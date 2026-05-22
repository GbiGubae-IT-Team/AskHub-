import Joi from "joi";
import { QuestionStatus } from "../../../generated/prisma/client.js";

export const updateQuestionSchema = Joi.object({
  content: Joi.string().trim().min(5).max(2000).optional(),
  isAnonymous: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...Object.values(QuestionStatus))
    .optional(),
})
  .min(1)
  .unknown(false)
  .messages({ "object.min": "At least one field is required to update" });
