import { Request, Response, NextFunction } from 'express';
import { PlatformSettingsModel } from '../models/platformSettingsModel.js';
import { verifyToken } from '../utils/jwt.js';

export async function maintenanceMiddleware(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    // Exempt health check and admin API endpoints
    const path = req.path;
    if (
      path.startsWith('/api/health') ||
      path.startsWith('/api/admin') ||
      path === '/api/auth/login' ||
      !path.startsWith('/api')
    ) {
      return next();
    }

    const isMaintenance = await PlatformSettingsModel.get('maintenance_mode', 'false');
    if (isMaintenance !== 'true') {
      return next();
    }

    // Check if current user is an Admin
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.role === 'ADMIN') {
          return next();
        }
      } catch (e) {
        // Token invalid, continue to block
      }
    }

    return res.status(503).json({
      success: false,
      message: 'AgroRent is temporarily under maintenance. Please try again later.',
      maintenance: true,
    });
  } catch (error) {
    // On unexpected error, do not block traffic
    next();
  }
}
