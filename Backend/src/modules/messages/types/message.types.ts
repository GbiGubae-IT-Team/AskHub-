import type { MessageType, UserRole } from "../../../generated/prisma/client.js";

export type MessageSenderRecord = {
  id: string;
  anonymousId: string;
  role: UserRole;
};

export type MessageRecord = {
  id: string;
  content: string;
  type: MessageType;
  createdAt: Date;
  senderId: string;
  roomId: string;
  sender: MessageSenderRecord;
};

export interface MessageResponse {
  id: string;
  content: string;
  type: MessageType;
  createdAt: Date;
  roomId: string;
  sender: MessageSenderRecord;
}

export interface ListMessagesQuery {
  page: number;
  limit: number;
  roomId: string;
  type?: MessageType;
  mine?: boolean;
}

export interface PaginatedMessagesResponse {
  items: MessageResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const toMessageResponse = (message: MessageRecord): MessageResponse => ({
  id: message.id,
  content: message.content,
  type: message.type,
  createdAt: message.createdAt,
  roomId: message.roomId,
  sender: message.sender,
});
