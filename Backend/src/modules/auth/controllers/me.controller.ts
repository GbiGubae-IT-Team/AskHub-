import type { Response } from "express";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { authRepository } from "../repositories/auth.repository.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";

export const meController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user) {
    throw new NotFoundError("User not found");
  }

  const user = await authRepository.findUserById(req.user.userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      anonymousId: user.anonymousId,
      role: user.role,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
};
