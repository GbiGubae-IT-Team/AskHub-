import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { CreateQuestionDto } from "../dto/createQuestion.dto.js";
import type { UpdateQuestionDto } from "../dto/updateQuestion.dto.js";
import type { ListQuestionsQuery } from "../types/question.types.js";
import {
  createQuestionSchema,
  listQuestionsSchema,
  updateQuestionSchema,
} from "../validations/index.js";

const formatJoiError = (error: { details: { message: string }[] }) =>
  error.details.map((d) => d.message).join(", ");

export const questionValidationService = {
  validateCreate(body: unknown): CreateQuestionDto {
    const { error, value } = createQuestionSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as CreateQuestionDto;
  },

  validateUpdate(body: unknown): UpdateQuestionDto {
    const { error, value } = updateQuestionSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as UpdateQuestionDto;
  },

  validateListQuery(query: unknown): ListQuestionsQuery {
    const { error, value } = listQuestionsSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as ListQuestionsQuery;
  },
};
