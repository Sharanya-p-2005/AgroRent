import { Request, Response, NextFunction } from 'express';
import { DeliveryTrackingModel, DeliveryStatus } from '../models/deliveryTrackingModel.js';
import { isValidLatitude, isValidLongitude } from '../utils/geoUtils.js';
import { query } from '../config/db.js';

export class DeliveryController {
  /**
   * GET /api/deliveries
   * List deliveries accessible to the current authenticated user
   */
  static async getDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      let deliveries = [];
      if (user.role === 'ADMIN') {
        deliveries = await DeliveryTrackingModel.listDeliveries({
          deliveryStatus: req.query.status as string,
        });
      } else if (user.role === 'FARMER') {
        deliveries = await DeliveryTrackingModel.listDeliveries({
          buyerId: user.id,
          deliveryStatus: req.query.status as string,
        });
      } else if (user.role === 'OWNER') {
        // Owner may be seller OR assigned driver
        const asSeller = await DeliveryTrackingModel.listDeliveries({
          sellerId: user.id,
          deliveryStatus: req.query.status as string,
        });
        const asDriver = await DeliveryTrackingModel.listDeliveries({
          driverUserId: user.id,
          deliveryStatus: req.query.status as string,
        });

        const mergedMap = new Map<string, any>();
        asSeller.forEach((d) => mergedMap.set(d.order_id, d));
        asDriver.forEach((d) => mergedMap.set(d.order_id, d));
        deliveries = Array.from(mergedMap.values());
      }

      return res.json({
        success: true,
        data: deliveries,
        count: deliveries.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/deliveries/:id
   */
  static async getDeliveryById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const delivery = await DeliveryTrackingModel.getDeliveryById(id, user);
      if (!delivery) {
        return res.status(404).json({ success: false, message: 'Delivery record not found.' });
      }

      return res.json({
        success: true,
        data: delivery,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/deliveries/:id/status
   */
  static async updateDeliveryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { status, note, latitude, longitude } = req.body;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
      }

      let coords;
      if (latitude != null && longitude != null) {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (isValidLatitude(lat) && isValidLongitude(lon)) {
          coords = { latitude: lat, longitude: lon };
        }
      }

      const updated = await DeliveryTrackingModel.updateDeliveryStatus(
        id,
        status as DeliveryStatus,
        user.id,
        user.role,
        note,
        coords
      );

      return res.json({
        success: true,
        message: `Delivery status updated to ${status}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/deliveries/:id/location
   */
  static async updateDeliveryLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { latitude, longitude, note } = req.body;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (!isValidLatitude(lat) || !isValidLongitude(lon)) {
        return res.status(400).json({
          success: false,
          message: 'Valid GPS latitude (-90 to 90) and longitude (-180 to 180) are required.',
        });
      }

      const result = await DeliveryTrackingModel.recordDriverLocation(
        id,
        user.id,
        lat,
        lon,
        note
      );

      return res.json({
        success: true,
        message: 'Delivery location updated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/deliveries/:id/tracking
   */
  static async getDeliveryTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const delivery = await DeliveryTrackingModel.getDeliveryById(id, user);
      if (!delivery) {
        return res.status(404).json({ success: false, message: 'Delivery not found.' });
      }

      return res.json({
        success: true,
        data: {
          order_id: delivery.order_id,
          delivery_status: delivery.delivery_status,
          distance_km: delivery.distance_km,
          eta_text: delivery.eta_text,
          delivery_latitude: delivery.delivery_latitude,
          delivery_longitude: delivery.delivery_longitude,
          destination: `${delivery.delivery_address}, ${delivery.delivery_city}, ${delivery.delivery_state} - ${delivery.delivery_pincode}`,
          assigned_driver: delivery.assigned_driver_name
            ? {
                name: delivery.assigned_driver_name,
                phone: delivery.assigned_driver_phone,
                latitude: delivery.assigned_driver_lat,
                longitude: delivery.assigned_driver_lon,
              }
            : null,
          latest_tracking: delivery.latest_tracking,
          tracking_history: delivery.tracking_history,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/deliveries/stats
   */
  static async getDeliveryStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const stats = await DeliveryTrackingModel.getDeliveryStats(user?.id, user?.role);
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  /**
   * ADMIN: GET /api/admin/deliveries
   */
  static async getAdminDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const deliveries = await DeliveryTrackingModel.listDeliveries({
        deliveryStatus: status as string,
      });

      return res.json({
        success: true,
        data: deliveries,
        count: deliveries.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * ADMIN / OWNER: GET /api/admin/deliveries/drivers/available
   */
  static async getAvailableDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await DeliveryTrackingModel.getAvailableDrivers();
      return res.json({
        success: true,
        data: drivers,
        count: drivers.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * ADMIN / OWNER: POST /api/admin/deliveries/:id/assign-driver
   */
  static async assignDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { driver_id } = req.body;

      if (!driver_id) {
        return res.status(400).json({ success: false, message: 'Driver service profile ID is required.' });
      }

      const updated = await DeliveryTrackingModel.assignDriver(
        id,
        driver_id,
        user.id,
        user.role
      );

      return res.json({
        success: true,
        message: 'Driver assigned to delivery successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DRIVER: GET /api/driver/deliveries
   * Fetch deliveries assigned to the authenticated driver
   */
  static async getDriverDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const deliveries = await DeliveryTrackingModel.listDeliveries({
        driverUserId: user.id,
        deliveryStatus: req.query.status as string,
      });

      return res.json({
        success: true,
        data: deliveries,
        count: deliveries.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DRIVER: GET /api/driver/deliveries/:id
   */
  static async getDriverDeliveryById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const delivery = await DeliveryTrackingModel.getDeliveryById(id, user);
      if (!delivery) {
        return res.status(404).json({ success: false, message: 'Delivery not found.' });
      }

      return res.json({
        success: true,
        data: delivery,
      });
    } catch (err) {
      next(err);
    }
  }
}
