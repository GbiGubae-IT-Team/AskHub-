import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createRoomService } from "../servies/_.service.js";

export const createRoomController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createRoomService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
