import type { RoomType } from "../../../generated/prisma/client.js";

export interface UpdateRoomDto {
  name?: string;
  type?: RoomType;
  isActive?: boolean;
}
