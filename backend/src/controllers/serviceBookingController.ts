import { Request, Response, NextFunction } from 'express';
import { ServiceBookingModel } from '../models/serviceBookingModel.js';
import { ServiceType } from '../models/serviceProfileModel.js';
import { PaymentService } from '../services/paymentService.js';
import { NotificationService } from '../services/notificationService.js';

export class ServiceBookingController {
  /**
   * Farmer: Create booking for a driver or farm worker
   * POST /api/service-bookings
   */
  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = (req as any).user.id;
      const {
        service_profile_id,
        booking_date,
        start_time,
        end_time,
        duration_hours,
        is_daily_booking,
        number_of_days,
        work_location,
        work_description,
      } = req.body;

      // 1. Validation: service_profile_id
      if (!service_profile_id || typeof service_profile_id !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Service profile ID is required',
        });
      }

      // 2. Validation: booking_date
      if (!booking_date || !/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
        return res.status(400).json({
          success: false,
          message: 'Valid booking date in YYYY-MM-DD format is required',
        });
      }

      // Prevent past dates
      const todayStr = new Date().toISOString().split('T')[0];
      if (booking_date < todayStr) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book for a past date',
        });
      }

      // 3. Validation: start_time and end_time (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
      if (!start_time || !timeRegex.test(start_time)) {
        return res.status(400).json({
          success: false,
          message: 'Valid start time in HH:MM format is required',
        });
      }

      if (!end_time || !timeRegex.test(end_time)) {
        return res.status(400).json({
          success: false,
          message: 'Valid end time in HH:MM format is required',
        });
      }

      const cleanStart = start_time.substring(0, 5);
      const cleanEnd = end_time.substring(0, 5);

      if (cleanStart === cleanEnd) {
        return res.status(400).json({
          success: false,
          message: 'Start time and end time cannot be identical',
        });
      }

      if (cleanEnd <= cleanStart) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time',
        });
      }

      // 4. Validation: work_location
      if (!work_location || typeof work_location !== 'string' || work_location.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Work location is required',
        });
      }

      // 5. Create booking via transaction
      const booking = await ServiceBookingModel.create({
        service_profile_id,
        farmer_id: farmerId,
        booking_date,
        start_time: cleanStart,
        end_time: cleanEnd,
        duration_hours: duration_hours ? parseFloat(String(duration_hours)) : undefined,
        is_daily_booking: Boolean(is_daily_booking),
        number_of_days: number_of_days ? parseInt(String(number_of_days), 10) : 1,
        work_location: work_location.trim(),
        work_description: work_description ? String(work_description).trim() : undefined,
      });

      // Automatically initialize internal payment record for this service booking
      const paymentType = booking.service_type === 'DRIVER' ? 'DRIVER' : 'FARM_WORKER';
      const payment = await PaymentService.getOrCreatePaymentForTarget(
        farmerId,
        paymentType,
        booking.id
      );

      // Notify service provider of new booking request
      NotificationService.onServiceBookingCreated({
        id: booking.id,
        provider_id: booking.provider_id,
        service_type: booking.service_type,
        booking_date: booking.booking_date,
        duration_hours: booking.duration_hours,
        total_amount: booking.total_amount,
      });

      res.status(201).json({
        success: true,
        message: 'Booking placed successfully! You may now proceed to payment.',
        data: {
          ...booking,
          payment_reference: payment.payment_reference,
        },
        payment,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  /**
   * Farmer: Get all own bookings
   * GET /api/farmer/service-bookings
   */
  static async getFarmerBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = (req as any).user.id;
      const bookings = await ServiceBookingModel.findByFarmerId(farmerId);
      res.json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Farmer: Get single booking details
   * GET /api/farmer/service-bookings/:id
   */
  static async getFarmerBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = (req as any).user.id;
      const { id } = req.params;
      const booking = await ServiceBookingModel.findFarmerBookingById(id, farmerId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or access denied',
        });
      }

      res.json({
        success: true,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Farmer: Cancel booking (PENDING or CONFIRMED only)
   * PUT /api/farmer/service-bookings/:id/cancel
   */
  static async cancelFarmerBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = (req as any).user.id;
      const { id } = req.params;

      const updated = await ServiceBookingModel.cancelByFarmer(id, farmerId);

      NotificationService.onServiceBookingStatusChanged(
        {
          id: updated.id,
          farmer_id: updated.farmer_id,
          provider_id: updated.provider_id,
          service_type: updated.service_type,
          booking_date: updated.booking_date,
        },
        'CANCELLED',
        (updated as any).provider_name
      );

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: updated,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  /**
   * Owner: Get bookings for own services
   * GET /api/owner/service-bookings
   */
  static async getOwnerBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.id;
      const { type, service_type } = req.query;
      const filterType = (type || service_type) as ServiceType | undefined;

      const bookings = await ServiceBookingModel.findByProviderId(providerId, filterType);
      res.json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Owner: Accept/Confirm booking (PENDING -> CONFIRMED)
   * PUT /api/owner/service-bookings/:id/confirm
   */
  static async confirmBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.id;
      const { id } = req.params;

      const updated = await ServiceBookingModel.updateStatusByProvider(id, providerId, 'CONFIRMED');

      NotificationService.onServiceBookingStatusChanged(
        {
          id: updated.id,
          farmer_id: updated.farmer_id,
          provider_id: updated.provider_id,
          service_type: updated.service_type,
          booking_date: updated.booking_date,
        },
        'CONFIRMED',
        (updated as any).provider_name
      );

      res.json({
        success: true,
        message: 'Booking accepted and confirmed',
        data: updated,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  /**
   * Owner: Reject booking (PENDING -> REJECTED)
   * PUT /api/owner/service-bookings/:id/reject
   */
  static async rejectBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.id;
      const { id } = req.params;

      const updated = await ServiceBookingModel.updateStatusByProvider(id, providerId, 'REJECTED');

      NotificationService.onServiceBookingStatusChanged(
        {
          id: updated.id,
          farmer_id: updated.farmer_id,
          provider_id: updated.provider_id,
          service_type: updated.service_type,
          booking_date: updated.booking_date,
        },
        'REJECTED',
        (updated as any).provider_name
      );

      res.json({
        success: true,
        message: 'Booking rejected',
        data: updated,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  /**
   * Owner: Mark booking active (CONFIRMED -> ACTIVE)
   * PUT /api/owner/service-bookings/:id/active
   */
  static async markActive(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.id;
      const { id } = req.params;

      const updated = await ServiceBookingModel.updateStatusByProvider(id, providerId, 'ACTIVE');

      NotificationService.onServiceBookingStatusChanged(
        {
          id: updated.id,
          farmer_id: updated.farmer_id,
          provider_id: updated.provider_id,
          service_type: updated.service_type,
          booking_date: updated.booking_date,
        },
        'ACTIVE',
        (updated as any).provider_name
      );

      res.json({
        success: true,
        message: 'Service marked as actively in progress',
        data: updated,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  /**
   * Owner: Mark booking completed (ACTIVE -> COMPLETED)
   * PUT /api/owner/service-bookings/:id/complete
   */
  static async markCompleted(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.id;
      const { id } = req.params;

      const updated = await ServiceBookingModel.updateStatusByProvider(id, providerId, 'COMPLETED');

      NotificationService.onServiceBookingStatusChanged(
        {
          id: updated.id,
          farmer_id: updated.farmer_id,
          provider_id: updated.provider_id,
          service_type: updated.service_type,
          booking_date: updated.booking_date,
        },
        'COMPLETED',
        (updated as any).provider_name
      );

      res.json({
        success: true,
        message: 'Service marked as completed',
        data: updated,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  /**
   * Owner: Get service earnings summary
   * GET /api/owner/service-earnings
   */
  static async getOwnerEarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.id;
      const summary = await ServiceBookingModel.getEarningsSummary(providerId);
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
}
