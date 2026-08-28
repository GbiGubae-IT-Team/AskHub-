import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { joinRoomService } from "../servies/room.service.js";

export const joinRoomController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const id = req.params.id as string;
  await joinRoomService(id, req.user!);
  return res.status(200).json({ success: true, message: "Joined room successfully" });
};
