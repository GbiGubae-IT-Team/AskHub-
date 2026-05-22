import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { updateRoomService } from "../servies/room.service.js";

export const updateRoomController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await updateRoomService(
    req.params.id as string,
    req.body,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
