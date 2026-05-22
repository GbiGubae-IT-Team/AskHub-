import type { Prisma, QuestionStatus } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const questionSelect = {
  id: true,
  content: true,
  isAnonymous: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  roomId: true,
  author: {
    select: {
      id: true,
      anonymousId: true,
      role: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.QuestionSelect;

const mapQuestion = (
  row: Prisma.QuestionGetPayload<{ select: typeof questionSelect }>,
) => ({
  id: row.id,
  content: row.content,
  isAnonymous: row.isAnonymous,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  authorId: row.authorId,
  roomId: row.roomId,
  author: row.author,
  tags: row.tags.map((t) => t.tag),
});

export const questionRepository = {
  async findById(id: string) {
    const row = await prisma.question.findUnique({
      where: { id },
      select: questionSelect,
    });
    return row ? mapQuestion(row) : null;
  },

  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.QuestionWhereInput;
  }) {
    const where = params.where;

    const [rows, total] = await Promise.all([
      prisma.question.findMany({
        where,
        select: questionSelect,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.question.count({ where }),
    ]);

    return { items: rows.map(mapQuestion), total };
  },

  async create(data: {
    content: string;
    isAnonymous: boolean;
    authorId: string;
    roomId?: string;
    tagIds?: string[];
  }) {
    const row = await prisma.question.create({
      data: {
        content: data.content,
        isAnonymous: data.isAnonymous,
        author: { connect: { id: data.authorId } },
        ...(data.roomId && { room: { connect: { id: data.roomId } } }),
        ...(data.tagIds?.length && {
          tags: {
            create: data.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      select: questionSelect,
    });

    return mapQuestion(row);
  },

  async update(id: string, data: Prisma.QuestionUpdateInput) {
    const row = await prisma.question.update({
      where: { id },
      data,
      select: questionSelect,
    });

    return mapQuestion(row);
  },

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany({ where: { questionId: id } });
      await tx.questionTag.deleteMany({ where: { questionId: id } });
      await tx.answer.deleteMany({ where: { questionId: id } });
      return tx.question.delete({ where: { id } });
    });
  },

  async countTags(tagIds: string[]) {
    return prisma.tag.count({
      where: { id: { in: tagIds } },
    });
  },

  async findActiveRoom(roomId: string) {
    return prisma.room.findFirst({
      where: { id: roomId, isActive: true },
      select: { id: true },
    });
  },
};

export const buildListWhere = (params: {
  actorUserId?: string;
  canModerate: boolean;
  status?: QuestionStatus;
  roomId?: string;
  mine?: boolean;
}): Prisma.QuestionWhereInput => {
  const { actorUserId, canModerate, status, roomId, mine } = params;

  if (canModerate) {
    return {
      ...(status !== undefined && { status }),
      ...(roomId !== undefined && { roomId }),
      ...(mine && actorUserId && { authorId: actorUserId }),
    };
  }

  if (mine && actorUserId) {
    return {
      authorId: actorUserId,
      ...(status !== undefined && { status }),
      ...(roomId !== undefined && { roomId }),
    };
  }

  if (actorUserId) {
    const publicStatuses: QuestionStatus[] = ["APPROVED", "ANSWERED"];

    if (status !== undefined) {
      const orConditions: Prisma.QuestionWhereInput[] = [
        { authorId: actorUserId, status },
      ];

      if (publicStatuses.includes(status)) {
        orConditions.push({ status });
      }

      return {
        OR: orConditions,
        ...(roomId !== undefined && { roomId }),
      };
    }

    return {
      OR: [
        { authorId: actorUserId },
        { status: { in: publicStatuses } },
      ],
      ...(roomId !== undefined && { roomId }),
    };
  }

  return {
    status: status ?? { in: ["APPROVED", "ANSWERED"] as QuestionStatus[] },
    ...(roomId !== undefined && { roomId }),
  };
};
