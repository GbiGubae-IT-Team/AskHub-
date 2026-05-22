import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { deleteMessageService } from "../servies/message.service.js";

export const deleteMessageController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await deleteMessageService(req.params.id as string, req.user!);

  return res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  });
};
