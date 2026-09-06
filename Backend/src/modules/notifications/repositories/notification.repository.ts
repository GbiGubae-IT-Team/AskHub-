import type { Prisma, NotificationTarget } from "../../../generated/prisma/client.js";
import prisma from "../../../config/db.js";

const getNotificationSelect = (actorId: string) => ({
  id: true,
  content: true,
  targetType: true,
  isActive: true,
  userId: true,
  createdById: true,
  createdAt: true,
  reads: actorId === 'guest' ? false : {
    where: { userId: actorId },
    select: { id: true },
  },
} satisfies Prisma.NotificationSelect);

type RawNotification = Prisma.NotificationGetPayload<{
  select: ReturnType<typeof getNotificationSelect>;
}>;

const mapNotification = (raw: RawNotification) => ({
  id: raw.id,
  content: raw.content,
  targetType: raw.targetType,
  isActive: raw.isActive,
  userId: raw.userId,
  createdById: raw.createdById,
  createdAt: raw.createdAt,
  isRead: Array.isArray(raw.reads) ? raw.reads.length > 0 : false,
});

export const notificationRepository = {
  async findById(id: string, actorId: string) {
    const raw = await prisma.notification.findUnique({
      where: { id },
      select: getNotificationSelect(actorId),
    });
    return raw ? mapNotification(raw) : null;
  },

  async findMany(params: {
    where: Prisma.NotificationWhereInput;
    unreadWhere: Prisma.NotificationWhereInput;
    skip: number;
    take: number;
    actorId: string;
  }) {
    const { where, unreadWhere, skip, take, actorId } = params;

    const [rawItems, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        select: getNotificationSelect(actorId),
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      // Guests have no DB records, skip the reads-based count
      actorId === 'guest'
        ? Promise.resolve(0)
        : prisma.notification.count({
            where: { ...unreadWhere, reads: { none: { userId: actorId } } },
          }),
    ]);

    return {
      items: rawItems.map(mapNotification),
      total,
      unreadCount,
    };
  },

  async create(data: {
    content: string;
    targetType: NotificationTarget;
    userId?: string;
    createdById?: string;
  }, actorId: string) {
    const createData: Prisma.NotificationCreateInput = {
      content: data.content,
      targetType: data.targetType,
    };
    if (data.userId) createData.user = { connect: { id: data.userId } };
    if (data.createdById) createData.createdBy = { connect: { id: data.createdById } };

    const raw = await prisma.notification.create({
      data: createData,
      select: getNotificationSelect(actorId),
    });
    return mapNotification(raw);
  },

  async update(id: string, data: Prisma.NotificationUpdateInput, actorId: string) {
    const raw = await prisma.notification.update({
      where: { id },
      data,
      select: getNotificationSelect(actorId),
    });
    return mapNotification(raw);
  },

  async markAsRead(notificationId: string, userId: string) {
    // Insert into NotificationRead if it doesn't exist
    await prisma.notificationRead.upsert({
      where: {
        userId_notificationId: { userId, notificationId }
      },
      create: { userId, notificationId },
      update: {},
    });
    return this.findById(notificationId, userId);
  },

  async markAllRead(userId: string, where: Prisma.NotificationWhereInput) {
    // We can't do updateMany on a relation like this easily if they don't exist.
    // Instead we find all unread notification IDs matching `where`, then create Many.
    const unread = await prisma.notification.findMany({
      where: { ...where, reads: { none: { userId } } },
      select: { id: true }
    });

    if (unread.length === 0) return { count: 0 };

    const result = await prisma.notificationRead.createMany({
      data: unread.map(u => ({
        userId,
        notificationId: u.id
      })),
      skipDuplicates: true
    });
    return { count: result.count };
  },

  async delete(id: string) {
    // Due to relations, maybe delete reads first
    await prisma.notificationRead.deleteMany({ where: { notificationId: id } });
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
