import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { deleteQuestionService } from "../servies/question.service.js";

export const deleteQuestionController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await deleteQuestionService(req.params.id as string, req.user!);

  return res.status(200).json({
    success: true,
    message: "Question deleted successfully",
  });
};
