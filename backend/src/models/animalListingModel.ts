import { query } from '../config/db.js';
import crypto from 'crypto';

export type ListingType = 'ANIMAL' | 'BIRD';
export type AnimalGender = 'MALE' | 'FEMALE' | 'OTHER';
export type AnimalAvailabilityStatus = 'AVAILABLE' | 'SOLD' | 'UNAVAILABLE';
export type AnimalApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface AnimalListing {
  id: string;
  seller_id: string;
  listing_type: ListingType;
  category: string;
  name: string;
  breed: string | null;
  age: string;
  gender: AnimalGender;
  description: string | null;
  price: number;
  quantity: number;
  location: string;
  image_url: string | null;
  health_status: string | null;
  availability_status: AnimalAvailabilityStatus;
  approval_status: AnimalApprovalStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;

  // Joined seller profile details
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
  seller_village?: string;
  seller_district?: string;
}

export interface CreateAnimalListingInput {
  listing_type: ListingType;
  category: string;
  name: string;
  breed?: string;
  age: string;
  gender: AnimalGender;
  description?: string;
  price: number;
  quantity?: number;
  location: string;
  image_url?: string;
  health_status?: string;
}

export interface UpdateAnimalListingInput {
  listing_type?: ListingType;
  category?: string;
  name?: string;
  breed?: string;
  age?: string;
  gender?: AnimalGender;
  description?: string;
  price?: number;
  quantity?: number;
  location?: string;
  image_url?: string;
  health_status?: string;
  availability_status?: AnimalAvailabilityStatus;
}

export interface AnimalFilterOptions {
  search?: string;
  listing_type?: string;
  category?: string;
  gender?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  availability?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}

export class AnimalListingModel {
  /**
   * Get public marketplace listings: only APPROVED and AVAILABLE listings.
   */
  static async getPublicListings(filters: AnimalFilterOptions = {}): Promise<AnimalListing[]> {
    let sql = `
      SELECT 
        a.*,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email,
        op.village as seller_village,
        op.district as seller_district
      FROM animal_listings a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN owner_profiles op ON a.seller_id = op.user_id
      WHERE a.approval_status = 'APPROVED'
        AND a.availability_status = 'AVAILABLE'
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (filters.listing_type && filters.listing_type !== 'ALL') {
      sql += ` AND a.listing_type = $${pIndex++}`;
      params.push(filters.listing_type.toUpperCase());
    }

    if (filters.category && filters.category !== 'ALL') {
      sql += ` AND LOWER(a.category) = LOWER($${pIndex++})`;
      params.push(filters.category);
    }

    if (filters.gender && filters.gender !== 'ALL') {
      sql += ` AND a.gender = $${pIndex++}`;
      params.push(filters.gender.toUpperCase());
    }

    if (filters.location) {
      sql += ` AND LOWER(a.location) LIKE LOWER($${pIndex++})`;
      params.push(`%${filters.location.trim()}%`);
    }

    if (filters.min_price !== undefined && !Number.isNaN(filters.min_price) && filters.min_price > 0) {
      sql += ` AND a.price >= $${pIndex++}`;
      params.push(filters.min_price);
    }

    if (filters.max_price !== undefined && !Number.isNaN(filters.max_price) && filters.max_price > 0) {
      sql += ` AND a.price <= $${pIndex++}`;
      params.push(filters.max_price);
    }

    if (filters.search) {
      sql += ` AND (
        LOWER(a.name) LIKE LOWER($${pIndex}) OR
        LOWER(COALESCE(a.breed, '')) LIKE LOWER($${pIndex}) OR
        LOWER(a.category) LIKE LOWER($${pIndex}) OR
        LOWER(a.location) LIKE LOWER($${pIndex})
      )`;
      params.push(`%${filters.search.trim()}%`);
      pIndex++;
    }

    switch (filters.sort) {
      case 'price_asc':
        sql += ` ORDER BY a.price ASC, a.created_at DESC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY a.price DESC, a.created_at DESC`;
        break;
      case 'oldest':
        sql += ` ORDER BY a.created_at ASC`;
        break;
      case 'newest':
      default:
        sql += ` ORDER BY a.created_at DESC`;
        break;
    }

    const res = await query<AnimalListing>(sql, params);
    return res.rows.map(row => ({
      ...row,
      price: parseFloat(row.price as any) || 0,
      quantity: parseInt(row.quantity as any, 10) || 0,
    }));
  }

  /**
   * Get single listing by ID with seller details.
   */
  static async getById(id: string): Promise<AnimalListing | null> {
    const sql = `
      SELECT 
        a.*,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email,
        op.village as seller_village,
        op.district as seller_district
      FROM animal_listings a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN owner_profiles op ON a.seller_id = op.user_id
      WHERE a.id = $1
    `;
    const res = await query<AnimalListing>(sql, [id]);
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      price: parseFloat(row.price as any) || 0,
      quantity: parseInt(row.quantity as any, 10) || 0,
    };
  }

  /**
   * Owner: get all listings belonging strictly to this seller.
   */
  static async getBySellerId(sellerId: string): Promise<AnimalListing[]> {
    const sql = `
      SELECT 
        a.*,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email
      FROM animal_listings a
      JOIN users u ON a.seller_id = u.id
      WHERE a.seller_id = $1
      ORDER BY a.created_at DESC
    `;
    const res = await query<AnimalListing>(sql, [sellerId]);
    return res.rows.map(row => ({
      ...row,
      price: parseFloat(row.price as any) || 0,
      quantity: parseInt(row.quantity as any, 10) || 0,
    }));
  }

  /**
   * Owner: create new animal or bird listing.
   * Approval status always starts as PENDING.
   * Availability status always starts as AVAILABLE.
   */
  static async create(sellerId: string, input: CreateAnimalListingInput): Promise<AnimalListing> {
    const id = crypto.randomUUID();
    const qty = input.quantity !== undefined && input.quantity > 0 ? input.quantity : 1;

    const sql = `
      INSERT INTO animal_listings (
        id, seller_id, listing_type, category, name, breed, age, gender,
        description, price, quantity, location, image_url, health_status,
        availability_status, approval_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        'AVAILABLE', 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const params = [
      id,
      sellerId,
      input.listing_type,
      input.category,
      input.name,
      input.breed || null,
      input.age,
      input.gender,
      input.description || null,
      input.price,
      qty,
      input.location,
      input.image_url || null,
      input.health_status || null,
    ];

    const res = await query<AnimalListing>(sql, params);
    const row = res.rows[0];
    return {
      ...row,
      price: parseFloat(row.price as any) || 0,
      quantity: parseInt(row.quantity as any, 10) || 0,
    };
  }

  /**
   * Owner: update own listing.
   * Enforces seller_id === authenticated owner.
   */
  static async update(
    id: string,
    sellerId: string,
    input: UpdateAnimalListingInput
  ): Promise<AnimalListing | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    if (existing.seller_id !== sellerId) {
      const err = new Error('You do not have permission to modify this listing');
      (err as any).statusCode = 403;
      throw err;
    }

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [id, sellerId];
    let pIndex = 3;

    if (input.listing_type !== undefined) {
      updates.push(`listing_type = $${pIndex++}`);
      params.push(input.listing_type);
    }
    if (input.category !== undefined) {
      updates.push(`category = $${pIndex++}`);
      params.push(input.category);
    }
    if (input.name !== undefined) {
      updates.push(`name = $${pIndex++}`);
      params.push(input.name);
    }
    if (input.breed !== undefined) {
      updates.push(`breed = $${pIndex++}`);
      params.push(input.breed || null);
    }
    if (input.age !== undefined) {
      updates.push(`age = $${pIndex++}`);
      params.push(input.age);
    }
    if (input.gender !== undefined) {
      updates.push(`gender = $${pIndex++}`);
      params.push(input.gender);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${pIndex++}`);
      params.push(input.description || null);
    }
    if (input.price !== undefined) {
      updates.push(`price = $${pIndex++}`);
      params.push(input.price);
    }
    if (input.quantity !== undefined) {
      updates.push(`quantity = $${pIndex++}`);
      params.push(input.quantity);
    }
    if (input.location !== undefined) {
      updates.push(`location = $${pIndex++}`);
      params.push(input.location);
    }
    if (input.image_url !== undefined) {
      updates.push(`image_url = $${pIndex++}`);
      params.push(input.image_url || null);
    }
    if (input.health_status !== undefined) {
      updates.push(`health_status = $${pIndex++}`);
      params.push(input.health_status || null);
    }
    if (input.availability_status !== undefined) {
      updates.push(`availability_status = $${pIndex++}`);
      params.push(input.availability_status);
    }

    // If listing was previously approved and critical info changed, reset to PENDING for admin review
    const criticalFieldsChanged =
      input.price !== undefined ||
      input.name !== undefined ||
      input.category !== undefined ||
      input.listing_type !== undefined;

    if (existing.approval_status === 'APPROVED' && criticalFieldsChanged) {
      updates.push(`approval_status = 'PENDING'`);
    }

    const sql = `
      UPDATE animal_listings
      SET ${updates.join(', ')}
      WHERE id = $1 AND seller_id = $2
      RETURNING *
    `;

    const res = await query<AnimalListing>(sql, params);
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      price: parseFloat(row.price as any) || 0,
      quantity: parseInt(row.quantity as any, 10) || 0,
    };
  }

  /**
   * Owner: delete own listing.
   * Strict Rule: Checks if active orders exist (PLACED, CONFIRMED, SHIPPED).
   */
  static async delete(id: string, sellerId: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    if (existing.seller_id !== sellerId) {
      const err = new Error('You do not have permission to delete this listing');
      (err as any).statusCode = 403;
      throw err;
    }

    // Check for active orders
    const activeOrdersRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM animal_orders 
       WHERE listing_id = $1 AND order_status IN ('PLACED', 'CONFIRMED', 'SHIPPED')`,
      [id]
    );
    const activeCount = parseInt(activeOrdersRes.rows[0]?.count || '0', 10);
    if (activeCount > 0) {
      const err = new Error(
        `Cannot delete listing with ${activeCount} active or in-transit order(s). Please fulfill or resolve active orders first.`
      );
      (err as any).statusCode = 400;
      throw err;
    }

    const res = await query('DELETE FROM animal_listings WHERE id = $1 AND seller_id = $2', [id, sellerId]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Admin: view all listings with optional filters.
   */
  static async getAllForAdmin(filters: {
    search?: string;
    approval_status?: string;
    availability_status?: string;
    listing_type?: string;
  } = {}): Promise<AnimalListing[]> {
    let sql = `
      SELECT 
        a.*,
        u.name as seller_name,
        u.phone as seller_phone,
        u.email as seller_email,
        op.village as seller_village,
        op.district as seller_district
      FROM animal_listings a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN owner_profiles op ON a.seller_id = op.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIndex = 1;

    if (filters.approval_status && filters.approval_status !== 'ALL') {
      sql += ` AND a.approval_status = $${pIndex++}`;
      params.push(filters.approval_status.toUpperCase());
    }

    if (filters.availability_status && filters.availability_status !== 'ALL') {
      sql += ` AND a.availability_status = $${pIndex++}`;
      params.push(filters.availability_status.toUpperCase());
    }

    if (filters.listing_type && filters.listing_type !== 'ALL') {
      sql += ` AND a.listing_type = $${pIndex++}`;
      params.push(filters.listing_type.toUpperCase());
    }

    if (filters.search) {
      sql += ` AND (
        LOWER(a.name) LIKE LOWER($${pIndex}) OR
        LOWER(COALESCE(a.breed, '')) LIKE LOWER($${pIndex}) OR
        LOWER(a.category) LIKE LOWER($${pIndex}) OR
        LOWER(a.location) LIKE LOWER($${pIndex}) OR
        LOWER(u.name) LIKE LOWER($${pIndex})
      )`;
      params.push(`%${filters.search.trim()}%`);
      pIndex++;
    }

    sql += ` ORDER BY a.created_at DESC`;

    const res = await query<AnimalListing>(sql, params);
    return res.rows.map(row => ({
      ...row,
      price: parseFloat(row.price as any) || 0,
      quantity: parseInt(row.quantity as any, 10) || 0,
    }));
  }

  /**
   * Admin: approve listing.
   */
  static async adminApprove(id: string): Promise<AnimalListing | null> {
    const sql = `
      UPDATE animal_listings 
      SET approval_status = 'APPROVED',
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const res = await query<AnimalListing>(sql, [id]);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      price: parseFloat(res.rows[0].price as any) || 0,
      quantity: parseInt(res.rows[0].quantity as any, 10) || 0,
    };
  }

  /**
   * Admin: reject listing with reason.
   */
  static async adminReject(id: string, reason?: string): Promise<AnimalListing | null> {
    const sql = `
      UPDATE animal_listings 
      SET approval_status = 'REJECTED',
          rejection_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const res = await query<AnimalListing>(sql, [id, reason || 'Listing details could not be verified']);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      price: parseFloat(res.rows[0].price as any) || 0,
      quantity: parseInt(res.rows[0].quantity as any, 10) || 0,
    };
  }

  /**
   * Admin: disable listing.
   */
  static async adminDisable(id: string): Promise<AnimalListing | null> {
    const sql = `
      UPDATE animal_listings 
      SET approval_status = 'DISABLED',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const res = await query<AnimalListing>(sql, [id]);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      price: parseFloat(res.rows[0].price as any) || 0,
      quantity: parseInt(res.rows[0].quantity as any, 10) || 0,
    };
  }

  /**
   * Admin: delete listing.
   */
  static async adminDelete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM animal_listings WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Aggregated metrics for Admin Dashboard.
   */
  static async getAdminStats(): Promise<{
    totalListings: number;
    pendingListings: number;
    approvedListings: number;
    rejectedListings: number;
    disabledListings: number;
    animalsCount: number;
    birdsCount: number;
  }> {
    const totalRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM animal_listings');
    const pendingRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE approval_status = 'PENDING'");
    const approvedRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE approval_status = 'APPROVED'");
    const rejectedRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE approval_status = 'REJECTED'");
    const disabledRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE approval_status = 'DISABLED'");
    const animalsRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE listing_type = 'ANIMAL'");
    const birdsRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE listing_type = 'BIRD'");

    return {
      totalListings: parseInt(totalRes.rows[0]?.count || '0', 10),
      pendingListings: parseInt(pendingRes.rows[0]?.count || '0', 10),
      approvedListings: parseInt(approvedRes.rows[0]?.count || '0', 10),
      rejectedListings: parseInt(rejectedRes.rows[0]?.count || '0', 10),
      disabledListings: parseInt(disabledRes.rows[0]?.count || '0', 10),
      animalsCount: parseInt(animalsRes.rows[0]?.count || '0', 10),
      birdsCount: parseInt(birdsRes.rows[0]?.count || '0', 10),
    };
  }

  /**
   * Aggregated metrics for Owner Dashboard.
   */
  static async getOwnerStats(sellerId: string): Promise<{
    totalListings: number;
    approvedListings: number;
    pendingListings: number;
    soldListings: number;
  }> {
    const totalRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM animal_listings WHERE seller_id = $1', [sellerId]);
    const approvedRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE seller_id = $1 AND approval_status = 'APPROVED'", [sellerId]);
    const pendingRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE seller_id = $1 AND approval_status = 'PENDING'", [sellerId]);
    const soldRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM animal_listings WHERE seller_id = $1 AND availability_status = 'SOLD'", [sellerId]);

    return {
      totalListings: parseInt(totalRes.rows[0]?.count || '0', 10),
      approvedListings: parseInt(approvedRes.rows[0]?.count || '0', 10),
      pendingListings: parseInt(pendingRes.rows[0]?.count || '0', 10),
      soldListings: parseInt(soldRes.rows[0]?.count || '0', 10),
    };
  }
}
