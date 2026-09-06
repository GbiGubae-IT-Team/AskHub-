import { randomUUID } from "node:crypto";
import { UserRole } from "../../../generated/prisma/client.js";
import { assertCanAssignRole } from "../../../core/constants/roleHierarchy.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { passwordService } from "../../../core/utils/hashPassword.js";
import { tokenService } from "../../../core/utils/jwt.js";
import type { RegisterDto } from "../dto/register.dto.js";
import { authRepository } from "../repositories/auth.repository.js";
import type { AuthTokensResponse } from "../types/auth.types.js";
import { authValidationService } from "./validation.service.js";

const resolveRegistrationRole = (
  requestedRole: UserRole | undefined,
  actorRole?: UserRole,
): UserRole => {
  const role = requestedRole ?? UserRole.TEACHER;

  if (!actorRole) {
    if (role !== UserRole.STUDENT && role !== UserRole.TEACHER) {
      throw new ForbiddenError(
        "Public registration is limited to student and teacher accounts",
      );
    }
    return role;
  }

  assertCanAssignRole(actorRole, role);
  return role;
};

export const registerService = async (
  body: unknown,
  actorRole?: UserRole,
): Promise<AuthTokensResponse> => {
  const dto = authValidationService.validateRegister(body);

  const existing = await authRepository.findUserByEmail(dto.email);
  if (existing) {
    throw new BadRequestError("Email is already registered");
  }

  const role = resolveRegistrationRole(dto.role, actorRole);
  const hashedPassword = await passwordService.hashPassword(dto.password);

  const user = await authRepository.createUser({
    email: dto.email,
    password: hashedPassword,
    anonymousId: `anon_${randomUUID()}`,
    role,
  });

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
