import jwt from "jsonwebtoken";
import type { JwtPayload } from "../../shared/types/types.js";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export const tokenService = {
  generateAccessToken(payload: JwtPayload) {
    return jwt.sign(payload, env.jwtAccessSecret, {
      expiresIn: "15m",
    });
  },

  generateRefreshToken(payload: JwtPayload) {
    return jwt.sign(payload, env.jwtRefreshSecret, {
      expiresIn: "7d",
    });
  },

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  },

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  },
};
