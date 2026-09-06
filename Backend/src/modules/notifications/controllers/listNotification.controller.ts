import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { listNotificationsService } from "../servies/notification.service.js";

export const listNotificationsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await listNotificationsService(req.query, req.user);

  return res.status(200).json({ success: true, data });
};
