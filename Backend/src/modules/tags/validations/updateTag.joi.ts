import Joi from "joi";

export const updateTagSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
}).unknown(false);
