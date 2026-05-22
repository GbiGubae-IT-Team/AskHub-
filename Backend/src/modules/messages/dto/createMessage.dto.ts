import type { MessageType } from "../../../generated/prisma/client.js";

export interface CreateMessageDto {
  content: string;
  type: MessageType;
  roomId: string;
}
