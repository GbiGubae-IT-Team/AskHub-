import Joi from "joi";

export const updateNotificationSchema = Joi.object({
  isRead: Joi.boolean().required(),
}).unknown(false);
