import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { updateNotificationService } from "../servies/notification.service.js";

export const updateNotificationController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await updateNotificationService(
    req.params.id as string,
    req.body,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
