import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { deleteNotificationService } from "../servies/notification.service.js";

export const deleteNotificationController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await deleteNotificationService(req.params.id as string, req.user!);

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
};
