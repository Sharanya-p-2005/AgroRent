import { query } from '../config/db.js';
import crypto from 'crypto';

export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Equipment {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  price_per_hour: number;
  location: string;
  availability_status: AvailabilityStatus;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;

  // Joined owner info
  owner_name?: string;
  owner_phone?: string;
  owner_village?: string;
  owner_district?: string;
}

export interface CreateEquipmentInput {
  owner_id: string;
  name: string;
  category: string;
  description?: string;
  brand?: string;
  model?: string;
  image_url?: string;
  price_per_hour: number;
  location: string;
}

export interface UpdateEquipmentInput {
  name?: string;
  category?: string;
  description?: string;
  brand?: string;
  model?: string;
  image_url?: string;
  price_per_hour?: number;
  location?: string;
  availability_status?: AvailabilityStatus;
}

export interface EquipmentFilterOptions {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
}

export class EquipmentModel {
  /**
   * Find only APPROVED & AVAILABLE equipment for farmers marketplace
   */
  static async findApprovedAvailable(filters: EquipmentFilterOptions = {}): Promise<Equipment[]> {
    let sql = `
      SELECT 
        e.*,
        u.name as owner_name,
        u.phone as owner_phone,
        op.village as owner_village,
        op.district as owner_district
      FROM equipment e
      JOIN users u ON e.owner_id = u.id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE e.approval_status = 'APPROVED'
        AND e.availability_status = 'AVAILABLE'
    `;
    const params: any[] = [];

    if (filters.search && filters.search.trim()) {
      params.push(`%${filters.search.trim()}%`);
      const idx = params.length;
      sql += ` AND (e.name ILIKE $${idx} OR e.category ILIKE $${idx} OR e.location ILIKE $${idx} OR e.brand ILIKE $${idx} OR e.model ILIKE $${idx})`;
    }

    if (filters.category && filters.category.trim() && filters.category !== 'All') {
      params.push(filters.category.trim());
      sql += ` AND e.category = $${params.length}`;
    }

    if (filters.location && filters.location.trim()) {
      params.push(`%${filters.location.trim()}%`);
      sql += ` AND e.location ILIKE $${params.length}`;
    }

    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      params.push(filters.minPrice);
      sql += ` AND e.price_per_hour >= $${params.length}`;
    }

    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      params.push(filters.maxPrice);
      sql += ` AND e.price_per_hour <= $${params.length}`;
    }

    // Sorting
    if (filters.sortBy === 'price_asc') {
      sql += ` ORDER BY e.price_per_hour ASC, e.created_at DESC`;
    } else if (filters.sortBy === 'price_desc') {
      sql += ` ORDER BY e.price_per_hour DESC, e.created_at DESC`;
    } else {
      // Default: newest
      sql += ` ORDER BY e.created_at DESC`;
    }

    const res = await query<Equipment>(sql, params);
    return res.rows.map(row => ({
      ...row,
      price_per_hour: parseFloat(row.price_per_hour as any)
    }));
  }

  /**
   * Find single equipment by ID with joined owner details
   */
  static async findById(id: string): Promise<Equipment | null> {
    const sql = `
      SELECT 
        e.*,
        u.name as owner_name,
        u.phone as owner_phone,
        op.village as owner_village,
        op.district as owner_district
      FROM equipment e
      JOIN users u ON e.owner_id = u.id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE e.id = $1
    `;
    const res = await query<Equipment>(sql, [id]);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      price_per_hour: parseFloat(res.rows[0].price_per_hour as any)
    };
  }

  /**
   * Find equipment belonging to a specific owner
   */
  static async findByOwnerId(ownerId: string): Promise<Equipment[]> {
    const sql = `
      SELECT 
        e.*,
        u.name as owner_name,
        u.phone as owner_phone
      FROM equipment e
      JOIN users u ON e.owner_id = u.id
      WHERE e.owner_id = $1
      ORDER BY e.created_at DESC
    `;
    const res = await query<Equipment>(sql, [ownerId]);
    return res.rows.map(row => ({
      ...row,
      price_per_hour: parseFloat(row.price_per_hour as any)
    }));
  }

  /**
   * Admin: find all equipment with optional filters
   */
  static async findAllForAdmin(options: { approval_status?: string; search?: string } = {}): Promise<Equipment[]> {
    let sql = `
      SELECT 
        e.*,
        u.name as owner_name,
        u.phone as owner_phone,
        op.village as owner_village,
        op.district as owner_district
      FROM equipment e
      JOIN users u ON e.owner_id = u.id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.approval_status && options.approval_status !== 'ALL') {
      params.push(options.approval_status);
      sql += ` AND e.approval_status = $${params.length}`;
    }

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      const idx = params.length;
      sql += ` AND (e.name ILIKE $${idx} OR e.category ILIKE $${idx} OR u.name ILIKE $${idx} OR e.location ILIKE $${idx})`;
    }

    sql += ` ORDER BY e.created_at DESC`;
    const res = await query<Equipment>(sql, params);
    return res.rows.map(row => ({
      ...row,
      price_per_hour: parseFloat(row.price_per_hour as any)
    }));
  }

  /**
   * Create new equipment by owner (defaults to PENDING and AVAILABLE)
   */
  static async create(data: CreateEquipmentInput): Promise<Equipment> {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO equipment (
        id, owner_id, name, category, description, brand, model,
        image_url, price_per_hour, location, availability_status, approval_status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'AVAILABLE', 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await query<Equipment>(sql, [
      id,
      data.owner_id,
      data.name.trim(),
      data.category.trim(),
      data.description?.trim() || null,
      data.brand?.trim() || null,
      data.model?.trim() || null,
      data.image_url?.trim() || null,
      data.price_per_hour,
      data.location.trim()
    ]);
    return {
      ...res.rows[0],
      price_per_hour: parseFloat(res.rows[0].price_per_hour as any)
    };
  }

  /**
   * Owner updates their own equipment
   */
  static async updateByOwner(id: string, ownerId: string, data: UpdateEquipmentInput): Promise<Equipment | null> {
    const current = await this.findById(id);
    if (!current || current.owner_id !== ownerId) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [id, ownerId];

    if (data.name !== undefined) {
      params.push(data.name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (data.category !== undefined) {
      params.push(data.category.trim());
      updates.push(`category = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description ? data.description.trim() : null);
      updates.push(`description = $${params.length}`);
    }
    if (data.brand !== undefined) {
      params.push(data.brand ? data.brand.trim() : null);
      updates.push(`brand = $${params.length}`);
    }
    if (data.model !== undefined) {
      params.push(data.model ? data.model.trim() : null);
      updates.push(`model = $${params.length}`);
    }
    if (data.image_url !== undefined) {
      params.push(data.image_url ? data.image_url.trim() : null);
      updates.push(`image_url = $${params.length}`);
    }
    if (data.price_per_hour !== undefined) {
      params.push(data.price_per_hour);
      updates.push(`price_per_hour = $${params.length}`);
    }
    if (data.location !== undefined) {
      params.push(data.location.trim());
      updates.push(`location = $${params.length}`);
    }
    if (data.availability_status !== undefined) {
      params.push(data.availability_status);
      updates.push(`availability_status = $${params.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE equipment
      SET ${updates.join(', ')}
      WHERE id = $1 AND owner_id = $2
      RETURNING *
    `;
    const res = await query<Equipment>(sql, params);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      price_per_hour: parseFloat(res.rows[0].price_per_hour as any)
    };
  }

  /**
   * Admin updates approval or availability status
   */
  static async adminUpdateStatus(id: string, updates: { approval_status?: ApprovalStatus; availability_status?: AvailabilityStatus }): Promise<Equipment | null> {
    const clauses: string[] = [];
    const params: any[] = [id];

    if (updates.approval_status) {
      params.push(updates.approval_status);
      clauses.push(`approval_status = $${params.length}`);
    }
    if (updates.availability_status) {
      params.push(updates.availability_status);
      clauses.push(`availability_status = $${params.length}`);
    }

    clauses.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE equipment
      SET ${clauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    const res = await query<Equipment>(sql, params);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      price_per_hour: parseFloat(res.rows[0].price_per_hour as any)
    };
  }

  /**
   * Check if equipment has active or confirmed bookings before deletion
   */
  static async hasActiveBookings(id: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM equipment_bookings 
      WHERE equipment_id = $1 
        AND booking_status IN ('CONFIRMED', 'ACTIVE')
    `;
    const res = await query<{ count: string }>(sql, [id]);
    return parseInt(res.rows[0]?.count || '0', 10) > 0;
  }

  /**
   * Delete equipment (optionally verifying ownerId)
   */
  static async delete(id: string, ownerId?: string): Promise<boolean> {
    let sql = 'DELETE FROM equipment WHERE id = $1';
    const params: any[] = [id];
    if (ownerId) {
      sql += ' AND owner_id = $2';
      params.push(ownerId);
    }
    const res = await query(sql, params);
    return (res.rowCount || 0) > 0;
  }
}
