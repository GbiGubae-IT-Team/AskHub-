import Joi from "joi";
import { RoomType } from "../../../generated/prisma/client.js";

export const updateRoomSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().allow("").optional(),
  category: Joi.string().trim().optional(),
  staffVerified: Joi.boolean().optional(),
  type: Joi.string()
    .valid(...Object.values(RoomType))
    .optional(),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .unknown(false)
  .messages({ "object.min": "At least one field is required to update" });
