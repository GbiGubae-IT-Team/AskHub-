import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { deleteAnswerService } from "../servies/answer.service.js";

export const deleteAnswerController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await deleteAnswerService(req.params.id as string, req.user!);

  return res.status(200).json({
    success: true,
    message: "Answer deleted successfully",
  });
};
