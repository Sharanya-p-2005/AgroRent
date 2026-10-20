import { Router } from 'express';
import { AnimalOrderController } from '../controllers/animalOrderController.js';
import { requireAuth, requireFarmer } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/animal-orders - Farmer creates an order
router.post('/', requireAuth, requireFarmer, AnimalOrderController.createOrder);

export default router;
