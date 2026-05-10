import prisma from '../../prisma/client';

export class RecipeRepository {
  async findMany(search?: string) {
    return prisma.recipe.findMany({
      where: search ? { title: { contains: search, mode: 'insensitive' } } : undefined,
      include: { ingredients: true },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    return prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    });
  }
}
