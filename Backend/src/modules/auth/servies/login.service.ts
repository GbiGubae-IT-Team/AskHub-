import { UnauthorizedError } from "../../../core/errors/UnauthorizedError.js";
import { passwordService } from "../../../core/utils/hashPassword.js";
import { tokenService } from "../../../core/utils/jwt.js";
import { authRepository } from "../repositories/auth.repository.js";
import type { AuthTokensResponse } from "../types/auth.types.js";
import { authValidationService } from "./validation.service.js";
import { UserRole, StaffStatus } from "../../../generated/prisma/client.js";

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

  if (
    user.role === UserRole.TEACHER ||
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN
  ) {
    if (user.staffStatus === StaffStatus.PENDING) {
      throw new UnauthorizedError("Your staff account is pending admin approval. Please wait to be approved.");
    }
    if (user.staffStatus === StaffStatus.SUSPENDED) {
      throw new UnauthorizedError("Your staff account has been suspended.");
    }
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
