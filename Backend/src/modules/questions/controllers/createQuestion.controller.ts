import { queuedRequestId } from "../../../core/utils/queuedCreate.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createQuestionService } from "../servies/question.service.js";

export const createQuestionController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const actor = "user" in req ? req.user : undefined;
  const requestId = req.route?.path === "/queued"
    ? queuedRequestId(req.get("X-Client-Request-Id"), req.get("X-Client-User-Id"), actor)
    : undefined;
  const data = await createQuestionService(req.body, actor, requestId);

  return res.status(201).json({ success: true, data });
};
