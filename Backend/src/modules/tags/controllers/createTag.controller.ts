import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { createTagService } from "../servies/tag.service.js";

export const createTagController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await createTagService(req.body, req.user!);

  return res.status(201).json({ success: true, data });
};
