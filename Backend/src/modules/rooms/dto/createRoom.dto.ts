import type { RoomType } from "../../../generated/prisma/client.js";

export interface CreateRoomDto {
  name: string;
  description?: string;
  category?: string;
  staffVerified?: boolean;
  type: RoomType;
}
