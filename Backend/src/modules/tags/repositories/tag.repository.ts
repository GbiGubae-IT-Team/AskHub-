import type { Prisma } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const tagSelect = {
  id: true,
  name: true,
} satisfies Prisma.TagSelect;

export const tagRepository = {
  async findById(id: string) {
    return prisma.tag.findUnique({
      where: { id },
      select: tagSelect,
    });
  },

  async findByName(name: string, excludeId?: string) {
    return prisma.tag.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
  },

  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
  }) {
    const where: Prisma.TagWhereInput = params.search
      ? {
          name: {
            contains: params.search,
            mode: "insensitive",
          },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        select: tagSelect,
        skip: params.skip,
        take: params.take,
        orderBy: { name: "asc" },
      }),
      prisma.tag.count({ where }),
    ]);

    return { items, total };
  },

  async create(name: string) {
    return prisma.tag.create({
      data: { name },
      select: tagSelect,
    });
  },

  async update(id: string, name: string) {
    return prisma.tag.update({
      where: { id },
      data: { name },
      select: tagSelect,
    });
  },

  async delete(id: string) {
    return prisma.tag.delete({
      where: { id },
      select: { id: true },
    });
  },
};
