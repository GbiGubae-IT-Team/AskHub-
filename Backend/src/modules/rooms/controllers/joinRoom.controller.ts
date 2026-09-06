import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { joinRoomService } from "../servies/room.service.js";

export const joinRoomController = async (
  req: Request | AuthenticatedRequest,
  res: Response,
) => {
  const id = req.params.id as string;
  const { code } = req.body || {};
  const actor = "user" in req ? req.user : undefined;
  const result = await joinRoomService(id, code, actor);
  return res.status(200).json({ success: true, message: "Joined room successfully", data: result });
};

