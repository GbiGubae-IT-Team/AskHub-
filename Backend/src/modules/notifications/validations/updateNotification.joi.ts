import Joi from "joi";
import { NotificationTarget } from "../../../generated/prisma/client.js";

export const updateNotificationSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).optional(),
  isRead: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  targetType: Joi.string().valid(NotificationTarget.PUBLIC, NotificationTarget.STAFF, NotificationTarget.USER).optional(),
})
  .min(1)
  .unknown(false)
  .messages({ "object.min": "At least one field is required to update" });
