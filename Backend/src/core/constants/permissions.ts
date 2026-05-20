import { UserRole } from "../../generated/prisma/client.js";

export const ROLE_PERMISSIONS = {
  [UserRole.STUDENT]: [
    "question:create",
    "question:read",
    "vote:create",
    "message:create",
    "notification:read",
  ],
  [UserRole.TEACHER]: [
    "question:create",
    "question:read",
    "question:approve",
    "answer:create",
    "vote:create",
    "message:create",
    "room:create",
    "notification:read",
  ],
  [UserRole.ADMIN]: [
    "question:create",
    "question:read",
    "question:approve",
    "question:delete",
    "answer:create",
    "answer:delete",
    "vote:create",
    "message:create",
    "message:delete",
    "room:create",
    "room:delete",
    "user:manage",
    "tag:manage",
    "notification:read",
    "notification:delete",
  ],
} as const;

export type Permission =
  (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number];

export const hasPermission = (role: UserRole, permission: Permission) =>
  (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
