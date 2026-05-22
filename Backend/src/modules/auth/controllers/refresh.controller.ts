import type { Request, Response } from "express";
import { refreshService } from "../servies/refresh.service.js";

export const refreshController = async (req: Request, res: Response) => {
  const result = await refreshService(req.body);

  return res.status(200).json({
    success: true,
    data: result,
  });
};
