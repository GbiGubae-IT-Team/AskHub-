import { hasPermission } from "../../../core/constants/permissions.js";
import { isPrivilegedRole } from "../../../core/constants/roleHierarchy.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import {
  toNotificationResponse,
  type ListNotificationsQuery,
  type PaginatedNotificationsResponse,
  type NotificationResponse,
} from "../types/notification.types.js";
import { notificationValidationService } from "./notificationValidation.service.js";

const canRead = (role: JwtPayload["role"]) =>
  hasPermission(role, "notification:read");

const canCreate = (role: JwtPayload["role"]) =>
  hasPermission(role, "notification:create");

const canDelete = (role: JwtPayload["role"]) =>
  hasPermission(role, "notification:delete");

const assertOwnNotification = (
  notification: { userId: string },
  actor: JwtPayload,
) => {
  if (notification.userId !== actor.userId && !canDelete(actor.role)) {
    throw new ForbiddenError("You can only access your own notifications");
  }
};

export const createNotificationService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<NotificationResponse> => {
  if (!canCreate(actor.role)) {
    throw new ForbiddenError(
      "You do not have permission to create notifications",
    );
  }

  const dto = notificationValidationService.validateCreate(body);

  const user = await notificationRepository.findActiveUser(dto.userId);
  if (!user) {
    throw new BadRequestError("Target user not found or is inactive");
  }

  const notification = await notificationRepository.create({
    content: dto.content,
    userId: dto.userId,
  });

  return toNotificationResponse(notification);
};

export const listNotificationsService = async (
  query: unknown,
  actor: JwtPayload,
): Promise<PaginatedNotificationsResponse> => {
  if (!canRead(actor.role)) {
    throw new ForbiddenError(
      "You do not have permission to read notifications",
    );
  }

  const { page, limit, isRead } =
    notificationValidationService.validateListQuery(query);
  const skip = (page - 1) * limit;

  const { items, total, unreadCount } = await notificationRepository.findMany({
    userId: actor.userId,
    skip,
    take: limit,
    ...(isRead !== undefined && { isRead }),
  });

  return {
    items: items.map(toNotificationResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    unreadCount,
  };
};

export const getNotificationByIdService = async (
  id: string,
  actor: JwtPayload,
): Promise<NotificationResponse> => {
  if (!canRead(actor.role)) {
    throw new ForbiddenError(
      "You do not have permission to read notifications",
    );
  }

  const notification = await notificationRepository.findById(id);

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  assertOwnNotification(notification, actor);

  return toNotificationResponse(notification);
};

export const updateNotificationService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<NotificationResponse> => {
  if (!canRead(actor.role)) {
    throw new ForbiddenError(
      "You do not have permission to read notifications",
    );
  }

  const existing = await notificationRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Notification not found");
  }

  const dto = notificationValidationService.validateUpdate(body);
  const actorCanManage = canCreate(actor.role);
  const isOwner = existing.userId === actor.userId;

  if (dto.content !== undefined && !actorCanManage) {
    throw new ForbiddenError("Only admins can edit notification content");
  }

  if (dto.isRead !== undefined && !isOwner && !actorCanManage) {
    throw new ForbiddenError(
      "You can only update read status on your own notifications",
    );
  }

  if (!isOwner && !actorCanManage) {
    throw new ForbiddenError("You can only access your own notifications");
  }

  const notification = await notificationRepository.update(id, {
    ...(dto.content !== undefined && { content: dto.content }),
    ...(dto.isRead !== undefined && { isRead: dto.isRead }),
  });

  return toNotificationResponse(notification);
};

export const markAllNotificationsReadService = async (
  actor: JwtPayload,
): Promise<{ updatedCount: number }> => {
  if (!canRead(actor.role)) {
    throw new ForbiddenError(
      "You do not have permission to read notifications",
    );
  }

  const result = await notificationRepository.markAllRead(actor.userId);

  return { updatedCount: result.count };
};

export const deleteNotificationService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  const existing = await notificationRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Notification not found");
  }

  const isOwner = existing.userId === actor.userId;

  if (!isOwner && !canDelete(actor.role)) {
    throw new ForbiddenError(
      "You do not have permission to delete this notification",
    );
  }

  try {
    await notificationRepository.delete(id);
  } catch (error) {
    return mapPrismaError(error);
  }
};
