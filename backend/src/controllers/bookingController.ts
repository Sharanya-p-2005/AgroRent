import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { BookingModel, BookingStatus } from '../models/bookingModel.js';
import { EquipmentModel } from '../models/equipmentModel.js';
import { PaymentService } from '../services/paymentService.js';
import { NotificationService } from '../services/notificationService.js';

export class BookingController {
  /**
   * POST /api/bookings
   * Farmer creates booking for equipment
   */
  static async createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const farmerId = req.user!.id;
      const { equipment_id, booking_date, start_time, end_time } = req.body;

      if (!equipment_id || !booking_date || !start_time || !end_time) {
        res.status(400).json({
          success: false,
          message: 'Equipment ID, booking date, start time, and end time are required.',
        });
        return;
      }

      // Validate date (not past date)
      const todayStr = new Date().toISOString().split('T')[0];
      if (booking_date < todayStr) {
        res.status(400).json({
          success: false,
          message: 'Cannot book equipment for past dates.',
        });
        return;
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        res.status(400).json({
          success: false,
          message: 'Times must be in valid 24-hour HH:MM format.',
        });
        return;
      }

      // Calculate duration
      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      if (endMinutes <= startMinutes) {
        res.status(400).json({
          success: false,
          message: 'End time must be later than start time.',
        });
        return;
      }

      const durationHours = parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));
      if (durationHours < 0.5) {
        res.status(400).json({
          success: false,
          message: 'Minimum booking duration is 30 minutes (0.5 hours).',
        });
        return;
      }

      // Fetch equipment details
      const equipment = await EquipmentModel.findById(equipment_id);
      if (!equipment) {
        res.status(404).json({
          success: false,
          message: 'Selected equipment does not exist.',
        });
        return;
      }

      if (equipment.approval_status !== 'APPROVED') {
        res.status(400).json({
          success: false,
          message: 'This equipment is pending verification and cannot be booked yet.',
        });
        return;
      }

      if (equipment.availability_status !== 'AVAILABLE') {
        res.status(400).json({
          success: false,
          message: 'This equipment is currently marked as unavailable for rental.',
        });
        return;
      }

      if (equipment.owner_id === farmerId) {
        res.status(400).json({
          success: false,
          message: 'Equipment owners cannot rent their own machinery.',
        });
        return;
      }

      // Check for schedule conflict
      const { conflict } = await BookingModel.checkConflict(
        equipment_id,
        booking_date,
        start_time,
        end_time
      );

      if (conflict) {
        res.status(409).json({
          success: false,
          message: `This equipment is already booked or reserved for the selected time slot on ${booking_date}. Please choose another time or date.`,
        });
        return;
      }

      const totalAmount = parseFloat((durationHours * equipment.price_per_hour).toFixed(2));

      const booking = await BookingModel.create({
        equipment_id,
        farmer_id: farmerId,
        owner_id: equipment.owner_id,
        booking_date,
        start_time,
        end_time,
        duration_hours: durationHours,
        price_per_hour: equipment.price_per_hour,
        total_amount: totalAmount,
      });

      // Automatically initialize internal payment record for this booking
      const payment = await PaymentService.getOrCreatePaymentForTarget(
        farmerId,
        'EQUIPMENT',
        booking.id
      );

      // Notify equipment owner of new rental request
      NotificationService.onEquipmentBookingCreated({
        id: booking.id,
        owner_id: equipment.owner_id,
        booking_date: booking.booking_date,
        total_amount: totalAmount,
        equipment_name: equipment.name,
      });

      res.status(201).json({
        success: true,
        message: 'Rental booking requested successfully! You may now proceed to payment.',
        data: {
          ...booking,
          payment_reference: payment.payment_reference,
        },
        payment,
      });
    } catch (error: any) {
      if (error.code === 'CONFLICT') {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
      console.error('[BookingController.createBooking] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/farmer/bookings
   * Farmer retrieves all their equipment bookings
   */
  static async getFarmerBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const farmerId = req.user!.id;
      const bookings = await BookingModel.findByFarmerId(farmerId);

      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (error: any) {
      console.error('[BookingController.getFarmerBookings] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve your bookings',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/farmer/bookings/:id
   * Farmer retrieves single booking details
   */
  static async getFarmerBookingById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const farmerId = req.user!.id;
      const { id } = req.params;

      const booking = await BookingModel.findById(id);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }

      if (booking.farmer_id !== farmerId) {
        res.status(403).json({ success: false, message: 'Unauthorized to view this booking' });
        return;
      }

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      console.error('[BookingController.getFarmerBookingById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking details',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/farmer/bookings/:id/cancel
   * Farmer cancels their pending or confirmed booking
   */
  static async cancelFarmerBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const farmerId = req.user!.id;
      const { id } = req.params;

      const booking = await BookingModel.findById(id);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }

      if (booking.farmer_id !== farmerId) {
        res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking' });
        return;
      }

      if (!['PENDING', 'CONFIRMED'].includes(booking.booking_status)) {
        res.status(400).json({
          success: false,
          message: `Cannot cancel booking with current status: ${booking.booking_status}`,
        });
        return;
      }

      const updated = await BookingModel.cancelByFarmer(id, farmerId);

      NotificationService.onEquipmentBookingStatusChanged(
        booking,
        'CANCELLED',
        (booking as any).equipment_name
      );

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('[BookingController.cancelFarmerBooking] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/owner/bookings
   * Owner retrieves all rental requests for their equipment
   */
  static async getOwnerBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const bookings = await BookingModel.findByOwnerId(ownerId);

      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (error: any) {
      console.error('[BookingController.getOwnerBookings] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment bookings',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/owner/bookings/:id/status
   * Owner updates status: CONFIRMED, REJECTED, ACTIVE, COMPLETED
   */
  static async updateOwnerBookingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body;

      let effectiveStatus = status;
      if (effectiveStatus === 'APPROVED') {
        effectiveStatus = 'CONFIRMED';
      }

      const allowedStatuses: BookingStatus[] = ['CONFIRMED', 'REJECTED', 'ACTIVE', 'COMPLETED'];
      if (!allowedStatuses.includes(effectiveStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')} or APPROVED`,
        });
        return;
      }

      const booking = await BookingModel.findById(id);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }

      if (booking.owner_id !== ownerId) {
        res.status(403).json({ success: false, message: 'Unauthorized to modify this booking' });
        return;
      }

      const updated = await BookingModel.updateOwnerStatus(id, ownerId, effectiveStatus);

      NotificationService.onEquipmentBookingStatusChanged(
        booking,
        effectiveStatus,
        (booking as any).equipment_name
      );

      res.status(200).json({
        success: true,
        message: `Booking marked as ${status}`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[BookingController.updateOwnerBookingStatus] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking status',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/owner/earnings
   * Owner retrieves earnings metrics & completed bookings
   */
  static async getOwnerEarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const earnings = await BookingModel.getOwnerEarnings(ownerId);

      res.status(200).json({
        success: true,
        data: earnings,
      });
    } catch (error: any) {
      console.error('[BookingController.getOwnerEarnings] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve earnings summary',
        error: error.message,
      });
    }
  }
}
