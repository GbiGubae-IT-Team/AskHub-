import { NotificationTarget } from "../../../generated/prisma/client.js";

export interface CreateNotificationDto {
  content: string;
  targetType: NotificationTarget;
  userId?: string;
}
