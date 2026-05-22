import Joi from "joi";

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
}).unknown(false);
