import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { UserModel } from '../models/userModel.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
      });
    }

    // Verify user still exists and is active in database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'User account suspended. Please contact support.',
        suspended: true,
      });
    }

    if (!user.is_active || user.status === 'INACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'User account deactivated. Please contact support.',
      });
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error: any) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
}

// Role-specific middleware
export const requireFarmer = requireRole(['FARMER']);
export const requireOwner = requireRole(['OWNER']);
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Optional authentication middleware:
 * Populates req.user if a valid bearer token is present, but never blocks or errors out if absent or invalid.
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = verifyToken(token);
          const user = await UserModel.findById(decoded.id);
          if (user && user.is_active) {
            req.user = {
              id: user.id,
              role: user.role,
              email: user.email,
              name: user.name,
            };
          }
        } catch {
          // Ignore invalid token in optional auth
        }
      }
    }
  } catch {
    // Ignore any auth lookup errors
  }
  next();
}

