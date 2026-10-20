import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', InvoiceController.getAll);
router.get('/:id', InvoiceController.getById);

export default router;
