import { Router } from 'express';
import { TestController } from '../controllers/testController.js';
import { BookingController } from '../controllers/bookingController.js';
import { AnimalOrderController } from '../controllers/animalOrderController.js';
import { ServiceBookingController } from '../controllers/serviceBookingController.js';
import { PaymentController } from '../controllers/paymentController.js';
import { SchemeController } from '../controllers/schemeController.js';
import { requireAuth, requireFarmer } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all /api/farmer routes: must be authenticated and have role FARMER
router.use(requireAuth, requireFarmer);

// Test endpoint for verifying farmer authorization
router.get('/test', TestController.farmerTest);

// Farmer Equipment Bookings management
router.get('/bookings', BookingController.getFarmerBookings);
router.get('/bookings/:id', BookingController.getFarmerBookingById);
router.put('/bookings/:id/cancel', BookingController.cancelFarmerBooking);

// Farmer Animal & Bird Orders management
router.get('/animal-orders', AnimalOrderController.getFarmerOrders);
router.get('/animal-orders/:id', AnimalOrderController.getFarmerOrderById);
router.put('/animal-orders/:id/cancel', AnimalOrderController.cancelFarmerOrder);

// Farmer Driver & Farm Worker Bookings management
router.get('/service-bookings', ServiceBookingController.getFarmerBookings);
router.get('/service-bookings/:id', ServiceBookingController.getFarmerBookingById);
router.put('/service-bookings/:id/cancel', ServiceBookingController.cancelFarmerBooking);

// Farmer Payment History
router.get('/payments', PaymentController.getFarmerPayments);

// Phase 7: Government Schemes Bookmarks & Saved Schemes
router.get('/saved-schemes', SchemeController.getSavedSchemes);
router.post('/schemes/:id/save', SchemeController.saveScheme);
router.delete('/schemes/:id/save', SchemeController.removeSavedScheme);

export default router;


