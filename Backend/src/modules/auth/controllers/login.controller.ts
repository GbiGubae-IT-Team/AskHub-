import type { Request, Response } from "express";
import { loginService } from "../servies/index.js";

export const loginController = async (req: Request, res: Response) => {
  const result = await loginService(req.body);

  return res.status(200).json({
    success: true,
    data: result,
  });
};
