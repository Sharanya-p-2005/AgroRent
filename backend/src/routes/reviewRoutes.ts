import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public breakdown and target reviews
router.get('/breakdown', ReviewController.getBreakdown);
router.get('/:targetType/:targetId', ReviewController.getReviewsForTarget);

// Authenticated endpoints
router.use(requireAuth);

// Helpful and Report
router.post('/:id/helpful', ReviewController.markHelpful);
router.post('/:id/report', ReviewController.reportReview);

// Get completed transactions eligible for review by the logged-in farmer
router.get('/user/eligible', ReviewController.getEligibleReviews);

// Submit a new review (with strict backend transaction ownership and completion checks)
router.post('/', ReviewController.createReview);

// Update reviewer's own review
router.put('/:id', ReviewController.updateReview);

// Delete reviewer's own review
router.delete('/:id', ReviewController.deleteReview);

export default router;
