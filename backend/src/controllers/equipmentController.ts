import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { EquipmentModel } from '../models/equipmentModel.js';
import { AuditService } from '../services/auditService.js';
import { NotificationService } from '../services/notificationService.js';

export class EquipmentController {
  /**
   * GET /api/equipment
   * Public / Farmer endpoint to browse approved & available equipment
   */
  static async getPublicEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, category, location, minPrice, maxPrice, sortBy } = req.query;

      const filters = {
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        location: location ? String(location) : undefined,
        minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
        sortBy: (sortBy as any) || 'newest',
      };

      const equipment = await EquipmentModel.findApprovedAvailable(filters);
      res.status(200).json({
        success: true,
        count: equipment.length,
        data: equipment,
      });
    } catch (error: any) {
      console.error('[EquipmentController.getPublicEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment listings',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/equipment/:id
   * Get single equipment details
   */
  static async getEquipmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const equipment = await EquipmentModel.findById(id);

      if (!equipment) {
        res.status(404).json({
          success: false,
          message: 'Equipment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: equipment,
      });
    } catch (error: any) {
      console.error('[EquipmentController.getEquipmentById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment details',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/owner/equipment
   * Retrieve all equipment owned by the authenticated owner
   */
  static async getOwnerEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const equipment = await EquipmentModel.findByOwnerId(ownerId);

      res.status(200).json({
        success: true,
        count: equipment.length,
        data: equipment,
      });
    } catch (error: any) {
      console.error('[EquipmentController.getOwnerEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve your equipment',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/owner/equipment
   * Owner adds new agricultural equipment
   */
  static async createOwnerEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { name, category, description, brand, model, image_url, price_per_hour, location } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Equipment name is required' });
        return;
      }
      if (!category || !category.trim()) {
        res.status(400).json({ success: false, message: 'Category is required' });
        return;
      }
      const parsedPrice = parseFloat(price_per_hour);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        res.status(400).json({ success: false, message: 'Price per hour must be a positive number' });
        return;
      }
      if (!location || !location.trim()) {
        res.status(400).json({ success: false, message: 'Location is required' });
        return;
      }

      const created = await EquipmentModel.create({
        owner_id: ownerId,
        name: name.trim(),
        category: category.trim(),
        description: description ? description.trim() : '',
        brand: brand ? brand.trim() : '',
        model: model ? model.trim() : '',
        image_url: image_url ? image_url.trim() : '',
        price_per_hour: parsedPrice,
        location: location.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Equipment listed successfully and submitted for admin review.',
        data: created,
      });
    } catch (error: any) {
      console.error('[EquipmentController.createOwnerEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create equipment',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/owner/equipment/:id
   * Owner updates existing equipment
   */
  static async updateOwnerEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { id } = req.params;
      const { name, category, description, brand, model, image_url, price_per_hour, location, availability_status } = req.body;

      const existing = await EquipmentModel.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Equipment not found' });
        return;
      }

      if (existing.owner_id !== ownerId) {
        res.status(403).json({ success: false, message: 'You are not authorized to edit this equipment' });
        return;
      }

      let parsedPrice: number | undefined = undefined;
      if (price_per_hour !== undefined) {
        parsedPrice = parseFloat(price_per_hour);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          res.status(400).json({ success: false, message: 'Price per hour must be a positive number' });
          return;
        }
      }

      const updated = await EquipmentModel.updateByOwner(id, ownerId, {
        name,
        category,
        description,
        brand,
        model,
        image_url,
        price_per_hour: parsedPrice,
        location,
        availability_status,
      });

      res.status(200).json({
        success: true,
        message: 'Equipment updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('[EquipmentController.updateOwnerEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update equipment',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/owner/equipment/:id
   * Owner deletes equipment
   */
  static async deleteOwnerEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { id } = req.params;

      const existing = await EquipmentModel.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Equipment not found' });
        return;
      }

      if (existing.owner_id !== ownerId) {
        res.status(403).json({ success: false, message: 'You are not authorized to delete this equipment' });
        return;
      }

      const hasActive = await EquipmentModel.hasActiveBookings(id);
      if (hasActive) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete equipment that has active or confirmed bookings.',
        });
        return;
      }

      await EquipmentModel.delete(id, ownerId);

      res.status(200).json({
        success: true,
        message: 'Equipment deleted successfully',
      });
    } catch (error: any) {
      console.error('[EquipmentController.deleteOwnerEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete equipment',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/equipment
   * Admin lists all equipment with filters
   */
  static async getAdminEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { approval_status, search } = req.query;
      const equipment = await EquipmentModel.findAllForAdmin({
        approval_status: approval_status ? String(approval_status) : undefined,
        search: search ? String(search) : undefined,
      });

      res.status(200).json({
        success: true,
        count: equipment.length,
        data: equipment,
      });
    } catch (error: any) {
      console.error('[EquipmentController.getAdminEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve equipment for admin',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/equipment/:id/approve
   * Admin approves equipment
   */
  static async approveEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await EquipmentModel.findById(id);
      const updated = await EquipmentModel.adminUpdateStatus(id, { approval_status: 'APPROVED' });

      if (!updated) {
        res.status(404).json({ success: false, message: 'Equipment not found' });
        return;
      }

      await AuditService.log({
        req,
        action: 'APPROVE_EQUIPMENT',
        entityType: 'EQUIPMENT',
        entityId: id,
        oldValues: { approval_status: existing?.approval_status },
        newValues: { approval_status: 'APPROVED', name: updated.name },
      });

      if (existing) {
        NotificationService.sendNotification({
          userId: existing.owner_id,
          title: 'Equipment Listing Approved',
          message: `Your listing for ${updated.name} has been reviewed and approved by admin. It is now live in the rental marketplace!`,
          notificationType: 'SYSTEM',
          referenceType: 'EQUIPMENT',
          referenceId: id,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Equipment approved successfully for public rental',
        data: updated,
      });
    } catch (error: any) {
      console.error('[EquipmentController.approveEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve equipment',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/equipment/:id/reject
   * Admin rejects equipment
   */
  static async rejectEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await EquipmentModel.findById(id);
      const updated = await EquipmentModel.adminUpdateStatus(id, { approval_status: 'REJECTED' });

      if (!updated) {
        res.status(404).json({ success: false, message: 'Equipment not found' });
        return;
      }

      await AuditService.log({
        req,
        action: 'REJECT_EQUIPMENT',
        entityType: 'EQUIPMENT',
        entityId: id,
        oldValues: { approval_status: existing?.approval_status },
        newValues: { approval_status: 'REJECTED', name: updated.name },
      });

      if (existing) {
        NotificationService.sendNotification({
          userId: existing.owner_id,
          title: 'Equipment Listing Not Approved',
          message: `Your listing for ${updated.name} was rejected by admin. Please verify details and resubmit.`,
          notificationType: 'SYSTEM',
          referenceType: 'EQUIPMENT',
          referenceId: id,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Equipment rejected',
        data: updated,
      });
    } catch (error: any) {
      console.error('[EquipmentController.rejectEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject equipment',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/equipment/:id/toggle-status
   * Admin toggles availability status (AVAILABLE <-> UNAVAILABLE)
   */
  static async toggleAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const current = await EquipmentModel.findById(id);

      if (!current) {
        res.status(404).json({ success: false, message: 'Equipment not found' });
        return;
      }

      const newStatus = current.availability_status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
      const updated = await EquipmentModel.adminUpdateStatus(id, { availability_status: newStatus });

      await AuditService.log({
        req,
        action: 'TOGGLE_EQUIPMENT_AVAILABILITY',
        entityType: 'EQUIPMENT',
        entityId: id,
        oldValues: { availability_status: current.availability_status },
        newValues: { availability_status: newStatus, name: current.name },
      });

      res.status(200).json({
        success: true,
        message: `Equipment availability set to ${newStatus}`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[EquipmentController.toggleAvailability] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle equipment availability',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/admin/equipment/:id
   * Admin deletes equipment
   */
  static async adminDeleteEquipment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await EquipmentModel.findById(id);
      const deleted = await EquipmentModel.delete(id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Equipment not found' });
        return;
      }

      await AuditService.log({
        req,
        action: 'DELETE_EQUIPMENT',
        entityType: 'EQUIPMENT',
        entityId: id,
        oldValues: { name: existing?.name, category: existing?.category, owner_id: existing?.owner_id },
        newValues: { deleted: true },
      });

      res.status(200).json({
        success: true,
        message: 'Equipment deleted by admin',
      });
    } catch (error: any) {
      console.error('[EquipmentController.adminDeleteEquipment] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete equipment',
        error: error.message,
      });
    }
  }
}
