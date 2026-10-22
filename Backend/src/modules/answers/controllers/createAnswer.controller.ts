import { queuedRequestId } from "../../../core/utils/queuedCreate.js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createAnswerService } from "../servies/answer.service.js";

export const createAnswerController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const requestId = req.route?.path === "/queued"
    ? queuedRequestId(req.get("X-Client-Request-Id"), req.get("X-Client-User-Id"), req.user!)
    : undefined;
  const data = await createAnswerService(req.body, req.user!, requestId);

  return res.status(201).json({ success: true, data });
};
