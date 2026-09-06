import Joi from "joi";
import { QuestionStatus } from "../../../generated/prisma/client.js";

export const listQuestionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid(...Object.values(QuestionStatus))
    .optional(),
  roomId: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.string().valid("null")
  ).optional(),
  mine: Joi.boolean().default(false),
});
