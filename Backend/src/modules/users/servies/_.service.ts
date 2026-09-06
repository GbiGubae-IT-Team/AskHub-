import { randomUUID } from "node:crypto";
import { UserRole, NotificationTarget } from "../../../generated/prisma/client.js";
import { hasPermission } from "../../../core/constants/permissions.js";
import {
  assertCanAssignRole,
  isPrivilegedRole,
} from "../../../core/constants/roleHierarchy.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { passwordService } from "../../../core/utils/hashPassword.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { userRepository } from "../repositories/_.repository.js";
import {
  toPrivateUser,
  toPublicUser,
  type ListUsersQuery,
  type PaginatedUsersResponse,
  type UserPublicResponse,
  type UserResponse,
} from "../types/user.types.js";
import { userValidationService } from "./_Validation.service.js";
import { sendNotificationToUser } from "../../notifications/servies/notification.service.js";

const canManageUsers = (role: UserRole) => hasPermission(role, "user:manage");

const assertManageAccess = (actor: JwtPayload) => {
  if (!canManageUsers(actor.role)) {
    throw new ForbiddenError("You do not have permission to manage users");
  }
};

const assertCanModifyUser = (
  targetRole: UserRole,
  actor: JwtPayload,
) => {
  if (
    targetRole === UserRole.SUPER_ADMIN &&
    actor.role !== UserRole.SUPER_ADMIN
  ) {
    throw new ForbiddenError("Only the super admin can modify this account");
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

  const role = dto.role ?? UserRole.STUDENT;
  assertCanAssignRole(actor.role, role);

  const user = await userRepository.create({
    email: dto.email,
    password: await passwordService.hashPassword(dto.password),
    anonymousId: `anon_${randomUUID()}`,
    role,
  });

  return toPrivateUser(user);
};

export const createAdminService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<UserResponse> => {
  if (!hasPermission(actor.role, "admin:create")) {
    throw new ForbiddenError("Only the super admin can create admin accounts");
  }

  const dto = userValidationService.validateCreate(body);

  if (await userRepository.findByEmail(dto.email)) {
    throw new BadRequestError("Email is already registered");
  }

  assertCanAssignRole(actor.role, UserRole.ADMIN);

  const user = await userRepository.create({
    email: dto.email,
    password: await passwordService.hashPassword(dto.password),
    anonymousId: `anon_${randomUUID()}`,
    role: UserRole.ADMIN,
  });

  return toPrivateUser(user);
};

export const listUsersService = async (
  query: unknown,
  actor: JwtPayload,
): Promise<PaginatedUsersResponse> => {
  assertManageAccess(actor);

  const { page, limit, role, includeInactive } =
    userValidationService.validateListQuery(query);
  const skip = (page - 1) * limit;

  const { items, total } = await userRepository.findMany({
    skip,
    take: limit,
    ...(role !== undefined && { role }),
    includeInactive: includeInactive ?? false,
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
    (actor.userId === id ||
      isPrivilegedRole(actor.role) ||
      canManageUsers(actor.role));

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

  assertCanModifyUser(existing.role, actor);

  const dto = userValidationService.validateUpdate(body);
  const isSelf = actor.userId === id;
  const actorIsPrivileged = isPrivilegedRole(actor.role);

  if (!isSelf && !actorIsPrivileged) {
    throw new ForbiddenError("You can only update your own profile");
  }

  if (dto.role !== undefined && !actorIsPrivileged) {
    throw new ForbiddenError("Only admins can change user roles");
  }

  if (dto.staffStatus !== undefined && actor.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Only super admins can change staff status");
  }

  if (dto.role !== undefined) {
    assertCanAssignRole(actor.role, dto.role);
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
    ...(dto.role !== undefined && actorIsPrivileged && { role: dto.role }),
    ...(dto.staffStatus !== undefined && actor.role === UserRole.SUPER_ADMIN && { staffStatus: dto.staffStatus }),
  });

  if (dto.staffStatus !== undefined && dto.staffStatus !== existing.staffStatus) {
    await sendNotificationToUser({
      targetType: NotificationTarget.USER,
      userId: id,
      content: `Your staff account status has been updated to ${dto.staffStatus}`,
      createdById: actor.userId,
    });
  }

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

  if (existing.role === UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Super admin accounts cannot be deleted");
  }

  if (!existing.isActive) {
    throw new BadRequestError("User is already deactivated");
  }

  try {
    await userRepository.softDelete(id);
  } catch (error) {
    mapPrismaError(error);
  }
};
