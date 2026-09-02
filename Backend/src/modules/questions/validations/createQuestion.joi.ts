import Joi from "joi";
import { tagIdsSchema, tagsInputSchema } from "./tagIds.joi.js";

export const createQuestionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  category: Joi.string().trim().optional(),
  content: Joi.string().trim().min(5).max(2000).required(),
  isAnonymous: Joi.boolean().optional(),
  roomId: Joi.string().uuid().optional(),
  tagIds: tagIdsSchema.optional(),
  tags: tagsInputSchema.optional(),
}).unknown(false);
