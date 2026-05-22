import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { CreateAnswerDto } from "../dto/createAnswer.dto.js";
import type { UpdateAnswerDto } from "../dto/updateAnswer.dto.js";
import type { ListAnswersQuery } from "../types/answer.types.js";
import {
  createAnswerSchema,
  listAnswersSchema,
  updateAnswerSchema,
} from "../validations/index.js";

const formatJoiError = (error: { details: { message: string }[] }) =>
  error.details.map((d) => d.message).join(", ");

export const answerValidationService = {
  validateCreate(body: unknown): CreateAnswerDto {
    const { error, value } = createAnswerSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as CreateAnswerDto;
  },

  validateUpdate(body: unknown): UpdateAnswerDto {
    const { error, value } = updateAnswerSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as UpdateAnswerDto;
  },

  validateListQuery(query: unknown): ListAnswersQuery {
    const { error, value } = listAnswersSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as ListAnswersQuery;
  },
};
