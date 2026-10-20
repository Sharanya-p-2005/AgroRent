import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';

const router = Router();

// Public endpoints to browse and view approved driver and farm worker profiles
router.get('/', ServiceController.getPublicServices);
router.get('/:id', ServiceController.getServiceById);

export default router;
