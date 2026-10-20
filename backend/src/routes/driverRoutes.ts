import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/deliveries', DeliveryController.getDriverDeliveries);
router.get('/deliveries/:id', DeliveryController.getDriverDeliveryById);
router.post('/deliveries/:id/location', DeliveryController.updateDeliveryLocation);
router.patch('/deliveries/:id/status', DeliveryController.updateDeliveryStatus);

export default router;
