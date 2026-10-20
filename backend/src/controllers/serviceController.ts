import { Request, Response, NextFunction } from 'express';
import { ServiceProfileModel, ServiceType } from '../models/serviceProfileModel.js';

export class ServiceController {
  /**
   * Public: List approved and available services
   * GET /api/services
   */
  static async getPublicServices(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        service_type,
        type,
        search,
        location,
        skill,
        minPrice,
        maxPrice,
        minExperience,
        sortBy,
      } = req.query;

      const filterType = (service_type || type) as ServiceType | undefined;

      const services = await ServiceProfileModel.findAll({
        service_type: filterType,
        search: search ? String(search) : undefined,
        location: location ? String(location) : undefined,
        skill: skill ? String(skill) : undefined,
        minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
        minExperience: minExperience ? parseInt(String(minExperience), 10) : undefined,
        sortBy: sortBy as any,
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
   * Public: Get service profile details
   * GET /api/services/:id
   */
  static async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const profile = await ServiceProfileModel.findById(id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found',
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Owner: List all service profiles owned by the caller
   * GET /api/owner/services
   */
  static async getOwnerServices(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { type, service_type } = req.query;
      const filterType = (type || service_type) as ServiceType | undefined;

      const services = await ServiceProfileModel.findByOwnerId(userId, filterType);

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
   * Owner: Create a new service profile
   * POST /api/owner/services
   */
  static async createOwnerService(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const {
        service_type,
        type,
        name,
        phone,
        profile_image_url,
        description,
        experience_years,
        skills,
        price_per_hour,
        price_per_day,
        location,
      } = req.body;

      const targetType = service_type || type;

      // Validation
      if (!targetType || !['DRIVER', 'FARM_WORKER'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          message: "Service type must be either 'DRIVER' or 'FARM_WORKER'",
        });
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Service profile name is required',
        });
      }

      if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Contact phone number is required',
        });
      }

      const exp = parseInt(experience_years, 10);
      if (isNaN(exp) || exp < 0) {
        return res.status(400).json({
          success: false,
          message: 'Experience must be a valid number of years greater than or equal to 0',
        });
      }

      let skillsStr = '';
      if (Array.isArray(skills)) {
        skillsStr = skills.map(s => String(s).trim()).filter(Boolean).join(', ');
      } else if (typeof skills === 'string') {
        skillsStr = skills.trim();
      }

      if (!skillsStr) {
        return res.status(400).json({
          success: false,
          message: 'At least one skill is required',
        });
      }

      const hourlyRate = parseFloat(price_per_hour);
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price per hour must be greater than 0',
        });
      }

      const dailyRate = parseFloat(price_per_day);
      if (isNaN(dailyRate) || dailyRate <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price per day must be greater than 0',
        });
      }

      if (!location || typeof location !== 'string' || location.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Operating location is required',
        });
      }

      // Strictly use req.user.id, ignoring any user_id from req.body
      const newProfile = await ServiceProfileModel.create({
        user_id: userId,
        service_type: targetType as ServiceType,
        name: name.trim(),
        phone: phone.trim(),
        profile_image_url: profile_image_url ? String(profile_image_url).trim() : undefined,
        description: description ? String(description).trim() : undefined,
        experience_years: exp,
        skills: skillsStr,
        price_per_hour: hourlyRate,
        price_per_day: dailyRate,
        location: location.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Service profile submitted successfully and is pending admin approval',
        data: newProfile,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Owner: Update own service profile
   * PUT /api/owner/services/:id
   */
  static async updateOwnerService(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const {
        name,
        phone,
        profile_image_url,
        description,
        experience_years,
        skills,
        price_per_hour,
        price_per_day,
        location,
        availability_status,
      } = req.body;

      let skillsStr: string | undefined = undefined;
      if (skills !== undefined) {
        if (Array.isArray(skills)) {
          skillsStr = skills.map(s => String(s).trim()).filter(Boolean).join(', ');
        } else if (typeof skills === 'string') {
          skillsStr = skills.trim();
        }
      }

      const updated = await ServiceProfileModel.updateByOwner(id, userId, {
        name: name ? String(name).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        profile_image_url: profile_image_url !== undefined ? String(profile_image_url).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        experience_years: experience_years !== undefined ? parseInt(experience_years, 10) : undefined,
        skills: skillsStr,
        price_per_hour: price_per_hour !== undefined ? parseFloat(price_per_hour) : undefined,
        price_per_day: price_per_day !== undefined ? parseFloat(price_per_day) : undefined,
        location: location ? String(location).trim() : undefined,
        availability_status: availability_status,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found or you do not own it',
        });
      }

      res.json({
        success: true,
        message: 'Service profile updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Owner: Delete own service profile
   * DELETE /api/owner/services/:id
   */
  static async deleteOwnerService(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const success = await ServiceProfileModel.deleteByOwner(id, userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found or you do not own it',
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
   * Owner: Toggle profile availability
   * PUT /api/owner/services/:id/availability
   */
  static async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { availability_status } = req.body;

      if (!['AVAILABLE', 'UNAVAILABLE'].includes(availability_status)) {
        return res.status(400).json({
          success: false,
          message: "availability_status must be 'AVAILABLE' or 'UNAVAILABLE'",
        });
      }

      const updated = await ServiceProfileModel.updateByOwner(id, userId, {
        availability_status,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Service profile not found or you do not own it',
        });
      }

      res.json({
        success: true,
        message: `Profile availability updated to ${availability_status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
