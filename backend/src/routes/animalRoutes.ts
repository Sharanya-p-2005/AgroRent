import { Router } from 'express';
import { AnimalController } from '../controllers/animalController.js';

const router = Router();

// Public / Farmer marketplace animal & bird browsing & details
router.get('/', AnimalController.getPublicAnimals);
router.get('/:id', AnimalController.getAnimalById);

export default router;
