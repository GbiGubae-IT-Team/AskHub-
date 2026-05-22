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

type TagInput = string | { id: string };

const resolveTagIds = (payload: {
  tagIds?: string[];
  tags?: TagInput[];
}): string[] | undefined => {
  const { tagIds, tags } = payload;

  if (tagIds !== undefined && tags !== undefined) {
    throw new BadRequestError("Use either tagIds or tags, not both");
  }

  if (tags !== undefined) {
    return tags.map((t) => (typeof t === "string" ? t : t.id));
  }

  return tagIds;
};

const normalizeQuestionInput = <T extends { tagIds?: string[]; tags?: TagInput[] }>(
  value: T,
): Omit<T, "tags"> & { tagIds?: string[] } => {
  const tagIds = resolveTagIds(value);
  const { tags: _tags, ...rest } = value;

  return {
    ...rest,
    ...(tagIds !== undefined && { tagIds }),
  };
};

export const questionValidationService = {
  validateCreate(body: unknown): CreateQuestionDto {
    const { error, value } = createQuestionSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return normalizeQuestionInput(value) as CreateQuestionDto;
  },

  validateUpdate(body: unknown): UpdateQuestionDto {
    const { error, value } = updateQuestionSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return normalizeQuestionInput(value) as UpdateQuestionDto;
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
