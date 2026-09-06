import {
  QuestionStatus,
  type UserRole,
} from "../../../generated/prisma/client.js";
import { isPrivilegedRole } from "../../../core/constants/roleHierarchy.js";

export type QuestionAuthorRecord = {
  id: string;
  anonymousId: string;
  role: UserRole;
};

export type QuestionTagRecord = {
  id: string;
  name: string;
};

export type QuestionRecord = {
  id: string;
  title: string | null;
  content: string;
  isAnonymous: boolean;
  category: string | null;
  status: QuestionStatus;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: QuestionAuthorRecord;
  roomId: string | null;
  tags: QuestionTagRecord[];
  answers: {
    id: string;
    content: string;
    createdAt: Date;
    author: QuestionAuthorRecord;
  }[];
};

export interface QuestionAuthorResponse {
  id?: string;
  anonymousId: string;
  role?: UserRole;
}

export interface QuestionResponse {
  id: string;
  title: string | null;
  content: string;
  isAnonymous: boolean;
  category: string | null;
  status: QuestionStatus;
  createdAt: Date;
  updatedAt: Date;
  roomId: string | null;
  author: QuestionAuthorResponse;
  tags: QuestionTagRecord[];
  answers: {
    id: string;
    content: string;
    createdAt: Date;
    author: QuestionAuthorResponse;
  }[];
}

export interface ListQuestionsQuery {
  page: number;
  limit: number;
  status?: QuestionStatus;
  roomId?: string | null;
  mine?: boolean;
}

export interface PaginatedQuestionsResponse {
  items: QuestionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PUBLIC_STATUSES: QuestionStatus[] = [
  QuestionStatus.APPROVED,
  QuestionStatus.ANSWERED,
];

export const isPubliclyVisible = (status: QuestionStatus) =>
  PUBLIC_STATUSES.includes(status);

export const toQuestionResponse = (
  question: QuestionRecord,
  viewer?: { userId: string; role: UserRole },
  canApprove = false,
): QuestionResponse => {
  const revealAuthor =
    !question.isAnonymous ||
    (viewer &&
      (viewer.userId === question.authorId ||
        canApprove ||
        isPrivilegedRole(viewer.role)));

  return {
    id: question.id,
    title: question.title,
    content: question.content,
    isAnonymous: question.isAnonymous,
    category: question.category,
    status: question.status,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    roomId: question.roomId,
    tags: question.tags,
    author: revealAuthor
      ? {
          id: question.author.id,
          anonymousId: question.author.anonymousId,
          role: question.author.role,
        }
      : { anonymousId: question.author.anonymousId },
    answers: question.answers.map(ans => ({
      id: ans.id,
      content: ans.content,
      createdAt: ans.createdAt,
      author: revealAuthor
        ? {
            id: ans.author.id,
            anonymousId: ans.author.anonymousId,
            role: ans.author.role,
          }
        : { anonymousId: ans.author.anonymousId },
    })),
  };
};
