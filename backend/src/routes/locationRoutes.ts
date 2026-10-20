import { Router } from 'express';
import { LocationController } from '../controllers/locationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all /api/locations routes
router.use(requireAuth);

router.post('/', LocationController.saveLocation);
router.get('/', LocationController.getLocations);
router.put('/:id', LocationController.updateLocation);
router.delete('/:id', LocationController.deleteLocation);
router.patch('/:id/default', LocationController.setDefault);

export default router;
