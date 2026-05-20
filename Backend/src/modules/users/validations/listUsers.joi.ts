import Joi from "joi";
import { UserRole } from "../../../generated/prisma/client.js";

export const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  includeInactive: Joi.boolean().default(false),
});
