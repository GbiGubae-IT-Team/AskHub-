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
    try {
      req.user = tokenService.verifyAccessToken(token);
    } catch {
      // For optional authentication, an invalid or expired token must not block public access.
      delete req.user;
    }
  }

  next();
};
