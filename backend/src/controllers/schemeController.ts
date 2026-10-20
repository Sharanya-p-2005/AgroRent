import { Request, Response, NextFunction } from 'express';
import { SchemeModel, SchemeFilterParams, GovernmentLevel, SchemeStatus } from '../models/schemeModel.js';
import { isValidSafeUrl } from '../utils/urlValidator.js';
import { NotificationService } from '../services/notificationService.js';

export const SchemeController = {
  // GET /api/schemes (Public/Farmer)
  async getPublicSchemes(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, government_level, state, featured, sort } = req.query;
      const userId = (req as any).user?.id;

      const schemes = await SchemeModel.findAllPublic(
        {
          search: search ? String(search) : undefined,
          category: category ? String(category) : undefined,
          government_level: government_level ? String(government_level) : undefined,
          state: state ? String(state) : undefined,
          featured: featured ? String(featured) : undefined,
          sort: sort ? String(sort) : 'featured',
        },
        userId
      );

      res.status(200).json({
        success: true,
        data: schemes,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/schemes/:id (Public/Farmer)
  async getPublicSchemeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const scheme = await SchemeModel.findById(id, userId);
      if (!scheme || scheme.status !== 'PUBLISHED') {
        return res.status(404).json({
          success: false,
          error: 'Government scheme not found or unavailable',
        });
      }

      res.status(200).json({
        success: true,
        data: scheme,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/farmer/saved-schemes
  async getSavedSchemes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const savedSchemes = await SchemeModel.findSavedByUserId(userId);
      res.status(200).json({
        success: true,
        data: savedSchemes,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/farmer/schemes/:id/save
  async saveScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { id: schemeId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const result = await SchemeModel.saveScheme(userId, schemeId);
      res.status(200).json({
        success: true,
        message: 'Government scheme saved successfully',
        data: result,
      });
    } catch (err: any) {
      if (err.message === 'Scheme not found') {
        return res.status(404).json({ success: false, error: 'Scheme not found' });
      }
      next(err);
    }
  },

  // DELETE /api/farmer/schemes/:id/save
  async removeSavedScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { id: schemeId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const removed = await SchemeModel.removeSavedScheme(userId, schemeId);
      res.status(200).json({
        success: true,
        message: removed ? 'Scheme removed from saved list' : 'Scheme was not in saved list',
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/schemes
  async getAdminSchemes(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, government_level, status, featured } = req.query;

      const schemes = await SchemeModel.findAllAdmin({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        government_level: government_level ? String(government_level) : undefined,
        status: status ? String(status) : undefined,
        featured: featured ? String(featured) : undefined,
      });

      res.status(200).json({
        success: true,
        data: schemes,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/admin/schemes
  async createScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        title,
        short_description,
        full_description,
        category,
        government_level,
        state,
        department,
        benefits,
        eligibility,
        required_documents,
        application_process,
        official_url,
        helpline,
        image_url,
        status,
        featured,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Scheme title is required' });
      }
      if (!short_description || !short_description.trim()) {
        return res.status(400).json({ success: false, error: 'Short description is required' });
      }
      if (!full_description || !full_description.trim()) {
        return res.status(400).json({ success: false, error: 'Full description is required' });
      }
      if (!category || !category.trim()) {
        return res.status(400).json({ success: false, error: 'Category is required' });
      }
      if (!government_level || !['CENTRAL', 'STATE'].includes(government_level.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Government level must be CENTRAL or STATE' });
      }

      if (status && !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Status must be DRAFT, PUBLISHED, or ARCHIVED' });
      }

      if (official_url && !isValidSafeUrl(official_url)) {
        return res.status(400).json({ success: false, error: 'Official URL must be a valid HTTP or HTTPS address' });
      }
      if (image_url && !isValidSafeUrl(image_url)) {
        return res.status(400).json({ success: false, error: 'Image URL must be a valid HTTP or HTTPS address' });
      }

      const scheme = await SchemeModel.create({
        title,
        short_description,
        full_description,
        category,
        government_level: government_level.toUpperCase() as GovernmentLevel,
        state: state || (government_level.toUpperCase() === 'CENTRAL' ? 'CENTRAL' : 'KARNATAKA'),
        department,
        benefits,
        eligibility,
        required_documents,
        application_process,
        official_url,
        helpline,
        image_url,
        status: status ? (status.toUpperCase() as SchemeStatus) : 'DRAFT',
        featured: Boolean(featured),
      });

      res.status(201).json({
        success: true,
        message: 'Government scheme created successfully',
        data: scheme,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/schemes/:id
  async updateScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        title,
        short_description,
        full_description,
        category,
        government_level,
        state,
        department,
        benefits,
        eligibility,
        required_documents,
        application_process,
        official_url,
        helpline,
        image_url,
        status,
        featured,
      } = req.body;

      if (title !== undefined && !title.trim()) {
        return res.status(400).json({ success: false, error: 'Title cannot be empty' });
      }
      if (government_level !== undefined && !['CENTRAL', 'STATE'].includes(government_level.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Government level must be CENTRAL or STATE' });
      }
      if (status !== undefined && !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Status must be DRAFT, PUBLISHED, or ARCHIVED' });
      }
      if (official_url && !isValidSafeUrl(official_url)) {
        return res.status(400).json({ success: false, error: 'Official URL must be a valid HTTP or HTTPS address' });
      }
      if (image_url && !isValidSafeUrl(image_url)) {
        return res.status(400).json({ success: false, error: 'Image URL must be a valid HTTP or HTTPS address' });
      }

      const updated = await SchemeModel.update(id, {
        title,
        short_description,
        full_description,
        category,
        government_level: government_level ? (government_level.toUpperCase() as GovernmentLevel) : undefined,
        state,
        department,
        benefits,
        eligibility,
        required_documents,
        application_process,
        official_url,
        helpline,
        image_url,
        status: status ? (status.toUpperCase() as SchemeStatus) : undefined,
        featured,
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Scheme not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Government scheme updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/admin/schemes/:id
  async deleteScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await SchemeModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Scheme not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Government scheme deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/schemes/:id/publish
  async publishScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await SchemeModel.setStatus(id, 'PUBLISHED');

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Scheme not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Government scheme published successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/schemes/:id/archive
  async archiveScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await SchemeModel.setStatus(id, 'ARCHIVED');

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Scheme not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Government scheme archived successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/schemes/:id/feature
  async featureScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await SchemeModel.setFeatured(id, true);

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Scheme not found' });
      }

      // Notify farmers of newly featured government scheme
      if (updated.status === 'PUBLISHED') {
        NotificationService.onFeaturedSchemePublished(updated.id, updated.title);
      }

      res.status(200).json({
        success: true,
        message: 'Government scheme marked as featured',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/schemes/:id/unfeature
  async unfeatureScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await SchemeModel.setFeatured(id, false);

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Scheme not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Government scheme unfeatured',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
