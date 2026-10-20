import { query, withTransaction } from '../config/db.js';
import crypto from 'crypto';

export type PaymentType = 'EQUIPMENT' | 'ANIMAL_ORDER' | 'DRIVER' | 'FARM_WORKER';
export type PaymentMethod = 'RAZORPAY' | 'UPI' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CASH_PENDING';

export interface Payment {
  id: string;
  user_id: string;
  payment_reference: string;
  payment_type: PaymentType;
  equipment_booking_id?: string | null;
  animal_order_id?: string | null;
  service_booking_id?: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  upi_transaction_id?: string | null;
  created_at: string;
  updated_at: string;

  // Joined entity & user details
  payer_name?: string;
  payer_email?: string;
  payer_phone?: string;
  recipient_name?: string;
  recipient_phone?: string;
  target_title?: string;
  target_subtitle?: string;
  target_location?: string;
  target_image_url?: string;
  booking_status?: string;
}

export interface CreatePaymentInput {
  user_id: string;
  payment_type: PaymentType;
  equipment_booking_id?: string;
  animal_order_id?: string;
  service_booking_id?: string;
  amount: number;
  currency?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
}

export interface AdminPaymentStats {
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_successful_amount: number;
}

export interface OwnerPaymentSummary {
  total_paid_amount: number;
  equipment_revenue: number;
  animal_sales: number;
  driver_service_revenue: number;
  worker_service_revenue: number;
}

export class PaymentModel {
  /**
   * Generates a collision-resistant, standardized payment reference.
   * Format: AGR-PAY-YYYYMMDD-XXXXX
   */
  static generatePaymentReference(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    return `AGR-PAY-${year}${month}${day}-${randomHex}`;
  }

  /**
   * Find existing payment for a specific target entity to prevent duplicate payments.
   */
  static async findByTarget(
    paymentType: PaymentType,
    targetId: string
  ): Promise<Payment | null> {
    let whereClause = '';
    if (paymentType === 'EQUIPMENT') {
      whereClause = 'equipment_booking_id = $1';
    } else if (paymentType === 'ANIMAL_ORDER') {
      whereClause = 'animal_order_id = $1';
    } else {
      whereClause = 'service_booking_id = $1';
    }

    const res = await query<Payment>(
      `SELECT * FROM payments WHERE ${whereClause} ORDER BY created_at DESC LIMIT 1`,
      [targetId]
    );

    if (res.rows.length === 0) return null;
    return this.enrichPaymentRow(res.rows[0]);
  }

  /**
   * Create an internal payment record.
   */
  static async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const id = crypto.randomUUID();
    const paymentReference = this.generatePaymentReference();
    const currency = input.currency || 'INR';
    const paymentMethod = input.payment_method || 'RAZORPAY';
    const paymentStatus = input.payment_status || 'PENDING';

    const sql = `
      INSERT INTO payments (
        id, user_id, payment_reference, payment_type,
        equipment_booking_id, animal_order_id, service_booking_id,
        amount, currency, payment_method, payment_status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const res = await query<Payment>(sql, [
      id,
      input.user_id,
      paymentReference,
      input.payment_type,
      input.equipment_booking_id || null,
      input.animal_order_id || null,
      input.service_booking_id || null,
      input.amount,
      currency,
      paymentMethod,
      paymentStatus,
    ]);

    const enriched = await this.findByReference(paymentReference);
    return enriched || res.rows[0];
  }

  /**
   * Find payment by reference with fully joined target metadata.
   */
  static async findByReference(paymentReference: string): Promise<Payment | null> {
    const res = await query<Payment>(
      `SELECT p.*,
              u.name as payer_name, u.email as payer_email, u.phone as payer_phone
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.payment_reference = $1`,
      [paymentReference]
    );

    if (res.rows.length === 0) return null;
    return this.enrichPaymentRow(res.rows[0]);
  }

  /**
   * Find payment by ID with fully joined target metadata.
   */
  static async findById(id: string): Promise<Payment | null> {
    const res = await query<Payment>(
      `SELECT p.*,
              u.name as payer_name, u.email as payer_email, u.phone as payer_phone
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return this.enrichPaymentRow(res.rows[0]);
  }

  /**
   * Internal helper to enrich payment record with target entity details.
   */
  private static async enrichPaymentRow(payment: Payment): Promise<Payment> {
    payment.amount = parseFloat(String(payment.amount)) || 0;

    if (payment.equipment_booking_id) {
      const eqRes = await query<any>(
        `SELECT b.booking_status, b.payment_status as target_payment_status,
                e.name as target_title, e.category as target_subtitle, e.location as target_location, e.image_url as target_image_url,
                u_owner.name as recipient_name, u_owner.phone as recipient_phone
         FROM equipment_bookings b
         JOIN equipment e ON b.equipment_id = e.id
         JOIN users u_owner ON b.owner_id = u_owner.id
         WHERE b.id = $1`,
        [payment.equipment_booking_id]
      );
      if (eqRes.rows[0]) {
        payment.target_title = eqRes.rows[0].target_title;
        payment.target_subtitle = eqRes.rows[0].target_subtitle;
        payment.target_location = eqRes.rows[0].target_location;
        payment.target_image_url = eqRes.rows[0].target_image_url;
        payment.recipient_name = eqRes.rows[0].recipient_name;
        payment.recipient_phone = eqRes.rows[0].recipient_phone;
        payment.booking_status = eqRes.rows[0].booking_status;
      }
    } else if (payment.animal_order_id) {
      const anRes = await query<any>(
        `SELECT o.order_status as booking_status, o.payment_status as target_payment_status,
                a.name as target_title, a.breed as target_subtitle, a.location as target_location, a.image_url as target_image_url,
                u_seller.name as recipient_name, u_seller.phone as recipient_phone
         FROM animal_orders o
         JOIN animal_listings a ON o.listing_id = a.id
         JOIN users u_seller ON o.seller_id = u_seller.id
         WHERE o.id = $1`,
        [payment.animal_order_id]
      );
      if (anRes.rows[0]) {
        payment.target_title = anRes.rows[0].target_title;
        payment.target_subtitle = anRes.rows[0].target_subtitle;
        payment.target_location = anRes.rows[0].target_location;
        payment.target_image_url = anRes.rows[0].target_image_url;
        payment.recipient_name = anRes.rows[0].recipient_name;
        payment.recipient_phone = anRes.rows[0].recipient_phone;
        payment.booking_status = anRes.rows[0].booking_status;
      }
    } else if (payment.service_booking_id) {
      const srvRes = await query<any>(
        `SELECT sb.booking_status, sb.payment_status as target_payment_status, sb.service_type,
                sp.name as target_title, sp.skills as target_subtitle, sb.work_location as target_location, sp.profile_image_url as target_image_url,
                u_prov.name as recipient_name, u_prov.phone as recipient_phone
         FROM service_bookings sb
         JOIN service_profiles sp ON sb.service_profile_id = sp.id
         JOIN users u_prov ON sb.provider_id = u_prov.id
         WHERE sb.id = $1`,
        [payment.service_booking_id]
      );
      if (srvRes.rows[0]) {
        payment.target_title = srvRes.rows[0].target_title;
        payment.target_subtitle = `${srvRes.rows[0].service_type === 'DRIVER' ? 'Agricultural Driver' : 'Farm Worker'} • ${srvRes.rows[0].target_subtitle}`;
        payment.target_location = srvRes.rows[0].target_location;
        payment.target_image_url = srvRes.rows[0].target_image_url;
        payment.recipient_name = srvRes.rows[0].recipient_name;
        payment.recipient_phone = srvRes.rows[0].recipient_phone;
        payment.booking_status = srvRes.rows[0].booking_status;
      }
    }

    return payment;
  }

  /**
   * Update razorpay_order_id and set status to PROCESSING.
   */
  static async updateRazorpayOrder(paymentId: string, razorpayOrderId: string): Promise<Payment | null> {
    await query(
      `UPDATE payments
       SET razorpay_order_id = $1, payment_status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [razorpayOrderId, paymentId]
    );
    return this.findById(paymentId);
  }

  /**
   * Transition payment to PAID and atomically update the underlying business entity's payment_status.
   * Strict Rule: Does NOT alter booking_status (e.g. COMPLETED) or order_status (e.g. DELIVERED).
   */
  static async markPaid(
    paymentId: string,
    method: PaymentMethod = 'RAZORPAY',
    razorpayPaymentId?: string,
    razorpaySignature?: string,
    upiTxId?: string
  ): Promise<Payment> {
    return withTransaction(async (tx) => {
      // 1. Fetch and lock payment record
      const pRes = await tx.query<Payment>(
        `SELECT * FROM payments WHERE id = $1 FOR UPDATE`,
        [paymentId]
      );
      const payment = pRes.rows[0];
      if (!payment) {
        const err = new Error('Payment not found');
        (err as any).statusCode = 404;
        throw err;
      }

      // If already paid, return without duplicating side-effects
      if (payment.payment_status === 'PAID') {
        return payment;
      }

      // 2. Update payment record
      const updatePaymentSql = `
        UPDATE payments
        SET payment_status = 'PAID',
            payment_method = $1,
            razorpay_payment_id = COALESCE($2, razorpay_payment_id),
            razorpay_signature = COALESCE($3, razorpay_signature),
            upi_transaction_id = COALESCE($4, upi_transaction_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      await tx.query(updatePaymentSql, [
        method,
        razorpayPaymentId || null,
        razorpaySignature || null,
        upiTxId || null,
        paymentId,
      ]);

      // 3. Atomically update target booking/order payment_status
      if (payment.equipment_booking_id) {
        await tx.query(
          `UPDATE equipment_bookings
           SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.equipment_booking_id]
        );
      } else if (payment.animal_order_id) {
        await tx.query(
          `UPDATE animal_orders
           SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.animal_order_id]
        );
      } else if (payment.service_booking_id) {
        await tx.query(
          `UPDATE service_bookings
           SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.service_booking_id]
        );
      }

      const updated = await this.findById(paymentId);
      return updated!;
    });
  }

  /**
   * Mark as CASH_PENDING (Pay by Hand selected).
   */
  static async markCashPending(paymentId: string): Promise<Payment> {
    return withTransaction(async (tx) => {
      const pRes = await tx.query<Payment>(
        `SELECT * FROM payments WHERE id = $1 FOR UPDATE`,
        [paymentId]
      );
      const payment = pRes.rows[0];
      if (!payment) {
        const err = new Error('Payment not found');
        (err as any).statusCode = 404;
        throw err;
      }

      if (payment.payment_status === 'PAID') {
        const err = new Error('Cannot switch an already paid transaction to cash pending');
        (err as any).statusCode = 400;
        throw err;
      }

      await tx.query(
        `UPDATE payments
         SET payment_method = 'CASH',
             payment_status = 'CASH_PENDING',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [paymentId]
      );

      if (payment.equipment_booking_id) {
        await tx.query(
          `UPDATE equipment_bookings
           SET payment_status = 'CASH_PENDING', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.equipment_booking_id]
        );
      } else if (payment.animal_order_id) {
        await tx.query(
          `UPDATE animal_orders
           SET payment_status = 'CASH_ON_DELIVERY', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.animal_order_id]
        );
      } else if (payment.service_booking_id) {
        await tx.query(
          `UPDATE service_bookings
           SET payment_status = 'CASH_PENDING', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.service_booking_id]
        );
      }

      const updated = await this.findById(paymentId);
      return updated!;
    });
  }

  /**
   * Log a manual UPI reference while keeping status strictly PENDING per security rules.
   */
  static async markUpiPending(paymentId: string, upiTxId?: string): Promise<Payment> {
    await query(
      `UPDATE payments
       SET payment_method = 'UPI',
           payment_status = 'PENDING',
           upi_transaction_id = COALESCE($1, upi_transaction_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [upiTxId || null, paymentId]
    );
    const updated = await this.findById(paymentId);
    return updated!;
  }

  /**
   * Mark as FAILED.
   */
  static async markFailed(paymentId: string): Promise<Payment> {
    await query(
      `UPDATE payments
       SET payment_status = 'FAILED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [paymentId]
    );

    const payment = await this.findById(paymentId);
    if (payment) {
      if (payment.equipment_booking_id) {
        await query(
          `UPDATE equipment_bookings SET payment_status = 'FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [payment.equipment_booking_id]
        );
      } else if (payment.animal_order_id) {
        await query(
          `UPDATE animal_orders SET payment_status = 'FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [payment.animal_order_id]
        );
      } else if (payment.service_booking_id) {
        await query(
          `UPDATE service_bookings SET payment_status = 'FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [payment.service_booking_id]
        );
      }
    }

    return payment!;
  }

  /**
   * Reset a failed/pending transaction to permit a fresh payment retry.
   */
  static async resetForRetry(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      const err = new Error('Payment not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (payment.payment_status === 'PAID') {
      const err = new Error('This booking/order has already been paid and cannot be retried.');
      (err as any).statusCode = 400;
      throw err;
    }

    await query(
      `UPDATE payments
       SET payment_status = 'PENDING',
           razorpay_order_id = NULL,
           razorpay_payment_id = NULL,
           razorpay_signature = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [paymentId]
    );

    return (await this.findById(paymentId))!;
  }

  /**
   * Get all payments made by a farmer.
   */
  static async getPaymentsByFarmer(farmerId: string): Promise<Payment[]> {
    const res = await query<Payment>(
      `SELECT p.*,
              u.name as payer_name, u.email as payer_email, u.phone as payer_phone
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [farmerId]
    );

    const enriched = await Promise.all(res.rows.map((r) => this.enrichPaymentRow(r)));
    return enriched;
  }

  /**
   * Get all payments received by an owner across equipment, animals, and services.
   * Strictly filters so an owner only accesses their own business earnings!
   */
  static async getPaymentsByOwner(ownerId: string): Promise<{
    payments: Payment[];
    summary: OwnerPaymentSummary;
  }> {
    const sql = `
      SELECT DISTINCT p.*,
             u_payer.name as payer_name, u_payer.email as payer_email, u_payer.phone as payer_phone
      FROM payments p
      JOIN users u_payer ON p.user_id = u_payer.id
      LEFT JOIN equipment_bookings eb ON p.equipment_booking_id = eb.id
      LEFT JOIN animal_orders ao ON p.animal_order_id = ao.id
      LEFT JOIN service_bookings sb ON p.service_booking_id = sb.id
      WHERE eb.owner_id = $1
         OR ao.seller_id = $1
         OR sb.provider_id = $1
      ORDER BY p.created_at DESC
    `;

    const res = await query<Payment>(sql, [ownerId]);
    const payments = await Promise.all(res.rows.map((r) => this.enrichPaymentRow(r)));

    // Calculate revenue summary strictly from successfully PAID transactions
    let equipmentRevenue = 0;
    let animalSales = 0;
    let driverRevenue = 0;
    let workerRevenue = 0;

    for (const p of payments) {
      if (p.payment_status === 'PAID') {
        const amt = parseFloat(String(p.amount)) || 0;
        if (p.payment_type === 'EQUIPMENT') {
          equipmentRevenue += amt;
        } else if (p.payment_type === 'ANIMAL_ORDER') {
          animalSales += amt;
        } else if (p.payment_type === 'DRIVER') {
          driverRevenue += amt;
        } else if (p.payment_type === 'FARM_WORKER') {
          workerRevenue += amt;
        }
      }
    }

    const totalPaidAmount = equipmentRevenue + animalSales + driverRevenue + workerRevenue;

    return {
      payments,
      summary: {
        total_paid_amount: totalPaidAmount,
        equipment_revenue: equipmentRevenue,
        animal_sales: animalSales,
        driver_service_revenue: driverRevenue,
        worker_service_revenue: workerRevenue,
      },
    };
  }

  /**
   * Get all payments across the platform for Admin dashboard with statistics.
   */
  static async getAllPaymentsForAdmin(filters?: {
    payment_status?: string;
    payment_type?: string;
    payment_method?: string;
    search?: string;
  }): Promise<{
    payments: Payment[];
    stats: AdminPaymentStats;
  }> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters?.payment_status && filters.payment_status !== 'ALL') {
      params.push(filters.payment_status);
      conditions.push(`p.payment_status = $${params.length}`);
    }

    if (filters?.payment_type && filters.payment_type !== 'ALL') {
      params.push(filters.payment_type);
      conditions.push(`p.payment_type = $${params.length}`);
    }

    if (filters?.payment_method && filters.payment_method !== 'ALL') {
      params.push(filters.payment_method);
      conditions.push(`p.payment_method = $${params.length}`);
    }

    if (filters?.search && filters.search.trim()) {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      conditions.push(
        `(LOWER(p.payment_reference) LIKE $${params.length} OR LOWER(u.name) LIKE $${params.length} OR LOWER(u.phone) LIKE $${params.length})`
      );
    }

    const sql = `
      SELECT p.*,
             u.name as payer_name, u.email as payer_email, u.phone as payer_phone
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
    `;

    const res = await query<Payment>(sql, params);
    const payments = await Promise.all(res.rows.map((r) => this.enrichPaymentRow(r)));

    // Aggregate statistics across all platform payments
    const statsRes = await query<{
      total_count: string;
      paid_count: string;
      failed_count: string;
      pending_count: string;
      total_paid_sum: string;
    }>(`
      SELECT
        COUNT(*) as total_count,
        COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'FAILED' THEN 1 END) as failed_count,
        COUNT(CASE WHEN payment_status IN ('PENDING', 'PROCESSING', 'CASH_PENDING') THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN amount ELSE 0 END), 0) as total_paid_sum
      FROM payments
    `);

    const statsRow = statsRes.rows[0];
    const stats: AdminPaymentStats = {
      total_transactions: parseInt(statsRow?.total_count || '0', 10),
      successful_payments: parseInt(statsRow?.paid_count || '0', 10),
      failed_payments: parseInt(statsRow?.failed_count || '0', 10),
      pending_payments: parseInt(statsRow?.pending_count || '0', 10),
      total_successful_amount: parseFloat(statsRow?.total_paid_sum || '0'),
    };

    return { payments, stats };
  }
}
