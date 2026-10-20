import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService.js';
import { PaymentModel, PaymentType } from '../models/paymentModel.js';

export class PaymentController {
  /**
   * POST /api/payments/initialize
   * Create or fetch an internal payment record for a given booking or order.
   */
  static async initializePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { payment_type, target_id } = req.body;

      if (!payment_type || !target_id) {
        return res.status(400).json({
          success: false,
          message: 'payment_type and target_id are required',
        });
      }

      const validTypes: PaymentType[] = ['EQUIPMENT', 'ANIMAL_ORDER', 'DRIVER', 'FARM_WORKER'];
      if (!validTypes.includes(payment_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment_type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      const payment = await PaymentService.getOrCreatePaymentForTarget(
        userId,
        payment_type,
        target_id
      );

      return res.status(200).json({
        success: true,
        payment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/payments/create-order
   * Generate Razorpay order for a verified payment.
   * Strictly verifies amounts on the backend!
   */
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      let paymentReference = req.body.payment_reference;

      // If client supplied target_type and target_id instead of payment_reference
      if (!paymentReference && req.body.target_type && req.body.target_id) {
        const payment = await PaymentService.getOrCreatePaymentForTarget(
          userId,
          req.body.target_type,
          req.body.target_id
        );
        paymentReference = payment.payment_reference;
      }

      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          message: 'payment_reference is required',
        });
      }

      const orderData = await PaymentService.createRazorpayOrder(paymentReference, userId);

      return res.status(200).json({
        success: true,
        data: orderData,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/payments/verify
   * Cryptographically verify Razorpay payment signature on backend.
   */
  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const {
        payment_reference,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (
        !payment_reference ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message: 'All payment verification credentials are required',
        });
      }

      const payment = await PaymentService.verifyPayment(
        payment_reference,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId
      );

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully! Status marked as PAID.',
        payment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/payments/:paymentReference
   * Retrieve payment details and related booking/order metadata.
   */
  static async getPaymentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const { paymentReference } = req.params;

      const payment = await PaymentModel.findByReference(paymentReference);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      // Authorization: Admin, Payer, or Recipient can view
      const isPayer = payment.user_id === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isPayer && !isAdmin) {
        // Check if owner/recipient
        const ownerPayments = await PaymentModel.getPaymentsByOwner(userId);
        const isOwnerOfTx = ownerPayments.payments.some(
          (p) => p.payment_reference === paymentReference
        );
        if (!isOwnerOfTx) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to view this payment record',
          });
        }
      }

      return res.status(200).json({
        success: true,
        payment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/payments/:paymentReference/upi-qr
   * Generate dynamic UPI QR code with merchant VPA and exact transaction amount.
   */
  static async getUpiQr(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentReference } = req.params;
      const qrData = await PaymentService.generateUpiQr(paymentReference);

      return res.status(200).json({
        success: true,
        data: qrData,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/payments/:paymentReference/cash
   * Select Cash / Pay by Hand. Status set to CASH_PENDING.
   */
  static async selectCashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { paymentReference } = req.params;

      const payment = await PaymentService.recordCashPayment(paymentReference, userId);

      return res.status(200).json({
        success: true,
        message: 'Cash payment selected. Payment will be confirmed upon service fulfillment.',
        payment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/payments/:paymentReference/upi-submit
   * Log user UPI payment reference. Status kept PENDING per security rules.
   */
  static async submitUpiPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { paymentReference } = req.params;
      const { upi_transaction_id } = req.body;

      const payment = await PaymentService.recordUpiPayment(
        paymentReference,
        userId,
        upi_transaction_id
      );

      return res.status(200).json({
        success: true,
        message: 'UPI payment recorded. Verification is pending with accounts.',
        payment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/payments/:paymentReference/retry
   * Retry a failed or pending payment.
   */
  static async retryPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { paymentReference } = req.params;

      const payment = await PaymentService.retryPayment(paymentReference, userId);

      return res.status(200).json({
        success: true,
        message: 'Payment reset for retry',
        payment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/payments/webhook
   * Razorpay Webhook endpoint.
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string | undefined;
      const rawBody = (req as any).rawBody || (req as any).body;

      const result = await PaymentService.handleWebhook(req.body, signature, rawBody);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[Webhook Error]', err.message);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * GET /api/farmer/payments
   * List payments made by the authenticated farmer.
   */
  static async getFarmerPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = (req as any).user.id;
      const payments = await PaymentModel.getPaymentsByFarmer(farmerId);

      return res.status(200).json({
        success: true,
        payments,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/owner/payments
   * List payments received by owner and revenue breakdown.
   */
  static async getOwnerPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = (req as any).user.id;
      const data = await PaymentModel.getPaymentsByOwner(ownerId);

      return res.status(200).json({
        success: true,
        payments: data.payments,
        summary: data.summary,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/payments
   * Admin global payments audit and statistics.
   */
  static async getAdminPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { payment_status, payment_type, payment_method, search } = req.query;

      const data = await PaymentModel.getAllPaymentsForAdmin({
        payment_status: payment_status as string,
        payment_type: payment_type as string,
        payment_method: payment_method as string,
        search: search as string,
      });

      return res.status(200).json({
        success: true,
        payments: data.payments,
        stats: data.stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/payments/:paymentReference
   * Admin detailed inspection for a specific payment reference.
   */
  static async getAdminPaymentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentReference } = req.params;
      const payment = await PaymentModel.findByReference(paymentReference);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      return res.status(200).json({
        success: true,
        payment,
      });
    } catch (err) {
      next(err);
    }
  }
}
