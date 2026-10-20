/**
 * Phase 10: AI Controller
 * Handles Chat, Conversation History, Smart Recommendations,
 * Natural-Language Search, and Admin Telemetry endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { AiService } from './ai.service.js';
import { RecommendationService } from './recommendation.service.js';

export class AiController {
  /**
   * POST /api/ai/chat
   * Handles user chat message, stores history, and returns AI response with suggestions.
   */
  static async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const { message, conversation_id } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({
          success: false,
          message: 'Message is required and cannot be empty.',
        });
        return;
      }

      let convId = conversation_id;

      // 1. If conversation_id is provided, verify ownership
      if (convId) {
        const convRes = await query<any>(
          `SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2`,
          [convId, userId]
        );
        if (convRes.rows.length === 0) {
          convId = null; // Create new conversation if not found
        }
      }

      // 2. Create conversation if none exists
      if (!convId) {
        const titleSnippet = message.trim().slice(0, 45) + (message.length > 45 ? '...' : '');
        convId = crypto.randomUUID();
        await query<any>(
          `INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [convId, userId, titleSnippet]
        );
      }

      // 3. Save User message to history
      const userMsgId = crypto.randomUUID();
      await query(
        `INSERT INTO ai_messages (id, conversation_id, sender_type, message, created_at)
         VALUES ($1, $2, 'USER', $3, CURRENT_TIMESTAMP)`,
        [userMsgId, convId, message.trim()]
      );

      // 4. Fetch previous conversation history
      const historyRes = await query<any>(
        `SELECT sender_type, message 
         FROM ai_messages 
         WHERE conversation_id = $1 
         ORDER BY created_at ASC LIMIT 12`,
        [convId]
      );

      // 5. Generate AI reply
      const replyData = await AiService.generateChatReply(
        userId,
        userRole,
        message.trim(),
        historyRes.rows
      );

      // 6. Save AI message to history
      const aiMsgId = crypto.randomUUID();
      const savedAiMsg = await query<any>(
        `INSERT INTO ai_messages (id, conversation_id, sender_type, message, suggestions, created_at)
         VALUES ($1, $2, 'AI', $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, created_at`,
        [aiMsgId, convId, replyData.reply, JSON.stringify(replyData.suggestions)]
      );

      // 7. Update conversation timestamp
      await query(
        `UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [convId]
      );

      res.status(200).json({
        success: true,
        data: {
          conversation_id: convId,
          message_id: savedAiMsg.rows[0].id,
          reply: replyData.reply,
          suggestions: replyData.suggestions,
          model_used: replyData.modelUsed,
          created_at: savedAiMsg.rows[0].created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/conversations
   * Lists user's conversations with latest message preview.
   */
  static async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const result = await query<any>(
        `SELECT c.id, c.title, c.created_at, c.updated_at,
                (SELECT COUNT(*) FROM ai_messages m WHERE m.conversation_id = c.id) as message_count,
                (SELECT message FROM ai_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
         FROM ai_conversations c
         WHERE c.user_id = $1
         ORDER BY c.updated_at DESC LIMIT 30`,
        [userId]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/conversations/:id
   * Retrieves conversation details and message thread.
   */
  static async getConversationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const convRes = await query<any>(
        `SELECT id, title, created_at, updated_at FROM ai_conversations WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (convRes.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found.',
        });
        return;
      }

      const msgRes = await query<any>(
        `SELECT id, sender_type, message, suggestions, metadata, created_at
         FROM ai_messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [id]
      );

      res.status(200).json({
        success: true,
        data: {
          ...convRes.rows[0],
          messages: msgRes.rows,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/ai/conversations
   * Explicitly create a new conversation thread.
   */
  static async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const title = (req.body.title || 'New Conversation').trim();
      const newId = crypto.randomUUID();

      const newConv = await query<any>(
        `INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, title, created_at, updated_at`,
        [newId, userId, title]
      );

      res.status(201).json({
        success: true,
        data: newConv.rows[0],
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/ai/conversations/:id
   * Deletes a conversation and all its messages.
   */
  static async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const delRes = await query(
        `DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
      );

      if (delRes.rowCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or unauthorized.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/ai/search
   * Natural language search parser and executor.
   */
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const { query: searchQuery, target_type } = req.body;

      if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
        res.status(400).json({
          success: false,
          message: 'Search query is required.',
        });
        return;
      }

      const searchResult = await AiService.parseAndExecuteSearch(
        userId,
        searchQuery.trim(),
        target_type
      );

      res.status(200).json({
        success: true,
        data: searchResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/recommendations/equipment
   */
  static async getEquipmentRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const items = await RecommendationService.getEquipmentRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/recommendations/animals
   */
  static async getAnimalRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const items = await RecommendationService.getAnimalRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/recommendations/drivers
   */
  static async getDriverRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const items = await RecommendationService.getDriverRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/recommendations/workers
   */
  static async getWorkerRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const items = await RecommendationService.getWorkerRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/recommendations/schemes
   */
  static async getSchemeRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const items = await RecommendationService.getSchemeRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai/recommendations/resources
   */
  static async getResourceRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string, 10) || 4;
      const items = await RecommendationService.getResourceRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/ai/usage
   * Admin metrics for AI usage monitoring
   */
  static async getAdminUsage(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await AiService.getAdminUsageMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/ai/errors
   * Admin error logs for AI
   */
  static async getAdminErrors(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = await AiService.getAdminAiErrors();
      res.status(200).json({
        success: true,
        data: errors,
      });
    } catch (err) {
      next(err);
    }
  }
}
