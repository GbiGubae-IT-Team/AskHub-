import Joi from "joi";
import { UserRole } from "../../../generated/prisma/client.js";

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });
