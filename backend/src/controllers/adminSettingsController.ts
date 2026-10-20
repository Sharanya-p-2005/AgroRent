import { Request, Response } from 'express';
import { PlatformSettingsModel } from '../models/platformSettingsModel.js';
import { AuditService } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class AdminSettingsController {
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await PlatformSettingsModel.getAll();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('[AdminSettingsController.getSettings] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve platform settings',
        error: error.message,
      });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const newSettings = req.body;
      const oldSettings = await PlatformSettingsModel.getAll();

      const updated = await PlatformSettingsModel.updateBulk(newSettings, req.user?.id);

      // Record audit log
      await AuditService.log({
        req,
        action: 'UPDATE_PLATFORM_SETTINGS',
        entityType: 'SETTINGS',
        entityId: 'global',
        oldValues: oldSettings,
        newValues: updated,
      });

      res.status(200).json({
        success: true,
        message: 'Platform settings updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AdminSettingsController.updateSettings] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update platform settings',
        error: error.message,
      });
    }
  }
}
