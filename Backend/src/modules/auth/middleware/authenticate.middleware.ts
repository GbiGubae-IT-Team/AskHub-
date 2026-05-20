import type { NextFunction, Response } from "express";
import { UnauthorizedError } from "../../../core/errors/UnauthorizedError.js";
import { tokenService } from "../../../core/utils/jwt.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Access token is required"));
  }

  const token = authHeader.slice(7);
  req.user = tokenService.verifyAccessToken(token);
  next();
};
