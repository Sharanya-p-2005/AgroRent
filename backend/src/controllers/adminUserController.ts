import { Request, Response } from 'express';
import { UserModel } from '../models/userModel.js';
import { AuditService } from '../services/auditService.js';

export class AdminUserController {
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const role = req.query.role as string;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const result = await UserModel.getAdminUsersList({
        page,
        limit,
        role,
        status,
        search,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[AdminUserController.getUsers] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve platform users',
        error: error.message,
      });
    }
  }

  static async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserModel.getUserFullDetails(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User account not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('[AdminUserController.getUserDetails] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile and history',
        error: error.message,
      });
    }
  }

  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED',
        });
        return;
      }

      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const oldStatus = existingUser.status || (existingUser.is_active ? 'ACTIVE' : 'INACTIVE');
      const updated = await UserModel.updateStatus(id, status);

      // Record audit log
      await AuditService.log({
        req,
        action: `USER_STATUS_${status}`,
        entityType: 'USER',
        entityId: id,
        oldValues: { status: oldStatus, is_active: existingUser.is_active },
        newValues: { status, is_active: status === 'ACTIVE', reason: reason || 'Administrative decision' },
      });

      res.status(200).json({
        success: true,
        message: `User status successfully updated to ${status}`,
        data: {
          id: updated?.id,
          name: updated?.name,
          email: updated?.email,
          role: updated?.role,
          status: updated?.status,
          is_active: updated?.is_active,
        },
      });
    } catch (error: any) {
      console.error('[AdminUserController.updateUserStatus] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user account status',
        error: error.message,
      });
    }
  }
}
