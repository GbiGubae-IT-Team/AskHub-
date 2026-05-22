export type NotificationRecord = {
  id: string;
  content: string;
  isRead: boolean;
  userId: string;
  createdById: string | null;
  createdAt: Date;
};

export interface NotificationResponse {
  id: string;
  content: string;
  isRead: boolean;
  recipientId: string;
  createdById: string | null;
  createdAt: Date;
}

export type NotificationListScope = "received" | "sent";

export interface ListNotificationsQuery {
  page: number;
  limit: number;
  isRead?: boolean;
  scope?: NotificationListScope;
}

export interface PaginatedNotificationsResponse {
  items: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export const toNotificationResponse = (
  notification: NotificationRecord,
): NotificationResponse => ({
  id: notification.id,
  content: notification.content,
  isRead: notification.isRead,
  recipientId: notification.userId,
  createdById: notification.createdById,
  createdAt: notification.createdAt,
});
