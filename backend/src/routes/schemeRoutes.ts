import { Router } from 'express';
import { SchemeController } from '../controllers/schemeController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public Government Scheme discovery (with optional authentication to detect saved status)
router.get('/', optionalAuth, SchemeController.getPublicSchemes);
router.get('/:id', optionalAuth, SchemeController.getPublicSchemeById);

export default router;
