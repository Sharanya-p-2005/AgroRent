import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  ReviewModel,
  ReviewTargetType,
  ReviewSourceType,
  ReviewStatus,
} from '../models/reviewModel.js';
import { NotificationService } from '../services/notificationService.js';
import { query } from '../config/db.js';

export class ReviewController {
  /**
   * POST /api/reviews
   * Submit a new rating and review with strict backend verification
   */
  static async createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reviewerId = req.user!.id;
      const { target_type, target_id, source_type, source_id, rating, comment } = req.body;

      // 1. Basic validation
      if (!target_type || !target_id || !source_type || !source_id) {
        res.status(400).json({
          success: false,
          message: 'target_type, target_id, source_type, and source_id are all required.',
        });
        return;
      }

      const parsedRating = parseInt(String(rating), 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5 stars.',
        });
        return;
      }

      const validTargetTypes: ReviewTargetType[] = [
        'EQUIPMENT',
        'OWNER',
        'DRIVER',
        'FARM_WORKER',
        'ANIMAL_SELLER',
      ];
      if (!validTargetTypes.includes(target_type)) {
        res.status(400).json({
          success: false,
          message: `Invalid target_type. Must be one of: ${validTargetTypes.join(', ')}`,
        });
        return;
      }

      const validSourceTypes: ReviewSourceType[] = [
        'EQUIPMENT_BOOKING',
        'ANIMAL_ORDER',
        'DRIVER_BOOKING',
        'WORKER_BOOKING',
      ];
      if (!validSourceTypes.includes(source_type)) {
        res.status(400).json({
          success: false,
          message: `Invalid source_type. Must be one of: ${validSourceTypes.join(', ')}`,
        });
        return;
      }

      // 2. Strict eligibility & completed transaction verification on backend
      const eligibility = await ReviewModel.verifyEligibility(
        reviewerId,
        target_type,
        target_id,
        source_type,
        source_id
      );

      if (!eligibility.eligible) {
        res.status(403).json({
          success: false,
          message: eligibility.message || 'You are not eligible to review this item.',
        });
        return;
      }

      // 3. Create review
      const review = await ReviewModel.createReview({
        reviewerId,
        targetType: target_type,
        targetId: target_id,
        sourceType: source_type,
        sourceId: source_id,
        rating: parsedRating,
        comment,
      });

      // 4. Send notification to the provider or owner who was reviewed
      try {
        let recipientUserId: string | null = null;
        let reviewedSubject = 'your listing/service';

        if (target_type === 'EQUIPMENT') {
          const eqRes = await query(`SELECT owner_id, name FROM equipment WHERE id = $1`, [target_id]);
          if (eqRes.rows.length > 0) {
            recipientUserId = eqRes.rows[0].owner_id;
            reviewedSubject = `equipment "${eqRes.rows[0].name}"`;
          }
        } else if (target_type === 'OWNER') {
          recipientUserId = target_id;
          reviewedSubject = 'your owner profile';
        } else if (target_type === 'ANIMAL_SELLER') {
          recipientUserId = target_id;
          reviewedSubject = 'your animal seller profile';
        } else if (target_type === 'DRIVER' || target_type === 'FARM_WORKER') {
          const spRes = await query(`SELECT user_id, name FROM service_profiles WHERE id = $1`, [target_id]);
          if (spRes.rows.length > 0) {
            recipientUserId = spRes.rows[0].user_id;
            reviewedSubject = `your ${target_type === 'DRIVER' ? 'driver' : 'farm worker'} service`;
          }
        }

        if (recipientUserId) {
          await NotificationService.sendNotification({
            userId: recipientUserId,
            title: 'New Rating & Review Received',
            message: `A farmer submitted a ${parsedRating}-star review on ${reviewedSubject}${
              comment ? `: "${comment.substring(0, 80)}..."` : '.'
            }`,
            notificationType: 'SYSTEM',
            referenceType: 'NONE',
          });
        }
      } catch (notifErr: any) {
        console.warn('[ReviewController] Error notifying review recipient:', notifErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully!',
        data: review,
      });
    } catch (error: any) {
      console.error('[ReviewController.createReview] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit review',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reviews/:targetType/:targetId
   * Public: Get published reviews and aggregated rating summary for an item or provider
   */
  static async getReviewsForTarget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { targetType, targetId } = req.params;

      const validTargetTypes: ReviewTargetType[] = [
        'EQUIPMENT',
        'OWNER',
        'DRIVER',
        'FARM_WORKER',
        'ANIMAL_SELLER',
      ];
      if (!validTargetTypes.includes(targetType as ReviewTargetType)) {
        res.status(400).json({
          success: false,
          message: `Invalid targetType. Must be one of: ${validTargetTypes.join(', ')}`,
        });
        return;
      }

      const result = await ReviewModel.getReviewsForTarget(
        targetType as ReviewTargetType,
        targetId
      );

      res.status(200).json({
        success: true,
        data: result.reviews,
        summary: result.summary,
      });
    } catch (error: any) {
      console.error('[ReviewController.getReviewsForTarget] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reviews',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/reviews/:id
   * Reviewer updates their own submitted review
   */
  static async updateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reviewerId = req.user!.id;
      const { id } = req.params;
      const { rating, comment } = req.body;

      const parsedRating = parseInt(String(rating), 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5.',
        });
        return;
      }

      const updated = await ReviewModel.updateReview(id, reviewerId, parsedRating, comment);
      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Review not found or unauthorized to edit.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('[ReviewController.updateReview] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/reviews/:id
   * Reviewer deletes their own submitted review
   */
  static async deleteReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reviewerId = req.user!.id;
      const { id } = req.params;

      const deleted = await ReviewModel.deleteReview(id, reviewerId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Review not found or unauthorized to delete.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error: any) {
      console.error('[ReviewController.deleteReview] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reviews/eligible
   * Authenticated Farmer gets completed transactions eligible for rating & review
   */
  static async getEligibleReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const farmerId = req.user!.id;
      const eligible = await ReviewModel.getEligibleTransactionsForFarmer(farmerId);

      res.status(200).json({
        success: true,
        count: eligible.length,
        data: eligible,
      });
    } catch (error: any) {
      console.error('[ReviewController.getEligibleReviews] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve eligible review items',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/reviews
   * Admin: view all reviews with filters, pagination and moderation statuses
   */
  static async adminGetAllReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, targetType, status, rating, search } = req.query;

      const result = await ReviewModel.getAllForAdmin({
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
        targetType: targetType ? String(targetType) : undefined,
        status: status ? String(status) : undefined,
        rating: rating ? parseInt(String(rating), 10) : undefined,
        search: search ? String(search) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.reviews,
        total: result.total,
      });
    } catch (error: any) {
      console.error('[ReviewController.adminGetAllReviews] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reviews for admin',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/admin/reviews/:id/status
   * Admin updates review status: PUBLISHED, HIDDEN, REPORTED
   */
  static async adminUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses: ReviewStatus[] = ['PUBLISHED', 'HIDDEN', 'REPORTED'];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Status must be one of: ${allowedStatuses.join(', ')}`,
        });
        return;
      }

      const updated = await ReviewModel.updateStatusByAdmin(id, status);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Review not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Review status updated to ${status}`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[ReviewController.adminUpdateStatus] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review status',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/admin/reviews/:id
   * Admin permanently deletes inappropriate review
   */
  static async adminDeleteReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ReviewModel.deleteByAdmin(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Review not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Review permanently deleted by admin',
      });
    } catch (error: any) {
      console.error('[ReviewController.adminDeleteReview] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/reviews/stats
   * Admin review summary statistics
   */
  static async adminGetStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await ReviewModel.getAdminStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[ReviewController.adminGetStats] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve review statistics',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/reviews/:id/helpful
   * Increment helpful count
   */
  static async markHelpful(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await query(
        'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Review not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Marked review as helpful', data: result.rows[0] });
    } catch (error: any) {
      console.error('[ReviewController.markHelpful] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update review' });
    }
  }

  /**
   * POST /api/reviews/:id/report
   * Report review for moderator review
   */
  static async reportReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason = 'Inappropriate or misleading content' } = req.body;
      const result = await query(
        `UPDATE reviews SET status = 'REPORTED', report_reason = $1, reported_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [reason, id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Review not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Review reported for administrative review', data: result.rows[0] });
    } catch (error: any) {
      console.error('[ReviewController.reportReview] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to report review' });
    }
  }

  /**
   * GET /api/reviews/breakdown
   * Rating distribution breakdown
   */
  static async getBreakdown(req: any, res: Response): Promise<void> {
    try {
      const targetType = req.query.target_type || req.params.targetType;
      const targetId = req.query.target_id || req.params.targetId;

      if (!targetType || !targetId) {
        res.status(400).json({ success: false, message: 'target_type and target_id are required' });
        return;
      }

      const rowsRes = await query(
        `SELECT rating, COUNT(*) as count FROM reviews WHERE target_type = $1 AND target_id = $2 AND status = 'PUBLISHED' GROUP BY rating`,
        [targetType, targetId]
      );

      const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let total = 0;
      let sum = 0;

      rowsRes.rows.forEach((r: any) => {
        const rating = parseInt(r.rating, 10);
        const count = parseInt(r.count, 10);
        counts[rating] = count;
        total += count;
        sum += rating * count;
      });

      const average = total > 0 ? parseFloat((sum / total).toFixed(1)) : 0;
      const breakdown = [5, 4, 3, 2, 1].map((star) => ({
        stars: star,
        count: counts[star] || 0,
        percentage: total > 0 ? Math.round(((counts[star] || 0) / total) * 100) : 0,
      }));

      res.status(200).json({
        success: true,
        data: {
          target_type: targetType,
          target_id: targetId,
          total_reviews: total,
          average_rating: average,
          breakdown,
        },
      });
    } catch (error: any) {
      console.error('[ReviewController.getBreakdown] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to calculate rating breakdown' });
    }
  }
}
