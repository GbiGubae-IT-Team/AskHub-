import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { listMessagesService } from "../servies/message.service.js";

export const listMessagesController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const actor = "user" in req ? req.user : undefined;
  const data = await listMessagesService(req.query, actor);

  return res.status(200).json({ success: true, data });
};
