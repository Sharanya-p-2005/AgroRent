import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class TestController {
  static health(req: Request, res: Response): any {
    return res.status(200).json({
      success: true,
      status: 'healthy',
      message: 'AgroRent API is running',
    });
  }

  static farmerTest(req: AuthenticatedRequest, res: Response): any {
    return res.status(200).json({
      success: true,
      message: 'Farmer access granted. Welcome to farmer services test endpoint.',
      user: req.user,
    });
  }

  static ownerTest(req: AuthenticatedRequest, res: Response): any {
    return res.status(200).json({
      success: true,
      message: 'Owner access granted. Welcome to owner services test endpoint.',
      user: req.user,
    });
  }

  static adminTest(req: AuthenticatedRequest, res: Response): any {
    return res.status(200).json({
      success: true,
      message: 'Admin access granted. Welcome to admin control test endpoint.',
      user: req.user,
    });
  }
}
