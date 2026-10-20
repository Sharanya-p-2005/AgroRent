import { query, withTransaction } from '../config/db.js';
import crypto from 'crypto';
import { ServiceType } from './serviceProfileModel.js';

export type ServiceBookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type ServicePaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CASH_PENDING';

export interface ServiceBooking {
  id: string;
  service_profile_id: string;
  farmer_id: string;
  provider_id: string;
  service_type: ServiceType;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  price_per_hour: number;
  price_per_day: number;
  total_amount: number;
  booking_status: ServiceBookingStatus;
  payment_status: ServicePaymentStatus;
  payment_reference?: string;
  work_location: string;
  work_description?: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  profile_name?: string;
  profile_phone?: string;
  profile_image_url?: string;
  profile_skills?: string;
  profile_experience?: number;
  provider_name?: string;
  provider_phone?: string;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_email?: string;
}

export interface CreateServiceBookingInput {
  service_profile_id: string;
  farmer_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours?: number;
  is_daily_booking?: boolean;
  number_of_days?: number;
  work_location: string;
  work_description?: string;
}

export interface ServiceEarningsSummary {
  total_earnings: number;
  total_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  driver_bookings: number;
  worker_bookings: number;
  completed_bookings_list: ServiceBooking[];
}

export class ServiceBookingModel {
  /**
   * Check for schedule conflict on the same service profile and date
   * Status in PENDING, CONFIRMED, ACTIVE prevents double-booking
   */
  static async checkConflict(
    profileId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<{ conflict: boolean; conflictingBooking?: ServiceBooking }> {
    let sql = `
      SELECT sb.*, sp.name as profile_name
      FROM service_bookings sb
      JOIN service_profiles sp ON sb.service_profile_id = sp.id
      WHERE sb.service_profile_id = $1
        AND sb.booking_date = $2
        AND sb.booking_status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
        AND (sb.start_time < $4 AND sb.end_time > $3)
    `;
    const params: any[] = [profileId, bookingDate, startTime, endTime];

    if (excludeBookingId) {
      params.push(excludeBookingId);
      sql += ` AND sb.id != $${params.length}`;
    }

    const res = await query(sql, params);
    if (res.rows.length > 0) {
      return {
        conflict: true,
        conflictingBooking: this.mapRow(res.rows[0]),
      };
    }
    return { conflict: false };
  }

  /**
   * Create a new booking with transaction and atomic conflict checks
   */
  static async create(data: CreateServiceBookingInput): Promise<ServiceBooking> {
    return await withTransaction(async (client) => {
      // 1. Fetch and verify service profile
      const profileRes = await client.query(
        `SELECT id, user_id, service_type, price_per_hour, price_per_day,
                availability_status, approval_status, name
         FROM service_profiles WHERE id = $1 FOR UPDATE`,
        [data.service_profile_id]
      );

      if (profileRes.rows.length === 0) {
        const err: any = new Error('Service profile not found');
        err.statusCode = 404;
        throw err;
      }

      const profile = profileRes.rows[0];

      if (profile.approval_status !== 'APPROVED') {
        const err: any = new Error('This service profile is not currently approved for bookings');
        err.statusCode = 400;
        throw err;
      }

      if (profile.availability_status !== 'AVAILABLE') {
        const err: any = new Error('This service provider is currently unavailable');
        err.statusCode = 400;
        throw err;
      }

      if (profile.user_id === data.farmer_id) {
        const err: any = new Error('You cannot book your own service profile');
        err.statusCode = 400;
        throw err;
      }

      // 2. Conflict checking
      const conflictRes = await client.query(
        `SELECT id, start_time, end_time FROM service_bookings
         WHERE service_profile_id = $1
           AND booking_date = $2
           AND booking_status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
           AND (start_time < $4 AND end_time > $3)`,
        [data.service_profile_id, data.booking_date, data.start_time, data.end_time]
      );

      if (conflictRes.rows.length > 0) {
        const err: any = new Error(
          `Schedule conflict: This provider is already booked between ${conflictRes.rows[0].start_time} and ${conflictRes.rows[0].end_time} on ${data.booking_date}`
        );
        err.statusCode = 409;
        throw err;
      }

      // 3. Compute duration and price
      let durationHours = data.duration_hours || 0;
      if (durationHours <= 0) {
        // Compute from start_time and end_time (HH:MM)
        const [startH, startM] = data.start_time.split(':').map(Number);
        const [endH, endM] = data.end_time.split(':').map(Number);
        const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        durationHours = Math.max(1, Math.round((diffMinutes / 60) * 100) / 100);
      }

      const pricePerHour = parseFloat(profile.price_per_hour);
      const pricePerDay = parseFloat(profile.price_per_day);
      let totalAmount = 0;

      if (data.is_daily_booking) {
        const days = Math.max(1, data.number_of_days || 1);
        totalAmount = Math.round(pricePerDay * days * 100) / 100;
      } else {
        totalAmount = Math.round(durationHours * pricePerHour * 100) / 100;
      }

      const bookingId = crypto.randomUUID();
      const insertSql = `
        INSERT INTO service_bookings (
          id, service_profile_id, farmer_id, provider_id, service_type,
          booking_date, start_time, end_time, duration_hours, price_per_hour, price_per_day,
          total_amount, booking_status, payment_status, work_location, work_description,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, 'PENDING', 'PENDING', $13, $14,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const insertRes = await client.query(insertSql, [
        bookingId,
        data.service_profile_id,
        data.farmer_id,
        profile.user_id,
        profile.service_type,
        data.booking_date,
        data.start_time,
        data.end_time,
        durationHours,
        pricePerHour,
        pricePerDay,
        totalAmount,
        data.work_location,
        data.work_description || null,
      ]);

      return this.mapRow(insertRes.rows[0]);
    });
  }

  /**
   * Find all bookings made by a specific farmer
   */
  static async findByFarmerId(farmerId: string): Promise<ServiceBooking[]> {
    const sql = `
      SELECT sb.*, p.payment_reference, sp.name as profile_name, sp.phone as profile_phone,
             sp.profile_image_url as profile_image_url, sp.skills as profile_skills,
             sp.experience_years as profile_experience,
             u_prov.name as provider_name, u_prov.phone as provider_phone,
             u_farm.name as farmer_name, u_farm.phone as farmer_phone, u_farm.email as farmer_email
      FROM service_bookings sb
      JOIN service_profiles sp ON sb.service_profile_id = sp.id
      JOIN users u_prov ON sb.provider_id = u_prov.id
      JOIN users u_farm ON sb.farmer_id = u_farm.id
      LEFT JOIN payments p ON sb.id = p.service_booking_id
      WHERE sb.farmer_id = $1
      ORDER BY sb.created_at DESC
    `;
    const res = await query(sql, [farmerId]);
    return res.rows.map(this.mapRow);
  }

  /**
   * Find single booking by ID (internal/service lookup)
   */
  static async findById(id: string): Promise<ServiceBooking | null> {
    const sql = `
      SELECT sb.*, p.payment_reference, sp.name as profile_name, sp.phone as profile_phone,
             sp.profile_image_url as profile_image_url, sp.skills as profile_skills,
             sp.experience_years as profile_experience,
             u_prov.name as provider_name, u_prov.phone as provider_phone,
             u_farm.name as farmer_name, u_farm.phone as farmer_phone, u_farm.email as farmer_email
      FROM service_bookings sb
      JOIN service_profiles sp ON sb.service_profile_id = sp.id
      JOIN users u_prov ON sb.provider_id = u_prov.id
      JOIN users u_farm ON sb.farmer_id = u_farm.id
      LEFT JOIN payments p ON sb.id = p.service_booking_id
      WHERE sb.id = $1
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  /**
   * Find single booking by ID for a farmer
   */
  static async findFarmerBookingById(id: string, farmerId: string): Promise<ServiceBooking | null> {
    const sql = `
      SELECT sb.*, p.payment_reference, sp.name as profile_name, sp.phone as profile_phone,
             sp.profile_image_url as profile_image_url, sp.skills as profile_skills,
             sp.experience_years as profile_experience,
             u_prov.name as provider_name, u_prov.phone as provider_phone,
             u_farm.name as farmer_name, u_farm.phone as farmer_phone, u_farm.email as farmer_email
      FROM service_bookings sb
      JOIN service_profiles sp ON sb.service_profile_id = sp.id
      JOIN users u_prov ON sb.provider_id = u_prov.id
      JOIN users u_farm ON sb.farmer_id = u_farm.id
      LEFT JOIN payments p ON sb.id = p.service_booking_id
      WHERE sb.id = $1 AND sb.farmer_id = $2
    `;
    const res = await query(sql, [id, farmerId]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  /**
   * Farmer cancels their booking (only permitted if PENDING or CONFIRMED)
   */
  static async cancelByFarmer(id: string, farmerId: string): Promise<ServiceBooking> {
    return await withTransaction(async (client) => {
      const checkRes = await client.query(
        `SELECT id, farmer_id, booking_status FROM service_bookings WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (checkRes.rows.length === 0) {
        const err: any = new Error('Booking not found');
        err.statusCode = 404;
        throw err;
      }

      const booking = checkRes.rows[0];

      if (booking.farmer_id !== farmerId) {
        const err: any = new Error('Unauthorized: You can only cancel your own bookings');
        err.statusCode = 403;
        throw err;
      }

      if (!['PENDING', 'CONFIRMED'].includes(booking.booking_status)) {
        const err: any = new Error(
          `Cannot cancel booking in '${booking.booking_status}' status. Only PENDING or CONFIRMED bookings may be cancelled.`
        );
        err.statusCode = 400;
        throw err;
      }

      const updateRes = await client.query(
        `UPDATE service_bookings
         SET booking_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return this.mapRow(updateRes.rows[0]);
    });
  }

  /**
   * Find bookings for an owner / service provider
   */
  static async findByProviderId(providerId: string, serviceType?: ServiceType): Promise<ServiceBooking[]> {
    let sql = `
      SELECT sb.*, sp.name as profile_name, sp.phone as profile_phone,
             sp.profile_image_url as profile_image_url, sp.skills as profile_skills,
             sp.experience_years as profile_experience,
             u_prov.name as provider_name, u_prov.phone as provider_phone,
             u_farm.name as farmer_name, u_farm.phone as farmer_phone, u_farm.email as farmer_email
      FROM service_bookings sb
      JOIN service_profiles sp ON sb.service_profile_id = sp.id
      JOIN users u_prov ON sb.provider_id = u_prov.id
      JOIN users u_farm ON sb.farmer_id = u_farm.id
      WHERE sb.provider_id = $1
    `;
    const params: any[] = [providerId];

    if (serviceType) {
      params.push(serviceType);
      sql += ` AND sb.service_type = $${params.length}`;
    }

    sql += ` ORDER BY sb.created_at DESC`;

    const res = await query(sql, params);
    return res.rows.map(this.mapRow);
  }

  /**
   * Owner updates status with strict flow verification:
   * PENDING -> CONFIRMED | REJECTED
   * CONFIRMED -> ACTIVE
   * ACTIVE -> COMPLETED
   */
  static async updateStatusByProvider(
    id: string,
    providerId: string,
    targetStatus: 'CONFIRMED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED'
  ): Promise<ServiceBooking> {
    return await withTransaction(async (client) => {
      const checkRes = await client.query(
        `SELECT id, provider_id, booking_status FROM service_bookings WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (checkRes.rows.length === 0) {
        const err: any = new Error('Booking not found');
        err.statusCode = 404;
        throw err;
      }

      const booking = checkRes.rows[0];

      if (booking.provider_id !== providerId) {
        const err: any = new Error('Unauthorized: You can only manage bookings for your own services');
        err.statusCode = 403;
        throw err;
      }

      // Verify valid transitions
      const current = booking.booking_status;
      let valid = false;

      if (targetStatus === 'CONFIRMED' && current === 'PENDING') valid = true;
      if (targetStatus === 'REJECTED' && current === 'PENDING') valid = true;
      if (targetStatus === 'ACTIVE' && current === 'CONFIRMED') valid = true;
      if (targetStatus === 'COMPLETED' && current === 'ACTIVE') valid = true;

      if (!valid) {
        const err: any = new Error(
          `Invalid status transition from '${current}' to '${targetStatus}'. Allowed flow: PENDING -> CONFIRMED -> ACTIVE -> COMPLETED (or PENDING -> REJECTED).`
        );
        err.statusCode = 400;
        throw err;
      }

      const updateRes = await client.query(
        `UPDATE service_bookings
         SET booking_status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, targetStatus]
      );

      return this.mapRow(updateRes.rows[0]);
    });
  }

  /**
   * Owner Service Earnings Summary
   */
  static async getEarningsSummary(providerId: string): Promise<ServiceEarningsSummary> {
    const totalBookingsRes = await query(
      `SELECT COUNT(*) as count FROM service_bookings WHERE provider_id = $1`,
      [providerId]
    );
    const totalBookings = parseInt(totalBookingsRes.rows[0]?.count || '0', 10);

    const pendingRes = await query(
      `SELECT COUNT(*) as count FROM service_bookings WHERE provider_id = $1 AND booking_status = 'PENDING'`,
      [providerId]
    );
    const pendingBookings = parseInt(pendingRes.rows[0]?.count || '0', 10);

    const driverRes = await query(
      `SELECT COUNT(*) as count FROM service_bookings WHERE provider_id = $1 AND service_type = 'DRIVER'`,
      [providerId]
    );
    const driverBookings = parseInt(driverRes.rows[0]?.count || '0', 10);

    const workerRes = await query(
      `SELECT COUNT(*) as count FROM service_bookings WHERE provider_id = $1 AND service_type = 'FARM_WORKER'`,
      [providerId]
    );
    const workerBookings = parseInt(workerRes.rows[0]?.count || '0', 10);

    const completedRes = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_earnings
       FROM service_bookings
       WHERE provider_id = $1 AND booking_status = 'COMPLETED'`,
      [providerId]
    );
    const completedBookings = parseInt(completedRes.rows[0]?.count || '0', 10);
    const totalEarnings = parseFloat(completedRes.rows[0]?.total_earnings || '0');

    // List completed bookings
    const completedListRes = await query(
      `SELECT sb.*, sp.name as profile_name, u_farm.name as farmer_name, u_farm.phone as farmer_phone
       FROM service_bookings sb
       JOIN service_profiles sp ON sb.service_profile_id = sp.id
       JOIN users u_farm ON sb.farmer_id = u_farm.id
       WHERE sb.provider_id = $1 AND sb.booking_status = 'COMPLETED'
       ORDER BY sb.updated_at DESC`,
      [providerId]
    );

    return {
      total_earnings: totalEarnings,
      total_bookings: totalBookings,
      completed_bookings: completedBookings,
      pending_bookings: pendingBookings,
      driver_bookings: driverBookings,
      worker_bookings: workerBookings,
      completed_bookings_list: completedListRes.rows.map(this.mapRow),
    };
  }

  /**
   * Admin: View all service bookings across the platform
   */
  static async adminFindAll(): Promise<ServiceBooking[]> {
    const sql = `
      SELECT sb.*, sp.name as profile_name, sp.phone as profile_phone,
             sp.profile_image_url as profile_image_url, sp.skills as profile_skills,
             sp.experience_years as profile_experience,
             u_prov.name as provider_name, u_prov.phone as provider_phone,
             u_farm.name as farmer_name, u_farm.phone as farmer_phone, u_farm.email as farmer_email
      FROM service_bookings sb
      JOIN service_profiles sp ON sb.service_profile_id = sp.id
      JOIN users u_prov ON sb.provider_id = u_prov.id
      JOIN users u_farm ON sb.farmer_id = u_farm.id
      ORDER BY sb.created_at DESC
    `;
    const res = await query(sql);
    return res.rows.map(this.mapRow);
  }

  private static mapRow(row: any): ServiceBooking {
    return {
      id: row.id,
      service_profile_id: row.service_profile_id,
      farmer_id: row.farmer_id,
      provider_id: row.provider_id,
      service_type: row.service_type,
      booking_date: typeof row.booking_date === 'object' && row.booking_date instanceof Date
        ? row.booking_date.toISOString().split('T')[0]
        : String(row.booking_date).split('T')[0],
      start_time: row.start_time,
      end_time: row.end_time,
      duration_hours: parseFloat(row.duration_hours),
      price_per_hour: parseFloat(row.price_per_hour || '0'),
      price_per_day: parseFloat(row.price_per_day || '0'),
      total_amount: parseFloat(row.total_amount),
      booking_status: row.booking_status,
      payment_status: row.payment_status,
      payment_reference: row.payment_reference || undefined,
      work_location: row.work_location,
      work_description: row.work_description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      profile_name: row.profile_name,
      profile_phone: row.profile_phone,
      profile_image_url: row.profile_image_url,
      profile_skills: row.profile_skills,
      profile_experience: row.profile_experience !== undefined ? parseInt(row.profile_experience, 10) : undefined,
      provider_name: row.provider_name,
      provider_phone: row.provider_phone,
      farmer_name: row.farmer_name,
      farmer_phone: row.farmer_phone,
      farmer_email: row.farmer_email,
    };
  }
}
