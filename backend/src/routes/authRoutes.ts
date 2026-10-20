import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public auth endpoints protected by rate limiting
router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/logout', AuthController.logout);

// Protected auth endpoints
router.get('/me', requireAuth, AuthController.me);
router.put('/profile', requireAuth, AuthController.updateProfile);

export default router;
