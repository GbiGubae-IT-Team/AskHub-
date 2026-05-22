import Joi from "joi";

export const createQuestionSchema = Joi.object({
  content: Joi.string().trim().min(5).max(2000).required(),
  isAnonymous: Joi.boolean().optional(),
  roomId: Joi.string().uuid().optional(),
  tagIds: Joi.array().items(Joi.string().uuid()).max(10).optional(),
}).unknown(false);
