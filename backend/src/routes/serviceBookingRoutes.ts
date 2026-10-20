import { Router } from 'express';
import { ServiceBookingController } from '../controllers/serviceBookingController.js';
import { requireAuth, requireFarmer } from '../middleware/authMiddleware.js';

const router = Router();

// Farmer service booking endpoints
router.post('/', requireAuth, requireFarmer, ServiceBookingController.createBooking);
router.get('/', requireAuth, requireFarmer, ServiceBookingController.getFarmerBookings);
router.get('/:id', requireAuth, requireFarmer, ServiceBookingController.getFarmerBookingById);
router.put('/:id/cancel', requireAuth, requireFarmer, ServiceBookingController.cancelFarmerBooking);

export default router;
