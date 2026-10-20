/**
 * Phase 10: AI Routes
 * Registers endpoints for AI Chat, Conversation Management,
 * Natural-Language Search, Smart Recommendations, and Admin Telemetry.
 */

import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Chat and Conversation History
router.post('/chat', requireAuth, aiRateLimiter, AiController.chat);
router.get('/conversations', requireAuth, AiController.getConversations);
router.post('/conversations', requireAuth, AiController.createConversation);
router.get('/conversations/:id', requireAuth, AiController.getConversationById);
router.delete('/conversations/:id', requireAuth, AiController.deleteConversation);

// Natural-Language Search
router.post('/search', optionalAuth, AiController.search);

// Smart Recommendations (Authenticated per farmer)
router.get('/recommendations/equipment', requireAuth, AiController.getEquipmentRecommendations);
router.get('/recommendations/animals', requireAuth, AiController.getAnimalRecommendations);
router.get('/recommendations/drivers', requireAuth, AiController.getDriverRecommendations);
router.get('/recommendations/workers', requireAuth, AiController.getWorkerRecommendations);
router.get('/recommendations/schemes', requireAuth, AiController.getSchemeRecommendations);
router.get('/recommendations/resources', requireAuth, AiController.getResourceRecommendations);

// Admin Monitoring (Protected by requireAdmin)
router.get('/admin/usage', requireAuth, requireAdmin, AiController.getAdminUsage);
router.get('/admin/errors', requireAuth, requireAdmin, AiController.getAdminErrors);

export default router;
