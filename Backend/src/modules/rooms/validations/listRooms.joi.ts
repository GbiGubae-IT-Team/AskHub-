import Joi from "joi";
import { RoomType } from "../../../generated/prisma/client.js";

export const listRoomsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string()
    .valid(...Object.values(RoomType))
    .optional(),
  includeInactive: Joi.boolean().default(false),
});
