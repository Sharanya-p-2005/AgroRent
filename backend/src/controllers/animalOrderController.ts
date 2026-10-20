import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AnimalOrderModel } from '../models/animalOrderModel.js';
import { PaymentService } from '../services/paymentService.js';
import { NotificationService } from '../services/notificationService.js';

export class AnimalOrderController {
  /**
   * POST /api/animal-orders
   * Farmer creates an order for an animal or bird
   */
  static async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const buyerId = req.user!.id;
      const {
        listing_id,
        quantity,
        delivery_name,
        delivery_phone,
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_pincode,
        delivery_latitude,
        delivery_longitude,
        delivery_address_id,
      } = req.body;

      if (!listing_id) {
        res.status(400).json({ success: false, message: 'Listing ID is required' });
        return;
      }
      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty < 1) {
        res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        return;
      }
      if (!delivery_name || !delivery_name.trim()) {
        res.status(400).json({ success: false, message: 'Delivery contact name is required' });
        return;
      }
      if (!delivery_phone || !/^\d{10,12}$/.test(delivery_phone.replace(/\D/g, ''))) {
        res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
        return;
      }
      if (!delivery_address || !delivery_address.trim()) {
        res.status(400).json({ success: false, message: 'Delivery address is required' });
        return;
      }
      if (!delivery_city || !delivery_city.trim()) {
        res.status(400).json({ success: false, message: 'City is required' });
        return;
      }
      if (!delivery_state || !delivery_state.trim()) {
        res.status(400).json({ success: false, message: 'State is required' });
        return;
      }
      if (!delivery_pincode || !/^\d{6}$/.test(delivery_pincode.trim())) {
        res.status(400).json({ success: false, message: 'Valid 6-digit postal pincode is required' });
        return;
      }

      const order = await AnimalOrderModel.createOrder(buyerId, {
        listing_id,
        quantity: parsedQty,
        delivery_name,
        delivery_phone,
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_pincode,
        delivery_latitude: delivery_latitude ? parseFloat(delivery_latitude) : undefined,
        delivery_longitude: delivery_longitude ? parseFloat(delivery_longitude) : undefined,
        delivery_address_id: delivery_address_id || undefined,
      });

      // Automatically initialize internal payment record for this animal order
      const payment = await PaymentService.getOrCreatePaymentForTarget(
        buyerId,
        'ANIMAL_ORDER',
        order.id
      );

      // Notify animal seller of new order
      NotificationService.onAnimalOrderCreated({
        id: order.id,
        seller_id: order.seller_id,
        quantity: parsedQty,
        total_amount: order.total_amount,
        animal_name: (order as any).listing_name,
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully! You may now proceed to payment.',
        data: {
          ...order,
          payment_reference: payment.payment_reference,
        },
        payment,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.createOrder] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to place order',
      });
    }
  }

  /**
   * GET /api/farmer/animal-orders
   * Farmer gets their own placed orders
   */
  static async getFarmerOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const buyerId = req.user!.id;
      const orders = await AnimalOrderModel.getFarmerOrders(buyerId);

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.getFarmerOrders] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/farmer/animal-orders/:id
   * Farmer gets detailed order receipt
   */
  static async getFarmerOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const buyerId = req.user!.id;
      const { id } = req.params;

      const order = await AnimalOrderModel.getFarmerOrderById(id, buyerId);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.getFarmerOrderById] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve order details',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/farmer/animal-orders/:id/cancel
   * Farmer cancels an eligible order (PLACED or CONFIRMED only)
   * Restores quantity back to listing
   */
  static async cancelFarmerOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const buyerId = req.user!.id;
      const { id } = req.params;

      const cancelled = await AnimalOrderModel.cancelOrder(id, buyerId);

      res.status(200).json({
        success: true,
        message: 'Your order has been cancelled and livestock stock restored.',
        data: cancelled,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.cancelFarmerOrder] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to cancel order',
      });
    }
  }

  /**
   * GET /api/owner/animal-orders
   * Owner gets all orders for their listed animals/birds
   */
  static async getOwnerOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const orders = await AnimalOrderModel.getOwnerOrders(sellerId);

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.getOwnerOrders] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customer orders',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/owner/animal-orders/:id/confirm
   * Owner confirms the order (PLACED -> CONFIRMED)
   */
  static async confirmOwnerOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;

      const updated = await AnimalOrderModel.updateOrderStatusBySeller(id, sellerId, 'CONFIRMED');

      NotificationService.onAnimalOrderStatusChanged(
        { id: updated.id, buyer_id: updated.buyer_id, seller_id: updated.seller_id },
        'CONFIRMED',
        (updated as any).listing_name
      );

      res.status(200).json({
        success: true,
        message: 'Order confirmed successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.confirmOwnerOrder] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to confirm order',
      });
    }
  }

  /**
   * PUT /api/owner/animal-orders/:id/reject
   * Owner rejects the order (PLACED -> REJECTED)
   * Restores stock
   */
  static async rejectOwnerOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;

      const updated = await AnimalOrderModel.updateOrderStatusBySeller(id, sellerId, 'REJECTED');

      NotificationService.onAnimalOrderStatusChanged(
        { id: updated.id, buyer_id: updated.buyer_id, seller_id: updated.seller_id },
        'REJECTED',
        (updated as any).listing_name
      );

      res.status(200).json({
        success: true,
        message: 'Order rejected and inventory restored.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.rejectOwnerOrder] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to reject order',
      });
    }
  }

  /**
   * PUT /api/owner/animal-orders/:id/ship
   * Owner marks order as shipped / dispatched (CONFIRMED -> SHIPPED)
   */
  static async shipOwnerOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;

      const updated = await AnimalOrderModel.updateOrderStatusBySeller(id, sellerId, 'SHIPPED');

      NotificationService.onAnimalOrderStatusChanged(
        { id: updated.id, buyer_id: updated.buyer_id, seller_id: updated.seller_id },
        'SHIPPED',
        (updated as any).listing_name
      );

      res.status(200).json({
        success: true,
        message: 'Order marked as shipped/in-transit to farmer.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.shipOwnerOrder] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update order status',
      });
    }
  }

  /**
   * PUT /api/owner/animal-orders/:id/deliver
   * Owner marks order as delivered (SHIPPED -> DELIVERED)
   */
  static async deliverOwnerOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;

      const updated = await AnimalOrderModel.updateOrderStatusBySeller(id, sellerId, 'DELIVERED');

      NotificationService.onAnimalOrderStatusChanged(
        { id: updated.id, buyer_id: updated.buyer_id, seller_id: updated.seller_id },
        'DELIVERED',
        (updated as any).listing_name
      );

      res.status(200).json({
        success: true,
        message: 'Order marked as delivered.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.deliverOwnerOrder] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to complete order',
      });
    }
  }

  /**
   * GET /api/admin/animal-orders
   * Admin: view all marketplace orders
   */
  static async getAdminOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, search } = req.query;
      const orders = await AnimalOrderModel.getAllOrdersForAdmin({
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error: any) {
      console.error('[AnimalOrderController.getAdminOrders] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin orders',
        error: error.message,
      });
    }
  }
}
