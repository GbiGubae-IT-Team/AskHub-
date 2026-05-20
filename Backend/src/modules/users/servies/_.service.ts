import { randomUUID } from "node:crypto";
import { UserRole } from "../../../generated/prisma/client.js";
import { hasPermission } from "../../../core/constants/permissions.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { passwordService } from "../../../core/utils/hashPassword.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { userRepository } from "../repositories/_.repository.js";
import {
  toPrivateUser,
  toPublicUser,
  type ListUsersQuery,
  type PaginatedUsersResponse,
  type UserPublicResponse,
  type UserResponse,
} from "../types/_.types.js";
import { userValidationService } from "./_Validation.service.js";

const isAdmin = (role: UserRole) => role === UserRole.ADMIN;
const canManageUsers = (role: UserRole) => hasPermission(role, "user:manage");

const assertManageAccess = (actor: JwtPayload) => {
  if (!canManageUsers(actor.role)) {
    throw new ForbiddenError("You do not have permission to manage users");
  }
};

export const createUserService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<UserResponse> => {
  assertManageAccess(actor);

  const dto = userValidationService.validateCreate(body);

  if (await userRepository.findByEmail(dto.email)) {
    throw new BadRequestError("Email is already registered");
  }

  const user = await userRepository.create({
    email: dto.email,
    password: await passwordService.hashPassword(dto.password),
    anonymousId: `anon_${randomUUID()}`,
    role: dto.role ?? UserRole.STUDENT,
  });

  return toPrivateUser(user);
};

export const listUsersService = async (
  query: unknown,
  actor: JwtPayload,
): Promise<PaginatedUsersResponse> => {
  assertManageAccess(actor);

  const { page, limit, role } = userValidationService.validateListQuery(query);
  const skip = (page - 1) * limit;

  const { items, total } = await userRepository.findMany({
    skip,
    take: limit,
    ...(role !== undefined && { role }),
  });

  return {
    items: items.map(toPrivateUser),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getUserByIdService = async (
  id: string,
  actor?: JwtPayload,
): Promise<UserResponse | UserPublicResponse> => {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const canViewPrivate =
    actor &&
    (actor.userId === id || isAdmin(actor.role) || canManageUsers(actor.role));

  return canViewPrivate ? toPrivateUser(user) : toPublicUser(user);
};

export const updateUserService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<UserResponse> => {
  const existing = await userRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("User not found");
  }

  const dto = userValidationService.validateUpdate(body);
  const isSelf = actor.userId === id;
  const actorIsAdmin = isAdmin(actor.role);

  if (!isSelf && !actorIsAdmin) {
    throw new ForbiddenError("You can only update your own profile");
  }

  if (dto.role !== undefined && !actorIsAdmin) {
    throw new ForbiddenError("Only admins can change user roles");
  }

  if (dto.email && dto.email !== existing.email) {
    if (await userRepository.findByEmail(dto.email)) {
      throw new BadRequestError("Email is already in use");
    }
  }

  const user = await userRepository.update(id, {
    ...(dto.email !== undefined && { email: dto.email }),
    ...(dto.password !== undefined && {
      password: await passwordService.hashPassword(dto.password),
    }),
    ...(dto.role !== undefined && actorIsAdmin && { role: dto.role }),
  });

  return toPrivateUser(user);
};

export const deleteUserService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  assertManageAccess(actor);

  if (actor.userId === id) {
    throw new BadRequestError("You cannot delete your own account");
  }

  const existing = await userRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("User not found");
  }

  await userRepository.delete(id);
};
