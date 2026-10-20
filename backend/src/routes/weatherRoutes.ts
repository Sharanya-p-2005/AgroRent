import { Router } from 'express';
import { WeatherController } from '../controllers/weatherController.js';

const router = Router();

// Public / Farmer weather endpoints
router.get('/current', WeatherController.getCurrent);
router.get('/forecast', WeatherController.getForecast);

export default router;
