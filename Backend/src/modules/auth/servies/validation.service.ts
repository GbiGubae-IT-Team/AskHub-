import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { LoginDto } from "../dto/login.dto.js";
import type { RegisterDto } from "../dto/register.dto.js";
import type { RefreshDto } from "../dto/refresh.dto.js";
import { loginSchema, refreshSchema, registerSchema } from "../validations/index.js";

export const authValidationService = {
  validateLogin(body: unknown): LoginDto {
    const { error, value } = loginSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(
        error.details.map((d) => d.message).join(", "),
      );
    }

    return value as LoginDto;
  },

  validateRegister(body: unknown): RegisterDto {
    const { error, value } = registerSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(
        error.details.map((d) => d.message).join(", "),
      );
    }

    return value as RegisterDto;
  },

  validateRefresh(body: unknown): RefreshDto {
    const { error, value } = refreshSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(
        error.details.map((d) => d.message).join(", "),
      );
    }

    return value as RefreshDto;
  },
};
