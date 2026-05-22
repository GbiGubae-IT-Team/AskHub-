import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/types/auth.types.js";
import { deleteTagService } from "../servies/tag.service.js";

export const deleteTagController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  await deleteTagService(req.params.id as string, req.user!);

  return res.status(200).json({
    success: true,
    message: "Tag deleted successfully",
  });
};
