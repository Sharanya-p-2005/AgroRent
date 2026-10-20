import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All favorites endpoints require authentication
router.use(requireAuth);

// Get farmer's saved favorites (supports ?type=...)
router.get('/', FavoriteController.getUserFavorites);

// Add item to favorites
router.post('/', FavoriteController.addFavorite);

// Check if item is in favorites
router.get('/check/:itemType/:itemId', FavoriteController.checkFavorite);

// Remove item from favorites
router.delete('/:itemType/:itemId', FavoriteController.removeFavorite);

export default router;
