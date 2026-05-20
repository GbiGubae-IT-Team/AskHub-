import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { getRoomByIdService } from "../servies/_.service.js";

export const getRoomByIdController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const actor = "user" in req ? req.user : undefined;
  const data = await getRoomByIdService(req.params.id as string, actor);

  return res.status(200).json({ success: true, data });
};
