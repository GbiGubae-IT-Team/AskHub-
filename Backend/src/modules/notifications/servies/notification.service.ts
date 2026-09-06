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
import { NotificationTarget } from "../../../generated/prisma/client.js";
import { notificationValidationService } from "./notificationValidation.service.js";

const canRead = (role: JwtPayload["role"]) =>
  hasPermission(role, "notification:read");

const canCreate = (role: JwtPayload["role"]) =>
  hasPermission(role, "notification:create");

const canDelete = (role: JwtPayload["role"]) =>
  hasPermission(role, "notification:delete");

const canAccessNotification = (
  notification: { userId: string | null; createdById: string | null; targetType: string },
  actor: JwtPayload,
) => {
  if (notification.targetType === NotificationTarget.PUBLIC) return true;
  if (notification.targetType === NotificationTarget.STAFF && actor.role !== 'STUDENT') return true;
  if (notification.targetType === NotificationTarget.USER && notification.userId === actor.userId) return true;

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

  const baseUnreadAndWhere = actor.role === 'STUDENT' ? {
    OR: [
      { targetType: NotificationTarget.PUBLIC },
      { targetType: NotificationTarget.USER, userId: actor.userId }
    ]
  } : {
    OR: [
      { targetType: NotificationTarget.PUBLIC },
      { targetType: NotificationTarget.STAFF },
      { targetType: NotificationTarget.USER, userId: actor.userId }
    ]
  };

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
          baseUnreadAndWhere,
          { createdById: actor.userId },
        ],
      },
      unreadWhere: baseUnreadAndWhere,
    };
  }

  return {
    where: baseUnreadAndWhere,
    unreadWhere: baseUnreadAndWhere,
  };
};

/** Internal helper for other modules (e.g. answers) — no admin permission required. */
export const sendNotificationToUser = async (params: {
  userId?: string;
  targetType: NotificationTarget;
  content: string;
  createdById?: string;
}) => {
  if (params.targetType === NotificationTarget.USER && params.userId) {
    const user = await notificationRepository.findActiveUser(params.userId);
    if (!user) {
      return null;
    }
  }

  return notificationRepository.create(
    {
      content: params.content,
      targetType: params.targetType,
      userId: params.userId,
      createdById: params.createdById,
    },
    params.createdById || "system"
  );
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

  if (dto.userId) {
    const user = await notificationRepository.findActiveUser(dto.userId);
    if (!user) {
      throw new BadRequestError("Target user not found or is inactive");
    }
  }

  const notification = await notificationRepository.create({
    content: dto.content,
    targetType: dto.targetType,
    userId: dto.userId,
    createdById: actor.userId,
  }, actor.userId);

  return toNotificationResponse(notification);
};

export const listNotificationsService = async (
  query: unknown,
  actor: JwtPayload | undefined,
): Promise<PaginatedNotificationsResponse> => {
  // Guest users (unauthenticated) can only see active PUBLIC notifications
  if (!actor) {
    const { page, limit } = notificationValidationService.validateListQuery(query);
    const skip = (page - 1) * limit;

    const guestWhere = {
      targetType: NotificationTarget.PUBLIC,
      isActive: true,
    };

    const { items, total } = await notificationRepository.findMany({
      where: guestWhere,
      unreadWhere: guestWhere,
      skip,
      take: limit,
      actorId: 'guest',
    });

    return {
      items: items.map(toNotificationResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount: 0,
    };
  }

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

  // Super admins fetching "all" can see inactive notifications too;
  // regular staff only see active ones
  const isActiveFilter = canCreate(actor.role) && effectiveScope === 'all'
    ? {} // super admins see everything in "all" scope
    : { isActive: true };

  const { items, total, unreadCount } = await notificationRepository.findMany({
    where: {
      ...where,
      ...isActiveFilter,
    },
    unreadWhere: { ...unreadWhere, isActive: true },
    skip,
    take: limit,
    actorId: actor.userId
  });

  // Since we fetch isRead dynamically, if isRead filter is applied we must filter after DB or use complex subquery.
  // For simplicity, we just filter in memory if isRead is provided (if performance is an issue, update repository)
  let finalItems = items;
  if (isRead !== undefined) {
    finalItems = items.filter(i => i.isRead === isRead);
  }

  return {
    items: finalItems.map(toNotificationResponse),
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

  const notification = await notificationRepository.findById(id, actor.userId);

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

  const existing = await notificationRepository.findById(id, actor.userId);

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

  if ((dto.isActive !== undefined || dto.targetType !== undefined) && !actorCanManage) {
    throw new ForbiddenError("Only admins can change notification visibility or target");
  }

  if (dto.isRead !== undefined && !isRecipient && !isCreator) {
    throw new ForbiddenError(
      "You can only update read status on your own notifications",
    );
  }

  let notification = existing;

  // Build update payload for content/isActive/targetType (admin fields)
  const adminUpdate: Record<string, unknown> = {};
  if (dto.content !== undefined) adminUpdate.content = dto.content;
  if (dto.isActive !== undefined) adminUpdate.isActive = dto.isActive;
  if (dto.targetType !== undefined) adminUpdate.targetType = dto.targetType;

  if (Object.keys(adminUpdate).length > 0) {
    notification = await notificationRepository.update(id, adminUpdate, actor.userId);
  }

  if (dto.isRead === true) {
    notification = (await notificationRepository.markAsRead(id, actor.userId)) || notification;
  }

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

  const { where } = buildListFilters(actor, "received");
  const result = await notificationRepository.markAllRead(actor.userId, where);

  return { updatedCount: result.count };
};

export const deleteNotificationService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  const existing = await notificationRepository.findById(id, actor.userId);

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
