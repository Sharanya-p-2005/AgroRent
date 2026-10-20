import { Router } from 'express';
import { TestController } from '../controllers/testController.js';
import { EquipmentController } from '../controllers/equipmentController.js';
import { BookingController } from '../controllers/bookingController.js';
import { AnimalController } from '../controllers/animalController.js';
import { AnimalOrderController } from '../controllers/animalOrderController.js';
import { ServiceController } from '../controllers/serviceController.js';
import { ServiceBookingController } from '../controllers/serviceBookingController.js';
import { PaymentController } from '../controllers/paymentController.js';
import { DeliveryController } from '../controllers/deliveryController.js';
import { requireAuth, requireOwner } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all /api/owner routes: must be authenticated and have role OWNER
router.use(requireAuth, requireOwner);

// Test endpoint for verifying owner authorization
router.get('/test', TestController.ownerTest);

// Owner Equipment management
router.get('/equipment', EquipmentController.getOwnerEquipment);
router.post('/equipment', EquipmentController.createOwnerEquipment);
router.put('/equipment/:id', EquipmentController.updateOwnerEquipment);
router.delete('/equipment/:id', EquipmentController.deleteOwnerEquipment);

// Owner Bookings management
router.get('/bookings', BookingController.getOwnerBookings);
router.put('/bookings/:id/status', BookingController.updateOwnerBookingStatus);

// Owner Earnings summary
router.get('/earnings', BookingController.getOwnerEarnings);

// Owner Animal & Bird listings management
router.get('/animals/stats', AnimalController.getOwnerStats);
router.get('/animals', AnimalController.getOwnerAnimals);
router.post('/animals', AnimalController.createOwnerAnimal);
router.put('/animals/:id', AnimalController.updateOwnerAnimal);
router.delete('/animals/:id', AnimalController.deleteOwnerAnimal);

// Owner Animal Orders management
router.get('/animal-orders', AnimalOrderController.getOwnerOrders);
router.put('/animal-orders/:id/confirm', AnimalOrderController.confirmOwnerOrder);
router.put('/animal-orders/:id/reject', AnimalOrderController.rejectOwnerOrder);
router.put('/animal-orders/:id/ship', AnimalOrderController.shipOwnerOrder);
router.put('/animal-orders/:id/deliver', AnimalOrderController.deliverOwnerOrder);

// Owner Driver & Farm Worker Services management
router.get('/services', ServiceController.getOwnerServices);
router.post('/services', ServiceController.createOwnerService);
router.put('/services/:id', ServiceController.updateOwnerService);
router.delete('/services/:id', ServiceController.deleteOwnerService);
router.put('/services/:id/availability', ServiceController.toggleAvailability);

// Owner Service Bookings & Fulfillment
router.get('/service-bookings', ServiceBookingController.getOwnerBookings);
router.put('/service-bookings/:id/confirm', ServiceBookingController.confirmBooking);
router.put('/service-bookings/:id/reject', ServiceBookingController.rejectBooking);
router.put('/service-bookings/:id/active', ServiceBookingController.markActive);
router.put('/service-bookings/:id/complete', ServiceBookingController.markCompleted);

// Owner Service Earnings
router.get('/service-earnings', ServiceBookingController.getOwnerEarnings);

// Owner Payments & Consolidated Multi-Channel Revenue
router.get('/payments', PaymentController.getOwnerPayments);

// Phase 9: Owner Delivery Oversight & Driver Assignment
router.get('/deliveries', DeliveryController.getAdminDeliveries);
router.get('/deliveries/drivers/available', DeliveryController.getAvailableDrivers);
router.post('/deliveries/:id/assign-driver', DeliveryController.assignDriver);
router.patch('/deliveries/:id/status', DeliveryController.updateDeliveryStatus);

export default router;

