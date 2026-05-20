import Joi from "joi";
import { RoomType } from "../../../generated/prisma/client.js";

export const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  type: Joi.string()
    .valid(...Object.values(RoomType))
    .required(),
});
