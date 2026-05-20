import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createAdminService } from "../servies/_.service.js";

export const createAdminController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createAdminService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
