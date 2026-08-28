import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { leaveRoomService } from "../servies/room.service.js";

export const leaveRoomController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = req.params.id as string;
  await leaveRoomService(id, req.user!);
  return res.status(200).json({ success: true, message: "Left room successfully" });
};
