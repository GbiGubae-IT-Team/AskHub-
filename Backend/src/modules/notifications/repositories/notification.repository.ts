import type { Prisma } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const notificationSelect = {
  id: true,
  content: true,
  isRead: true,
  userId: true,
  createdById: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export const notificationRepository = {
  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      select: notificationSelect,
    });
  },

  async findMany(params: {
    where: Prisma.NotificationWhereInput;
    unreadWhere: Prisma.NotificationWhereInput;
    skip: number;
    take: number;
  }) {
    const { where, unreadWhere, skip, take } = params;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        select: notificationSelect,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { ...unreadWhere, isRead: false },
      }),
    ]);

    return { items, total, unreadCount };
  },

  async create(data: {
    content: string;
    userId: string;
    createdById?: string;
  }) {
    return prisma.notification.create({
      data: {
        content: data.content,
        user: { connect: { id: data.userId } },
        ...(data.createdById && {
          createdBy: { connect: { id: data.createdById } },
        }),
      },
      select: notificationSelect,
    });
  },

  async update(id: string, data: Prisma.NotificationUpdateInput) {
    return prisma.notification.update({
      where: { id },
      data,
      select: notificationSelect,
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
      select: { id: true },
    });
  },

  async findActiveUser(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true },
    });
  },
};
