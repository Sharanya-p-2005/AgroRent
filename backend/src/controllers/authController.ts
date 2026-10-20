import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { validateRegisterInput, validateLoginInput } from '../validators/authValidator.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { UserModel } from '../models/userModel.js';

export class AuthController {
  static async register(req: Request, res: Response): Promise<any> {
    try {
      const validation = validateRegisterInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors[0],
          errors: validation.errors,
        });
      }

      const result = await AuthService.register({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        role: req.body.role.toUpperCase(),
        address: req.body.address,
        village: req.body.village,
        taluk: req.body.taluk,
        district: req.body.district,
        state: req.body.state,
        pincode: req.body.pincode,
      });

      return res.status(result.status).json({
        success: result.success,
        message: result.message,
        ...(result.token && { token: result.token }),
        ...(result.user && { user: result.user }),
      });
    } catch (error: any) {
      console.error('[AuthController.register error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed due to a server error',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<any> {
    try {
      const validation = validateLoginInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors[0],
        });
      }

      const result = await AuthService.login(req.body.email, req.body.password);
      return res.status(result.status).json({
        success: result.success,
        message: result.message,
        ...(result.token && { token: result.token }),
        ...(result.user && { user: result.user }),
      });
    } catch (error: any) {
      console.error('[AuthController.login error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed due to a server error',
      });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const result = await AuthService.getCurrentUser(req.user.id);
      return res.status(result.status).json(result);
    } catch (error: any) {
      console.error('[AuthController.me error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const updated = await UserModel.updateProfile(req.user.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updated,
        data: updated,
      });
    } catch (error: any) {
      console.error('[AuthController.updateProfile error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<any> {
    // Client-side JWT logout is handled by discarding token;
    // API returns standard confirmation
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }
}
