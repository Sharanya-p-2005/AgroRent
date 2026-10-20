import { Router } from 'express';
import { BookingController } from '../controllers/bookingController.js';
import { requireAuth, requireFarmer } from '../middleware/authMiddleware.js';

const router = Router();

// Farmer creates equipment booking
router.post('/', requireAuth, requireFarmer, BookingController.createBooking);

export default router;
