import type { Prisma, QuestionStatus } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const answerSelect = {
  id: true,
  content: true,
  createdAt: true,
  questionId: true,
  authorId: true,
  author: {
    select: {
      id: true,
      anonymousId: true,
      role: true,
    },
  },
} satisfies Prisma.AnswerSelect;

export const answerRepository = {
  async findById(id: string) {
    return prisma.answer.findUnique({
      where: { id },
      select: answerSelect,
    });
  },

  async findMany(params: {
    questionId: string;
    skip: number;
    take: number;
  }) {
    const where = { questionId: params.questionId };

    const [items, total] = await Promise.all([
      prisma.answer.findMany({
        where,
        select: answerSelect,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "asc" },
      }),
      prisma.answer.count({ where }),
    ]);

    return { items, total };
  },

  async create(data: {
    content: string;
    questionId: string;
    authorId: string;
  }) {
    return prisma.answer.create({
      data: {
        content: data.content,
        question: { connect: { id: data.questionId } },
        author: { connect: { id: data.authorId } },
      },
      select: answerSelect,
    });
  },

  async update(id: string, content: string) {
    return prisma.answer.update({
      where: { id },
      data: { content },
      select: answerSelect,
    });
  },

  async delete(id: string) {
    return prisma.answer.delete({
      where: { id },
      select: { id: true },
    });
  },

  async findQuestionForAnswer(questionId: string) {
    return prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        status: true,
        authorId: true,
        content: true,
      },
    });
  },

  async updateQuestionStatus(questionId: string, status: QuestionStatus) {
    return prisma.question.update({
      where: { id: questionId },
      data: { status },
      select: { id: true, status: true },
    });
  },
};
