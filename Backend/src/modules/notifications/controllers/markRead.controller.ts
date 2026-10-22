import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { getNotificationByIdService } from "../servies/notification.service.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { toNotificationResponse } from "../types/notification.types.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";

export async function markReadController(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id);
  // Validate visibility first; the read flag belongs to this reader, including
  // readers of public and staff broadcasts, rather than only the creator.
  await getNotificationByIdService(id, req.user!);
  const notification = await notificationRepository.markAsRead(id, req.user!.userId);
  if (!notification) throw new NotFoundError("Notification not found");
  return res.json({success: true, data: toNotificationResponse(notification)});
}
