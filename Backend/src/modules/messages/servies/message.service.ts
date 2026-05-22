import { hasPermission } from "../../../core/constants/permissions.js";
import { isPrivilegedRole } from "../../../core/constants/roleHierarchy.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { messageRepository } from "../repositories/message.repository.js";
import {
  toMessageResponse,
  type ListMessagesQuery,
  type PaginatedMessagesResponse,
  type MessageResponse,
} from "../types/message.types.js";
import { messageValidationService } from "./messageValidation.service.js";

const canCreate = (role: JwtPayload["role"]) =>
  hasPermission(role, "message:create");

const canDelete = (role: JwtPayload["role"]) =>
  hasPermission(role, "message:delete");

const assertActiveRoom = async (
  roomId: string,
  actor?: JwtPayload,
) => {
  const includeInactive = actor ? isPrivilegedRole(actor.role) : false;
  const room = await messageRepository.findRoom(roomId, includeInactive);

  if (!room) {
    throw new NotFoundError("Room not found or is inactive");
  }

  return room;
};

export const createMessageService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<MessageResponse> => {
  if (!canCreate(actor.role)) {
    throw new ForbiddenError("You do not have permission to send messages");
  }

  const dto = messageValidationService.validateCreate(body);
  await assertActiveRoom(dto.roomId, actor);

  const message = await messageRepository.create({
    content: dto.content,
    type: dto.type,
    senderId: actor.userId,
    roomId: dto.roomId,
  });

  return toMessageResponse(message);
};

export const listMessagesService = async (
  query: unknown,
  actor?: JwtPayload,
): Promise<PaginatedMessagesResponse> => {
  const { page, limit, roomId, type, mine } =
    messageValidationService.validateListQuery(query);

  if (mine && !actor) {
    throw new ForbiddenError("Authentication required to list your messages");
  }

  await assertActiveRoom(roomId, actor);

  const skip = (page - 1) * limit;

  const { items, total } = await messageRepository.findMany({
    skip,
    take: limit,
    where: {
      roomId,
      ...(type !== undefined && { type }),
      ...(mine && actor && { senderId: actor.userId }),
    },
  });

  return {
    items: items.map(toMessageResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getMessageByIdService = async (
  id: string,
  actor?: JwtPayload,
): Promise<MessageResponse> => {
  const message = await messageRepository.findById(id);

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  await assertActiveRoom(message.roomId, actor);

  return toMessageResponse(message);
};

export const updateMessageService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<MessageResponse> => {
  const existing = await messageRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Message not found");
  }

  await assertActiveRoom(existing.roomId, actor);

  const dto = messageValidationService.validateUpdate(body);
  const isSender = existing.senderId === actor.userId;
  const actorIsPrivileged = isPrivilegedRole(actor.role);

  if (!isSender && !actorIsPrivileged) {
    throw new ForbiddenError("You can only edit your own messages");
  }

  const message = await messageRepository.update(id, dto.content);

  return toMessageResponse(message);
};

export const deleteMessageService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  const existing = await messageRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Message not found");
  }

  const isSender = existing.senderId === actor.userId;
  const actorCanDelete = canDelete(actor.role);

  if (!isSender && !actorCanDelete) {
    throw new ForbiddenError("You do not have permission to delete this message");
  }

  try {
    await messageRepository.delete(id);
  } catch (error) {
    mapPrismaError(error);
  }
};
