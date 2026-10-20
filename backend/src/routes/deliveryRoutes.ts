import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', DeliveryController.getDeliveryStats);
router.get('/', DeliveryController.getDeliveries);
router.get('/:id', DeliveryController.getDeliveryById);
router.patch('/:id/status', DeliveryController.updateDeliveryStatus);
router.post('/:id/location', DeliveryController.updateDeliveryLocation);
router.get('/:id/tracking', DeliveryController.getDeliveryTracking);

export default router;
