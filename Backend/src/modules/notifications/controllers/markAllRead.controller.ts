import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { markAllNotificationsReadService } from "../servies/notification.service.js";

export const markAllReadController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await markAllNotificationsReadService(req.user!);

  return res.status(200).json({ success: true, data });
};
