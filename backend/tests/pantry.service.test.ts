/**
 * tests/pantry.service.test.ts
 *
 * Unit tests for PantryService — the business logic layer.
 *
 * TESTING STRATEGY:
 * - Unit tests target the service layer because that's where business rules live
 * - The repository is mocked — we test logic in isolation, not DB integration
 * - Integration tests (in tests/integration/) cover the full HTTP → DB flow
 *
 * WHY TEST THE SERVICE LAYER:
 * The expiry status computation, ownership enforcement, and date validation
 * are domain rules. Testing them at the service level means tests run fast
 * and don't require a database connection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PantryService } from '../src/features/pantry/pantry.service';
import { NotFoundError, BusinessError } from '../src/shared/errors/AppError';
import { addDays, subDays, format } from 'date-fns';

// ─── Mock Repository ─────────────────────────────────────────────────────────

const mockRepo = {
  findMany: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findExpiringSoon: vi.fn(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeItem = (overrides = {}) => ({
  id: 'item-uuid',
  userId: 'user-uuid',
  name: 'Milk',
  quantity: 1,
  unit: 'l',
  category: { id: 'cat-uuid', name: 'Dairy', icon: '🥛' },
  expiryDate: null,
  addedAt: new Date(),
  notes: null,
  ...overrides,
});

const toDateString = (date: Date) => format(date, 'yyyy-MM-dd');

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PantryService', () => {
  let service: PantryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PantryService(mockRepo as any);
    process.env.EXPIRY_WARNING_DAYS = '3';
  });

  // ── Expiry Status Computation ──────────────────────────────────────────────

  describe('Expiry status enrichment', () => {
    it('assigns NO_EXPIRY when expiryDate is null', async () => {
      const item = makeItem({ expiryDate: null });
      mockRepo.findMany.mockResolvedValue([item]);

      const result = await service.findAll('user-uuid', {});

      expect(result[0].expiryStatus).toBe('NO_EXPIRY');
    });

    it('assigns FRESH when expiry is more than 3 days away', async () => {
      const item = makeItem({ expiryDate: new Date(addDays(new Date(), 10)) });
      mockRepo.findMany.mockResolvedValue([item]);

      const result = await service.findAll('user-uuid', {});

      expect(result[0].expiryStatus).toBe('FRESH');
    });

    it('assigns EXPIRING_SOON when expiry is within 3 days', async () => {
      const item = makeItem({ expiryDate: new Date(addDays(new Date(), 2)) });
      mockRepo.findMany.mockResolvedValue([item]);

      const result = await service.findAll('user-uuid', {});

      expect(result[0].expiryStatus).toBe('EXPIRING_SOON');
    });

    it('assigns EXPIRING_SOON when expiry is today', async () => {
      const item = makeItem({ expiryDate: new Date() });
      mockRepo.findMany.mockResolvedValue([item]);

      const result = await service.findAll('user-uuid', {});

      expect(result[0].expiryStatus).toBe('EXPIRING_SOON');
    });

    it('assigns EXPIRED when expiry is in the past', async () => {
      const item = makeItem({ expiryDate: new Date(subDays(new Date(), 1)) });
      mockRepo.findMany.mockResolvedValue([item]);

      const result = await service.findAll('user-uuid', {});

      expect(result[0].expiryStatus).toBe('EXPIRED');
    });
  });

  // ── Ownership Enforcement ─────────────────────────────────────────────────

  describe('findById', () => {
    it('throws NotFoundError when item does not exist for this user', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('some-id', 'user-uuid')).rejects.toThrow(NotFoundError);
    });

    it('returns the item with expiry status when found', async () => {
      const item = makeItem();
      mockRepo.findOne.mockResolvedValue(item);

      const result = await service.findById('item-uuid', 'user-uuid');

      expect(result.id).toBe('item-uuid');
      expect(result.expiryStatus).toBe('NO_EXPIRY');
    });
  });

  // ── Create Validation ─────────────────────────────────────────────────────

  describe('create', () => {
    it('throws BusinessError when expiryDate is in the past', async () => {
      const dto = {
        name: 'Milk',
        quantity: 1,
        unit: 'l',
        expiryDate: toDateString(subDays(new Date(), 5)),
      };

      await expect(service.create('user-uuid', dto)).rejects.toThrow(BusinessError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('creates item successfully when expiryDate is in the future', async () => {
      const item = makeItem({ expiryDate: new Date(addDays(new Date(), 7)) });
      mockRepo.create.mockResolvedValue(item);

      const dto = {
        name: 'Milk',
        quantity: 1,
        unit: 'l',
        expiryDate: toDateString(addDays(new Date(), 7)),
      };

      const result = await service.create('user-uuid', dto);

      expect(mockRepo.create).toHaveBeenCalledWith('user-uuid', dto);
      expect(result.expiryStatus).toBe('FRESH');
    });

    it('creates item without expiryDate', async () => {
      const item = makeItem();
      mockRepo.create.mockResolvedValue(item);

      const dto = { name: 'Milk', quantity: 1, unit: 'l' };
      const result = await service.create('user-uuid', dto);

      expect(result.expiryStatus).toBe('NO_EXPIRY');
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('throws NotFoundError when item does not exist for this user', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('some-id', 'user-uuid')).rejects.toThrow(NotFoundError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('calls repository delete when item exists', async () => {
      mockRepo.findOne.mockResolvedValue(makeItem());
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('item-uuid', 'user-uuid');

      expect(mockRepo.delete).toHaveBeenCalledWith('item-uuid');
    });
  });
});
