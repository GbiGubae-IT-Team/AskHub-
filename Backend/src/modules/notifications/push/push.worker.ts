import prisma from "../../../config/db.js";
import {eligibleForPush, pushPayload, retryDelay} from "./push.policy.js";

const EXPO_URL = "https://exp.host/--/api/v2/push";
class ExpoTransportError extends Error {
  constructor(status: number) { super(`Expo HTTP ${status}`); }
}
async function expoRequest(path: string, body: unknown) {
  const response = await fetch(`${EXPO_URL}/${path}`, {
    method: "POST", headers: {"Content-Type": "application/json", Accept: "application/json",
      ...(process.env.EXPO_ACCESS_TOKEN && {Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`})},
    body: JSON.stringify(body), signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new ExpoTransportError(response.status);
  const result = await response.json();
  if (result.errors?.length || !result.data) throw new Error("Expo rejected the push request");
  return result.data;
}

export async function queueNewNotifications() {
  const notifications = await prisma.notification.findMany({where: {pushQueuedAt: null}, orderBy: {createdAt: "asc"}, take: 20});
  for (const notification of notifications) {
    await prisma.$transaction(async tx => {
      const claimed = await tx.notification.updateMany({where: {id: notification.id, pushQueuedAt: null}, data: {pushQueuedAt: new Date()}});
      if (!claimed.count || !notification.isActive || notification.createdAt.getTime() < Date.now() - 86400_000) return;
      const audience = notification.targetType === "PUBLIC" ? {} : notification.targetType === "USER"
        ? {userId: notification.userId || "no-recipient"}
        : {user: {is: {isActive: true, deletedAt: null, OR: [
          {role: "SUPER_ADMIN" as const}, {role: {in: ["TEACHER" as const, "ADMIN" as const]}, staffStatus: "APPROVED" as const},
        ]}}};
      const devices = await tx.pushDevice.findMany({where: {isEnabled: true, expoPushToken: {not: null},
        lastSeenAt: {gte: new Date(Date.now() - 90 * 86400_000)}, ...audience}, select: {id: true, bindingVersion: true}});
      for (let offset = 0; offset < devices.length; offset += 500) {
        await tx.pushDelivery.createMany({skipDuplicates: true, data: devices.slice(offset, offset + 500).map(device => ({
          notificationId: notification.id, deviceId: device.id, deviceVersion: device.bindingVersion,
        }))});
      }
    });
  }
}

async function failOrRetry(id: string, attempts: number, error: string, retry = true) {
  await prisma.pushDelivery.update({where: {id}, data: {status: retry && attempts < 6 ? "pending" : "failed",
    availableAt: new Date(Date.now() + retryDelay(attempts)), ticketId: null, lastError: error.slice(0, 200)}});
}

export async function sendPendingPushes() {
  const now = new Date();
  // A process can exit after claiming a job but before contacting Expo.
  await prisma.pushDelivery.updateMany({where: {status: "sending", availableAt: {lte: now}}, data: {status: "pending"}});
  const jobs = await prisma.pushDelivery.findMany({where: {status: "pending", availableAt: {lte: now}},
    include: {notification: true, device: {include: {user: {select: {isActive: true, deletedAt: true, role: true, staffStatus: true}}}}}, orderBy: {createdAt: "asc"}, take: 100});
  const sending: typeof jobs = [];
  for (const job of jobs) {
    const claimed = await prisma.pushDelivery.updateMany({where: {id: job.id, status: "pending", availableAt: {lte: now}},
      data: {status: "sending", attempts: {increment: 1}, availableAt: new Date(Date.now() + 120_000)}});
    if (!claimed.count) continue;
    if (!eligibleForPush(job)) {
      await prisma.pushDelivery.update({where: {id: job.id}, data: {status: "skipped", lastError: "Recipient or notification changed"}});
      continue;
    }
    sending.push({...job, attempts: job.attempts + 1});
  }
  if (!sending.length) return;
  try {
    const tickets = await expoRequest("send", sending.map(pushPayload));
    if (!Array.isArray(tickets) || tickets.length !== sending.length) throw new Error("Unexpected Expo ticket response");
    for (let index = 0; index < sending.length; index++) {
      const job = sending[index];
      const ticket = tickets[index];
      if (ticket.status === "ok" && typeof ticket.id === "string") {
        await prisma.pushDelivery.update({where: {id: job.id}, data: {status: "ticketed", ticketId: ticket.id,
          sentToken: job.device.expoPushToken, availableAt: new Date(Date.now() + 15 * 60_000), lastError: null}});
      } else {
        const code = String(ticket.details?.error || "PushRejected");
        if (code !== "DeviceNotRegistered") console.warn("Expo push rejected:", code.slice(0, 80));
        if (code === "DeviceNotRegistered") await deactivateDevice(job.deviceId, job.deviceVersion, job.device.expoPushToken);
        await failOrRetry(job.id, job.attempts, code, ["MessageRateExceeded", "InvalidCredentials", "MismatchSenderId"].includes(code));
      }
    }
  } catch (error) {
    if (error instanceof ExpoTransportError) console.warn(error.message);
    // Only unresolved sends return to pending; never resend an accepted ticket
    // because a later job's database update failed.
    for (const job of sending) {
      await prisma.pushDelivery.updateMany({where: {id: job.id, status: "sending"}, data: {
        status: job.attempts < 6 ? "pending" : "failed", lastError: error instanceof ExpoTransportError ? error.message : "Push transport failed",
        availableAt: new Date(Date.now() + retryDelay(job.attempts)),
      }});
    }
  }
}

async function deactivateDevice(id: string, bindingVersion: number, token: string | null) {
  await prisma.pushDevice.updateMany({where: {id, bindingVersion, expoPushToken: token}, data: {isEnabled: false, expoPushToken: null}});
}

export async function checkPushReceipts() {
  const now = new Date();
  const candidates = await prisma.pushDelivery.findMany({where: {status: "ticketed", availableAt: {lte: now}, ticketId: {not: null}}, take: 100});
  const jobs: typeof candidates = [];
  for (const job of candidates) {
    const claimed = await prisma.pushDelivery.updateMany({where: {id: job.id, status: "ticketed", ticketId: job.ticketId, availableAt: {lte: now}},
      data: {availableAt: new Date(Date.now() + 120_000)}});
    if (claimed.count) jobs.push(job);
  }
  if (!jobs.length) return;
  const receipts = await expoRequest("getReceipts", {ids: jobs.map(job => job.ticketId!)});
  for (const job of jobs) {
    const receipt = receipts[job.ticketId!];
    if (!receipt) {
      await prisma.pushDelivery.update({where: {id: job.id}, data: {status: job.createdAt.getTime() < Date.now() - 86400_000 ? "failed" : "ticketed",
        availableAt: new Date(Date.now() + 5 * 60_000), lastError: "Waiting for Expo receipt"}});
    } else if (receipt.status === "ok") {
      // Expo receipts confirm provider acceptance, not display on the phone.
      await prisma.pushDelivery.update({where: {id: job.id}, data: {status: "accepted", lastError: null}});
    } else {
      const code = String(receipt.details?.error || "ReceiptError");
      if (code !== "DeviceNotRegistered") console.warn("Expo push receipt failed:", code.slice(0, 80));
      if (code === "DeviceNotRegistered") await deactivateDevice(job.deviceId, job.deviceVersion, job.sentToken);
      await failOrRetry(job.id, job.attempts, code, ["MessageRateExceeded", "InvalidCredentials", "MismatchSenderId"].includes(code));
    }
  }
}

export function startPushWorker() {
  if (process.env.PUSH_NOTIFICATIONS_ENABLED === "false") return () => {};
  let busy = false;
  let stopped = false;
  const tick = async () => {
    if (busy || stopped) return;
    busy = true;
    try { await queueNewNotifications(); await sendPendingPushes(); await checkPushReceipts(); }
    catch { console.warn("Push delivery paused; it will retry automatically."); }
    finally { busy = false; }
  };
  const timer = setInterval(() => { void tick(); }, 5000);
  timer.unref();
  return () => { stopped = true; clearInterval(timer); };
}
