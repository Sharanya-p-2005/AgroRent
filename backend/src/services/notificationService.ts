import { NotificationModel, NotificationType, ReferenceType } from '../models/notificationModel.js';
import { query } from '../config/db.js';

export class NotificationService {
  /**
   * Helper to send single notification safely without throwing unhandled exceptions
   */
  static async sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    notificationType?: NotificationType;
    referenceType?: ReferenceType;
    referenceId?: string | null;
  }) {
    try {
      return await NotificationModel.create(params);
    } catch (err: any) {
      console.warn('[NotificationService.sendNotification] Failed to create notification:', err.message);
      return null;
    }
  }

  /**
   * Trigger when farmer books equipment -> notify equipment owner
   */
  static async onEquipmentBookingCreated(booking: {
    id: string;
    owner_id: string;
    booking_date: string;
    total_amount: number;
    equipment_name?: string;
  }) {
    const title = 'New Equipment Rental Request';
    const name = booking.equipment_name || 'equipment';
    const message = `A farmer has submitted a rental request for ${name} on ${booking.booking_date} (Total: ₹${booking.total_amount}). Please review and respond.`;

    return this.sendNotification({
      userId: booking.owner_id,
      title,
      message,
      notificationType: 'BOOKING',
      referenceType: 'EQUIPMENT_BOOKING',
      referenceId: booking.id,
    });
  }

  /**
   * Trigger when equipment booking status changes
   */
  static async onEquipmentBookingStatusChanged(
    booking: {
      id: string;
      farmer_id: string;
      owner_id: string;
      booking_date: string;
    },
    newStatus: string,
    equipmentName?: string
  ) {
    const name = equipmentName || 'equipment';

    if (newStatus === 'CONFIRMED') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: 'Equipment Booking Confirmed',
        message: `Your booking for ${name} on ${booking.booking_date} has been confirmed by the owner.`,
        notificationType: 'BOOKING',
        referenceType: 'EQUIPMENT_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'REJECTED') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: 'Equipment Booking Rejected',
        message: `Your booking for ${name} on ${booking.booking_date} was declined by the owner.`,
        notificationType: 'BOOKING',
        referenceType: 'EQUIPMENT_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'ACTIVE') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: 'Equipment Rental Active',
        message: `Your rental period for ${name} is now active. Reach out to the owner if you require operational assistance.`,
        notificationType: 'BOOKING',
        referenceType: 'EQUIPMENT_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'COMPLETED') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: 'Equipment Rental Completed',
        message: `Your rental of ${name} has concluded. Please rate and review the equipment and owner!`,
        notificationType: 'BOOKING',
        referenceType: 'EQUIPMENT_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'CANCELLED') {
      return this.sendNotification({
        userId: booking.owner_id,
        title: 'Equipment Booking Cancelled',
        message: `The rental booking for ${name} scheduled for ${booking.booking_date} was cancelled.`,
        notificationType: 'BOOKING',
        referenceType: 'EQUIPMENT_BOOKING',
        referenceId: booking.id,
      });
    }
  }

  /**
   * Trigger when farmer places animal order -> notify seller
   */
  static async onAnimalOrderCreated(order: {
    id: string;
    seller_id: string;
    quantity: number;
    total_amount: number;
    animal_name?: string;
  }) {
    const name = order.animal_name || 'animal listing';
    return this.sendNotification({
      userId: order.seller_id,
      title: 'New Animal Order Received',
      message: `A buyer has placed an order for ${order.quantity}x ${name} (Total: ₹${order.total_amount}). Please confirm shipment details.`,
      notificationType: 'ORDER',
      referenceType: 'ANIMAL_ORDER',
      referenceId: order.id,
    });
  }

  /**
   * Trigger when animal order status changes
   */
  static async onAnimalOrderStatusChanged(
    order: {
      id: string;
      buyer_id: string;
      seller_id: string;
    },
    newStatus: string,
    animalName?: string
  ) {
    const name = animalName || 'animal order';

    if (newStatus === 'CONFIRMED') {
      return this.sendNotification({
        userId: order.buyer_id,
        title: 'Animal Order Confirmed',
        message: `Your order for ${name} has been confirmed by the seller and is being prepared for transport.`,
        notificationType: 'ORDER',
        referenceType: 'ANIMAL_ORDER',
        referenceId: order.id,
      });
    }

    if (newStatus === 'REJECTED') {
      return this.sendNotification({
        userId: order.buyer_id,
        title: 'Animal Order Cancelled / Rejected',
        message: `Your order for ${name} was rejected by the seller. Any paid amount will be processed for refund.`,
        notificationType: 'ORDER',
        referenceType: 'ANIMAL_ORDER',
        referenceId: order.id,
      });
    }

    if (newStatus === 'SHIPPED') {
      return this.sendNotification({
        userId: order.buyer_id,
        title: 'Animal Order Dispatched',
        message: `Your order for ${name} has been dispatched and is currently in-transit to your delivery location.`,
        notificationType: 'ORDER',
        referenceType: 'ANIMAL_ORDER',
        referenceId: order.id,
      });
    }

    if (newStatus === 'DELIVERED') {
      return this.sendNotification({
        userId: order.buyer_id,
        title: 'Animal Order Delivered',
        message: `Your order for ${name} has been marked as delivered! Please submit a review for the seller.`,
        notificationType: 'ORDER',
        referenceType: 'ANIMAL_ORDER',
        referenceId: order.id,
      });
    }
  }

  /**
   * Trigger when farmer books driver or farm worker -> notify provider
   */
  static async onServiceBookingCreated(booking: {
    id: string;
    provider_id: string;
    service_type: string;
    booking_date: string;
    duration_hours: number;
    total_amount: number;
  }) {
    const typeLabel = booking.service_type === 'DRIVER' ? 'Driver' : 'Farm Worker';
    return this.sendNotification({
      userId: booking.provider_id,
      title: `New ${typeLabel} Booking Request`,
      message: `You received a booking request for ${booking.booking_date} (${booking.duration_hours} hrs, ₹${booking.total_amount}). Please accept or decline.`,
      notificationType: 'SERVICE',
      referenceType: booking.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING',
      referenceId: booking.id,
    });
  }

  /**
   * Trigger when service booking status changes
   */
  static async onServiceBookingStatusChanged(
    booking: {
      id: string;
      farmer_id: string;
      provider_id: string;
      service_type: string;
      booking_date: string;
    },
    newStatus: string,
    providerName?: string
  ) {
    const typeLabel = booking.service_type === 'DRIVER' ? 'Driver' : 'Farm Worker';
    const name = providerName || 'Service Provider';

    if (newStatus === 'CONFIRMED') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: `${typeLabel} Booking Confirmed`,
        message: `Your ${typeLabel.toLowerCase()} booking with ${name} on ${booking.booking_date} has been confirmed.`,
        notificationType: 'SERVICE',
        referenceType: booking.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'REJECTED') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: `${typeLabel} Booking Rejected`,
        message: `Your ${typeLabel.toLowerCase()} booking with ${name} on ${booking.booking_date} was declined.`,
        notificationType: 'SERVICE',
        referenceType: booking.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'ACTIVE') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: `${typeLabel} Service Active`,
        message: `${name} has commenced work for your booked service today.`,
        notificationType: 'SERVICE',
        referenceType: booking.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'COMPLETED') {
      return this.sendNotification({
        userId: booking.farmer_id,
        title: `${typeLabel} Service Completed`,
        message: `Your booking with ${name} has completed. Please take a moment to rate and review their service!`,
        notificationType: 'SERVICE',
        referenceType: booking.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING',
        referenceId: booking.id,
      });
    }

    if (newStatus === 'CANCELLED') {
      return this.sendNotification({
        userId: booking.provider_id,
        title: `${typeLabel} Booking Cancelled`,
        message: `The booking scheduled for ${booking.booking_date} was cancelled by the farmer.`,
        notificationType: 'SERVICE',
        referenceType: booking.service_type === 'DRIVER' ? 'DRIVER_BOOKING' : 'WORKER_BOOKING',
        referenceId: booking.id,
      });
    }
  }

  /**
   * Trigger when payment status is updated
   */
  static async onPaymentStatusUpdated(payment: {
    user_id: string;
    payment_reference: string;
    amount: number;
    payment_status: string;
    target_type?: string;
    target_id?: string;
  }) {
    if (payment.payment_status === 'PAID') {
      return this.sendNotification({
        userId: payment.user_id,
        title: 'Payment Successful',
        message: `Your payment of ₹${payment.amount} for transaction #${payment.payment_reference} has been received and verified successfully.`,
        notificationType: 'PAYMENT',
        referenceType: 'PAYMENT',
        referenceId: payment.payment_reference,
      });
    }

    if (payment.payment_status === 'FAILED') {
      return this.sendNotification({
        userId: payment.user_id,
        title: 'Payment Failed',
        message: `Payment of ₹${payment.amount} for transaction #${payment.payment_reference} was not successful. You can retry your payment at any time.`,
        notificationType: 'PAYMENT',
        referenceType: 'PAYMENT',
        referenceId: payment.payment_reference,
      });
    }

    if (payment.payment_status === 'CASH_PENDING') {
      return this.sendNotification({
        userId: payment.user_id,
        title: 'Cash Payment Selected',
        message: `Cash / Pay-by-hand confirmed for ₹${payment.amount} (#${payment.payment_reference}). Please pay directly upon receiving equipment or service.`,
        notificationType: 'PAYMENT',
        referenceType: 'PAYMENT',
        referenceId: payment.payment_reference,
      });
    }
  }

  /**
   * Trigger when a featured scheme is published
   */
  static async onFeaturedSchemePublished(schemeId: string, schemeTitle: string) {
    try {
      // Check if notification already sent for this scheme to avoid duplicates
      const exists = await query(
        `SELECT 1 FROM notifications WHERE reference_type = 'SCHEME' AND reference_id = $1 LIMIT 1`,
        [schemeId]
      );
      if (exists.rows.length > 0) {
        return;
      }

      await NotificationModel.createBroadcast({
        target: 'ALL_FARMERS',
        title: 'New Government Scheme Available',
        message: `New featured scheme published: "${schemeTitle}". Learn about eligibility and application steps on AgroRent.`,
        notificationType: 'SCHEME',
        referenceType: 'SCHEME',
        referenceId: schemeId,
      });
    } catch (err: any) {
      console.warn('[NotificationService.onFeaturedSchemePublished] Failed:', err.message);
    }
  }
}
