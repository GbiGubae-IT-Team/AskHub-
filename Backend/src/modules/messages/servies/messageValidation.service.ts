import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { CreateMessageDto } from "../dto/createMessage.dto.js";
import type { UpdateMessageDto } from "../dto/updateMessage.dto.js";
import type { ListMessagesQuery } from "../types/message.types.js";
import {
  createMessageSchema,
  listMessagesSchema,
  updateMessageSchema,
} from "../validations/index.js";

const formatJoiError = (error: { details: { message: string }[] }) =>
  error.details.map((d) => d.message).join(", ");

export const messageValidationService = {
  validateCreate(body: unknown): CreateMessageDto {
    const { error, value } = createMessageSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as CreateMessageDto;
  },

  validateUpdate(body: unknown): UpdateMessageDto {
    const { error, value } = updateMessageSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as UpdateMessageDto;
  },

  validateListQuery(query: unknown): ListMessagesQuery {
    const { error, value } = listMessagesSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as ListMessagesQuery;
  },
};
