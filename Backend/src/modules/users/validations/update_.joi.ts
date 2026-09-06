import Joi from "joi";
import { UserRole, StaffStatus } from "../../../generated/prisma/client.js";

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string()
    .valid(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
    .optional(),
  staffStatus: Joi.string()
    .valid(StaffStatus.PENDING, StaffStatus.APPROVED, StaffStatus.SUSPENDED)
    .optional(),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });
