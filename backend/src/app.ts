import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import animalRoutes from './routes/animalRoutes.js';
import animalOrderRoutes from './routes/animalOrderRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import serviceBookingRoutes from './routes/serviceBookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import aiRoutes from './ai/ai.routes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import agricultureRoutes from './routes/agricultureRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import { TestController } from './controllers/testController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { waitForMigrations } from './services/migrationService.js';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware.js';

export function createExpressApp() {
  const app = express();

  // Security Middleware - configured to allow embedding in AI Studio iframe
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      frameguard: false,
    })
  );

  // Enable CORS
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // JSON and URL parsing (with rawBody capture for webhook signature verification)
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // Public Health Endpoint (always responds immediately)
  app.get('/api/health', TestController.health);

  // Ensure DB migrations complete before handling application API requests
  app.use('/api', async (req, res, next) => {
    try {
      await waitForMigrations();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Check platform maintenance mode
  app.use(maintenanceMiddleware);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/animals', animalRoutes);
  app.use('/api/animal-orders', animalOrderRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/service-bookings', serviceBookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/schemes', schemeRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/deliveries', deliveryRoutes);
  app.use('/api/driver', driverRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/agriculture', agricultureRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/farmer', farmerRoutes);
  app.use('/api/owner', ownerRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 Handler for unmatched API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
