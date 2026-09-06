import Joi from "joi";

import { NotificationTarget } from "../../../generated/prisma/client.js";

export const createNotificationSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).required(),
  targetType: Joi.string().valid(NotificationTarget.PUBLIC, NotificationTarget.STAFF, NotificationTarget.USER).required(),
  userId: Joi.string().uuid().when('targetType', {
    is: NotificationTarget.USER,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
}).unknown(false);
