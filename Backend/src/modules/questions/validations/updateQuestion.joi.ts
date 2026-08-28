import Joi from "joi";
import { QuestionStatus } from "../../../generated/prisma/client.js";
import { tagIdsSchema, tagsInputSchema } from "./tagIds.joi.js";

export const updateQuestionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  category: Joi.string().trim().optional(),
  content: Joi.string().trim().min(5).max(2000).optional(),
  isAnonymous: Joi.boolean().optional(),
  status: Joi.string()
    .valid(...Object.values(QuestionStatus))
    .optional(),
  tagIds: tagIdsSchema.optional(),
  tags: tagsInputSchema.optional(),
})
  .min(1)
  .unknown(false)
  .messages({ "object.min": "At least one field is required to update" });
