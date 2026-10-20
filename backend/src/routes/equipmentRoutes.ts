import { Router } from 'express';
import { EquipmentController } from '../controllers/equipmentController.js';

const router = Router();

// Public / Farmer equipment browsing & details
router.get('/', EquipmentController.getPublicEquipment);
router.get('/:id', EquipmentController.getEquipmentById);

export default router;
