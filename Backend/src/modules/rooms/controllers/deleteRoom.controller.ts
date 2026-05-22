import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { deleteRoomService } from "../servies/room.service.js";

export const deleteRoomController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await deleteRoomService(req.params.id as string, req.user!);

  return res.status(200).json({
    success: true,
    message: "Room deactivated successfully",
  });
};
