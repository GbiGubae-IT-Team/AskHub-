import type { RoomType, UserRole } from "../../../generated/prisma/client.js";

export type RoomCreatorRecord = {
  id: string;
  anonymousId: string;
  role: UserRole;
};

export type RoomRecord = {
  id: string;
  name: string;
  type: RoomType;
  isActive: boolean;
  createdAt: Date;
  createdById: string;
  createdBy: RoomCreatorRecord;
};

export interface RoomResponse {
  id: string;
  name: string;
  type: RoomType;
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

export const toRoomResponse = (room: RoomRecord): RoomResponse => ({
  id: room.id,
  name: room.name,
  type: room.type,
  isActive: room.isActive,
  createdAt: room.createdAt,
  createdBy: room.createdBy,
});
