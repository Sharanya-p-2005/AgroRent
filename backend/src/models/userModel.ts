import { query } from '../config/db.js';
import crypto from 'crypto';

export type UserRole = 'FARMER' | 'OWNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface FarmerProfile {
  id: string;
  user_id: string;
  address: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

export interface OwnerProfile {
  id: string;
  user_id: string;
  address: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'FARMER' | 'OWNER';
  address: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const res = await query<User>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    return res.rows[0] || null;
  }

  static async findByPhone(phone: string): Promise<User | null> {
    const res = await query<User>('SELECT * FROM users WHERE phone = $1', [phone.trim()]);
    return res.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const res = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findWithProfile(id: string): Promise<any | null> {
    const user = await this.findById(id);
    if (!user) return null;

    let profile = null;
    if (user.role === 'FARMER') {
      const pRes = await query<FarmerProfile>('SELECT * FROM farmer_profiles WHERE user_id = $1', [id]);
      profile = pRes.rows[0] || null;
    } else if (user.role === 'OWNER') {
      const pRes = await query<OwnerProfile>('SELECT * FROM owner_profiles WHERE user_id = $1', [id]);
      profile = pRes.rows[0] || null;
    } else if (user.role === 'ADMIN') {
      const pRes = await query<AdminProfile>('SELECT * FROM admin_profiles WHERE user_id = $1', [id]);
      profile = pRes.rows[0] || null;
    }

    // Exclude password_hash before returning
    const { password_hash, ...safeUser } = user;
    return {
      ...safeUser,
      profile,
    };
  }

  static async createWithProfile(data: CreateUserData): Promise<Omit<User, 'password_hash'>> {
    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();

    // Insert user
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, data.name.trim(), data.email.trim().toLowerCase(), data.phone.trim(), data.password_hash, data.role]
    );

    // Insert profile based on role
    if (data.role === 'FARMER') {
      await query(
        `INSERT INTO farmer_profiles (id, user_id, address, village, taluk, district, state, pincode, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [profileId, userId, data.address, data.village, data.taluk, data.district, data.state, data.pincode]
      );
    } else if (data.role === 'OWNER') {
      await query(
        `INSERT INTO owner_profiles (id, user_id, address, village, taluk, district, state, pincode, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [profileId, userId, data.address, data.village, data.taluk, data.district, data.state, data.pincode]
      );
    }

    const created = await this.findById(userId);
    if (!created) {
      throw new Error('Failed to retrieve created user');
    }

    const { password_hash, ...safeUser } = created;
    return safeUser;
  }

  static async getStats(): Promise<{
    totalUsers: number;
    farmers: number;
    owners: number;
    equipment: number;
    animals: number;
    bookings: number;
    orders: number;
    revenue: number;
  }> {
    const totalUsersRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
    const farmersRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'FARMER'");
    const ownersRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'OWNER'");

    return {
      totalUsers: parseInt(totalUsersRes.rows[0]?.count || '0', 10),
      farmers: parseInt(farmersRes.rows[0]?.count || '0', 10),
      owners: parseInt(ownersRes.rows[0]?.count || '0', 10),
      equipment: 0,
      animals: 0,
      bookings: 0,
      orders: 0,
      revenue: 0,
    };
  }

  static async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<User | null> {
    const isActive = status === 'ACTIVE';
    const res = await query<User>(
      `UPDATE users 
       SET status = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, isActive, id]
    );
    return res.rows[0] || null;
  }

  static async getAdminUsersList(options: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  } = {}): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (options.role && options.role !== 'ALL') {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(options.role.toUpperCase());
    }

    if (options.status && options.status !== 'ALL') {
      conditions.push(`COALESCE(u.status, CASE WHEN u.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END) = $${paramIndex++}`);
      params.push(options.status.toUpperCase());
    }

    if (options.search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`);
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const usersSql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.is_active,
        COALESCE(u.status, CASE WHEN u.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END) as status,
        u.created_at,
        u.updated_at,
        COALESCE(fp.district, op.district, '') as district,
        COALESCE(fp.state, op.state, '') as state,
        COALESCE(fp.village, op.village, '') as village
      FROM users u
      LEFT JOIN farmer_profiles fp ON u.id = fp.user_id AND u.role = 'FARMER'
      LEFT JOIN owner_profiles op ON u.id = op.user_id AND u.role = 'OWNER'
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const usersRes = await query<any>(usersSql, [...params, limit, offset]);

    return {
      users: usersRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getUserFullDetails(id: string): Promise<any | null> {
    const user = await this.findWithProfile(id);
    if (!user) return null;

    // Fetch activity statistics
    const [bookingsRes, ordersRes, paymentsRes, reviewsRes] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM equipment_bookings WHERE farmer_id = $1 OR owner_id = $1', [id]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM animal_orders WHERE buyer_id = $1 OR seller_id = $1', [id]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM payments WHERE user_id = $1', [id]),
      query<{ count: string }>('SELECT COUNT(*) as count FROM reviews WHERE reviewer_id = $1', [id]),
    ]);

    return {
      ...user,
      activity: {
        totalBookings: parseInt(bookingsRes.rows[0]?.count || '0', 10),
        totalOrders: parseInt(ordersRes.rows[0]?.count || '0', 10),
        totalPayments: parseInt(paymentsRes.rows[0]?.count || '0', 10),
        totalReviews: parseInt(reviewsRes.rows[0]?.count || '0', 10),
      },
    };
  }

  static async updateProfile(userId: string, data: any): Promise<any> {
    const user = await this.findById(userId);
    if (!user) return null;

    // 1. Update basic user fields if provided
    const userUpdates: string[] = [];
    const userParams: any[] = [];
    let uIdx = 1;

    if (data.name !== undefined) {
      userUpdates.push(`name = $${uIdx++}`);
      userParams.push(data.name);
    }
    if (data.phone !== undefined) {
      userUpdates.push(`phone = $${uIdx++}`);
      userParams.push(data.phone);
    }
    if (data.profile_image !== undefined) {
      userUpdates.push(`profile_image = $${uIdx++}`);
      userParams.push(data.profile_image);
    }

    if (userUpdates.length > 0) {
      userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
      userParams.push(userId);
      await query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${uIdx}`, userParams);
    }

    // 2. Update role-specific profile
    if (user.role === 'FARMER') {
      await query(
        `INSERT INTO farmer_profiles (id, user_id, address, village, taluk, district, state, pincode, farm_size, soil_type, irrigation_type, preferred_language, main_crops, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           address = COALESCE($3, farmer_profiles.address),
           village = COALESCE($4, farmer_profiles.village),
           taluk = COALESCE($5, farmer_profiles.taluk),
           district = COALESCE($6, farmer_profiles.district),
           state = COALESCE($7, farmer_profiles.state),
           pincode = COALESCE($8, farmer_profiles.pincode),
           farm_size = COALESCE($9, farmer_profiles.farm_size),
           soil_type = COALESCE($10, farmer_profiles.soil_type),
           irrigation_type = COALESCE($11, farmer_profiles.irrigation_type),
           preferred_language = COALESCE($12, farmer_profiles.preferred_language),
           main_crops = COALESCE($13, farmer_profiles.main_crops),
           updated_at = CURRENT_TIMESTAMP`,
        [
          crypto.randomUUID(),
          userId,
          data.address ?? null,
          data.village ?? null,
          data.taluk ?? null,
          data.district ?? null,
          data.state ?? null,
          data.pincode ?? null,
          data.farm_size ? parseFloat(data.farm_size) : null,
          data.soil_type ?? null,
          data.irrigation_type ?? null,
          data.preferred_language ?? 'en',
          data.main_crops ?? null,
        ]
      );
    } else if (user.role === 'OWNER') {
      await query(
        `INSERT INTO owner_profiles (id, user_id, address, village, taluk, district, state, pincode, business_name, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           address = COALESCE($3, owner_profiles.address),
           village = COALESCE($4, owner_profiles.village),
           taluk = COALESCE($5, owner_profiles.taluk),
           district = COALESCE($6, owner_profiles.district),
           state = COALESCE($7, owner_profiles.state),
           pincode = COALESCE($8, owner_profiles.pincode),
           business_name = COALESCE($9, owner_profiles.business_name),
           description = COALESCE($10, owner_profiles.description),
           updated_at = CURRENT_TIMESTAMP`,
        [
          crypto.randomUUID(),
          userId,
          data.address ?? null,
          data.village ?? null,
          data.taluk ?? null,
          data.district ?? null,
          data.state ?? null,
          data.pincode ?? null,
          data.business_name ?? null,
          data.description ?? null,
        ]
      );
    }

    return await this.findWithProfile(userId);
  }
}
