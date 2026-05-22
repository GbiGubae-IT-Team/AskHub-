import type { UserRole } from "../../../generated/prisma/client.js";

export type AnswerAuthorRecord = {
  id: string;
  anonymousId: string;
  role: UserRole;
};

export type AnswerRecord = {
  id: string;
  content: string;
  createdAt: Date;
  questionId: string;
  authorId: string;
  author: AnswerAuthorRecord;
};

export interface AnswerResponse {
  id: string;
  content: string;
  createdAt: Date;
  questionId: string;
  author: AnswerAuthorRecord;
}

export interface ListAnswersQuery {
  page: number;
  limit: number;
  questionId: string;
}

export interface PaginatedAnswersResponse {
  items: AnswerResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const toAnswerResponse = (answer: AnswerRecord): AnswerResponse => ({
  id: answer.id,
  content: answer.content,
  createdAt: answer.createdAt,
  questionId: answer.questionId,
  author: answer.author,
});
