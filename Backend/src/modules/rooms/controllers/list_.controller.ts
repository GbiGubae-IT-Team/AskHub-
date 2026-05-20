import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { listRoomsService } from "../servies/_.service.js";

export const listRoomsController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const actor = "user" in req ? req.user : undefined;
  const data = await listRoomsService(req.query, actor);

  return res.status(200).json({ success: true, data });
};
