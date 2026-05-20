import type { Response } from "express";
import { registerService } from "../servies/index.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

export const registerController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const result = await registerService(req.body, req.user?.role);

  return res.status(201).json({
    success: true,
    data: result,
  });
};
