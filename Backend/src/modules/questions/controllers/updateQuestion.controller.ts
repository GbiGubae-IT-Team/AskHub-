import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { updateQuestionService } from "../servies/question.service.js";

export const updateQuestionController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await updateQuestionService(
    req.params.id as string,
    req.body,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
