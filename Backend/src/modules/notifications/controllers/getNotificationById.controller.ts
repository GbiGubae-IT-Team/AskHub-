import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { getNotificationByIdService } from "../servies/notification.service.js";

export const getNotificationByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await getNotificationByIdService(
    req.params.id as string,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
