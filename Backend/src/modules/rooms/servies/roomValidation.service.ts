import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { CreateRoomDto } from "../dto/createRoom.dto.js";
import type { UpdateRoomDto } from "../dto/updateRoom.dto.js";
import type { ListRoomsQuery } from "../types/room.types.js";
import {
  createRoomSchema,
  listRoomsSchema,
  updateRoomSchema,
} from "../validations/index.js";

const formatJoiError = (error: { details: { message: string }[] }) =>
  error.details.map((d) => d.message).join(", ");

export const roomValidationService = {
  validateCreate(body: unknown): CreateRoomDto {
    const { error, value } = createRoomSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as CreateRoomDto;
  },

  validateUpdate(body: unknown): UpdateRoomDto {
    const { error, value } = updateRoomSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as UpdateRoomDto;
  },

  validateListQuery(query: unknown): ListRoomsQuery {
    const { error, value } = listRoomsSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as ListRoomsQuery;
  },
};
