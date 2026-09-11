import { UserRole } from "../../generated/prisma/client.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";

const ASSIGNABLE_BY_ADMIN = [
  UserRole.STUDENT,
  UserRole.TEACHER,
] as const;

const ASSIGNABLE_BY_SUPER_ADMIN = [
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.ADMIN,
] as const;

export const canAssignRole = (actorRole: UserRole, targetRole: UserRole) => {
  if (targetRole === UserRole.SUPER_ADMIN) {
    return false;
  }

  if (actorRole === UserRole.SUPER_ADMIN) {
    return ASSIGNABLE_BY_SUPER_ADMIN.includes(
      targetRole as (typeof ASSIGNABLE_BY_SUPER_ADMIN)[number],
    );
  }

  if (actorRole === UserRole.ADMIN) {
    return ASSIGNABLE_BY_ADMIN.includes(
      targetRole as (typeof ASSIGNABLE_BY_ADMIN)[number],
    );
  }

  return targetRole === UserRole.STUDENT;
};

export const assertCanAssignRole = (
  actorRole: UserRole,
  targetRole: UserRole,
) => {
  if (!canAssignRole(actorRole, targetRole)) {
    if (targetRole === UserRole.ADMIN) {
      throw new ForbiddenError("Only the super admin can create admin accounts");
    }

    if (targetRole === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError("Super admin accounts cannot be created via API");
    }

    throw new ForbiddenError(
      `Role '${actorRole}' cannot assign role '${targetRole}'`,
    );
  }
};

export const isPrivilegedRole = (role: UserRole) =>
  role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

export const isStaffRole = (role: UserRole) =>
  role === UserRole.TEACHER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
