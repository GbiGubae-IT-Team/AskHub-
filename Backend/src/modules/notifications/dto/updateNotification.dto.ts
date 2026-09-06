import { NotificationTarget } from "../../../generated/prisma/client.js";

export interface UpdateNotificationDto {
  content?: string;
  isRead?: boolean;
  isActive?: boolean;
  targetType?: NotificationTarget;
}
