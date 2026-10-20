import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AnimalListingModel } from '../models/animalListingModel.js';
import { AnimalOrderModel } from '../models/animalOrderModel.js';
import { AuditService } from '../services/auditService.js';

export class AnimalController {
  /**
   * GET /api/animals
   * Public / Farmer endpoint to browse approved & available animal & bird listings
   */
  static async getPublicAnimals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        search,
        listing_type,
        category,
        gender,
        location,
        min_price,
        max_price,
        sort,
      } = req.query;

      const filters = {
        search: search ? String(search) : undefined,
        listing_type: listing_type ? String(listing_type) : undefined,
        category: category ? String(category) : undefined,
        gender: gender ? String(gender) : undefined,
        location: location ? String(location) : undefined,
        min_price: min_price ? parseFloat(String(min_price)) : undefined,
        max_price: max_price ? parseFloat(String(max_price)) : undefined,
        sort: (sort as any) || 'newest',
      };

      const listings = await AnimalListingModel.getPublicListings(filters);
      res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } catch (error: any) {
      console.error('[AnimalController.getPublicAnimals] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve animal listings',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/animals/:id
   * Get details of a single animal or bird listing
   */
  static async getAnimalById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const listing = await AnimalListingModel.getById(id);

      if (!listing) {
        res.status(404).json({
          success: false,
          message: 'Listing not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error: any) {
      console.error('[AnimalController.getAnimalById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve animal details',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/owner/animals
   * Owner: get all listings created by the authenticated owner
   */
  static async getOwnerAnimals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const listings = await AnimalListingModel.getBySellerId(sellerId);

      res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } catch (error: any) {
      console.error('[AnimalController.getOwnerAnimals] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve your animal listings',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/owner/animals/stats
   * Owner: retrieve animal metrics for dashboard
   */
  static async getOwnerStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const animalStats = await AnimalListingModel.getOwnerStats(sellerId);
      const orderStats = await AnimalOrderModel.getOwnerOrderStats(sellerId);

      res.status(200).json({
        success: true,
        data: {
          ...animalStats,
          ...orderStats,
        },
      });
    } catch (error: any) {
      console.error('[AnimalController.getOwnerStats] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve owner animal statistics',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/owner/animals
   * Owner creates a new animal or bird listing
   */
  static async createOwnerAnimal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const {
        listing_type,
        category,
        name,
        breed,
        age,
        gender,
        description,
        price,
        quantity,
        location,
        image_url,
        health_status,
      } = req.body;

      // Validation
      if (!listing_type || !['ANIMAL', 'BIRD'].includes(listing_type.toUpperCase())) {
        res.status(400).json({ success: false, message: "Listing type must be 'ANIMAL' or 'BIRD'" });
        return;
      }
      if (!category || !category.trim()) {
        res.status(400).json({ success: false, message: 'Category is required' });
        return;
      }
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      if (!age || !age.trim()) {
        res.status(400).json({ success: false, message: 'Age is required' });
        return;
      }
      if (!gender || !['MALE', 'FEMALE', 'OTHER'].includes(gender.toUpperCase())) {
        res.status(400).json({ success: false, message: "Gender must be 'MALE', 'FEMALE', or 'OTHER'" });
        return;
      }
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        res.status(400).json({ success: false, message: 'Price must be a positive number' });
        return;
      }
      const parsedQuantity = quantity !== undefined ? parseInt(quantity, 10) : 1;
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        return;
      }
      if (!location || !location.trim()) {
        res.status(400).json({ success: false, message: 'Location is required' });
        return;
      }

      const listing = await AnimalListingModel.create(sellerId, {
        listing_type: listing_type.toUpperCase() as any,
        category: category.trim(),
        name: name.trim(),
        breed: breed ? breed.trim() : undefined,
        age: age.trim(),
        gender: gender.toUpperCase() as any,
        description: description ? description.trim() : undefined,
        price: parsedPrice,
        quantity: parsedQuantity,
        location: location.trim(),
        image_url: image_url ? image_url.trim() : undefined,
        health_status: health_status ? health_status.trim() : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Listing created successfully and submitted for admin review.',
        data: listing,
      });
    } catch (error: any) {
      console.error('[AnimalController.createOwnerAnimal] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create animal listing',
      });
    }
  }

  /**
   * PUT /api/owner/animals/:id
   * Owner edits an existing listing
   */
  static async updateOwnerAnimal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;
      const {
        listing_type,
        category,
        name,
        breed,
        age,
        gender,
        description,
        price,
        quantity,
        location,
        image_url,
        health_status,
        availability_status,
      } = req.body;

      const updatePayload: any = {};

      if (listing_type) {
        if (!['ANIMAL', 'BIRD'].includes(listing_type.toUpperCase())) {
          res.status(400).json({ success: false, message: "Listing type must be 'ANIMAL' or 'BIRD'" });
          return;
        }
        updatePayload.listing_type = listing_type.toUpperCase();
      }
      if (category !== undefined) updatePayload.category = category.trim();
      if (name !== undefined) updatePayload.name = name.trim();
      if (breed !== undefined) updatePayload.breed = breed.trim();
      if (age !== undefined) updatePayload.age = age.trim();
      if (gender !== undefined) {
        if (!['MALE', 'FEMALE', 'OTHER'].includes(gender.toUpperCase())) {
          res.status(400).json({ success: false, message: "Gender must be 'MALE', 'FEMALE', or 'OTHER'" });
          return;
        }
        updatePayload.gender = gender.toUpperCase();
      }
      if (description !== undefined) updatePayload.description = description.trim();
      if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          res.status(400).json({ success: false, message: 'Price must be a positive number' });
          return;
        }
        updatePayload.price = parsedPrice;
      }
      if (quantity !== undefined) {
        const parsedQty = parseInt(quantity, 10);
        if (isNaN(parsedQty) || parsedQty < 0) {
          res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
          return;
        }
        updatePayload.quantity = parsedQty;
        if (parsedQty === 0) {
          updatePayload.availability_status = 'SOLD';
        }
      }
      if (location !== undefined) updatePayload.location = location.trim();
      if (image_url !== undefined) updatePayload.image_url = image_url.trim();
      if (health_status !== undefined) updatePayload.health_status = health_status.trim();
      if (availability_status !== undefined) {
        if (!['AVAILABLE', 'SOLD', 'UNAVAILABLE'].includes(availability_status.toUpperCase())) {
          res.status(400).json({ success: false, message: 'Invalid availability status' });
          return;
        }
        updatePayload.availability_status = availability_status.toUpperCase();
      }

      const updated = await AnimalListingModel.update(id, sellerId, updatePayload);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Listing not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Listing updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AnimalController.updateOwnerAnimal] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update animal listing',
      });
    }
  }

  /**
   * DELETE /api/owner/animals/:id
   * Owner deletes their own listing
   */
  static async deleteOwnerAnimal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;

      const deleted = await AnimalListingModel.delete(id, sellerId);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Listing not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Listing deleted successfully.',
      });
    } catch (error: any) {
      console.error('[AnimalController.deleteOwnerAnimal] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete listing',
      });
    }
  }

  /**
   * GET /api/admin/animals
   * Admin retrieves all animal & bird listings
   */
  static async getAdminAnimals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, approval_status, availability_status, listing_type } = req.query;
      const listings = await AnimalListingModel.getAllForAdmin({
        search: search ? String(search) : undefined,
        approval_status: approval_status ? String(approval_status) : undefined,
        availability_status: availability_status ? String(availability_status) : undefined,
        listing_type: listing_type ? String(listing_type) : undefined,
      });

      res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } catch (error: any) {
      console.error('[AnimalController.getAdminAnimals] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin animal listings',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/animals/:id/approve
   * Admin approves a listing
   */
  static async approveAnimal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await AnimalListingModel.getById(id);
      const approved = await AnimalListingModel.adminApprove(id);
      if (!approved) {
        res.status(404).json({ success: false, message: 'Listing not found' });
        return;
      }

      await AuditService.log({
        req,
        action: 'APPROVE_ANIMAL',
        entityType: 'ANIMAL',
        entityId: id,
        oldValues: { approval_status: existing?.approval_status },
        newValues: { approval_status: 'APPROVED', name: approved.name },
      });

      res.status(200).json({
        success: true,
        message: 'Listing approved successfully and is now active on the marketplace.',
        data: approved,
      });
    } catch (error: any) {
      console.error('[AnimalController.approveAnimal] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve listing',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/animals/:id/reject
   * Admin rejects a listing with optional reason
   */
  static async rejectAnimal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const existing = await AnimalListingModel.getById(id);
      const rejected = await AnimalListingModel.adminReject(id, reason);
      if (!rejected) {
        res.status(404).json({ success: false, message: 'Listing not found' });
        return;
      }

      await AuditService.log({
        req,
        action: 'REJECT_ANIMAL',
        entityType: 'ANIMAL',
        entityId: id,
        oldValues: { approval_status: existing?.approval_status },
        newValues: { approval_status: 'REJECTED', name: rejected.name, rejection_reason: reason },
      });

      res.status(200).json({
        success: true,
        message: 'Listing has been rejected.',
        data: rejected,
      });
    } catch (error: any) {
      console.error('[AnimalController.rejectAnimal] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject listing',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/animals/:id/disable
   * Admin disables a listing
   */
  static async disableAnimal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await AnimalListingModel.getById(id);
      const disabled = await AnimalListingModel.adminDisable(id);
      if (!disabled) {
        res.status(404).json({ success: false, message: 'Listing not found' });
        return;
      }

      await AuditService.log({
        req,
        action: 'DISABLE_ANIMAL',
        entityType: 'ANIMAL',
        entityId: id,
        oldValues: { availability_status: existing?.availability_status },
        newValues: { availability_status: 'UNAVAILABLE', name: disabled.name },
      });

      res.status(200).json({
        success: true,
        message: 'Listing has been disabled from public view.',
        data: disabled,
      });
    } catch (error: any) {
      console.error('[AnimalController.disableAnimal] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable listing',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/admin/animals/:id
   * Admin deletes a listing
   */
  static async deleteAdminAnimal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await AnimalListingModel.getById(id);
      const deleted = await AnimalListingModel.adminDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Listing not found' });
        return;
      }

      await AuditService.log({
        req,
        action: 'DELETE_ANIMAL',
        entityType: 'ANIMAL',
        entityId: id,
        oldValues: { name: existing?.name, category: existing?.category, seller_id: existing?.seller_id },
        newValues: { deleted: true },
      });

      res.status(200).json({
        success: true,
        message: 'Listing deleted by administrator.',
      });
    } catch (error: any) {
      console.error('[AnimalController.deleteAdminAnimal] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete listing',
        error: error.message,
      });
    }
  }
}
