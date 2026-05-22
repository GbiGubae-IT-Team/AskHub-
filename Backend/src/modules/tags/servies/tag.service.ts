import { Prisma } from "../../../generated/prisma/client.js";
import { hasPermission } from "../../../core/constants/permissions.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { tagRepository } from "../repositories/tag.repository.js";
import {
  toTagResponse,
  type ListTagsQuery,
  type PaginatedTagsResponse,
  type TagResponse,
} from "../types/tag.types.js";
import { tagValidationService } from "./tagValidation.service.js";

const canManageTags = (role: JwtPayload["role"]) =>
  hasPermission(role, "tag:manage");

const assertManageAccess = (actor: JwtPayload) => {
  if (!canManageTags(actor.role)) {
    throw new ForbiddenError("You do not have permission to manage tags");
  }
};

const assertUniqueName = async (name: string, excludeId?: string) => {
  const existing = await tagRepository.findByName(name, excludeId);
  if (existing) {
    throw new BadRequestError(`Tag "${name}" already exists`);
  }
};

export const createTagService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<TagResponse> => {
  assertManageAccess(actor);

  const dto = tagValidationService.validateCreate(body);
  await assertUniqueName(dto.name);

  try {
    const tag = await tagRepository.create(dto.name);
    return toTagResponse(tag);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BadRequestError(`Tag "${dto.name}" already exists`);
    }
    return mapPrismaError(error);
  }
};

export const listTagsService = async (
  query: unknown,
): Promise<PaginatedTagsResponse> => {
  const { page, limit, search } = tagValidationService.validateListQuery(query);
  const skip = (page - 1) * limit;

  const { items, total } = await tagRepository.findMany({
    skip,
    take: limit,
    ...(search !== undefined && { search }),
  });

  return {
    items: items.map(toTagResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getTagByIdService = async (id: string): Promise<TagResponse> => {
  const tag = await tagRepository.findById(id);

  if (!tag) {
    throw new NotFoundError("Tag not found");
  }

  return toTagResponse(tag);
};

export const updateTagService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<TagResponse> => {
  assertManageAccess(actor);

  const existing = await tagRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Tag not found");
  }

  const dto = tagValidationService.validateUpdate(body);
  await assertUniqueName(dto.name, id);

  try {
    const tag = await tagRepository.update(id, dto.name);
    return toTagResponse(tag);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BadRequestError(`Tag "${dto.name}" already exists`);
    }
    return mapPrismaError(error);
  }
};

export const deleteTagService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  assertManageAccess(actor);

  const existing = await tagRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Tag not found");
  }

  try {
    await tagRepository.delete(id);
  } catch (error) {
    mapPrismaError(error);
  }
};
