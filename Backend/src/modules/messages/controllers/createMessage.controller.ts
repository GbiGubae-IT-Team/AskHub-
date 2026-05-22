import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createMessageService } from "../servies/message.service.js";

export const createMessageController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createMessageService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
