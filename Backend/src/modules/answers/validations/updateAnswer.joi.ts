import Joi from "joi";

export const updateAnswerSchema = Joi.object({
  content: Joi.string().trim().min(5).max(5000).required(),
}).unknown(false);
