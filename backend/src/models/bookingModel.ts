import { query, withTransaction } from '../config/db.js';
import crypto from 'crypto';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CASH_PENDING';

export interface EquipmentBooking {
  id: string;
  equipment_id: string;
  farmer_id: string;
  owner_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_hours?: number;
  price_per_hour: number;
  total_amount: number;
  booking_status: BookingStatus;
  status?: string;
  payment_status: PaymentStatus;
  payment_reference?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  equipment_name?: string;
  equipment_category?: string;
  equipment_image_url?: string;
  equipment_location?: string;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_village?: string;
  farmer_district?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_village?: string;
  owner_district?: string;
}

export interface CreateBookingInput {
  equipment_id: string;
  farmer_id: string;
  owner_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  price_per_hour: number;
  total_amount: number;
}

export interface OwnerEarningsSummary {
  total_earnings: number;
  totalEarnings: number;
  completed_bookings_count: number;
  completedBookings: number;
  active_bookings_count: number;
  confirmedBookings: number;
  pending_bookings_count: number;
  pendingBookings: number;
  total_bookings_count: number;
  totalBookings: number;
  equipment_breakdown: Array<{
    id: string;
    name: string;
    category: string;
    bookings_count: number;
    total_earned: number;
  }>;
  completedBookingsList: EquipmentBooking[];
}

export class BookingModel {
  /**
   * Check for schedule conflict on the same equipment and date
   * Status in PENDING, CONFIRMED, ACTIVE prevents double-booking
   */
  static async checkConflict(
    equipmentId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<{ conflict: boolean; conflictingBooking?: EquipmentBooking }> {
    let sql = `
      SELECT b.*, e.name as equipment_name
      FROM equipment_bookings b
      JOIN equipment e ON b.equipment_id = e.id
      WHERE b.equipment_id = $1
        AND b.booking_date = $2
        AND b.booking_status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
        AND (b.start_time < $4 AND b.end_time > $3)
    `;
    const params: any[] = [equipmentId, bookingDate, startTime, endTime];

    if (excludeBookingId) {
      params.push(excludeBookingId);
      sql += ` AND b.id != $${params.length}`;
    }

    const res = await query<EquipmentBooking>(sql, params);
    if (res.rows.length > 0) {
      return {
        conflict: true,
        conflictingBooking: res.rows[0],
      };
    }
    return { conflict: false };
  }

  /**
   * Create new booking atomically inside a database transaction
   * to guarantee prevention of double bookings and overlapping reservations.
   */
  static async create(data: CreateBookingInput): Promise<EquipmentBooking> {
    return await withTransaction(async (tx) => {
      // 1. Check for overlapping reservation inside the transaction
      const checkSql = `
        SELECT b.id, e.name as equipment_name
        FROM equipment_bookings b
        JOIN equipment e ON b.equipment_id = e.id
        WHERE b.equipment_id = $1
          AND b.booking_date = $2
          AND b.booking_status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
          AND (b.start_time < $4 AND b.end_time > $3)
      `;
      const conflictRes = await tx.query<any>(checkSql, [
        data.equipment_id,
        data.booking_date,
        data.start_time,
        data.end_time,
      ]);

      if (conflictRes.rows.length > 0) {
        const err: any = new Error(
          `This equipment is already booked or reserved for the selected time slot on ${data.booking_date}. Please choose another time or date.`
        );
        err.code = 'CONFLICT';
        throw err;
      }

      // 2. Insert new booking with initial PENDING status
      const id = crypto.randomUUID();
      const insertSql = `
        INSERT INTO equipment_bookings (
          id, equipment_id, farmer_id, owner_id, booking_date,
          start_time, end_time, duration_hours, price_per_hour, total_amount,
          booking_status, payment_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const res = await tx.query<EquipmentBooking>(insertSql, [
        id,
        data.equipment_id,
        data.farmer_id,
        data.owner_id,
        data.booking_date,
        data.start_time,
        data.end_time,
        data.duration_hours,
        data.price_per_hour,
        data.total_amount,
      ]);

      return res.rows[0];
    });
  }

  /**
   * Find booking by ID with all joined details
   */
  static async findById(id: string): Promise<EquipmentBooking | null> {
    const sql = `
      SELECT 
        b.*,
        p.payment_reference,
        e.name as equipment_name,
        e.category as equipment_category,
        e.image_url as equipment_image_url,
        e.location as equipment_location,
        u_farmer.name as farmer_name,
        u_farmer.phone as farmer_phone,
        fp.village as farmer_village,
        fp.district as farmer_district,
        u_owner.name as owner_name,
        u_owner.phone as owner_phone,
        op.village as owner_village,
        op.district as owner_district
      FROM equipment_bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users u_farmer ON b.farmer_id = u_farmer.id
      LEFT JOIN farmer_profiles fp ON u_farmer.id = fp.user_id
      JOIN users u_owner ON b.owner_id = u_owner.id
      LEFT JOIN owner_profiles op ON u_owner.id = op.user_id
      LEFT JOIN payments p ON b.id = p.equipment_booking_id
      WHERE b.id = $1
    `;
    const res = await query<EquipmentBooking>(sql, [id]);
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    const duration = parseFloat(row.duration_hours as any) || 0;
    const price = parseFloat(row.price_per_hour as any) || 0;
    const amount = parseFloat(row.total_amount as any) || 0;
    const status = row.booking_status;
    return {
      ...row,
      duration_hours: duration,
      total_hours: duration,
      price_per_hour: price,
      total_amount: amount,
      booking_status: row.booking_status,
      status: status,
    };
  }

  /**
   * Find all bookings made by a specific farmer
   */
  static async findByFarmerId(farmerId: string): Promise<EquipmentBooking[]> {
    const sql = `
      SELECT 
        b.*,
        p.payment_reference,
        e.name as equipment_name,
        e.category as equipment_category,
        e.image_url as equipment_image_url,
        e.location as equipment_location,
        u_owner.name as owner_name,
        u_owner.phone as owner_phone,
        op.village as owner_village,
        op.district as owner_district
      FROM equipment_bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users u_owner ON b.owner_id = u_owner.id
      LEFT JOIN owner_profiles op ON u_owner.id = op.user_id
      LEFT JOIN payments p ON b.id = p.equipment_booking_id
      WHERE b.farmer_id = $1
      ORDER BY b.created_at DESC
    `;
    const res = await query<EquipmentBooking>(sql, [farmerId]);
    return res.rows.map(row => {
      const duration = parseFloat(row.duration_hours as any) || 0;
      const price = parseFloat(row.price_per_hour as any) || 0;
      const amount = parseFloat(row.total_amount as any) || 0;
      const status = row.booking_status;
      return {
        ...row,
        duration_hours: duration,
        total_hours: duration,
        price_per_hour: price,
        total_amount: amount,
        booking_status: row.booking_status,
        status: status,
      };
    });
  }

  /**
   * Find all bookings for equipment owned by a specific owner
   */
  static async findByOwnerId(ownerId: string): Promise<EquipmentBooking[]> {
    const sql = `
      SELECT 
        b.*,
        p.payment_reference,
        e.name as equipment_name,
        e.category as equipment_category,
        e.image_url as equipment_image_url,
        e.location as equipment_location,
        u_farmer.name as farmer_name,
        u_farmer.phone as farmer_phone,
        fp.village as farmer_village,
        fp.district as farmer_district
      FROM equipment_bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users u_farmer ON b.farmer_id = u_farmer.id
      LEFT JOIN farmer_profiles fp ON u_farmer.id = fp.user_id
      LEFT JOIN payments p ON b.id = p.equipment_booking_id
      WHERE b.owner_id = $1
      ORDER BY b.created_at DESC
    `;
    const res = await query<EquipmentBooking>(sql, [ownerId]);
    return res.rows.map(row => {
      const duration = parseFloat(row.duration_hours as any) || 0;
      const price = parseFloat(row.price_per_hour as any) || 0;
      const amount = parseFloat(row.total_amount as any) || 0;
      const status = row.booking_status;
      return {
        ...row,
        duration_hours: duration,
        total_hours: duration,
        price_per_hour: price,
        total_amount: amount,
        booking_status: row.booking_status,
        status: status,
      };
    });
  }

  /**
   * Owner updates status: CONFIRMED, REJECTED, ACTIVE, COMPLETED
   */
  static async updateOwnerStatus(
    bookingId: string,
    ownerId: string,
    newStatus: BookingStatus
  ): Promise<EquipmentBooking | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.owner_id !== ownerId) {
      return null;
    }

    let paymentUpdate = '';
    if (newStatus === 'COMPLETED' && booking.payment_status === 'PENDING') {
      paymentUpdate = `, payment_status = 'PAID'`;
    }

    const sql = `
      UPDATE equipment_bookings
      SET booking_status = $1, updated_at = CURRENT_TIMESTAMP ${paymentUpdate}
      WHERE id = $2 AND owner_id = $3
      RETURNING *
    `;
    await query(sql, [newStatus, bookingId, ownerId]);
    return this.findById(bookingId);
  }

  /**
   * Farmer cancels booking (allowed if PENDING or CONFIRMED)
   */
  static async cancelByFarmer(bookingId: string, farmerId: string): Promise<EquipmentBooking | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.farmer_id !== farmerId) {
      return null;
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.booking_status)) {
      throw new Error(`Cannot cancel booking in ${booking.booking_status} status`);
    }

    const sql = `
      UPDATE equipment_bookings
      SET booking_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND farmer_id = $2
      RETURNING *
    `;
    await query(sql, [bookingId, farmerId]);
    return this.findById(bookingId);
  }

  /**
   * Owner earnings and performance summary
   */
  static async getOwnerEarnings(ownerId: string): Promise<OwnerEarningsSummary> {
    const bookings = await this.findByOwnerId(ownerId);

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.booking_status === 'PENDING').length;
    const confirmedBookings = bookings.filter(b => b.booking_status === 'CONFIRMED' || b.booking_status === 'ACTIVE').length;
    const completedList = bookings.filter(b => b.booking_status === 'COMPLETED');
    const completedBookings = completedList.length;

    const totalEarnings = completedList.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

    const equipmentMap: Record<string, { id: string; name: string; category: string; bookings_count: number; total_earned: number }> = {};
    for (const b of bookings) {
      if (!equipmentMap[b.equipment_id]) {
        equipmentMap[b.equipment_id] = {
          id: b.equipment_id,
          name: b.equipment_name || 'Machinery',
          category: b.equipment_category || 'Machinery',
          bookings_count: 0,
          total_earned: 0,
        };
      }
      if (b.booking_status === 'COMPLETED') {
        equipmentMap[b.equipment_id].bookings_count += 1;
        equipmentMap[b.equipment_id].total_earned += Number(b.total_amount) || 0;
      }
    }

    return {
      total_earnings: totalEarnings,
      totalEarnings,
      completed_bookings_count: completedBookings,
      completedBookings,
      active_bookings_count: confirmedBookings,
      confirmedBookings,
      pending_bookings_count: pendingBookings,
      pendingBookings,
      total_bookings_count: totalBookings,
      totalBookings,
      equipment_breakdown: Object.values(equipmentMap),
      completedBookingsList: completedList,
    };
  }

  /**
   * Live statistics for Admin Dashboard
   */
  static async getAdminStats(): Promise<{
    equipment: number;
    pendingEquipment: number;
    approvedEquipment: number;
    rejectedEquipment: number;
    bookings: number;
    activeBookings: number;
    completedBookings: number;
    revenue: number;
  }> {
    const eqTotal = await query<{ count: string }>('SELECT COUNT(*) as count FROM equipment');
    const eqPending = await query<{ count: string }>("SELECT COUNT(*) as count FROM equipment WHERE approval_status = 'PENDING'");
    const eqApproved = await query<{ count: string }>("SELECT COUNT(*) as count FROM equipment WHERE approval_status = 'APPROVED'");
    const eqRejected = await query<{ count: string }>("SELECT COUNT(*) as count FROM equipment WHERE approval_status = 'REJECTED'");

    const bkTotal = await query<{ count: string }>('SELECT COUNT(*) as count FROM equipment_bookings');
    const bkActive = await query<{ count: string }>("SELECT COUNT(*) as count FROM equipment_bookings WHERE booking_status IN ('CONFIRMED', 'ACTIVE')");
    const bkCompleted = await query<{ count: string }>("SELECT COUNT(*) as count FROM equipment_bookings WHERE booking_status = 'COMPLETED'");
    const revRes = await query<{ sum: string }>("SELECT COALESCE(SUM(total_amount), 0) as sum FROM equipment_bookings WHERE booking_status = 'COMPLETED'");

    return {
      equipment: parseInt(eqTotal.rows[0]?.count || '0', 10),
      pendingEquipment: parseInt(eqPending.rows[0]?.count || '0', 10),
      approvedEquipment: parseInt(eqApproved.rows[0]?.count || '0', 10),
      rejectedEquipment: parseInt(eqRejected.rows[0]?.count || '0', 10),
      bookings: parseInt(bkTotal.rows[0]?.count || '0', 10),
      activeBookings: parseInt(bkActive.rows[0]?.count || '0', 10),
      completedBookings: parseInt(bkCompleted.rows[0]?.count || '0', 10),
      revenue: parseFloat(revRes.rows[0]?.sum || '0'),
    };
  }
}
