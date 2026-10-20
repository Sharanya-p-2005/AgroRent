import { Request, Response, NextFunction } from 'express';
import { UserLocationModel } from '../models/userLocationModel.js';

export class LocationController {
  /**
   * Save a new farm/home/office location
   * POST /api/locations
   */
  static async saveLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const { label, address, city, state, pincode, latitude, longitude, is_default } = req.body;

      const location = await UserLocationModel.create(userId, {
        label,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
        is_default,
      });

      return res.status(201).json({
        success: true,
        message: 'Location saved successfully.',
        data: location,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all saved locations for the authenticated user
   * GET /api/locations
   */
  static async getLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const locations = await UserLocationModel.getAllByUserId(userId);

      return res.json({
        success: true,
        data: locations,
        count: locations.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an existing saved location
   * PUT /api/locations/:id
   */
  static async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const { label, address, city, state, pincode, latitude, longitude, is_default } = req.body;

      const updated = await UserLocationModel.update(id, userId, {
        label,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
        is_default,
      });

      return res.json({
        success: true,
        message: 'Location updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a saved location
   * DELETE /api/locations/:id
   */
  static async deleteLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      await UserLocationModel.delete(id, userId);

      return res.json({
        success: true,
        message: 'Location deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Set location as default
   * PATCH /api/locations/:id/default
   */
  static async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const location = await UserLocationModel.setDefault(id, userId);

      return res.json({
        success: true,
        message: 'Default location updated successfully.',
        data: location,
      });
    } catch (err) {
      next(err);
    }
  }
}
