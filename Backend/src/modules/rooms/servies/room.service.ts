import { hasPermission } from "../../../core/constants/permissions.js";
import { isPrivilegedRole } from "../../../core/constants/roleHierarchy.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { roomRepository } from "../repositories/room.repository.js";
import {
  toRoomResponse,
  type ListRoomsQuery,
  type PaginatedRoomsResponse,
  type RoomResponse,
} from "../types/room.types.js";
import { roomValidationService } from "./roomValidation.service.js";

const canDeleteRoom = (role: JwtPayload["role"]) =>
  hasPermission(role, "room:delete");

const canCreateRoom = (role: JwtPayload["role"]) =>
  hasPermission(role, "room:create");

export const createRoomService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<RoomResponse> => {
  if (!canCreateRoom(actor.role)) {
    throw new ForbiddenError("You do not have permission to create rooms");
  }

  const dto = roomValidationService.validateCreate(body);

  const room = await roomRepository.create({
    name: dto.name,
    type: dto.type,
    createdBy: { connect: { id: actor.userId } },
  });

  return toRoomResponse(room);
};

export const listRoomsService = async (
  query: unknown,
  actor?: JwtPayload,
): Promise<PaginatedRoomsResponse> => {
  const { page, limit, type, includeInactive } =
    roomValidationService.validateListQuery(query);

  if (includeInactive && (!actor || !isPrivilegedRole(actor.role))) {
    throw new ForbiddenError("Only admins can list inactive rooms");
  }

  const skip = (page - 1) * limit;

  const { items, total } = await roomRepository.findMany({
    skip,
    take: limit,
    ...(type !== undefined && { type }),
    includeInactive: includeInactive ?? false,
  });

  return {
    items: items.map(toRoomResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getRoomByIdService = async (
  id: string,
  actor?: JwtPayload,
): Promise<RoomResponse> => {
  const includeInactive = actor ? isPrivilegedRole(actor.role) : false;
  const room = await roomRepository.findById(id, includeInactive);

  if (!room) {
    throw new NotFoundError("Room not found");
  }

  return toRoomResponse(room);
};

export const updateRoomService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<RoomResponse> => {
  const includeInactive = isPrivilegedRole(actor.role);
  const existing = await roomRepository.findById(id, includeInactive);

  if (!existing) {
    throw new NotFoundError("Room not found");
  }

  const dto = roomValidationService.validateUpdate(body);
  const isCreator = existing.createdById === actor.userId;
  const actorIsPrivileged = isPrivilegedRole(actor.role);

  if (!isCreator && !actorIsPrivileged) {
    throw new ForbiddenError("You can only update rooms you created");
  }

  if (dto.isActive !== undefined && !actorIsPrivileged) {
    throw new ForbiddenError("Only admins can change room active status");
  }

  if (!existing.isActive && !actorIsPrivileged) {
    throw new BadRequestError("Cannot update a deactivated room");
  }

  const room = await roomRepository.update(id, {
    ...(dto.name !== undefined && { name: dto.name }),
    ...(dto.type !== undefined && { type: dto.type }),
    ...(dto.isActive !== undefined &&
      actorIsPrivileged && { isActive: dto.isActive }),
  });

  return toRoomResponse(room);
};

export const deleteRoomService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  if (!canDeleteRoom(actor.role)) {
    throw new ForbiddenError("You do not have permission to deactivate rooms");
  }

  const existing = await roomRepository.findById(id, true);

  if (!existing) {
    throw new NotFoundError("Room not found");
  }

  if (!existing.isActive) {
    throw new BadRequestError("Room is already deactivated");
  }

  try {
    await roomRepository.softDelete(id);
  } catch (error) {
    mapPrismaError(error);
  }
};

export const joinRoomService = async (
  roomId: string,
  actor: JwtPayload,
): Promise<void> => {
  const room = await roomRepository.findById(roomId, false);
  if (!room) {
    throw new NotFoundError("Room not found or inactive");
  }

  try {
    await roomRepository.update(roomId, {
      members: {
        connect: { id: actor.userId }
      }
    } as any);
  } catch (error) {
    mapPrismaError(error);
  }
};

export const leaveRoomService = async (
  roomId: string,
  actor: JwtPayload,
): Promise<void> => {
  const room = await roomRepository.findById(roomId, false);
  if (!room) {
    throw new NotFoundError("Room not found or inactive");
  }

  try {
    await roomRepository.update(roomId, {
      members: {
        disconnect: { id: actor.userId }
      }
    } as any);
  } catch (error) {
    mapPrismaError(error);
  }
};

