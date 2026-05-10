import { ShoppingListRepository } from './shopping-list.repository';
import { NotFoundError } from '../../shared/errors/AppError';

const repo = new ShoppingListRepository();

export class ShoppingListService {
  async findAll(userId: string) {
    return repo.findMany(userId);
  }

  async findOne(id: string, userId: string) {
    const list = await repo.findOne(id, userId);
    if (!list) throw new NotFoundError('Shopping list');
    return list;
  }

  async create(userId: string, name: string, items: any[]) {
    return repo.create(userId, name, items);
  }

  async toggleItem(listId: string, itemId: string, userId: string) {
    const list = await repo.findOne(listId, userId);
    if (!list) throw new NotFoundError('Shopping list');
    const item = list.items.find(i => i.id === itemId);
    if (!item) throw new NotFoundError('Shopping item');
    return repo.updateItem(itemId, { isPurchased: !item.isPurchased });
  }

  async delete(id: string, userId: string) {
    const list = await repo.findOne(id, userId);
    if (!list) throw new NotFoundError('Shopping list');
    return repo.delete(id);
  }
}
