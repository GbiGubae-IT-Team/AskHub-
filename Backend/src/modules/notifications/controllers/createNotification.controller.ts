import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createNotificationService } from "../servies/notification.service.js";

export const createNotificationController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createNotificationService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
