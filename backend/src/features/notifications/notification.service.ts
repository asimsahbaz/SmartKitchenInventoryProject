import prisma from '../../prisma/client';

export class NotificationService {
  async getAll(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async generateExpiryNotifications(userId: string) {
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(today.getDate() + 3);

    const expiringSoon = await prisma.pantryItem.findMany({
      where: {
        userId,
        expiryDate: { gte: today, lte: in3Days },
      },
    });

    const expired = await prisma.pantryItem.findMany({
      where: {
        userId,
        expiryDate: { lt: today },
      },
    });

    for (const item of expiringSoon) {
      const exists = await prisma.notification.findFirst({
        where: {
          userId,
          pantryItemId: item.id,
          type: 'EXPIRY_WARNING',
          createdAt: { gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!exists) {
        const days = Math.ceil((new Date(item.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        await prisma.notification.create({
          data: {
            userId,
            pantryItemId: item.id,
            type: 'EXPIRY_WARNING',
            message: `"${item.name}" expires in ${days} day${days !== 1 ? 's' : ''}!`,
          },
        });
      }
    }

    for (const item of expired) {
      const exists = await prisma.notification.findFirst({
        where: {
          userId,
          pantryItemId: item.id,
          type: 'ITEM_EXPIRED',
          createdAt: { gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId,
            pantryItemId: item.id,
            type: 'ITEM_EXPIRED',
            message: `"${item.name}" has expired. Consider removing it from your pantry.`,
          },
        });
      }
    }

    return this.getAll(userId);
  }
}
