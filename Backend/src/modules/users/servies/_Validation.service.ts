import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { CreateUserDto } from "../dto/createUser.dto.js";
import type { UpdateUserDto } from "../dto/updateUser.dto.js";
import type { ListUsersQuery } from "../types/user.types.js";
import {
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
} from "../validations/index.js";

const formatJoiError = (error: { details: { message: string }[] }) =>
  error.details.map((d) => d.message).join(", ");

export const userValidationService = {
  validateCreate(body: unknown): CreateUserDto {
    const { error, value } = createUserSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as CreateUserDto;
  },

  validateUpdate(body: unknown): UpdateUserDto {
    const { error, value } = updateUserSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as UpdateUserDto;
  },

  validateListQuery(query: unknown): ListUsersQuery {
    const { error, value } = listUsersSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as ListUsersQuery;
  },
};
