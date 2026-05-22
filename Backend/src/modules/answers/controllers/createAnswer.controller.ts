import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createAnswerService } from "../servies/answer.service.js";

export const createAnswerController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createAnswerService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
