import { hasPermission } from "../../../core/constants/permissions.js";
import { isPrivilegedRole, isStaffRole } from "../../../core/constants/roleHierarchy.js";
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
import { NotificationTarget } from "../../../generated/prisma/client.js";
import { sendNotificationToUser } from "../../notifications/servies/notification.service.js";

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

  const generateRoomCode = async (): Promise<string> => {
    for (let i = 0; i < 10; i++) {
      const c = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await roomRepository.findByCode(c);
      if (!existing) return c;
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const code = await generateRoomCode();

  const room = await roomRepository.create({
    name: dto.name,
    type: dto.type,
    ...(dto.description !== undefined && { description: dto.description }),
    ...(dto.category !== undefined && { category: dto.category }),
    ...(dto.staffVerified !== undefined && { staffVerified: dto.staffVerified }),
    code,
    createdBy: { connect: { id: actor.userId } },
  });

  await sendNotificationToUser({
    targetType: NotificationTarget.PUBLIC,
    content: `New room created: ${dto.name}`,
    createdById: actor.userId,
  });

  return toRoomResponse(room, actor);
};

export const listRoomsService = async (
  query: unknown,
  actor?: JwtPayload,
): Promise<PaginatedRoomsResponse> => {
  const { page, limit, type, includeInactive } =
    roomValidationService.validateListQuery(query);

  if (includeInactive && (!actor || !isStaffRole(actor.role))) {
    throw new ForbiddenError("Only staff can list inactive rooms");
  }

  const skip = (page - 1) * limit;

  const { items, total } = await roomRepository.findMany({
    skip,
    take: limit,
    ...(type !== undefined && { type }),
    includeInactive: includeInactive ?? false,
  });

  return {
    items: items.map(r => toRoomResponse(r, actor)),
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
  const includeInactive = actor ? isStaffRole(actor.role) : false;
  const room = await roomRepository.findById(id, includeInactive);

  if (!room) {
    throw new NotFoundError("Room not found");
  }

  return toRoomResponse(room, actor);
};

export const updateRoomService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<RoomResponse> => {
  const includeInactive = isStaffRole(actor.role);
  const existing = await roomRepository.findById(id, includeInactive);

  if (!existing) {
    throw new NotFoundError("Room not found");
  }

  const dto = roomValidationService.validateUpdate(body);
  const isCreator = existing.createdById === actor.userId;
  const actorIsStaff = isStaffRole(actor.role);

  if (!isCreator && !actorIsStaff) {
    throw new ForbiddenError("You can only update rooms you created");
  }

  if (dto.isActive !== undefined && !actorIsStaff) {
    throw new ForbiddenError("Only staff can change room active status");
  }

  if (!existing.isActive && !actorIsStaff) {
    throw new BadRequestError("Cannot update a deactivated room");
  }

  const room = await roomRepository.update(id, {
    ...(dto.name !== undefined && { name: dto.name }),
    ...(dto.type !== undefined && { type: dto.type }),
    ...(dto.isActive !== undefined &&
      actorIsStaff && { isActive: dto.isActive }),
  });

  return toRoomResponse(room, actor);
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
  code?: string,
  actor?: JwtPayload,
): Promise<{ roomId: string; name: string; code: string | null }> => {
  const room = await roomRepository.findById(roomId, false);
  if (!room) {
    throw new NotFoundError("Room not found or inactive");
  }

  const isStaff = actor ? (isPrivilegedRole(actor.role) || actor.role === "TEACHER" || actor.userId === room.createdById) : false;

  // If not staff, require the matching 6-digit room code
  if (!isStaff && room.code) {
    if (!code || code.trim() !== room.code) {
      throw new BadRequestError("Invalid 6-digit room key");
    }
  }

  if (actor) {
    try {
      await roomRepository.update(roomId, {
        members: {
          connect: { id: actor.userId },
        },
      } as any);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  return {
    roomId: room.id,
    name: room.name,
    code: isStaff ? room.code : null,
  };
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

