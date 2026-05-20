import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { updateUserService } from "../servies/_.service.js";

export const updateUserController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await updateUserService(
    req.params.id as string,
    req.body,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
