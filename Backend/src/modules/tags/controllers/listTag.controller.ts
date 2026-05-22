import type { Request, Response } from "express";
import { listTagsService } from "../servies/tag.service.js";

export const listTagsController = async (req: Request, res: Response) => {
  const data = await listTagsService(req.query);

  return res.status(200).json({ success: true, data });
};
