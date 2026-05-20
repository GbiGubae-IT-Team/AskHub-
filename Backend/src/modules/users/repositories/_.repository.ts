import type { Prisma, UserRole } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const userSelect = {
  id: true,
  anonymousId: true,
  role: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  },

  async findMany(params: {
    skip: number;
    take: number;
    role?: UserRole;
  }) {
    const where: Prisma.UserWhereInput = params.role
      ? { role: params.role }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  },

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
      select: { id: true },
    });
  },
};
