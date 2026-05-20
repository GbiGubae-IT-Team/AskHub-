import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { deleteUserService } from "../servies/_.service.js";

export const deleteUserController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await deleteUserService(req.params.id as string, req.user!);

  return res.status(200).json({
    success: true,
    message: "User deactivated successfully",
  });
};
