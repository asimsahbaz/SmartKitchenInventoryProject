import prisma from '../../prisma/client';

export class AnalyticsService {
  async getSummary(userId: string) {
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(today.getDate() + 3);

    const [
      totalItems,
      expiredItems,
      expiringSoon,
      recentlyAdded,
      categoryBreakdown,
    ] = await Promise.all([
      prisma.pantryItem.count({ where: { userId } }),
      prisma.pantryItem.count({
        where: { userId, expiryDate: { lt: today } },
      }),
      prisma.pantryItem.count({
        where: { userId, expiryDate: { gte: today, lte: in3Days } },
      }),
      prisma.pantryItem.count({
        where: {
          userId,
          addedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.pantryItem.groupBy({
        by: ['categoryId'],
        where: { userId },
        _count: { id: true },
      }),
    ]);

    const categoryIds = categoryBreakdown
      .filter(c => c.categoryId)
      .map(c => c.categoryId as string);

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryCounts = categoryBreakdown.map(c => {
      const cat = categories.find(x => x.id === c.categoryId);
      return {
        category: cat?.name ?? 'Uncategorized',
        icon: cat?.icon ?? '📦',
        count: c._count.id,
      };
    }).sort((a, b) => b.count - a.count);

    return {
      totalItems,
      expiredItems,
      expiringSoon,
      recentlyAdded,
      categoryCounts,
    };
  }
}
