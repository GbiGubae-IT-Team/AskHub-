import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { listUsersService } from "../servies/_.service.js";

export const listUsersController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await listUsersService(req.query, req.user!);

  return res.status(200).json({ success: true, data });
};
