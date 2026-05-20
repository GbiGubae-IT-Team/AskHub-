import type { UserRole } from "../../../generated/prisma/client.js";

export type UserRecord = {
  id: string;
  anonymousId: string;
  role: UserRole;
  email: string | null;
  createdAt: Date;
};

export interface UserPublicResponse {
  id: string;
  anonymousId: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserResponse extends UserPublicResponse {
  email: string | null;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: UserRole;
}

export interface PaginatedUsersResponse {
  items: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const toPublicUser = (user: UserRecord): UserPublicResponse => ({
  id: user.id,
  anonymousId: user.anonymousId,
  role: user.role,
  createdAt: user.createdAt,
});

export const toPrivateUser = (user: UserRecord): UserResponse => ({
  ...toPublicUser(user),
  email: user.email,
});
