import type { Prisma, RoomType } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const roomSelect = {
  id: true,
  name: true,
  type: true,
  isActive: true,
  createdAt: true,
  createdById: true,
  createdBy: {
    select: {
      id: true,
      anonymousId: true,
      role: true,
    },
  },
} satisfies Prisma.RoomSelect;

const activeOnly = { isActive: true } as const;

export const roomRepository = {
  async findById(id: string, includeInactive = false) {
    return prisma.room.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : activeOnly),
      },
      select: roomSelect,
    });
  },

  async findMany(params: {
    skip: number;
    take: number;
    type?: RoomType;
    includeInactive?: boolean;
  }) {
    const where: Prisma.RoomWhereInput = {
      ...(params.type !== undefined && { type: params.type }),
      ...(params.includeInactive ? {} : activeOnly),
    };

    const [items, total] = await Promise.all([
      prisma.room.findMany({
        where,
        select: roomSelect,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.room.count({ where }),
    ]);

    return { items, total };
  },

  async create(data: Prisma.RoomCreateInput) {
    return prisma.room.create({
      data,
      select: roomSelect,
    });
  },

  async update(id: string, data: Prisma.RoomUpdateInput) {
    return prisma.room.update({
      where: { id },
      data,
      select: roomSelect,
    });
  },

  async softDelete(id: string) {
    return prisma.room.update({
      where: { id },
      data: { isActive: false },
      select: roomSelect,
    });
  },
};
