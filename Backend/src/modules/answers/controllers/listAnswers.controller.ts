import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { listAnswersService } from "../servies/answer.service.js";

export const listAnswersController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const actor = "user" in req ? req.user : undefined;
  const data = await listAnswersService(req.query, actor);

  return res.status(200).json({ success: true, data });
};
