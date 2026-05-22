import Joi from "joi";
import { MessageType } from "../../../generated/prisma/client.js";

export const createMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  type: Joi.string()
    .valid(...Object.values(MessageType))
    .required(),
  roomId: Joi.string().uuid().required(),
}).unknown(false);
