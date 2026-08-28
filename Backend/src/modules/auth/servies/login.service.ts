import { UnauthorizedError } from "../../../core/errors/UnauthorizedError.js";
import { passwordService } from "../../../core/utils/hashPassword.js";
import { tokenService } from "../../../core/utils/jwt.js";
import { authRepository } from "../repositories/auth.repository.js";
import type { AuthTokensResponse } from "../types/auth.types.js";
import { authValidationService } from "./validation.service.js";

export const loginService = async (body: unknown): Promise<AuthTokensResponse> => {
  const dto = authValidationService.validateLogin(body);

  const user = await authRepository.findUserByEmail(dto.email);

  if (!user?.password) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await passwordService.comparePassword(
    dto.password,
    user.password,
  );

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("not approved");
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
