import prisma from '../../prisma/client';

export class PantryRepository {
  async findMany(userId: string, filters: any) {
    const where: any = { userId };
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    return prisma.pantryItem.findMany({
      where,
      include: { category: true },
      orderBy: { [filters.sortBy ?? 'addedAt']: filters.sortOrder ?? 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return prisma.pantryItem.findFirst({
      where: { id, userId },
      include: { category: true },
    });
  }

  async create(userId: string, data: any) {
    return prisma.pantryItem.create({
      data: { ...data, userId },
      include: { category: true },
    });
  }

  async update(id: string, data: any) {
    return prisma.pantryItem.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string) {
    return prisma.pantryItem.delete({ where: { id } });
  }

  async findExpiringSoon(userId: string, days: number) {
    const future = new Date();
    future.setDate(future.getDate() + days);
    return prisma.pantryItem.findMany({
      where: {
        userId,
        expiryDate: { lte: future, gte: new Date() },
      },
      include: { category: true },
    });
  }
}
