export type NotificationRecord = {
  id: string;
  content: string;
  isRead: boolean;
  userId: string;
  createdAt: Date;
};

export interface NotificationResponse {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ListNotificationsQuery {
  page: number;
  limit: number;
  isRead?: boolean;
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
  createdAt: notification.createdAt,
});
