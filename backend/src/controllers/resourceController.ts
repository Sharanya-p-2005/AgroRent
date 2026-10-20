import { Request, Response, NextFunction } from 'express';
import { ResourceModel, ResourceType, ResourceStatus } from '../models/resourceModel.js';
import { isValidSafeUrl } from '../utils/urlValidator.js';

export const ResourceController = {
  // GET /api/resources (Public/Farmer)
  async getPublicResources(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, resource_type } = req.query;

      const resources = await ResourceModel.findAllPublic({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        resource_type: resource_type ? String(resource_type) : undefined,
      });

      res.status(200).json({
        success: true,
        data: resources,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/resources/:id (Public/Farmer)
  async getPublicResourceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const resource = await ResourceModel.findById(id);

      if (!resource || resource.status !== 'PUBLISHED') {
        return res.status(404).json({
          success: false,
          error: 'Resource not found or unavailable',
        });
      }

      res.status(200).json({
        success: true,
        data: resource,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/admin/resources
  async getAdminResources(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, resource_type, status } = req.query;

      const resources = await ResourceModel.findAllAdmin({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        resource_type: resource_type ? String(resource_type) : undefined,
        status: status ? String(status) : undefined,
      });

      res.status(200).json({
        success: true,
        data: resources,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/admin/resources
  async createResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, category, content, resource_type, image_url, official_url, status } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Resource title is required' });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, error: 'Description is required' });
      }
      if (!category || !category.trim()) {
        return res.status(400).json({ success: false, error: 'Category is required' });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'Content is required' });
      }
      if (
        !resource_type ||
        !['ARTICLE', 'GUIDE', 'VIDEO', 'DOCUMENT', 'WEBSITE', 'HELPLINE'].includes(resource_type.toUpperCase())
      ) {
        return res.status(400).json({
          success: false,
          error: 'Resource type must be ARTICLE, GUIDE, VIDEO, DOCUMENT, WEBSITE, or HELPLINE',
        });
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

      const resource = await ResourceModel.create({
        title,
        description,
        category,
        content,
        resource_type: resource_type.toUpperCase() as ResourceType,
        image_url,
        official_url,
        status: status ? (status.toUpperCase() as ResourceStatus) : 'DRAFT',
      });

      res.status(201).json({
        success: true,
        message: 'Farmer resource created successfully',
        data: resource,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/resources/:id
  async updateResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, category, content, resource_type, image_url, official_url, status } = req.body;

      if (title !== undefined && !title.trim()) {
        return res.status(400).json({ success: false, error: 'Title cannot be empty' });
      }
      if (
        resource_type !== undefined &&
        !['ARTICLE', 'GUIDE', 'VIDEO', 'DOCUMENT', 'WEBSITE', 'HELPLINE'].includes(resource_type.toUpperCase())
      ) {
        return res.status(400).json({
          success: false,
          error: 'Resource type must be ARTICLE, GUIDE, VIDEO, DOCUMENT, WEBSITE, or HELPLINE',
        });
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

      const updated = await ResourceModel.update(id, {
        title,
        description,
        category,
        content,
        resource_type: resource_type ? (resource_type.toUpperCase() as ResourceType) : undefined,
        image_url,
        official_url,
        status: status ? (status.toUpperCase() as ResourceStatus) : undefined,
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Resource not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Farmer resource updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/admin/resources/:id
  async deleteResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await ResourceModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Resource not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Farmer resource deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/resources/:id/publish
  async publishResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await ResourceModel.setStatus(id, 'PUBLISHED');

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Resource not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Farmer resource published successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/admin/resources/:id/archive
  async archiveResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await ResourceModel.setStatus(id, 'ARCHIVED');

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Resource not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Farmer resource archived successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
