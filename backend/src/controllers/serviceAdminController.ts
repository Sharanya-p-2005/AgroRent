import { Request, Response, NextFunction } from 'express';
import { ServiceProfileModel, ServiceType, ApprovalStatus } from '../models/serviceProfileModel.js';
import { ServiceBookingModel } from '../models/serviceBookingModel.js';

export class ServiceAdminController {
  /**
   * Admin: View all service profiles across platform
   * GET /api/admin/services
   */
  static async getAllServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, service_type, approval_status, search } = req.query;
      const filterType = (type || service_type) as ServiceType | undefined;
      const filterApproval = approval_status as ApprovalStatus | undefined;

      const services = await ServiceProfileModel.adminFindAll({
        service_type: filterType,
        approval_status: filterApproval,
        search: search ? String(search) : undefined,
      });

      res.json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Approve service profile
   * PUT /api/admin/services/:id/approve
   */
  static async approveService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await ServiceProfileModel.setApprovalStatus(id, 'APPROVED');

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found',
        });
      }

      res.json({
        success: true,
        message: 'Service profile approved and is now active in public marketplace',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Reject service profile
   * PUT /api/admin/services/:id/reject
   */
  static async rejectService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;

      const updated = await ServiceProfileModel.setApprovalStatus(
        id,
        'REJECTED',
        rejection_reason ? String(rejection_reason).trim() : 'Does not meet platform guidelines'
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found',
        });
      }

      res.json({
        success: true,
        message: 'Service profile rejected',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Disable service profile
   * PUT /api/admin/services/:id/disable
   */
  static async disableService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await ServiceProfileModel.setApprovalStatus(id, 'DISABLED');

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found',
        });
      }

      res.json({
        success: true,
        message: 'Service profile disabled',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Permanently delete service profile
   * DELETE /api/admin/services/:id
   */
  static async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = await ServiceProfileModel.adminDelete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found',
        });
      }

      res.json({
        success: true,
        message: 'Service profile deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Audit all service bookings across platform
   * GET /api/admin/service-bookings
   */
  static async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await ServiceBookingModel.adminFindAll();
      res.json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (err) {
      next(err);
    }
  }
}
