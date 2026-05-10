/**
 * features/pantry/pantry.service.ts
 *
 * LAYER: Business Logic Layer
 *
 * This service owns all pantry-related domain rules:
 *  - Computing expiry status (FRESH / EXPIRING_SOON / EXPIRED / NO_EXPIRY)
 *  - Enforcing ownership — users can only access their own pantry items
 *  - Generating notifications for expiring items
 *
 * WHAT THIS CLASS MUST NOT DO:
 *  - Know about HTTP (no Request/Response)
 *  - Query the database directly (delegates to PantryRepository)
 *  - Format JSON responses (the controller's job)
 */

import { differenceInDays, isAfter, startOfDay } from 'date-fns';
import { NotFoundError, BusinessError } from '../../shared/errors/AppError';
import { PantryRepository } from './pantry.repository';
import { CreatePantryItemDto, UpdatePantryItemDto, PantryFilterDto } from './pantry.dto';
import { PantryItemWithStatus, ExpiryStatus } from './pantry.types';

const EXPIRY_WARNING_DAYS = parseInt(process.env.EXPIRY_WARNING_DAYS ?? '3', 10);

export class PantryService {
  constructor(private readonly pantryRepo: PantryRepository) {}

  /**
   * Retrieve all pantry items for a user with filters applied.
   * BUSINESS RULE: Items are enriched with computed expiryStatus before returning.
   */
  async findAll(userId: string, filters: PantryFilterDto): Promise<PantryItemWithStatus[]> {
    const items = await this.pantryRepo.findMany(userId, filters);
    return items.map(item => this.enrichWithExpiryStatus(item));
  }

  /**
   * Find a single item by ID, enforcing ownership.
   * SECURITY: Filters by userId from JWT — not from URL. Prevents IDOR.
   */
  async findById(itemId: string, userId: string): Promise<PantryItemWithStatus> {
    const item = await this.pantryRepo.findOne(itemId, userId);
    if (!item) {
      throw new NotFoundError('Pantry item');
    }
    return this.enrichWithExpiryStatus(item);
  }

  /**
   * Add a new pantry item.
   * BUSINESS RULE: expiryDate cannot be in the past.
   */
  async create(userId: string, dto: CreatePantryItemDto): Promise<PantryItemWithStatus> {
    if (dto.expiryDate) {
      const expiry = new Date(dto.expiryDate);
      const today = startOfDay(new Date());
      if (!isAfter(expiry, today) && expiry.getTime() !== today.getTime()) {
        throw new BusinessError(
          'Expiry date cannot be set in the past.',
          'INVALID_EXPIRY_DATE',
        );
      }
    }

    const item = await this.pantryRepo.create(userId, dto);
    return this.enrichWithExpiryStatus(item);
  }

  /**
   * Update an existing pantry item.
   */
  async update(
    itemId: string,
    userId: string,
    dto: UpdatePantryItemDto,
  ): Promise<PantryItemWithStatus> {
    // Verify ownership first
    const existing = await this.pantryRepo.findOne(itemId, userId);
    if (!existing) {
      throw new NotFoundError('Pantry item');
    }

    const updated = await this.pantryRepo.update(itemId, dto);
    return this.enrichWithExpiryStatus(updated);
  }

  /**
   * Delete a pantry item.
   */
  async delete(itemId: string, userId: string): Promise<void> {
    const existing = await this.pantryRepo.findOne(itemId, userId);
    if (!existing) {
      throw new NotFoundError('Pantry item');
    }
    await this.pantryRepo.delete(itemId);
  }

  /**
   * Returns all items expiring within the warning window (for notification generation).
   * Called by the NotificationService on a schedule or on each login.
   */
  async getExpiringItems(userId: string): Promise<PantryItemWithStatus[]> {
    const items = await this.pantryRepo.findExpiringSoon(userId, EXPIRY_WARNING_DAYS);
    return items.map(item => this.enrichWithExpiryStatus(item));
  }

  // ─── Private: Domain Logic ─────────────────────────────────────────────────

  /**
   * Computes the expiry status for a pantry item.
   *
   * DOMAIN RULE:
   *  - NO_EXPIRY: No expiry date set
   *  - EXPIRED: expiryDate < today
   *  - EXPIRING_SOON: 0 ≤ daysUntilExpiry ≤ EXPIRY_WARNING_DAYS
   *  - FRESH: daysUntilExpiry > EXPIRY_WARNING_DAYS
   */
  private enrichWithExpiryStatus(item: any): PantryItemWithStatus {
    let expiryStatus: ExpiryStatus = 'NO_EXPIRY';

    if (item.expiryDate) {
      const today = startOfDay(new Date());
      const expiry = startOfDay(new Date(item.expiryDate));
      const daysUntilExpiry = differenceInDays(expiry, today);

      if (daysUntilExpiry < 0) {
        expiryStatus = 'EXPIRED';
      } else if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
        expiryStatus = 'EXPIRING_SOON';
      } else {
        expiryStatus = 'FRESH';
      }
    }

    return { ...item, expiryStatus };
  }
}
