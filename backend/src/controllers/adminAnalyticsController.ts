import { Request, Response } from 'express';
import { AnalyticsService, DateFilter } from '../services/analyticsService.js';

export class AdminAnalyticsController {
  private static extractFilter(req: Request): DateFilter {
    return {
      period: (req.query.period as string) || 'last_30_days',
      from: req.query.from as string,
      to: req.query.to as string,
    };
  }

  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getOverview(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getOverview] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve platform overview analytics', error: error.message });
    }
  }

  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getUsersAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getUsers] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve user analytics', error: error.message });
    }
  }

  static async getEquipment(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getEquipmentAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getEquipment] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve equipment analytics', error: error.message });
    }
  }

  static async getBookings(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getBookingAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getBookings] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve booking analytics', error: error.message });
    }
  }

  static async getAnimals(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getAnimalAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getAnimals] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve animal marketplace analytics', error: error.message });
    }
  }

  static async getServices(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getServiceAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getServices] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve service analytics', error: error.message });
    }
  }

  static async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getPaymentAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getPayments] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve payment analytics', error: error.message });
    }
  }

  static async getRevenue(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getRevenueAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getRevenue] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve revenue analytics', error: error.message });
    }
  }

  static async getDeliveries(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getDeliveryAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getDeliveries] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve delivery analytics', error: error.message });
    }
  }

  static async getAi(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getAiAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getAi] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve AI telemetry analytics', error: error.message });
    }
  }

  static async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getReviewAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getReviews] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve review analytics', error: error.message });
    }
  }

  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const filter = AdminAnalyticsController.extractFilter(req);
      const data = await AnalyticsService.getNotificationAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[AdminAnalyticsController.getNotifications] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve notification analytics', error: error.message });
    }
  }
}
