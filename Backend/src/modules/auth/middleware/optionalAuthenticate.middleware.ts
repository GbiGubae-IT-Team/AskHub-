import type { NextFunction, Response } from "express";
import { tokenService } from "../../../core/utils/jwt.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    req.user = tokenService.verifyAccessToken(token);
  }

  next();
};
