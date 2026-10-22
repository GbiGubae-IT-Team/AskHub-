type Device = {isEnabled: boolean; expoPushToken: string | null; bindingVersion: number; userId: string | null;
  lastSeenAt: Date; language: string; user: {isActive: boolean; deletedAt: Date | null; role: string; staffStatus: string | null} | null};
type Notification = {id: string; isActive: boolean; content: string; targetType: string; userId: string | null; createdAt: Date};
export type PushJob = {deviceVersion: number; device: Device; notification: Notification};

export function eligibleForPush(job: PushJob, now = Date.now()) {
  const {device, notification} = job;
  if (!device.isEnabled || !device.expoPushToken || device.bindingVersion !== job.deviceVersion || !notification.isActive ||
      notification.createdAt.getTime() < now - 86400_000 || device.lastSeenAt.getTime() < now - 90 * 86400_000) return false;
  if (notification.targetType === "PUBLIC") return true;
  const user = device.user;
  if (!user || !user.isActive || user.deletedAt || !device.userId) return false;
  if (notification.targetType === "USER") return notification.userId === device.userId;
  return notification.targetType === "STAFF" && (user.role === "SUPER_ADMIN" ||
    (["TEACHER", "ADMIN"].includes(user.role) && user.staffStatus === "APPROVED"));
}

export function pushPayload(job: PushJob) {
  const {device, notification} = job;
  const am = device.language === "am";
  const generic = notification.targetType === "STAFF"
    ? am ? "ለሠራተኞች አዲስ ማሳወቂያ አለ። ለማየት መተግበሪያውን ይክፈቱ።" : "You have a new staff notification. Open AskHub to view it."
    : am ? "አዲስ ማሳወቂያ አለዎት። ለማየት መተግበሪያውን ይክፈቱ።" : "You have a new notification. Open AskHub to view it.";
  return {
    to: device.expoPushToken!, title: "AskHub", sound: "default", channelId: "askhub", priority: "high", ttl: 86400,
    body: notification.targetType === "PUBLIC" ? Array.from(notification.content).slice(0, 800).join("") : generic,
    data: {notificationId: notification.id, targetType: notification.targetType,
      ...(notification.targetType === "USER" && {recipientUserId: notification.userId})},
  };
}

export function retryDelay(attempts: number) { return Math.min(30 * 60_000, 10_000 * 2 ** Math.min(attempts, 8)); }
