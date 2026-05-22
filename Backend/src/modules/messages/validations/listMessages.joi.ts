import Joi from "joi";
import { MessageType } from "../../../generated/prisma/client.js";

export const listMessagesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  roomId: Joi.string().uuid().required(),
  type: Joi.string()
    .valid(...Object.values(MessageType))
    .optional(),
  mine: Joi.boolean().default(false),
});
