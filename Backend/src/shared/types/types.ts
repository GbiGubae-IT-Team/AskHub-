import type { UserRole } from "../../generated/prisma/client.js";

export interface JwtPayload {
  userId: string;
  role: UserRole;
  anonymousId: string;
}
