import { Request, Response } from 'express';
import { ReportService, ReportFilter } from '../services/reportService.js';

export class ReportController {
  private static extractFilter(req: Request): ReportFilter {
    return {
      page: parseInt(req.query.page as string, 10) || 1,
      limit: parseInt(req.query.limit as string, 10) || 25,
      from: req.query.from as string,
      to: req.query.to as string,
      status: req.query.status as string,
      category: req.query.category as string,
      search: req.query.search as string,
      format: (req.query.format as string) === 'csv' ? 'csv' : 'json',
    };
  }

  private static handleOutput(res: Response, result: any, filename: string, filter: ReportFilter): void {
    if (filter.format === 'csv') {
      const csvData = result.csv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.status(200).send(csvData);
    } else {
      res.status(200).json({
        success: true,
        data: {
          title: result.title,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit) || 1,
          headers: result.headers,
          rows: result.rows,
        },
      });
    }
  }

  static async getUsersReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getUsersReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-users-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getUsersReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate users report', error: error.message });
    }
  }

  static async getEquipmentReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getEquipmentReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-equipment-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getEquipmentReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate equipment report', error: error.message });
    }
  }

  static async getBookingsReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getBookingsReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-bookings-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getBookingsReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate bookings report', error: error.message });
    }
  }

  static async getOrdersReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getOrdersReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-orders-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getOrdersReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate marketplace orders report', error: error.message });
    }
  }

  static async getPaymentsReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getPaymentsReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-payments-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getPaymentsReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate payments report', error: error.message });
    }
  }

  static async getDeliveriesReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getDeliveriesReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-deliveries-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getDeliveriesReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate deliveries report', error: error.message });
    }
  }

  static async getReviewsReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getReviewsReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-reviews-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getReviewsReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate reviews report', error: error.message });
    }
  }

  static async getAiReport(req: Request, res: Response): Promise<void> {
    try {
      const filter = ReportController.extractFilter(req);
      const result = await ReportService.getAiReport(filter);
      ReportController.handleOutput(res, result, 'agrorent-ai-telemetry-report', filter);
    } catch (error: any) {
      console.error('[ReportController.getAiReport] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate AI usage report', error: error.message });
    }
  }
}
