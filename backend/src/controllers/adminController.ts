import { Request, Response } from 'express';
import { UserModel } from '../models/userModel.js';
import { BookingModel } from '../models/bookingModel.js';
import { AnimalListingModel } from '../models/animalListingModel.js';
import { AnimalOrderModel } from '../models/animalOrderModel.js';
import { SchemeModel } from '../models/schemeModel.js';
import { ResourceModel } from '../models/resourceModel.js';
import { NotificationModel } from '../models/notificationModel.js';
import { ReviewModel } from '../models/reviewModel.js';

export class AdminController {
  /**
   * GET /api/admin/dashboard/stats
   * Retrieves live platform metrics for admin dashboard.
   * Access: ADMIN only (enforced by middleware)
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userStats = await UserModel.getStats();
      const adminStats = await BookingModel.getAdminStats();
      const animalStats = await AnimalListingModel.getAdminStats();
      const animalOrderStats = await AnimalOrderModel.getAdminOrderStats();
      const schemeStats = await SchemeModel.getStats();
      const resourceStats = await ResourceModel.getStats();
      const notificationStats = await NotificationModel.getStats();
      const reviewStats = await ReviewModel.getAdminStats();

      res.status(200).json({
        success: true,
        data: {
          ...userStats,
          ...adminStats,
          animals: animalStats.totalListings,
          totalAnimalListings: animalStats.totalListings,
          pendingAnimals: animalStats.pendingListings,
          approvedAnimals: animalStats.approvedListings,
          rejectedAnimals: animalStats.rejectedListings,
          disabledAnimals: animalStats.disabledListings,
          orders: animalOrderStats.totalOrders,
          totalAnimalOrders: animalOrderStats.totalOrders,
          placedAnimalOrders: animalOrderStats.placedOrders,
          deliveredAnimalOrders: animalOrderStats.deliveredOrders,
          animalTurnover: animalOrderStats.totalTurnover,
          revenue: (adminStats.revenue || 0) + (animalOrderStats.totalTurnover || 0),
          // Phase 7: Government Schemes & Farmer Resources stats
          totalSchemes: schemeStats.total_schemes,
          publishedSchemes: schemeStats.published_schemes,
          draftSchemes: schemeStats.draft_schemes,
          featuredSchemes: schemeStats.featured_schemes,
          totalResources: resourceStats.total_resources,
          publishedResources: resourceStats.published_resources,
          // Phase 8: Notifications & Reviews stats
          totalNotifications: notificationStats.total,
          unreadNotifications: notificationStats.unread,
          totalReviews: reviewStats.total,
          publishedReviews: reviewStats.published,
          hiddenReviews: reviewStats.hidden,
          reportedReviews: reviewStats.reported,
          averagePlatformRating: reviewStats.averagePlatformRating,
        },
      });
    } catch (error: any) {
      console.error('[AdminController.getDashboardStats] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve administrative statistics',
        error: error.message,
      });
    }
  }
}

