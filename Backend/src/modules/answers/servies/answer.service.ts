import { QuestionStatus, NotificationTarget } from "../../../generated/prisma/client.js";
import { hasPermission } from "../../../core/constants/permissions.js";
import { isPrivilegedRole } from "../../../core/constants/roleHierarchy.js";
import { BadRequestError } from "../../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../../core/errors/NotFoundError.js";
import { mapPrismaError } from "../../../core/utils/prismaErrors.js";
import { sendNotificationToUser } from "../../notifications/servies/notification.service.js";
import { isPubliclyVisible } from "../../questions/types/question.types.js";
import type { JwtPayload } from "../../../shared/types/types.js";
import { answerRepository } from "../repositories/answer.repository.js";
import {
  toAnswerResponse,
  type ListAnswersQuery,
  type PaginatedAnswersResponse,
  type AnswerResponse,
} from "../types/answer.types.js";
import { answerValidationService } from "./answerValidation.service.js";

const canCreate = (role: JwtPayload["role"]) =>
  hasPermission(role, "answer:create");

const canReadQuestions = (role: JwtPayload["role"]) =>
  hasPermission(role, "question:read");

const canApprove = (role: JwtPayload["role"]) =>
  hasPermission(role, "question:approve");

const canDelete = (role: JwtPayload["role"]) =>
  hasPermission(role, "answer:delete");

const assertCanViewQuestion = (
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

const assertQuestionAnswerable = (
  question: { status: QuestionStatus },
  actor: JwtPayload,
) => {
  if (question.status === QuestionStatus.REJECTED) {
    throw new BadRequestError("Cannot answer a rejected question");
  }

  if (question.status === QuestionStatus.PENDING && !canApprove(actor.role)) {
    throw new BadRequestError(
      "Only teachers and admins can answer pending questions",
    );
  }
};

export const createAnswerService = async (
  body: unknown,
  actor: JwtPayload,
): Promise<AnswerResponse> => {
  if (!canCreate(actor.role)) {
    throw new ForbiddenError("You do not have permission to create answers");
  }

  const dto = answerValidationService.validateCreate(body);

  const question = await answerRepository.findQuestionForAnswer(dto.questionId);

  if (!question) {
    throw new NotFoundError("Question not found");
  }

  assertQuestionAnswerable(question, actor);

  const answer = await answerRepository.create({
    content: dto.content,
    questionId: dto.questionId,
    authorId: actor.userId,
  });

  if (question.status !== QuestionStatus.ANSWERED) {
    await answerRepository.updateQuestionStatus(
      dto.questionId,
      QuestionStatus.ANSWERED,
    );
  }

  if (question.authorId !== actor.userId) {
    await sendNotificationToUser({
      userId: question.authorId,
      content: "Your question has been answered.",
      targetType: NotificationTarget.USER,
      createdById: actor.userId,
    });
  }

  return toAnswerResponse(answer);
};

export const listAnswersService = async (
  query: unknown,
  actor?: JwtPayload,
): Promise<PaginatedAnswersResponse> => {
  if (actor && !canReadQuestions(actor.role)) {
    throw new ForbiddenError("You do not have permission to read answers");
  }

  const { page, limit, questionId } =
    answerValidationService.validateListQuery(query);

  const question = await answerRepository.findQuestionForAnswer(questionId);

  if (!question) {
    throw new NotFoundError("Question not found");
  }

  if (!assertCanViewQuestion(question, actor)) {
    throw new NotFoundError("Question not found");
  }

  const skip = (page - 1) * limit;

  const { items, total } = await answerRepository.findMany({
    questionId,
    skip,
    take: limit,
  });

  return {
    items: items.map(toAnswerResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getAnswerByIdService = async (
  id: string,
  actor?: JwtPayload,
): Promise<AnswerResponse> => {
  const answer = await answerRepository.findById(id);

  if (!answer) {
    throw new NotFoundError("Answer not found");
  }

  const question = await answerRepository.findQuestionForAnswer(
    answer.questionId,
  );

  if (!question || !assertCanViewQuestion(question, actor)) {
    throw new NotFoundError("Answer not found");
  }

  return toAnswerResponse(answer);
};

export const updateAnswerService = async (
  id: string,
  body: unknown,
  actor: JwtPayload,
): Promise<AnswerResponse> => {
  const existing = await answerRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Answer not found");
  }

  const isAuthor = existing.authorId === actor.userId;
  const actorIsPrivileged = isPrivilegedRole(actor.role);

  if (!isAuthor && !actorIsPrivileged) {
    throw new ForbiddenError("You can only edit your own answers");
  }

  const dto = answerValidationService.validateUpdate(body);

  const answer = await answerRepository.update(id, dto.content);

  return toAnswerResponse(answer);
};

export const deleteAnswerService = async (
  id: string,
  actor: JwtPayload,
): Promise<void> => {
  const existing = await answerRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("Answer not found");
  }

  const isAuthor = existing.authorId === actor.userId;

  if (!isAuthor && !canDelete(actor.role)) {
    throw new ForbiddenError("You do not have permission to delete this answer");
  }

  try {
    await answerRepository.delete(id);
  } catch (error) {
    return mapPrismaError(error);
  }
};
