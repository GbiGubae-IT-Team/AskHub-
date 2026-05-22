import Joi from "joi";

export const updateNotificationSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).optional(),
  isRead: Joi.boolean().optional(),
})
  .min(1)
  .unknown(false)
  .messages({ "object.min": "At least one field is required to update" });
