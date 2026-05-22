import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { getMessageByIdService } from "../servies/message.service.js";

export const getMessageByIdController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const actor = "user" in req ? req.user : undefined;
  const data = await getMessageByIdService(req.params.id as string, actor);

  return res.status(200).json({ success: true, data });
};
