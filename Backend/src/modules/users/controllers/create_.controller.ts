import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createUserService } from "../servies/_.service.js";

export const createUserController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createUserService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
