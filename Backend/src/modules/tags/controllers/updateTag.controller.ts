import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { updateTagService } from "../servies/tag.service.js";

export const updateTagController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const data = await updateTagService(
    req.params.id as string,
    req.body,
    req.user!,
  );

  return res.status(200).json({ success: true, data });
};
