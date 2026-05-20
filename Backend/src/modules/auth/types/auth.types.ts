import type { Request } from "express";
import type { UserRole } from "../../../generated/prisma/client.js";
import type { JwtPayload } from "../../../shared/types/types.js";

export interface AuthUser {
  id: string;
  anonymousId: string;
  role: UserRole;
  email: string | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    anonymousId: string;
    role: UserRole;
    email: string | null;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export type { JwtPayload };
