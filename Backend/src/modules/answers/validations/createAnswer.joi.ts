import Joi from "joi";

export const createAnswerSchema = Joi.object({
  content: Joi.string().trim().min(5).max(5000).required(),
  questionId: Joi.string().uuid().required(),
}).unknown(false);
