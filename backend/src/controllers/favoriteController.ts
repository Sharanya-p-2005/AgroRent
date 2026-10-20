import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { FavoriteModel, FavoriteItemType } from '../models/favoriteModel.js';

export class FavoriteController {
  /**
   * POST /api/favorites
   * Add an item to farmer's favorites
   */
  static async addFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userId = user.id;

      // Ensure farmer role
      if (user.role !== 'FARMER' && user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only farmers can save favorites.',
        });
        return;
      }

      const { item_type, item_id } = req.body;

      if (!item_type || !item_id) {
        res.status(400).json({
          success: false,
          message: 'item_type and item_id are required.',
        });
        return;
      }

      const validTypes: FavoriteItemType[] = ['EQUIPMENT', 'ANIMAL', 'DRIVER', 'FARM_WORKER', 'SCHEME'];
      if (!validTypes.includes(item_type)) {
        res.status(400).json({
          success: false,
          message: `Invalid item_type. Allowed types: ${validTypes.join(', ')}`,
        });
        return;
      }

      // Check existence and active/approval status of referenced item
      const validation = await FavoriteModel.validateItemExists(item_type, item_id);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.message || 'The specified item does not exist or is not available.',
        });
        return;
      }

      const result = await FavoriteModel.addFavorite(userId, item_type, item_id);

      res.status(200).json({
        success: true,
        message: result.created ? 'Saved to favorites' : 'Already in favorites',
        data: result.favorite,
        created: result.created,
      });
    } catch (error: any) {
      console.error('[FavoriteController.addFavorite] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add favorite',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/favorites/:itemType/:itemId
   * Remove item from farmer's favorites
   */
  static async removeFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { itemType, itemId } = req.params;

      const validTypes: FavoriteItemType[] = ['EQUIPMENT', 'ANIMAL', 'DRIVER', 'FARM_WORKER', 'SCHEME'];
      if (!validTypes.includes(itemType as FavoriteItemType)) {
        res.status(400).json({
          success: false,
          message: `Invalid itemType. Allowed: ${validTypes.join(', ')}`,
        });
        return;
      }

      const removed = await FavoriteModel.removeFavorite(userId, itemType as FavoriteItemType, itemId);

      res.status(200).json({
        success: true,
        message: 'Removed from favorites',
        removed,
      });
    } catch (error: any) {
      console.error('[FavoriteController.removeFavorite] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove favorite',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/favorites
   * Fetch current farmer's saved favorites with full item details
   */
  static async getUserFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { type } = req.query;

      const favorites = await FavoriteModel.getUserFavorites(userId, type ? String(type) : undefined);

      res.status(200).json({
        success: true,
        count: favorites.length,
        data: favorites,
      });
    } catch (error: any) {
      console.error('[FavoriteController.getUserFavorites] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve favorites',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/favorites/check/:itemType/:itemId
   * Check if a specific item is in current user's favorites
   */
  static async checkFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { itemType, itemId } = req.params;

      const isFavorite = await FavoriteModel.isFavorited(userId, itemType as FavoriteItemType, itemId);

      res.status(200).json({
        success: true,
        isFavorite,
      });
    } catch (error: any) {
      console.error('[FavoriteController.checkFavorite] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check favorite status',
        error: error.message,
      });
    }
  }
}
