import type { RoomType, UserRole } from "../../../generated/prisma/client.js";

export type RoomCreatorRecord = {
  id: string;
  anonymousId: string;
  role: UserRole;
};

export type RoomRecord = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: RoomType;
  staffVerified: boolean;
  code: string | null;
  isActive: boolean;
  createdAt: Date;
  createdById: string;
  createdBy: RoomCreatorRecord;
};

export interface RoomResponse {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: RoomType;
  staffVerified: boolean;
  code: string | null;
  isActive: boolean;
  createdAt: Date;
  createdBy: RoomCreatorRecord;
}

export interface ListRoomsQuery {
  page: number;
  limit: number;
  type?: RoomType;
  includeInactive?: boolean;
}

export interface PaginatedRoomsResponse {
  items: RoomResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

import type { JwtPayload } from "../../auth/types/auth.types.js";

export const toRoomResponse = (room: RoomRecord, actor?: JwtPayload): RoomResponse => {
  const isStaff = actor
    ? (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN" || actor.role === "TEACHER" || actor.userId === room.createdById)
    : false;

  return {
    id: room.id,
    name: room.name,
    description: room.description,
    category: room.category,
    type: room.type,
    staffVerified: room.staffVerified,
    code: isStaff ? room.code : null,
    isActive: room.isActive,
    createdAt: room.createdAt,
    createdBy: room.createdBy,
  };
};
