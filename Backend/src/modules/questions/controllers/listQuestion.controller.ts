import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { listQuestionsService } from "../servies/question.service.js";

export const listQuestionsController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const actor = "user" in req ? req.user : undefined;
  const data = await listQuestionsService(req.query, actor);

  return res.status(200).json({ success: true, data });
};
