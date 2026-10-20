import { Request, Response } from 'express';
import { AuditLogModel } from '../models/auditLogModel.js';

export class AuditLogController {
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const action = req.query.action as string;
      const entity_type = req.query.entity_type as string;
      const user_id = req.query.user_id as string;
      const search = req.query.search as string;
      const from = req.query.from as string;
      const to = req.query.to as string;

      const result = await AuditLogModel.findAll({
        page,
        limit,
        action,
        entity_type,
        user_id,
        search,
        from,
        to,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[AuditLogController.getAuditLogs] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs',
        error: error.message,
      });
    }
  }

  static async getAuditLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const log = await AuditLogModel.findById(id);

      if (!log) {
        res.status(404).json({
          success: false,
          message: 'Audit log entry not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error: any) {
      console.error('[AuditLogController.getAuditLogById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit log details',
        error: error.message,
      });
    }
  }
}
