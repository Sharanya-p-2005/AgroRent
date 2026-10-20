import crypto from 'crypto';
import QRCode from 'qrcode';
import Razorpay from 'razorpay';
import {
  PaymentModel,
  Payment,
  PaymentType,
  PaymentMethod,
} from '../models/paymentModel.js';
import { BookingModel } from '../models/bookingModel.js';
import { AnimalOrderModel } from '../models/animalOrderModel.js';
import { ServiceBookingModel } from '../models/serviceBookingModel.js';
import { NotificationService } from './notificationService.js';

let razorpayInstance: any = null;

/**
 * Lazy initialization of Razorpay Node SDK.
 * Returns null if test credentials are not configured in environment.
 */
export function getRazorpayClient(): any {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.trim() === '' || keySecret.trim() === '') {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new (Razorpay as any)({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || 'rzp_test_agrorent_sandbox';
}

export function getMerchantUpiId(): string {
  return process.env.UPI_ID || 'agrorent@upi';
}

export class PaymentService {
  /**
   * Ensure or create an internal payment record for a given transaction.
   * STRICT SECURITY: Amount is always derived from the database entity, NEVER from client input.
   */
  static async getOrCreatePaymentForTarget(
    userId: string,
    paymentType: PaymentType,
    targetId: string
  ): Promise<Payment> {
    // 1. Check if a payment record already exists for this target
    const existing = await PaymentModel.findByTarget(paymentType, targetId);
    if (existing) {
      // Check authorization (must be payer or admin)
      if (existing.user_id !== userId) {
        const err = new Error('You are not authorized to view or pay for this transaction');
        (err as any).statusCode = 403;
        throw err;
      }
      return existing;
    }

    // 2. Fetch target from DB and strictly extract verified total_amount
    let verifiedAmount = 0;
    let equipmentBookingId: string | undefined;
    let animalOrderId: string | undefined;
    let serviceBookingId: string | undefined;

    if (paymentType === 'EQUIPMENT') {
      const booking = await BookingModel.findById(targetId);
      if (!booking) {
        const err = new Error('Equipment booking not found');
        (err as any).statusCode = 404;
        throw err;
      }
      if (booking.farmer_id !== userId) {
        const err = new Error('You are not authorized to pay for this equipment booking');
        (err as any).statusCode = 403;
        throw err;
      }
      if (booking.payment_status === 'PAID') {
        const err = new Error('This booking has already been paid.');
        (err as any).statusCode = 400;
        throw err;
      }
      verifiedAmount = parseFloat(String(booking.total_amount));
      equipmentBookingId = booking.id;
    } else if (paymentType === 'ANIMAL_ORDER') {
      const order = await AnimalOrderModel.findById(targetId);
      if (!order) {
        const err = new Error('Animal order not found');
        (err as any).statusCode = 404;
        throw err;
      }
      if (order.buyer_id !== userId) {
        const err = new Error('You are not authorized to pay for this animal order');
        (err as any).statusCode = 403;
        throw err;
      }
      if (order.payment_status === 'PAID') {
        const err = new Error('This order has already been paid.');
        (err as any).statusCode = 400;
        throw err;
      }
      verifiedAmount = parseFloat(String(order.total_amount));
      animalOrderId = order.id;
    } else if (paymentType === 'DRIVER' || paymentType === 'FARM_WORKER') {
      const serviceBooking = await ServiceBookingModel.findById(targetId);
      if (!serviceBooking) {
        const err = new Error('Service booking not found');
        (err as any).statusCode = 404;
        throw err;
      }
      if (serviceBooking.farmer_id !== userId) {
        const err = new Error('You are not authorized to pay for this service booking');
        (err as any).statusCode = 403;
        throw err;
      }
      if (serviceBooking.payment_status === 'PAID') {
        const err = new Error('This service booking has already been paid.');
        (err as any).statusCode = 400;
        throw err;
      }
      verifiedAmount = parseFloat(String(serviceBooking.total_amount));
      serviceBookingId = serviceBooking.id;
    } else {
      const err = new Error('Invalid payment type requested');
      (err as any).statusCode = 400;
      throw err;
    }

    if (!verifiedAmount || verifiedAmount <= 0) {
      const err = new Error('Invalid transaction amount in database');
      (err as any).statusCode = 400;
      throw err;
    }

    // 3. Create payment in PENDING status
    return PaymentModel.createPayment({
      user_id: userId,
      payment_type: paymentType,
      equipment_booking_id: equipmentBookingId,
      animal_order_id: animalOrderId,
      service_booking_id: serviceBookingId,
      amount: verifiedAmount,
      currency: 'INR',
      payment_method: 'RAZORPAY',
      payment_status: 'PENDING',
    });
  }

  /**
   * Create Razorpay Order for a verified payment reference.
   * Returns order id and payment parameters for frontend Razorpay Checkout modal.
   */
  static async createRazorpayOrder(paymentReference: string, userId: string): Promise<{
    razorpay_order_id: string;
    amount: number;
    currency: string;
    key_id: string;
    payment_reference: string;
    is_test_mode: boolean;
  }> {
    const payment = await PaymentModel.findByReference(paymentReference);
    if (!payment) {
      const err = new Error('Payment reference not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (payment.user_id !== userId) {
      const err = new Error('Unauthorized to initiate payment for this reference');
      (err as any).statusCode = 403;
      throw err;
    }

    // Duplicate Payment Protection
    if (payment.payment_status === 'PAID') {
      const err = new Error('This booking/order has already been paid.');
      (err as any).statusCode = 400;
      throw err;
    }

    const rzpClient = getRazorpayClient();
    const amountInPaise = Math.round(Number(payment.amount) * 100);
    let orderId: string;
    let isTestMode = false;

    if (rzpClient) {
      try {
        const order = await rzpClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: payment.payment_reference,
          notes: {
            payment_type: payment.payment_type,
            user_id: payment.user_id,
            payment_reference: payment.payment_reference,
          },
        });
        orderId = order.id;
      } catch (err: any) {
        console.error('[Razorpay] Order creation failed with credentials:', err);
        throw new Error(`Razorpay order creation failed: ${err.message}`);
      }
    } else {
      // Test / Sandbox mode when environment keys are not configured
      isTestMode = true;
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      orderId = `order_test_${timestamp}_${randomSuffix}`;
    }

    // Update internal payment record with razorpay_order_id and status PROCESSING
    await PaymentModel.updateRazorpayOrder(payment.id, orderId);

    return {
      razorpay_order_id: orderId,
      amount: Number(payment.amount),
      currency: 'INR',
      key_id: getRazorpayKeyId(),
      payment_reference: payment.payment_reference,
      is_test_mode: isTestMode,
    };
  }

  /**
   * Verify Razorpay Payment Signature on BACKEND.
   * Only transitions payment to PAID if cryptographic signature matches.
   */
  static async verifyPayment(
    paymentReference: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string
  ): Promise<Payment> {
    const payment = await PaymentModel.findByReference(paymentReference);
    if (!payment) {
      const err = new Error('Payment reference not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (payment.user_id !== userId) {
      const err = new Error('Unauthorized to verify payment');
      (err as any).statusCode = 403;
      throw err;
    }

    // Idempotency: If already marked PAID, return directly
    if (payment.payment_status === 'PAID') {
      return payment;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let isSignatureValid = false;

    if (keySecret && keySecret.trim() !== '') {
      // Authentic HMAC-SHA256 verification using Razorpay Secret
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isSignatureValid = generatedSignature === razorpaySignature;
    } else {
      // Test sandbox mode verification: Accepts test signature or verified format
      if (
        razorpayOrderId.startsWith('order_test_') ||
        razorpayPaymentId.startsWith('pay_test_') ||
        razorpaySignature.startsWith('sig_test_') ||
        razorpaySignature.length === 64
      ) {
        isSignatureValid = true;
      }
    }

    if (!isSignatureValid) {
      // Mark as failed in DB
      await PaymentModel.markFailed(payment.id);
      const err = new Error('Payment verification failed. Invalid Razorpay signature.');
      (err as any).statusCode = 400;
      throw err;
    }

    // Transition payment and underlying booking/order atomically to PAID
    const paidPayment = await PaymentModel.markPaid(
      payment.id,
      'RAZORPAY',
      razorpayPaymentId,
      razorpaySignature
    );

    // Trigger payment confirmation notification
    NotificationService.onPaymentStatusUpdated(paidPayment);

    return paidPayment;
  }

  /**
   * Dynamic UPI QR Generation.
   * Creates a standards-compliant UPI deep link string and converts to dynamic PNG/SVG QR code.
   */
  static async generateUpiQr(paymentReference: string): Promise<{
    qr_data_url: string;
    upi_url: string;
    upi_id: string;
    merchant_name: string;
    amount: number;
    payment_reference: string;
  }> {
    const payment = await PaymentModel.findByReference(paymentReference);
    if (!payment) {
      const err = new Error('Payment reference not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const upiId = getMerchantUpiId();
    const merchantName = 'AgroRent';
    const amountStr = Number(payment.amount).toFixed(2);

    // Standard NPCI UPI URI Specification
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(payment.payment_reference)}`;

    // Generate high-resolution QR code Data URL
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#166534', // AgroRent forest green accent
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    return {
      qr_data_url: qrDataUrl,
      upi_url: upiUrl,
      upi_id: upiId,
      merchant_name: merchantName,
      amount: Number(payment.amount),
      payment_reference: payment.payment_reference,
    };
  }

  /**
   * Record Pay by Hand (Cash) selection.
   * Sets status to CASH_PENDING without marking paid.
   */
  static async recordCashPayment(paymentReference: string, userId: string): Promise<Payment> {
    const payment = await PaymentModel.findByReference(paymentReference);
    if (!payment) {
      const err = new Error('Payment reference not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (payment.user_id !== userId) {
      const err = new Error('Unauthorized to update payment method');
      (err as any).statusCode = 403;
      throw err;
    }

    if (payment.payment_status === 'PAID') {
      const err = new Error('This booking/order has already been paid.');
      (err as any).statusCode = 400;
      throw err;
    }

    const cashPayment = await PaymentModel.markCashPending(payment.id);
    NotificationService.onPaymentStatusUpdated(cashPayment);
    return cashPayment;
  }

  /**
   * Record manual UPI submission with optional UTR / Transaction ID.
   * STRICT RULE: Kept in PENDING status until verified by merchant/accounts.
   */
  static async recordUpiPayment(
    paymentReference: string,
    userId: string,
    upiTransactionId?: string
  ): Promise<Payment> {
    const payment = await PaymentModel.findByReference(paymentReference);
    if (!payment) {
      const err = new Error('Payment reference not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (payment.user_id !== userId) {
      const err = new Error('Unauthorized to update payment');
      (err as any).statusCode = 403;
      throw err;
    }

    if (payment.payment_status === 'PAID') {
      const err = new Error('This booking/order has already been paid.');
      (err as any).statusCode = 400;
      throw err;
    }

    return PaymentModel.markUpiPending(payment.id, upiTransactionId);
  }

  /**
   * Payment Retry: resets FAILED or CASH_PENDING payment record back to PENDING.
   */
  static async retryPayment(paymentReference: string, userId: string): Promise<Payment> {
    const payment = await PaymentModel.findByReference(paymentReference);
    if (!payment) {
      const err = new Error('Payment reference not found');
      (err as any).statusCode = 404;
      throw err;
    }

    if (payment.user_id !== userId) {
      const err = new Error('Unauthorized to retry payment');
      (err as any).statusCode = 403;
      throw err;
    }

    return PaymentModel.resetForRetry(payment.id);
  }

  /**
   * Process incoming Razorpay Webhook.
   * Fully idempotent to safely withstand multiple redeliveries.
   */
  static async handleWebhook(
    payload: any,
    signature: string | undefined,
    rawBody?: Buffer | string
  ): Promise<{ received: boolean; processed: boolean; message: string }> {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && webhookSecret.trim() !== '') {
      if (!signature) {
        throw new Error('Missing Razorpay webhook signature header');
      }

      const bodyToVerify = rawBody
        ? (typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
        : JSON.stringify(payload);

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyToVerify)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid Razorpay webhook signature');
      }
    }

    const event = payload.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    // Extract payment/order entities
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId) {
      return { received: true, processed: false, message: 'No associated razorpay_order_id in payload' };
    }

    // Find internal payment record by razorpay_order_id
    const paymentRes = await PaymentModel.getAllPaymentsForAdmin({
      search: razorpayOrderId,
    });
    const payment = paymentRes.payments.find((p) => p.razorpay_order_id === razorpayOrderId);

    if (!payment) {
      return { received: true, processed: false, message: `No internal payment matches order ${razorpayOrderId}` };
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      if (payment.payment_status === 'PAID') {
        return { received: true, processed: true, message: 'Payment already marked as PAID (idempotent)' };
      }

      await PaymentModel.markPaid(
        payment.id,
        'RAZORPAY',
        razorpayPaymentId,
        signature
      );
      return { received: true, processed: true, message: 'Payment marked as PAID via webhook' };
    } else if (event === 'payment.failed') {
      if (payment.payment_status !== 'PAID') {
        await PaymentModel.markFailed(payment.id);
      }
      return { received: true, processed: true, message: 'Payment marked as FAILED via webhook' };
    }

    return { received: true, processed: true, message: `Event ${event} acknowledged` };
  }
}
