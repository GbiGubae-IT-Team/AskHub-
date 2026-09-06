import type { UserRole, StaffStatus } from "../../../generated/prisma/client.js";

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: UserRole;
  staffStatus?: StaffStatus;
}
