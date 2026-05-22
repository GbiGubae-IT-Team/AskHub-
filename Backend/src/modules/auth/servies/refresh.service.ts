import { UnauthorizedError } from "../../../core/errors/UnauthorizedError.js";
import { tokenService } from "../../../core/utils/jwt.js";
import { authRepository } from "../repositories/auth.repository.js";
import type { AuthTokensResponse } from "../types/auth.types.js";
import { authValidationService } from "./validation.service.js";

export const refreshService = async (
  body: unknown,
): Promise<AuthTokensResponse> => {
  const dto = authValidationService.validateRefresh(body);

  const payload = tokenService.verifyRefreshToken(dto.refreshToken);

  const user = await authRepository.findUserById(payload.userId);

  if (!user) {
    throw new UnauthorizedError("User no longer exists or is inactive");
  }

  const tokenPayload = {
    userId: user.id,
    role: user.role,
    anonymousId: user.anonymousId,
  };

  return {
    accessToken: tokenService.generateAccessToken(tokenPayload),
    refreshToken: tokenService.generateRefreshToken(tokenPayload),
    user: {
      id: user.id,
      anonymousId: user.anonymousId,
      role: user.role,
      email: user.email,
    },
  };
};
