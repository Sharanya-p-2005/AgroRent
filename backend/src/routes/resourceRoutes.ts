import { Router } from 'express';
import { ResourceController } from '../controllers/resourceController.js';

const router = Router();

// Public Educational & Agricultural Farmer Resources
router.get('/', ResourceController.getPublicResources);
router.get('/:id', ResourceController.getPublicResourceById);

export default router;
