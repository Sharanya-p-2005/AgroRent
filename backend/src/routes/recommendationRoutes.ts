import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController.js';

const router = Router();

router.get('/', RecommendationController.getRecommendations);

export default router;
