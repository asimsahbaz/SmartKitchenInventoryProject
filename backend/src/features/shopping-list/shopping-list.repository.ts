import prisma from '../../prisma/client';

export class ShoppingListRepository {
  async findMany(userId: string) {
    return prisma.shoppingList.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return prisma.shoppingList.findFirst({
      where: { id, userId },
      include: { items: true },
    });
  }

  async create(userId: string, name: string, items: any[]) {
    return prisma.shoppingList.create({
      data: {
        userId,
        name,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async updateItem(itemId: string, data: any) {
    return prisma.shoppingItem.update({
      where: { id: itemId },
      data,
    });
  }

  async delete(id: string) {
    return prisma.shoppingList.delete({ where: { id } });
  }
}
