import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { updateAnswerService } from "../servies/answer.service.js";

export const updateAnswerController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await updateAnswerService(
    req.params.id as string,
    req.body,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
