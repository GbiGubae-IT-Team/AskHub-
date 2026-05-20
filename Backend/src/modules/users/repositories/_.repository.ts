import type { Prisma, UserRole } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const userSelect = {
  id: true,
  anonymousId: true,
  role: true,
  email: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const activeOnly = { isActive: true } as const;

export const userRepository = {
  async findById(id: string, includeInactive = false) {
    return prisma.user.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : activeOnly),
      },
      select: userSelect,
    });
  },

  async findByEmail(email: string, includeInactive = false) {
    return prisma.user.findFirst({
      where: {
        email,
        ...(includeInactive ? {} : activeOnly),
      },
      select: { id: true, isActive: true },
    });
  },

  async findMany(params: {
    skip: number;
    take: number;
    role?: UserRole;
    includeInactive?: boolean;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(params.role !== undefined && { role: params.role }),
      ...(params.includeInactive ? {} : activeOnly),
    };

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

  async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        email: null,
        password: null,
      },
      select: userSelect,
    });
  },
};
