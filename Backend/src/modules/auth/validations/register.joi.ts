import Joi from "joi";
import { UserRole } from "../../../generated/prisma/client.js";

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
});
