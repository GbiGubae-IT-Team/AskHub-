import Joi from "joi";

export const updateMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
}).unknown(false);
