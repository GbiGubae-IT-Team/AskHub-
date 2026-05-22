import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import type { CreateTagDto } from "../dto/createTag.dto.js";
import type { UpdateTagDto } from "../dto/updateTag.dto.js";
import type { ListTagsQuery } from "../types/tag.types.js";
import {
  createTagSchema,
  listTagsSchema,
  updateTagSchema,
} from "../validations/index.js";

const formatJoiError = (error: { details: { message: string }[] }) =>
  error.details.map((d) => d.message).join(", ");

export const tagValidationService = {
  validateCreate(body: unknown): CreateTagDto {
    const { error, value } = createTagSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as CreateTagDto;
  },

  validateUpdate(body: unknown): UpdateTagDto {
    const { error, value } = updateTagSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as UpdateTagDto;
  },

  validateListQuery(query: unknown): ListTagsQuery {
    const { error, value } = listTagsSchema.validate(query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new BadRequestError(formatJoiError(error));
    }

    return value as ListTagsQuery;
  },
};
