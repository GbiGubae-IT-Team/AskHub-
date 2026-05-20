import type { UserRole } from "../../../generated/prisma/client.js";

export interface CreateUserDto {
  email: string;
  password: string;
  role?: UserRole;
}
