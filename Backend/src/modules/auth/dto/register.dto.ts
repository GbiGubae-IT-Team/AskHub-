import type { UserRole } from "../../../generated/prisma/client.js";

export interface RegisterDto {
  email: string;
  password: string;
  role?: UserRole;
}
