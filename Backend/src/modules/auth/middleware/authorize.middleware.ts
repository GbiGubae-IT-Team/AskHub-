import type { NextFunction, Response } from "express";
import type { UserRole } from "../../../generated/prisma/client.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' is not allowed to perform this action`,
        ),
      );
    }

    next();
  };
