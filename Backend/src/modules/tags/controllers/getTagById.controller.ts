import type { Request, Response } from "express";
import { getTagByIdService } from "../servies/tag.service.js";

export const getTagByIdController = async (req: Request, res: Response) => {
  const data = await getTagByIdService(req.params.id as string);

  return res.status(200).json({ success: true, data });
};
