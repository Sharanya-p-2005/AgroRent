import { query } from '../config/db.js';
import crypto from 'crypto';

export type ServiceType = 'DRIVER' | 'FARM_WORKER';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface ServiceProfile {
  id: string;
  user_id: string;
  service_type: ServiceType;
  name: string;
  phone: string;
  profile_image_url?: string | null;
  description?: string | null;
  experience_years: number;
  skills: string;
  price_per_hour: number;
  price_per_day: number;
  location: string;
  availability_status: AvailabilityStatus;
  approval_status: ApprovalStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;

  // Joined provider information
  provider_name?: string;
  provider_phone?: string;
  provider_email?: string;
  provider_village?: string;
  provider_district?: string;
}

export interface CreateServiceProfileInput {
  user_id: string;
  service_type: ServiceType;
  name: string;
  phone: string;
  profile_image_url?: string;
  description?: string;
  experience_years: number;
  skills: string;
  price_per_hour: number;
  price_per_day: number;
  location: string;
}

export interface UpdateServiceProfileInput {
  name?: string;
  phone?: string;
  profile_image_url?: string;
  description?: string;
  experience_years?: number;
  skills?: string;
  price_per_hour?: number;
  price_per_day?: number;
  location?: string;
  availability_status?: AvailabilityStatus;
}

export interface ServiceProfileFilter {
  service_type?: ServiceType;
  search?: string;
  location?: string;
  skill?: string;
  minPrice?: number;
  maxPrice?: number;
  minExperience?: number;
  availability_status?: AvailabilityStatus;
  approval_status?: ApprovalStatus;
  sortBy?: 'price_asc' | 'price_desc' | 'experience' | 'newest';
}

export class ServiceProfileModel {
  /**
   * Find approved and available service profiles for public / farmer marketplace
   */
  static async findAll(filter: ServiceProfileFilter = {}): Promise<ServiceProfile[]> {
    let sql = `
      SELECT sp.*, u.name as provider_name, u.phone as provider_phone, u.email as provider_email,
             op.village as provider_village, op.district as provider_district
      FROM service_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // By default, public browse shows only APPROVED and AVAILABLE
    if (filter.approval_status) {
      params.push(filter.approval_status);
      sql += ` AND sp.approval_status = $${params.length}`;
    } else {
      sql += ` AND sp.approval_status = 'APPROVED'`;
    }

    if (filter.availability_status) {
      params.push(filter.availability_status);
      sql += ` AND sp.availability_status = $${params.length}`;
    } else {
      sql += ` AND sp.availability_status = 'AVAILABLE'`;
    }

    if (filter.service_type) {
      params.push(filter.service_type);
      sql += ` AND sp.service_type = $${params.length}`;
    }

    if (filter.location) {
      params.push(`%${filter.location.trim()}%`);
      sql += ` AND sp.location ILIKE $${params.length}`;
    }

    if (filter.minPrice !== undefined && !isNaN(filter.minPrice)) {
      params.push(filter.minPrice);
      sql += ` AND sp.price_per_hour >= $${params.length}`;
    }

    if (filter.maxPrice !== undefined && !isNaN(filter.maxPrice)) {
      params.push(filter.maxPrice);
      sql += ` AND sp.price_per_hour <= $${params.length}`;
    }

    if (filter.minExperience !== undefined && !isNaN(filter.minExperience)) {
      params.push(filter.minExperience);
      sql += ` AND sp.experience_years >= $${params.length}`;
    }

    if (filter.skill) {
      params.push(`%${filter.skill.trim()}%`);
      sql += ` AND sp.skills ILIKE $${params.length}`;
    }

    if (filter.search) {
      params.push(`%${filter.search.trim()}%`);
      const searchParamIdx = params.length;
      sql += ` AND (
        sp.name ILIKE $${searchParamIdx} OR
        sp.skills ILIKE $${searchParamIdx} OR
        sp.location ILIKE $${searchParamIdx} OR
        sp.description ILIKE $${searchParamIdx}
      )`;
    }

    // Sorting
    switch (filter.sortBy) {
      case 'price_asc':
        sql += ' ORDER BY sp.price_per_hour ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY sp.price_per_hour DESC';
        break;
      case 'experience':
        sql += ' ORDER BY sp.experience_years DESC, sp.price_per_hour ASC';
        break;
      case 'newest':
      default:
        sql += ' ORDER BY sp.created_at DESC';
        break;
    }

    const result = await query(sql, params);
    return result.rows.map(this.mapRow);
  }

  /**
   * Find single service profile by ID with provider details
   */
  static async findById(id: string): Promise<ServiceProfile | null> {
    const sql = `
      SELECT sp.*, u.name as provider_name, u.phone as provider_phone, u.email as provider_email,
             op.village as provider_village, op.district as provider_district
      FROM service_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE sp.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  /**
   * Find all profiles belonging to a specific owner
   */
  static async findByOwnerId(userId: string, serviceType?: ServiceType): Promise<ServiceProfile[]> {
    let sql = `
      SELECT sp.*, u.name as provider_name, u.phone as provider_phone, u.email as provider_email,
             op.village as provider_village, op.district as provider_district
      FROM service_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE sp.user_id = $1
    `;
    const params: any[] = [userId];

    if (serviceType) {
      params.push(serviceType);
      sql += ` AND sp.service_type = $2`;
    }

    sql += ` ORDER BY sp.created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map(this.mapRow);
  }

  /**
   * Create a new service profile (Default: approval_status = PENDING, availability_status = AVAILABLE)
   */
  static async create(data: CreateServiceProfileInput): Promise<ServiceProfile> {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO service_profiles (
        id, user_id, service_type, name, phone, profile_image_url,
        description, experience_years, skills, price_per_hour, price_per_day,
        location, availability_status, approval_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'AVAILABLE', 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const params = [
      id,
      data.user_id,
      data.service_type,
      data.name,
      data.phone,
      data.profile_image_url || null,
      data.description || null,
      data.experience_years,
      data.skills,
      data.price_per_hour,
      data.price_per_day,
      data.location,
    ];

    const result = await query(sql, params);
    return this.mapRow(result.rows[0]);
  }

  /**
   * Update service profile (Owner only: verifies user_id === req.user.id)
   */
  static async updateByOwner(
    id: string,
    userId: string,
    data: UpdateServiceProfileInput
  ): Promise<ServiceProfile | null> {
    // First verify ownership
    const checkSql = `SELECT id, user_id FROM service_profiles WHERE id = $1`;
    const checkResult = await query(checkSql, [id]);
    if (checkResult.rows.length === 0) return null;
    if (checkResult.rows[0].user_id !== userId) {
      const err: any = new Error('Unauthorized: You do not own this service profile');
      err.statusCode = 403;
      throw err;
    }

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [id, userId];

    if (data.name !== undefined) {
      params.push(data.name);
      updates.push(`name = $${params.length}`);
    }
    if (data.phone !== undefined) {
      params.push(data.phone);
      updates.push(`phone = $${params.length}`);
    }
    if (data.profile_image_url !== undefined) {
      params.push(data.profile_image_url);
      updates.push(`profile_image_url = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description);
      updates.push(`description = $${params.length}`);
    }
    if (data.experience_years !== undefined) {
      params.push(data.experience_years);
      updates.push(`experience_years = $${params.length}`);
    }
    if (data.skills !== undefined) {
      params.push(data.skills);
      updates.push(`skills = $${params.length}`);
    }
    if (data.price_per_hour !== undefined) {
      params.push(data.price_per_hour);
      updates.push(`price_per_hour = $${params.length}`);
    }
    if (data.price_per_day !== undefined) {
      params.push(data.price_per_day);
      updates.push(`price_per_day = $${params.length}`);
    }
    if (data.location !== undefined) {
      params.push(data.location);
      updates.push(`location = $${params.length}`);
    }
    if (data.availability_status !== undefined) {
      params.push(data.availability_status);
      updates.push(`availability_status = $${params.length}`);
    }

    const sql = `
      UPDATE service_profiles
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await query(sql, params);
    return this.mapRow(result.rows[0]);
  }

  /**
   * Delete service profile (Owner only: verifies user_id === req.user.id)
   */
  static async deleteByOwner(id: string, userId: string): Promise<boolean> {
    const checkSql = `SELECT id, user_id FROM service_profiles WHERE id = $1`;
    const checkResult = await query(checkSql, [id]);
    if (checkResult.rows.length === 0) return false;
    if (checkResult.rows[0].user_id !== userId) {
      const err: any = new Error('Unauthorized: You do not own this service profile');
      err.statusCode = 403;
      throw err;
    }

    // Check if there are active bookings
    const bookingCheck = await query(
      `SELECT COUNT(*) as count FROM service_bookings 
       WHERE service_profile_id = $1 AND booking_status IN ('PENDING', 'CONFIRMED', 'ACTIVE')`,
      [id]
    );
    if (parseInt(bookingCheck.rows[0].count, 10) > 0) {
      const err: any = new Error('Cannot delete service profile with active or confirmed bookings');
      err.statusCode = 400;
      throw err;
    }

    await query(`DELETE FROM service_profiles WHERE id = $1 AND user_id = $2`, [id, userId]);
    return true;
  }

  /**
   * Admin: List all service profiles across all statuses
   */
  static async adminFindAll(filter: {
    service_type?: ServiceType;
    approval_status?: ApprovalStatus;
    search?: string;
  } = {}): Promise<ServiceProfile[]> {
    let sql = `
      SELECT sp.*, u.name as provider_name, u.phone as provider_phone, u.email as provider_email,
             op.village as provider_village, op.district as provider_district
      FROM service_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.service_type) {
      params.push(filter.service_type);
      sql += ` AND sp.service_type = $${params.length}`;
    }

    if (filter.approval_status) {
      params.push(filter.approval_status);
      sql += ` AND sp.approval_status = $${params.length}`;
    }

    if (filter.search) {
      params.push(`%${filter.search.trim()}%`);
      const searchIdx = params.length;
      sql += ` AND (sp.name ILIKE $${searchIdx} OR sp.skills ILIKE $${searchIdx} OR u.name ILIKE $${searchIdx} OR sp.location ILIKE $${searchIdx})`;
    }

    sql += ` ORDER BY sp.created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map(this.mapRow);
  }

  /**
   * Admin: Update approval status (APPROVE, REJECT, DISABLE)
   */
  static async setApprovalStatus(
    id: string,
    approvalStatus: ApprovalStatus,
    rejectionReason?: string
  ): Promise<ServiceProfile | null> {
    const sql = `
      UPDATE service_profiles
      SET approval_status = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id, approvalStatus, rejectionReason || null]);
    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  /**
   * Admin: Delete profile
   */
  static async adminDelete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM service_profiles WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private static mapRow(row: any): ServiceProfile {
    return {
      id: row.id,
      user_id: row.user_id,
      service_type: row.service_type,
      name: row.name,
      phone: row.phone,
      profile_image_url: row.profile_image_url,
      description: row.description,
      experience_years: parseInt(row.experience_years, 10) || 0,
      skills: row.skills,
      price_per_hour: parseFloat(row.price_per_hour),
      price_per_day: parseFloat(row.price_per_day),
      location: row.location,
      availability_status: row.availability_status,
      approval_status: row.approval_status,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      provider_name: row.provider_name,
      provider_phone: row.provider_phone,
      provider_email: row.provider_email,
      provider_village: row.provider_village,
      provider_district: row.provider_district,
    };
  }
}
