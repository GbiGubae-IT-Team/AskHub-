import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { updateMessageService } from "../servies/message.service.js";

export const updateMessageController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await updateMessageService(
    req.params.id as string,
    req.body,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
