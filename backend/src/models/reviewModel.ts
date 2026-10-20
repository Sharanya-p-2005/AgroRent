import crypto from 'crypto';
import { query } from '../config/db.js';

export type ReviewTargetType = 'EQUIPMENT' | 'OWNER' | 'DRIVER' | 'FARM_WORKER' | 'ANIMAL_SELLER';
export type ReviewSourceType = 'EQUIPMENT_BOOKING' | 'ANIMAL_ORDER' | 'DRIVER_BOOKING' | 'WORKER_BOOKING';
export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'REPORTED';

export interface ReviewRecord {
  id: string;
  reviewer_id: string;
  target_type: ReviewTargetType;
  target_id: string;
  source_type: ReviewSourceType;
  source_id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
  target_name?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export class ReviewModel {
  /**
   * Verify whether a user is strictly eligible to review a given target for a source transaction
   */
  static async verifyEligibility(
    reviewerId: string,
    targetType: ReviewTargetType,
    targetId: string,
    sourceType: ReviewSourceType,
    sourceId: string
  ): Promise<{ eligible: boolean; message?: string }> {
    // 1. Check if user already reviewed this target for this source
    const existing = await query(
      `SELECT id FROM reviews WHERE reviewer_id = $1 AND source_type = $2 AND source_id = $3 AND target_type = $4`,
      [reviewerId, sourceType, sourceId, targetType]
    );
    if (existing.rows.length > 0) {
      return { eligible: false, message: 'You have already submitted a review for this transaction and target.' };
    }

    // 2. Validate transaction completion and ownership
    if (sourceType === 'EQUIPMENT_BOOKING') {
      const bRes = await query(
        `SELECT id, farmer_id, owner_id, equipment_id, booking_status FROM equipment_bookings WHERE id = $1`,
        [sourceId]
      );
      if (bRes.rows.length === 0) {
        return { eligible: false, message: 'Referenced equipment booking does not exist.' };
      }
      const booking = bRes.rows[0];
      if (booking.farmer_id !== reviewerId) {
        return { eligible: false, message: 'Only the farmer who booked this equipment can leave a review.' };
      }
      if (booking.booking_status !== 'COMPLETED') {
        return {
          eligible: false,
          message: `Reviews can only be submitted after the rental is COMPLETED (current status: ${booking.booking_status}).`,
        };
      }
      if (targetType === 'EQUIPMENT' && booking.equipment_id !== targetId) {
        return { eligible: false, message: 'The equipment specified does not match this booking.' };
      }
      if (targetType === 'OWNER' && booking.owner_id !== targetId) {
        return { eligible: false, message: 'The owner specified does not match this booking.' };
      }
      return { eligible: true };
    }

    if (sourceType === 'ANIMAL_ORDER') {
      const oRes = await query(
        `SELECT id, buyer_id, seller_id, order_status FROM animal_orders WHERE id = $1`,
        [sourceId]
      );
      if (oRes.rows.length === 0) {
        return { eligible: false, message: 'Referenced animal order does not exist.' };
      }
      const order = oRes.rows[0];
      if (order.buyer_id !== reviewerId) {
        return { eligible: false, message: 'Only the buyer of this animal order can submit a review.' };
      }
      if (order.order_status !== 'DELIVERED') {
        return {
          eligible: false,
          message: `Reviews can only be submitted after the animal order has been DELIVERED (current status: ${order.order_status}).`,
        };
      }
      if (targetType === 'ANIMAL_SELLER' && order.seller_id !== targetId) {
        return { eligible: false, message: 'The seller specified does not match this order.' };
      }
      return { eligible: true };
    }

    if (sourceType === 'DRIVER_BOOKING' || sourceType === 'WORKER_BOOKING') {
      const sRes = await query(
        `SELECT sb.id, sb.farmer_id, sb.provider_id, sb.service_profile_id, sb.booking_status, sp.service_type
         FROM service_bookings sb
         JOIN service_profiles sp ON sb.service_profile_id = sp.id
         WHERE sb.id = $1`,
        [sourceId]
      );
      if (sRes.rows.length === 0) {
        return { eligible: false, message: 'Referenced service booking does not exist.' };
      }
      const booking = sRes.rows[0];
      if (booking.farmer_id !== reviewerId) {
        return { eligible: false, message: 'Only the farmer who booked this service can submit a review.' };
      }
      if (booking.booking_status !== 'COMPLETED') {
        return {
          eligible: false,
          message: `Reviews can only be submitted after the service is COMPLETED (current status: ${booking.booking_status}).`,
        };
      }
      const expectedType = sourceType === 'DRIVER_BOOKING' ? 'DRIVER' : 'FARM_WORKER';
      if (booking.service_type !== expectedType || targetType !== expectedType) {
        return { eligible: false, message: 'Service type mismatch for review.' };
      }
      if (booking.service_profile_id !== targetId && booking.provider_id !== targetId) {
        return { eligible: false, message: 'The service provider specified does not match this booking.' };
      }
      return { eligible: true };
    }

    return { eligible: false, message: 'Invalid source type specified.' };
  }

  /**
   * Create a new review
   */
  static async createReview(params: {
    reviewerId: string;
    targetType: ReviewTargetType;
    targetId: string;
    sourceType: ReviewSourceType;
    sourceId: string;
    rating: number;
    comment?: string;
  }): Promise<ReviewRecord> {
    const id = crypto.randomUUID();
    const cleanComment = params.comment ? params.comment.trim() : null;

    const res = await query(
      `INSERT INTO reviews (
        id, reviewer_id, target_type, target_id, source_type, source_id, rating, comment, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        id,
        params.reviewerId,
        params.targetType,
        params.targetId,
        params.sourceType,
        params.sourceId,
        params.rating,
        cleanComment,
      ]
    );

    return res.rows[0];
  }

  /**
   * Find single review by ID
   */
  static async findById(id: string): Promise<ReviewRecord | null> {
    const res = await query(
      `SELECT r.*, u.name as reviewer_name 
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Update review (by reviewer)
   */
  static async updateReview(
    id: string,
    reviewerId: string,
    rating: number,
    comment?: string
  ): Promise<ReviewRecord | null> {
    const cleanComment = comment ? comment.trim() : null;
    const res = await query(
      `UPDATE reviews 
       SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND reviewer_id = $4
       RETURNING *`,
      [rating, cleanComment, id, reviewerId]
    );
    return res.rows[0] || null;
  }

  /**
   * Delete review (by reviewer)
   */
  static async deleteReview(id: string, reviewerId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2 RETURNING id`,
      [id, reviewerId]
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Get public reviews for a target entity with rating summary
   */
  static async getReviewsForTarget(
    targetType: ReviewTargetType,
    targetId: string
  ): Promise<{ reviews: ReviewRecord[]; summary: ReviewSummary }> {
    const res = await query(
      `SELECT r.id, r.reviewer_id, r.target_type, r.target_id, r.source_type, r.source_id,
              r.rating, r.comment, r.status, r.created_at, r.updated_at,
              u.name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.target_type = $1 AND r.target_id = $2 AND r.status = 'PUBLISHED'
       ORDER BY r.created_at DESC`,
      [targetType, targetId]
    );

    const reviews = res.rows;
    const totalReviews = reviews.length;
    let sum = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const r of reviews) {
      sum += r.rating;
      const rateKey = r.rating as 1 | 2 | 3 | 4 | 5;
      if (distribution[rateKey] !== undefined) {
        distribution[rateKey]++;
      }
    }

    const averageRating = totalReviews > 0 ? parseFloat((sum / totalReviews).toFixed(1)) : 0;

    return {
      reviews,
      summary: {
        averageRating,
        totalReviews,
        ratingDistribution: distribution,
      },
    };
  }

  /**
   * Get eligible transactions for a farmer that have not yet been reviewed
   */
  static async getEligibleTransactionsForFarmer(farmerId: string): Promise<any[]> {
    const eligibleList: any[] = [];

    // 1. Completed equipment bookings
    const eqBookings = await query(
      `SELECT b.id as source_id, b.equipment_id, b.owner_id, b.booking_date, b.total_amount,
              e.name as equipment_name, e.image_url as equipment_image,
              u.name as owner_name
       FROM equipment_bookings b
       JOIN equipment e ON b.equipment_id = e.id
       JOIN users u ON b.owner_id = u.id
       WHERE b.farmer_id = $1 AND b.booking_status = 'COMPLETED'`,
      [farmerId]
    );

    for (const b of eqBookings.rows) {
      // Check if equipment already reviewed
      const eqRev = await query(
        `SELECT id, rating FROM reviews WHERE reviewer_id = $1 AND source_type = 'EQUIPMENT_BOOKING' AND source_id = $2 AND target_type = 'EQUIPMENT'`,
        [farmerId, b.source_id]
      );
      if (eqRev.rows.length === 0) {
        eligibleList.push({
          source_type: 'EQUIPMENT_BOOKING',
          source_id: b.source_id,
          target_type: 'EQUIPMENT',
          target_id: b.equipment_id,
          title: `Rent: ${b.equipment_name}`,
          target_name: b.equipment_name,
          subtitle: `Booked on ${b.booking_date} (₹${b.total_amount})`,
          image_url: b.equipment_image,
          party_name: b.owner_name,
          date: b.booking_date,
        });
      }

      // Check if owner already reviewed
      const ownerRev = await query(
        `SELECT id, rating FROM reviews WHERE reviewer_id = $1 AND source_type = 'EQUIPMENT_BOOKING' AND source_id = $2 AND target_type = 'OWNER'`,
        [farmerId, b.source_id]
      );
      if (ownerRev.rows.length === 0) {
        eligibleList.push({
          source_type: 'EQUIPMENT_BOOKING',
          source_id: b.source_id,
          target_type: 'OWNER',
          target_id: b.owner_id,
          title: `Owner: ${b.owner_name}`,
          target_name: b.owner_name,
          subtitle: `Equipment rental fulfilled on ${b.booking_date}`,
          image_url: b.equipment_image,
          party_name: b.owner_name,
          date: b.booking_date,
        });
      }
    }

    // 2. Delivered animal orders
    const animalOrders = await query(
      `SELECT o.id as source_id, o.seller_id, o.listing_id, o.quantity, o.total_amount, o.created_at,
              a.name as animal_name, a.image_url as animal_image,
              u.name as seller_name
       FROM animal_orders o
       JOIN animal_listings a ON o.listing_id = a.id
       JOIN users u ON o.seller_id = u.id
       WHERE o.buyer_id = $1 AND o.order_status = 'DELIVERED'`,
      [farmerId]
    );

    for (const o of animalOrders.rows) {
      const sellerRev = await query(
        `SELECT id, rating FROM reviews WHERE reviewer_id = $1 AND source_type = 'ANIMAL_ORDER' AND source_id = $2 AND target_type = 'ANIMAL_SELLER'`,
        [farmerId, o.source_id]
      );
      if (sellerRev.rows.length === 0) {
        eligibleList.push({
          source_type: 'ANIMAL_ORDER',
          source_id: o.source_id,
          target_type: 'ANIMAL_SELLER',
          target_id: o.seller_id,
          title: `Animal Seller: ${o.seller_name}`,
          target_name: o.seller_name,
          subtitle: `Order for ${o.quantity}x ${o.animal_name} (₹${o.total_amount})`,
          image_url: o.animal_image,
          party_name: o.seller_name,
          date: new Date(o.created_at).toISOString().split('T')[0],
        });
      }
    }

    // 3. Completed service bookings (Driver & Farm Worker)
    const serviceBookings = await query(
      `SELECT sb.id as source_id, sb.service_profile_id, sb.provider_id, sb.booking_date, sb.total_amount,
              sp.name as provider_name, sp.service_type, sp.profile_image_url
       FROM service_bookings sb
       JOIN service_profiles sp ON sb.service_profile_id = sp.id
       WHERE sb.farmer_id = $1 AND sb.booking_status = 'COMPLETED'`,
      [farmerId]
    );

    for (const sb of serviceBookings.rows) {
      const sType = sb.service_type === 'DRIVER' ? 'DRIVER' : 'FARM_WORKER';
      const sSource = sb.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING';

      const sRev = await query(
        `SELECT id, rating FROM reviews WHERE reviewer_id = $1 AND source_type = $2 AND source_id = $3 AND target_type = $4`,
        [farmerId, sSource, sb.source_id, sType]
      );

      if (sRev.rows.length === 0) {
        eligibleList.push({
          source_type: sSource,
          source_id: sb.source_id,
          target_type: sType,
          target_id: sb.service_profile_id,
          title: `${sb.service_type === 'DRIVER' ? 'Driver' : 'Farm Worker'}: ${sb.provider_name}`,
          target_name: sb.provider_name,
          subtitle: `Service completed on ${sb.booking_date} (₹${sb.total_amount})`,
          image_url: sb.profile_image_url,
          party_name: sb.provider_name,
          date: sb.booking_date,
        });
      }
    }

    return eligibleList;
  }

  /**
   * Admin: Get all reviews with filters, search, and pagination
   */
  static async getAllForAdmin(options: {
    page?: number;
    limit?: number;
    targetType?: string;
    status?: string;
    rating?: number;
    search?: string;
  } = {}): Promise<{ reviews: any[]; total: number }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (options.targetType && options.targetType !== 'ALL') {
      queryParams.push(options.targetType);
      whereConditions.push(`r.target_type = $${queryParams.length}`);
    }

    if (options.status && options.status !== 'ALL') {
      queryParams.push(options.status);
      whereConditions.push(`r.status = $${queryParams.length}`);
    }

    if (options.rating && options.rating > 0) {
      queryParams.push(options.rating);
      whereConditions.push(`r.rating = $${queryParams.length}`);
    }

    if (options.search && options.search.trim()) {
      queryParams.push(`%${options.search.trim()}%`);
      whereConditions.push(
        `(r.comment ILIKE $${queryParams.length} OR u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length})`
      );
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      ${whereClause}
    `;
    const countRes = await query(countSql, queryParams);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const fetchSql = `
      SELECT r.*, u.name as reviewer_name, u.email as reviewer_email
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const fetchParams = [...queryParams, limit, offset];
    const fetchRes = await query(fetchSql, fetchParams);

    return {
      reviews: fetchRes.rows,
      total,
    };
  }

  /**
   * Admin: Update review moderation status (PUBLISHED, HIDDEN, REPORTED)
   */
  static async updateStatusByAdmin(id: string, status: ReviewStatus): Promise<ReviewRecord | null> {
    const res = await query(
      `UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return res.rows[0] || null;
  }

  /**
   * Admin: Delete review permanently
   */
  static async deleteByAdmin(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [id]);
    return (res.rowCount || 0) > 0;
  }

  /**
   * Admin: Statistics for reviews
   */
  static async getAdminStats(): Promise<{
    total: number;
    published: number;
    hidden: number;
    reported: number;
    averagePlatformRating: number;
  }> {
    const res = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'HIDDEN' THEN 1 END) as hidden,
        COUNT(CASE WHEN status = 'REPORTED' THEN 1 END) as reported,
        COALESCE(AVG(CASE WHEN status = 'PUBLISHED' THEN rating END), 0) as avg_rating
      FROM reviews
    `);

    return {
      total: parseInt(res.rows[0]?.total || '0', 10),
      published: parseInt(res.rows[0]?.published || '0', 10),
      hidden: parseInt(res.rows[0]?.hidden || '0', 10),
      reported: parseInt(res.rows[0]?.reported || '0', 10),
      averagePlatformRating: parseFloat(Number(res.rows[0]?.avg_rating || 0).toFixed(1)),
    };
  }
}
