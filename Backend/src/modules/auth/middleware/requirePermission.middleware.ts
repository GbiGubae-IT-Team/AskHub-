import type { NextFunction, Response } from "express";
import {
  hasPermission,
  type Permission,
} from "../../../core/constants/permissions.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

export const requirePermission =
  (permission: Permission) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError("Authentication required"));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(
        new ForbiddenError(`Missing permission: ${permission}`),
      );
    }

    next();
  };
