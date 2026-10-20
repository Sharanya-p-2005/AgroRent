import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { requireAuth, requireAdmin, requireFarmer, requireOwner } from '../middleware/authMiddleware.js';

const router = Router();

// Webhook endpoint (must accept requests without Bearer token)
router.post('/webhook', PaymentController.handleWebhook);

// Initialize / retrieve internal payment record for a booking or order
router.post('/initialize', requireAuth, PaymentController.initializePayment);

// Razorpay order creation (calculates & verifies amount on backend)
router.post('/create-order', requireAuth, PaymentController.createOrder);

// Cryptographic Razorpay payment signature verification
router.post('/verify', requireAuth, PaymentController.verifyPayment);

// Farmer payment history
router.get('/farmer/history', requireAuth, requireFarmer, PaymentController.getFarmerPayments);

// Owner earnings & payments
router.get('/owner/history', requireAuth, requireOwner, PaymentController.getOwnerPayments);

// Admin payments audit & statistics
router.get('/admin/all', requireAuth, requireAdmin, PaymentController.getAdminPayments);

// Dynamic UPI QR code retrieval
router.get('/:paymentReference/upi-qr', requireAuth, PaymentController.getUpiQr);

// Pay by Hand (Cash) selection
router.post('/:paymentReference/cash', requireAuth, PaymentController.selectCashPayment);

// Submit UPI transaction reference (kept PENDING per security rules)
router.post('/:paymentReference/upi-submit', requireAuth, PaymentController.submitUpiPayment);

// Retry failed/pending payment
router.post('/:paymentReference/retry', requireAuth, PaymentController.retryPayment);

// Retrieve payment details & status by reference
router.get('/:paymentReference', requireAuth, PaymentController.getPaymentDetails);

export default router;
