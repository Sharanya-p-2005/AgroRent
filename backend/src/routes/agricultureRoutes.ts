import { Router } from 'express';
import { AgricultureController } from '../controllers/agricultureController.js';

const router = Router();

router.post('/crop-recommendation', AgricultureController.getCropRecommendation);

export default router;
