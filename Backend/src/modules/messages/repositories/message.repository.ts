import type { MessageType, Prisma } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const messageSelect = {
  id: true,
  content: true,
  type: true,
  createdAt: true,
  senderId: true,
  roomId: true,
  sender: {
    select: {
      id: true,
      anonymousId: true,
      role: true,
    },
  },
} satisfies Prisma.MessageSelect;

export const messageRepository = {
  async findById(id: string) {
    return prisma.message.findUnique({
      where: { id },
      select: messageSelect,
    });
  },

  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.MessageWhereInput;
  }) {
    const where = params.where;

    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where,
        select: messageSelect,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "asc" },
      }),
      prisma.message.count({ where }),
    ]);

    return { items, total };
  },

  async create(data: {
    content: string;
    type: MessageType;
    senderId: string;
    roomId: string;
  }) {
    return prisma.message.create({
      data: {
        content: data.content,
        type: data.type,
        sender: { connect: { id: data.senderId } },
        room: { connect: { id: data.roomId } },
      },
      select: messageSelect,
    });
  },

  async update(id: string, content: string) {
    return prisma.message.update({
      where: { id },
      data: { content },
      select: messageSelect,
    });
  },

  async delete(id: string) {
    return prisma.message.delete({
      where: { id },
      select: { id: true },
    });
  },

  async findRoom(roomId: string, includeInactive = false) {
    return prisma.room.findFirst({
      where: {
        id: roomId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: { id: true, isActive: true },
    });
  },
};
