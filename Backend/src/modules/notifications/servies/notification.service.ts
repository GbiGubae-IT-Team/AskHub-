import { hasPermission } from "../../../core/constants/permissions.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import {
  toNotificationResponse,
  type ListNotificationsQuery,
  type NotificationListScope,
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

const canAccessNotification = (
  notification: { userId: string; createdById: string | null },
  actor: JwtPayload,
) => {
  if (notification.userId === actor.userId) {
    return true;
  }

  if (
    canCreate(actor.role) &&
    notification.createdById === actor.userId
  ) {
    return true;
  }

  if (canDelete(actor.role)) {
    return true;
  }

  return false;
};

const resolveListScope = (
  actor: JwtPayload,
  requested?: NotificationListScope,
): NotificationListScope => {
  if (requested) {
    return requested;
  }

  return canCreate(actor.role) ? "all" : "received";
};

const buildListFilters = (
  actor: JwtPayload,
  scope: NotificationListScope,
) => {
  if (scope === "sent" || scope === "all") {
    if (!canCreate(actor.role)) {
      throw new ForbiddenError(
        "Only admins can view sent or combined notification lists",
      );
    }
  }

  if (scope === "sent") {
    return {
      where: { createdById: actor.userId },
      unreadWhere: { createdById: actor.userId },
    };
  }

  if (scope === "all") {
    return {
      where: {
        OR: [
          { userId: actor.userId },
          { createdById: actor.userId },
        ],
      },
      unreadWhere: { userId: actor.userId },
    };
  }

  return {
    where: { userId: actor.userId },
    unreadWhere: { userId: actor.userId },
  };
};

/** Internal helper for other modules (e.g. answers) — no admin permission required. */
export const sendNotificationToUser = async (params: {
  userId: string;
  content: string;
  createdById: string;
}) => {
  const user = await notificationRepository.findActiveUser(params.userId);
  if (!user) {
    return null;
  }

  return notificationRepository.create({
    content: params.content,
    userId: params.userId,
    createdById: params.createdById,
  });
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
    createdById: actor.userId,
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

  const { page, limit, isRead, scope } =
    notificationValidationService.validateListQuery(query);
  const skip = (page - 1) * limit;

  const effectiveScope = resolveListScope(actor, scope);

  const { where, unreadWhere } = buildListFilters(actor, effectiveScope);

  const { items, total, unreadCount } = await notificationRepository.findMany({
    where: {
      ...where,
      ...(isRead !== undefined && { isRead }),
    },
    unreadWhere,
    skip,
    take: limit,
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

  if (!canAccessNotification(notification, actor)) {
    throw new NotFoundError("Notification not found");
  }

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

  if (!canAccessNotification(existing, actor)) {
    throw new NotFoundError("Notification not found");
  }

  const dto = notificationValidationService.validateUpdate(body);
  const actorCanManage = canCreate(actor.role);
  const isRecipient = existing.userId === actor.userId;
  const isCreator =
    existing.createdById === actor.userId && actorCanManage;

  if (dto.content !== undefined && !actorCanManage) {
    throw new ForbiddenError("Only admins can edit notification content");
  }

  if (dto.isRead !== undefined && !isRecipient && !isCreator) {
    throw new ForbiddenError(
      "You can only update read status on your own notifications",
    );
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

  const isRecipient = existing.userId === actor.userId;
  const isCreator =
    existing.createdById === actor.userId && canCreate(actor.role);

  if (!isRecipient && !isCreator && !canDelete(actor.role)) {
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
