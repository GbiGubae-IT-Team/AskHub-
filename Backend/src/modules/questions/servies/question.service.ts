import { QuestionStatus } from "../../../generated/prisma/client.js";
import { hasPermission } from "../../../core/constants/permissions.js";
import { isPrivilegedRole } from "../../../core/constants/roleHierarchy.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import {
  buildListWhere,
  questionRepository,
} from "../repositories/question.repository.js";
import {
  isPubliclyVisible,
  toQuestionResponse,
  type ListQuestionsQuery,
  type PaginatedQuestionsResponse,
  type QuestionResponse,
} from "../types/question.types.js";
import { questionValidationService } from "./questionValidation.service.js";

const canCreate = (role: JwtPayload["role"]) =>
  hasPermission(role, "question:create");

const canRead = (role: JwtPayload["role"]) =>
  hasPermission(role, "question:read");

const canApprove = (role: JwtPayload["role"]) =>
  hasPermission(role, "question:approve");

const canDelete = (role: JwtPayload["role"]) =>
  hasPermission(role, "question:delete");

const canManageTags = (role: JwtPayload["role"]) =>
  hasPermission(role, "tag:manage");

const assertValidTagIds = async (tagIds: string[]) => {
  const tagCount = await questionRepository.countTags(tagIds);
  if (tagCount !== tagIds.length) {
    throw new BadRequestError("One or more tags are invalid");
  }
};

const canViewQuestion = (
  question: { authorId: string; status: QuestionStatus },
  actor?: JwtPayload,
) => {
  if (isPubliclyVisible(question.status)) {
    return true;
  }

  if (!actor) {
    return false;
  }

  if (canApprove(actor.role) || isPrivilegedRole(actor.role)) {
    return true;
  }

  return actor.userId === question.authorId;
};

export const createQuestionService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<QuestionResponse> => {
  if (!canCreate(actor.role)) {
    throw new ForbiddenError("You do not have permission to create questions");
  }

  const dto = questionValidationService.validateCreate(body);

  if (dto.roomId) {
    const room = await questionRepository.findActiveRoom(dto.roomId);
    if (!room) {
      throw new BadRequestError("Room not found or is inactive");
    }
  }

  if (dto.tagIds?.length) {
    await assertValidTagIds(dto.tagIds);
  }

  const question = await questionRepository.create({
    content: dto.content,
    isAnonymous: dto.isAnonymous ?? true,
    authorId: actor.userId,
    ...(dto.roomId !== undefined && { roomId: dto.roomId }),
    ...(dto.tagIds !== undefined && { tagIds: dto.tagIds }),
  });

  return toQuestionResponse(question, actor, canApprove(actor.role));
};

export const listQuestionsService = async (
  query: unknown,
  actor?: JwtPayload,
): Promise<PaginatedQuestionsResponse> => {
  if (actor && !canRead(actor.role)) {
    throw new ForbiddenError("You do not have permission to read questions");
  }

  const { page, limit, status, roomId, mine } =
    questionValidationService.validateListQuery(query);

  if (mine && !actor) {
    throw new ForbiddenError("Authentication required to list your questions");
  }

  const canModerate = actor
    ? canApprove(actor.role) || isPrivilegedRole(actor.role)
    : false;

  const skip = (page - 1) * limit;

  const { items, total } = await questionRepository.findMany({
    skip,
    take: limit,
    where: buildListWhere({
      ...(actor?.userId !== undefined && { actorUserId: actor.userId }),
      canModerate,
      ...(status !== undefined && { status }),
      ...(roomId !== undefined && { roomId }),
      mine: mine ?? false,
    }),
  });

  const viewerCanApprove = actor ? canApprove(actor.role) : false;

  return {
    items: items.map((q) =>
      toQuestionResponse(q, actor, viewerCanApprove),
    ),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getQuestionByIdService = async (
  id: string,
  actor?: JwtPayload,
): Promise<QuestionResponse> => {
  const question = await questionRepository.findById(id);

  if (!question) {
    throw new NotFoundError("Question not found");
  }

  if (!canViewQuestion(question, actor)) {
    throw new NotFoundError("Question not found");
  }

  return toQuestionResponse(
    question,
    actor,
    actor ? canApprove(actor.role) : false,
  );
};

export const updateQuestionService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<QuestionResponse> => {
  const existing = await questionRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  if (!canViewQuestion(existing, actor)) {
    throw new NotFoundError("Question not found");
  }

  const dto = questionValidationService.validateUpdate(body);
  const isAuthor = existing.authorId === actor.userId;
  const actorCanApprove = canApprove(actor.role);
  const actorIsPrivileged = isPrivilegedRole(actor.role);

  if (dto.status !== undefined && !actorCanApprove && !actorIsPrivileged) {
    throw new ForbiddenError("Only teachers and admins can change question status");
  }

  if (
    (dto.content !== undefined || dto.isAnonymous !== undefined) &&
    !isAuthor &&
    !actorIsPrivileged
  ) {
    throw new ForbiddenError("You can only edit your own questions");
  }

  if (
    isAuthor &&
    !actorCanApprove &&
    !actorIsPrivileged &&
    existing.status !== QuestionStatus.PENDING
  ) {
    throw new BadRequestError("Only pending questions can be edited by the author");
  }

  if (dto.status !== undefined && isAuthor && !actorCanApprove) {
    throw new ForbiddenError("You cannot change the status of your own question");
  }

  if (dto.tagIds !== undefined) {
    const canRetagAsAuthor =
      isAuthor &&
      existing.status === QuestionStatus.PENDING &&
      !actorCanApprove &&
      !actorIsPrivileged;

    const canRetagAsModerator =
      actorCanApprove || actorIsPrivileged || canManageTags(actor.role);

    if (!canRetagAsAuthor && !canRetagAsModerator) {
      throw new ForbiddenError(
        "You can only change tags on your own pending questions, or you need teacher/admin permissions",
      );
    }

    if (
      isAuthor &&
      !actorCanApprove &&
      !actorIsPrivileged &&
      existing.status !== QuestionStatus.PENDING
    ) {
      throw new BadRequestError(
        "Only pending questions can have tags changed by the author",
      );
    }

    await assertValidTagIds(dto.tagIds);
  }

  let question = await questionRepository.update(id, {
    ...(dto.content !== undefined && { content: dto.content }),
    ...(dto.isAnonymous !== undefined && { isAnonymous: dto.isAnonymous }),
    ...(dto.status !== undefined && { status: dto.status }),
  });

  if (dto.tagIds !== undefined) {
    question = await questionRepository.setTags(id, dto.tagIds);
  }

  return toQuestionResponse(question, actor, actorCanApprove);
};

export const deleteQuestionService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  if (!canDelete(actor.role)) {
    throw new ForbiddenError("You do not have permission to delete questions");
  }

  const existing = await questionRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  try {
    await questionRepository.delete(id);
  } catch (error) {
    mapPrismaError(error);
  }
};
