import Joi from "joi";

export const createNotificationSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).required(),
  userId: Joi.string().uuid().required(),
}).unknown(false);
