import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { getUserByIdService } from "../servies/_.service.js";

export const getUserByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await getUserByIdService(req.params.id as string, req.user);

  return res.status(200).json({ success: true, data });
};
