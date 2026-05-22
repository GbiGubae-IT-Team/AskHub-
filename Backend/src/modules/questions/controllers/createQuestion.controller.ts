import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createQuestionService } from "../servies/question.service.js";

export const createQuestionController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createQuestionService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
