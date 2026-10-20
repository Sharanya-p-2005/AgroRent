/**
 * Phase 10: AI Core Service
 * Coordinates AI provider interaction (@google/genai Gemini SDK), prompt grounding,
 * rule-based fallback intelligence, natural-language search parsing, and usage logging.
 */

import { GoogleGenAI } from '@google/genai';
import { query } from '../config/db.js';
import { SafetyService } from './safety.service.js';
import { RateLimitService } from './rateLimit.service.js';
import { PromptService } from './prompt.service.js';

export interface ChatReplyResult {
  reply: string;
  suggestions: string[];
  metadata?: Record<string, any>;
  modelUsed: string;
}

export interface NaturalSearchFilters {
  target_type: 'EQUIPMENT' | 'ANIMAL' | 'DRIVER' | 'WORKER' | 'SCHEME';
  category?: string;
  max_price?: number;
  min_rating?: number;
  location_query?: string;
  keyword?: string;
  skills?: string;
}

export class AiService {
  private static getAiConfig() {
    const provider = process.env.AI_PROVIDER || 'gemini';
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
    const model = process.env.AI_MODEL || 'gemini-3.8-flash';
    const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '1000', 10);

    return {
      provider,
      apiKey,
      model,
      maxTokens: isNaN(maxTokens) ? 1000 : maxTokens,
    };
  }

  /**
   * Log AI request metrics into ai_usage_logs
   */
  static async logUsage(params: {
    userId?: string;
    requestType: string;
    model: string;
    success: boolean;
    errorMessage?: string;
    responseTimeMs: number;
    promptTokens?: number;
    completionTokens?: number;
  }): Promise<void> {
    try {
      const logId = crypto.randomUUID();
      await query(
        `INSERT INTO ai_usage_logs (
          id, user_id, request_type, model, success, error_message, response_time_ms, prompt_tokens, completion_tokens, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          logId,
          params.userId || null,
          params.requestType,
          params.model,
          params.success,
          params.errorMessage || null,
          params.responseTimeMs,
          params.promptTokens || 0,
          params.completionTokens || 0,
        ]
      );
    } catch (err: any) {
      console.warn('[AI Usage Log] Failed to insert log:', err.message);
    }
  }

  /**
   * Generate conversational reply for the Farmer Assistant
   */
  static async generateChatReply(
    userId: string,
    userRole: string,
    message: string,
    history: Array<{ sender_type: string; message: string }> = []
  ): Promise<ChatReplyResult> {
    const startTime = Date.now();
    const config = this.getAiConfig();

    // 1. Rate limiting check
    const rateCheck = RateLimitService.checkRateLimit(userId, userRole);
    if (!rateCheck.allowed) {
      await this.logUsage({
        userId,
        requestType: 'CHAT',
        model: config.model,
        success: false,
        errorMessage: 'Rate limit exceeded',
        responseTimeMs: Date.now() - startTime,
      });
      const err = new Error(
        `You've reached the AI usage limit (${process.env.AI_RATE_LIMIT || 20} requests/hour). Please try again in ${rateCheck.resetInSeconds} seconds.`
      );
      (err as any).statusCode = 429;
      throw err;
    }

    // 2. Safety evaluation
    const safetyCheck = SafetyService.evaluatePrompt(message);
    if (!safetyCheck.isSafe) {
      await this.logUsage({
        userId,
        requestType: 'CHAT',
        model: 'SAFETY_FILTER',
        success: true,
        responseTimeMs: Date.now() - startTime,
      });
      return {
        reply: safetyCheck.safeResponse || 'I can only assist with farming, equipment, livestock, and AgroRent services.',
        suggestions: ['Show nearby tractors', 'Find available animals', 'View government schemes'],
        modelUsed: 'SAFETY_GUARD',
      };
    }

    // 3. Assemble Grounded Context
    const userContext = await PromptService.getUserContext(userId);
    const relevantSchemes = await PromptService.retrieveRelevantSchemes(message);
    const relevantResources = await PromptService.retrieveRelevantResources(message);
    const systemPrompt = PromptService.buildSystemPrompt(userContext, relevantSchemes, relevantResources);

    let replyText = '';
    let modelUsed = config.model;

    // 4. Check if Gemini API is configured
    if (config.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: config.apiKey });
        const contents: any[] = [];

        // Append recent conversation history (up to last 6 messages)
        const recentHistory = history.slice(-6);
        for (const h of recentHistory) {
          contents.push({
            role: h.sender_type === 'USER' ? 'user' : 'model',
            parts: [{ text: h.message }],
          });
        }

        // Append current message
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const response = await ai.models.generateContent({
          model: config.model,
          contents,
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: config.maxTokens,
            temperature: 0.5,
          },
        });

        replyText = response.text || '';
      } catch (geminiErr: any) {
        console.warn('[AI Service] Gemini API call failed or timed out:', geminiErr.message);
        // Seamlessly switch to intelligent fallback knowledge engine
        replyText = this.fallbackKnowledgeEngine(message, userContext, relevantSchemes, relevantResources);
        modelUsed = 'agrorent-knowledge-engine';
      }
    } else {
      // No API key configured: use internal knowledge engine
      replyText = this.fallbackKnowledgeEngine(message, userContext, relevantSchemes, relevantResources);
      modelUsed = 'agrorent-knowledge-engine';
    }

    replyText = SafetyService.sanitizeResponse(replyText);

    // Compute dynamic suggestions based on intent
    const suggestions = this.computeSuggestions(message, userContext);

    // Log success
    const responseTimeMs = Date.now() - startTime;
    await this.logUsage({
      userId,
      requestType: 'CHAT',
      model: modelUsed,
      success: true,
      responseTimeMs,
    });

    return {
      reply: replyText,
      suggestions,
      modelUsed,
    };
  }

  /**
   * Robust Rule-Based & Grounded Fallback Knowledge Engine
   * Answers queries accurately even if Gemini API key is not present or external network fails.
   */
  private static fallbackKnowledgeEngine(
    message: string,
    context: any,
    schemes: any[],
    resources: any[]
  ): string {
    const msg = message.toLowerCase().trim();

    // Check Kannada input
    if (/[\u0C80-\u0CFF]/.test(message)) {
      if (msg.includes('ಟ್ರಾಕ್ಟರ್') || msg.includes('ಯಂತ್ರ') || msg.includes('ಬೇಕು')) {
        return `ನಮಸ್ಕಾರ ${context.name}! AgroRent ನಲ್ಲಿ ಬಾಡಿಗೆಗೆ ಲಭ್ಯವಿರುವ ಟ್ರಾಕ್ಟರ್‌ಗಳು ಮತ್ತು ಕೃಷಿ ಯಂತ್ರಗಳನ್ನು ನೀವು ಸುಲಭವಾಗಿ ಪಡೆಯಬಹುದು.\n\n• ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ (${context.defaultLocation?.city || 'ಕರ್ನಾಟಕ'}) ಗಂಟೆಗೆ ₹600 ರಿಂದ ಟ್ರಾಕ್ಟರ್‌ಗಳು ಲಭ್ಯವಿವೆ.\n• ಚಾಲಕ ಅಥವಾ ಆಪರೇಟರ್ ಸಹ ಲಭ್ಯವಿದ್ದಾರೆ.\n\nನಿಮ್ಮ ಅಗತ್ಯಕ್ಕೆ ಅನುಗುಣವಾಗಿ "Equipment" ವಿಭಾಗವನ್ನು ತೆರೆಯಲು ಕೆಳಗಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.`;
      }
      if (msg.includes('ಯೋಜನೆ') || msg.includes('ಸಬ್ಸಿಡಿ') || msg.includes('ಸರ್ಕಾರ')) {
        let schemeText = 'ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಕೃಷಿ ಸಬ್ಸಿಡಿ ಮತ್ತು ಯೋಜನೆಗಳು:\n\n';
        if (schemes.length > 0) {
          schemes.slice(0, 3).forEach((s, idx) => {
            schemeText += `${idx + 1}. **${s.name}**: ${s.benefit_summary || ''}\n   ಅರ್ಜಿ ಲಿಂಕ್: ${s.official_url || 'ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್'}\n\n`;
          });
        } else {
          schemeText += '1. ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ ಸಬ್ಸಿಡಿ ಯೋಜನೆ (50% ವರೆಗೆ ಸಬ್ಸಿಡಿ)\n2. ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ\n\n';
        }
        schemeText += '*ಗಮನಿಸಿ: ಅಧಿಕೃತ ವಿವರಗಳನ್ನು ಸರ್ಕಾರದ ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.*';
        return schemeText;
      }
      if (msg.includes('ಹಾಲು') || msg.includes('ಹಸು') || msg.includes('ದನ') || msg.includes('ಕುರಿ')) {
        return `AgroRent ಹಸು ಮತ್ತು ಪ್ರಾಣಿ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ (Livestock Marketplace) ಅಧಿಕೃತ ಪಶುವೈದ್ಯ ಪ್ರಮಾಣಪತ್ರವಿರುವ ಉತ್ತಮ ತಳಿಯ ಹಸುಗಳು ಮತ್ತು ಮೇಕೆಗಳು ಲಭ್ಯವಿವೆ.\n\nನೀವು ಮಾರಾಟಗಾರರ ನೇರ ಸಂಪರ್ಕ ಮತ್ತು ಡೆಲಿವರಿ ಟ್ರ್ಯಾಕಿಂಗ್ ಸೌಲಭ್ಯವನ್ನು ಪಡೆಯಬಹುದು.`;
      }
      return `ನಮಸ್ಕಾರ ${context.name}! ನಾನು AgroRent AI ಕೃಷಿ ಸಹಾಯಕ. ಟ್ರಾಕ್ಟರ್ ಬಾಡಿಗೆ, ಹಸು/ಕುರಿ ಖರೀದಿ, ಚಾಲಕರು/ಕಾರ್ಮಿಕರ ಬುಕಿಂಗ್ ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಕುರಿತು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.`;
    }

    // Order and Delivery Tracking Intent
    if (msg.includes('where is my order') || msg.includes('track my order') || msg.includes('delivery status') || msg.includes('my delivery')) {
      if (context.latestAnimalOrder) {
        const order = context.latestAnimalOrder;
        let response = `Your latest animal order **#${order.id.slice(0, 8)}** (${order.listing_name}) is currently **${order.delivery_status}**.\n\n`;
        if (order.assigned_driver_name) {
          response += `• **Assigned Driver**: ${order.assigned_driver_name}\n`;
        }
        response += `• **Order Status**: ${order.order_status}\n`;
        response += `\nYou can view real-time GPS tracking and live transit updates on your Delivery Tracking page.`;
        return response;
      }
      return `I couldn't find an active livestock delivery in your account right now. If you recently placed an order, please check your **Orders** tab to view your order receipt.`;
    }

    // Equipment Booking Intent
    if (msg.includes('where is my booking') || msg.includes('my booking') || msg.includes('booking status')) {
      if (context.latestBooking) {
        const b = context.latestBooking;
        return `Your latest equipment rental for **${b.equipment_name}** is currently **${b.status}** (Total: ₹${b.total_price}). You can manage your rental dates and contact the equipment owner from your Bookings dashboard.`;
      }
      return `You do not have any active equipment bookings right now. You can browse nearby tractors, harvesters, and tillers in the Equipment section.`;
    }

    // Government Schemes Intent
    if (msg.includes('scheme') || msg.includes('subsidy') || msg.includes('subsidies') || msg.includes('government') || msg.includes('financial help')) {
      let response = `Based on the government schemes currently published in AgroRent, these schemes may be relevant to your farm:\n\n`;
      if (schemes.length > 0) {
        schemes.forEach((s, idx) => {
          response += `${idx + 1}. **${s.name}** (${s.category})\n`;
          if (s.benefit_summary) response += `   • *Benefit*: ${s.benefit_summary}\n`;
          if (s.max_subsidy_amount) response += `   • *Subsidy*: Up to ₹${Number(s.max_subsidy_amount).toLocaleString('en-IN')}\n`;
          if (s.official_url) response += `   • *Official Portal*: [View Official Link](${s.official_url})\n\n`;
        });
      } else {
        response += `1. **Farm Mechanization & Equipment Subsidy** - Up to 50% subsidy for small & marginal farmers.\n`;
        response += `2. **PM-KUSUM Solar Pump Scheme** - Subsidized solar-powered water pumps for agricultural irrigation.\n`;
        response += `3. **National Livestock Mission (NLM)** - Capital subsidy for dairy and goat farming setups.\n\n`;
      }
      response += SafetyService.getGovernmentDisclaimer();
      return response;
    }

    // Irrigation & Agricultural Resources Intent
    if (msg.includes('irrigation') || msg.includes('water') || msg.includes('soil') || msg.includes('fertilizer') || msg.includes('crop') || msg.includes('farming advice')) {
      let response = `Here is general agricultural guidance for your farm in ${context.defaultLocation?.city || 'Karnataka'}:\n\n`;
      response += `• **Drip & Sprinkler Irrigation**: Reduces water usage by up to 45% while maintaining root moisture, particularly effective for vegetables, sugarcane, and orchards.\n`;
      response += `• **Soil Preparation**: Test soil pH every season and incorporate organic manure or green manure before sowing.\n`;
      response += `• **Pest Monitoring**: Prioritize biological controls (neem oil spray, pheromone traps) before applying chemical treatments.\n\n`;
      if (resources.length > 0) {
        response += `### Curated AgroRent Resources:\n`;
        resources.forEach((r, idx) => {
          response += `${idx + 1}. **${r.title}** - *${r.description || r.category}*\n`;
        });
      }
      return response;
    }

    // Tractor & Equipment Intent
    if (msg.includes('tractor') || msg.includes('harvester') || msg.includes('tiller') || msg.includes('rent') || msg.includes('equipment')) {
      const city = context.defaultLocation?.city || 'your area';
      return `AgroRent provides tractors (Mahindra, John Deere, Sonalika, Swaraj), power tillers, and rotavators for hourly or daily rentals in ${city}.\n\n• **Rates**: Typically starting from ₹600 – ₹1,200/hour depending on HP and attachments.\n• **Operator Available**: You can also book experienced drivers along with the machinery.\n• **Booking**: Select your dates, review terms, and pay securely via UPI or Card.`;
    }

    // Livestock Intent
    if (msg.includes('cow') || msg.includes('buffalo') || msg.includes('goat') || msg.includes('sheep') || msg.includes('animal') || msg.includes('livestock')) {
      return `AgroRent's Animal Marketplace connects you directly with verified livestock owners across Karnataka.\n\n• **High-Yield Dairy**: Gir, HF, Jersey, and Sahiwal cows with verified lactation records.\n• **Health Verified**: Listings include vaccination status and official health certificates.\n• **Safe Transit**: Track delivery with dedicated animal transit drivers and GPS waypoint updates.`;
    }

    // Driver & Farm Worker Intent
    if (msg.includes('driver') || msg.includes('worker') || msg.includes('labor') || msg.includes('labour') || msg.includes('hire')) {
      return `You can hire verified drivers and farm workers on AgroRent:\n\n• **Tractor & Transit Drivers**: Commercial-licensed drivers experienced in heavy machinery and animal transport (from ₹200–₹350/hour).\n• **Farm Workers**: Skilled in sowing, weeding, harvesting, and irrigation (from ₹500–₹800/day).\n\nBrowse profiles with ratings, verified identity, and contact options under the **Services** tab.`;
    }

    // Default Greeting & Capabilities
    return `Hello ${context.name}! I am AgroRent AI, your smart farming assistant. I can help you with:

1. 🚜 **Equipment Rentals**: Finding nearby tractors, harvesters, and tillers within your budget.
2. 🐄 **Livestock Marketplace**: High-yield cows, buffalos, and goats with verified health records.
3. 👨🌾 **Farm Services**: Booking verified drivers and agricultural workers.
4. 💰 **Government Schemes**: Locating central and state agricultural subsidies.
5. 📦 **Live Delivery Tracking**: Checking the real-time status of your active orders.

What would you like assistance with today?`;
  }

  /**
   * Contextual smart suggestions
   */
  private static computeSuggestions(message: string, context: any): string[] {
    const msg = message.toLowerCase();

    if (msg.includes('tractor') || msg.includes('rent') || msg.includes('equipment')) {
      return [
        'Find tractors under ₹1000/hr',
        'Show equipment near my farm',
        'Need driver for tractor',
        'Equipment subsidy schemes',
      ];
    }

    if (msg.includes('animal') || msg.includes('cow') || msg.includes('goat')) {
      return [
        'Show high-yield dairy cows',
        'Track my animal delivery',
        'Livestock subsidy schemes',
        'Verified goat listings',
      ];
    }

    if (msg.includes('scheme') || msg.includes('subsidy')) {
      return [
        'Equipment subsidy schemes',
        'Solar pump subsidy',
        'Dairy development schemes',
        'How to apply for schemes',
      ];
    }

    if (msg.includes('order') || msg.includes('track') || msg.includes('delivery')) {
      return [
        'Where is my driver right now?',
        'Contact delivery driver',
        'Show my past orders',
        'Report delivery issue',
      ];
    }

    return [
      '🚜 Find a tractor near me',
      '🐄 Browse dairy cows',
      '👨🌾 Hire harvesting workers',
      '💰 Equipment subsidy schemes',
      '📦 Track my latest order',
      '📚 Drip irrigation tips',
    ];
  }

  /**
   * Natural Language Search Parsing
   * Converts farmer's query into safe, validated SQL filter parameters.
   */
  static async parseAndExecuteSearch(
    userId: string,
    searchQuery: string,
    preferredTarget?: string
  ): Promise<{
    target_type: string;
    filters: NaturalSearchFilters;
    results: any[];
    total: number;
    explanation: string;
  }> {
    const startTime = Date.now();
    const queryLower = searchQuery.toLowerCase().trim();

    // 1. Determine target entity type
    let targetType: 'EQUIPMENT' | 'ANIMAL' | 'DRIVER' | 'WORKER' | 'SCHEME' = 'EQUIPMENT';

    if (preferredTarget && ['EQUIPMENT', 'ANIMAL', 'DRIVER', 'WORKER', 'SCHEME'].includes(preferredTarget.toUpperCase())) {
      targetType = preferredTarget.toUpperCase() as any;
    } else if (queryLower.includes('cow') || queryLower.includes('goat') || queryLower.includes('sheep') || queryLower.includes('animal') || queryLower.includes('buffalo')) {
      targetType = 'ANIMAL';
    } else if (queryLower.includes('driver')) {
      targetType = 'DRIVER';
    } else if (queryLower.includes('worker') || queryLower.includes('labor') || queryLower.includes('labour') || queryLower.includes('harvesting worker')) {
      targetType = 'WORKER';
    } else if (queryLower.includes('scheme') || queryLower.includes('subsidy') || queryLower.includes('subsidies') || queryLower.includes('yojana')) {
      targetType = 'SCHEME';
    }

    // 2. Extract price limit if mentioned (e.g. "under 1000", "below 70000", "under ₹500")
    let maxPrice: number | undefined = undefined;
    const priceMatch = queryLower.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
    if (priceMatch && priceMatch[1]) {
      const parsed = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxPrice = parsed;
      }
    }

    // 3. Extract rating if mentioned ("highly rated", "4 star", "top rated")
    let minRating: number | undefined = undefined;
    if (queryLower.includes('highly rated') || queryLower.includes('top rated')) {
      minRating = 4.5;
    } else {
      const ratingMatch = queryLower.match(/([3-5](?:\.[0-9])?)\s*(?:star|\*)/i);
      if (ratingMatch && ratingMatch[1]) {
        minRating = parseFloat(ratingMatch[1]);
      }
    }

    // 4. Extract Category / Keywords
    let category: string | undefined = undefined;
    let keyword: string | undefined = undefined;

    if (targetType === 'EQUIPMENT') {
      if (queryLower.includes('tractor')) category = 'TRACTOR';
      else if (queryLower.includes('harvester')) category = 'HARVESTER';
      else if (queryLower.includes('tiller')) category = 'TILLER';
      else if (queryLower.includes('sprayer')) category = 'SPRAYER';
      else if (queryLower.includes('seeder')) category = 'SEEDER';
    } else if (targetType === 'ANIMAL') {
      if (queryLower.includes('cow')) category = 'Cow';
      else if (queryLower.includes('buffalo')) category = 'Buffalo';
      else if (queryLower.includes('goat')) category = 'Goat';
      else if (queryLower.includes('sheep')) category = 'Sheep';
    }

    // 5. Extract Location if mentioned
    let locationQuery: string | undefined = undefined;
    const locationMatch = queryLower.match(/(?:near|in|at)\s+([a-zA-Z]+)(?:\s+farm)?/i);
    if (locationMatch && locationMatch[1] && !['me', 'my', 'here'].includes(locationMatch[1].toLowerCase())) {
      locationQuery = locationMatch[1].trim();
    }

    const filters: NaturalSearchFilters = {
      target_type: targetType,
      category,
      max_price: maxPrice,
      min_rating: minRating,
      location_query: locationQuery,
      keyword,
    };

    // 6. Execute validated backend query in PostgreSQL (SAFE PARAMETERIZED QUERIES ONLY)
    let results: any[] = [];
    let explanation = '';

    if (targetType === 'EQUIPMENT') {
      let sql = `
        SELECT e.*, u.name as owner_name,
               COALESCE((SELECT AVG(rating)::numeric(2,1) FROM reviews WHERE target_type = 'EQUIPMENT' AND target_id = e.id), 4.5) as rating
        FROM equipment e
        JOIN users u ON e.owner_id = u.id
        WHERE e.approval_status = 'APPROVED' AND e.availability_status = 'AVAILABLE'
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (category) {
        sql += ` AND e.category ILIKE $${pIdx++}`;
        params.push(`%${category}%`);
      }
      if (maxPrice) {
        sql += ` AND e.price_per_hour <= $${pIdx++}`;
        params.push(maxPrice);
      }
      if (locationQuery) {
        sql += ` AND e.location ILIKE $${pIdx++}`;
        params.push(`%${locationQuery}%`);
      }

      sql += ` ORDER BY rating DESC, e.created_at DESC LIMIT 10`;
      const dbRes = await query<any>(sql, params);
      results = dbRes.rows;
      explanation = `Found ${results.length} available equipment matching your search${category ? ` (${category})` : ''}${maxPrice ? ` under ₹${maxPrice}/hr` : ''}.`;
    } else if (targetType === 'ANIMAL') {
      let sql = `
        SELECT a.*, u.name as seller_name,
               COALESCE((SELECT AVG(rating)::numeric(2,1) FROM reviews WHERE target_type = 'ANIMAL_SELLER' AND target_id = a.seller_id), 4.7) as rating
        FROM animal_listings a
        JOIN users u ON a.seller_id = u.id
        WHERE a.approval_status = 'APPROVED' AND a.availability_status = 'AVAILABLE'
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (category) {
        sql += ` AND a.category ILIKE $${pIdx++}`;
        params.push(`%${category}%`);
      }
      if (maxPrice) {
        sql += ` AND a.price <= $${pIdx++}`;
        params.push(maxPrice);
      }
      if (locationQuery) {
        sql += ` AND a.location ILIKE $${pIdx++}`;
        params.push(`%${locationQuery}%`);
      }

      sql += ` ORDER BY rating DESC, a.created_at DESC LIMIT 10`;
      const dbRes = await query<any>(sql, params);
      results = dbRes.rows;
      explanation = `Found ${results.length} verified livestock listings${category ? ` (${category})` : ''}${maxPrice ? ` under ₹${maxPrice}` : ''}.`;
    } else if (targetType === 'DRIVER') {
      let sql = `
        SELECT sp.*, u.phone, u.name as driver_name
        FROM service_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.service_type = 'DRIVER'
          AND sp.approval_status = 'APPROVED'
          AND sp.availability_status = 'AVAILABLE'
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (maxPrice) {
        sql += ` AND sp.price_per_hour <= $${pIdx++}`;
        params.push(maxPrice);
      }
      if (locationQuery) {
        sql += ` AND (sp.location ILIKE $${pIdx} OR sp.description ILIKE $${pIdx})`;
        params.push(`%${locationQuery}%`);
        pIdx++;
      }

      sql += ` ORDER BY sp.created_at DESC LIMIT 10`;
      const dbRes = await query<any>(sql, params);
      results = dbRes.rows;
      explanation = `Found ${results.length} available verified drivers${maxPrice ? ` under ₹${maxPrice}/hr` : ''}.`;
    } else if (targetType === 'WORKER') {
      let sql = `
        SELECT sp.*, u.phone, u.name as worker_name
        FROM service_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.service_type = 'FARM_WORKER'
          AND sp.approval_status = 'APPROVED'
          AND sp.availability_status = 'AVAILABLE'
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (maxPrice) {
        sql += ` AND (sp.price_per_day <= $${pIdx} OR sp.price_per_hour <= $${pIdx})`;
        params.push(maxPrice);
        pIdx++;
      }
      if (locationQuery) {
        sql += ` AND (sp.location ILIKE $${pIdx} OR sp.description ILIKE $${pIdx})`;
        params.push(`%${locationQuery}%`);
        pIdx++;
      }

      sql += ` ORDER BY sp.created_at DESC LIMIT 10`;
      const dbRes = await query<any>(sql, params);
      results = dbRes.rows;
      explanation = `Found ${results.length} available agricultural workers${maxPrice ? ` within ₹${maxPrice}` : ''}.`;
    } else if (targetType === 'SCHEME') {
      const res = await query<any>(
        `SELECT id, name, code, category, department, benefit_summary, max_subsidy_amount, official_url
         FROM government_schemes
         WHERE status = 'ACTIVE'
         ORDER BY created_at DESC LIMIT 10`
      );
      results = res.rows;
      explanation = `Retrieved ${results.length} active government schemes published in AgroRent.`;
    }

    // Log AI Search usage
    await this.logUsage({
      userId,
      requestType: 'SEARCH',
      model: 'AI_SEARCH_PARSER',
      success: true,
      responseTimeMs: Date.now() - startTime,
    });

    return {
      target_type: targetType,
      filters,
      results,
      total: results.length,
      explanation,
    };
  }

  /**
   * Admin Telemetry & Metrics
   */
  static async getAdminUsageMetrics(): Promise<any> {
    const totalRes = await query<any>(`SELECT COUNT(*) as count FROM ai_usage_logs`);
    const todayRes = await query<any>(
      `SELECT COUNT(*) as count FROM ai_usage_logs WHERE created_at >= CURRENT_DATE`
    );
    const failedRes = await query<any>(
      `SELECT COUNT(*) as count FROM ai_usage_logs WHERE success = false`
    );
    const activeUsersRes = await query<any>(
      `SELECT COUNT(DISTINCT user_id) as count FROM ai_usage_logs WHERE user_id IS NOT NULL`
    );
    const typeBreakdownRes = await query<any>(
      `SELECT request_type, COUNT(*) as count, AVG(response_time_ms)::int as avg_latency_ms
       FROM ai_usage_logs
       GROUP BY request_type
       ORDER BY count DESC`
    );
    const recentLogs = await query<any>(
      `SELECT l.id, l.request_type, l.model, l.success, l.error_message, l.response_time_ms, l.created_at,
              u.name as user_name, u.email as user_email
       FROM ai_usage_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC LIMIT 20`
    );

    return {
      total_requests: parseInt(totalRes.rows[0]?.count || '0', 10),
      today_requests: parseInt(todayRes.rows[0]?.count || '0', 10),
      failed_requests: parseInt(failedRes.rows[0]?.count || '0', 10),
      active_users: parseInt(activeUsersRes.rows[0]?.count || '0', 10),
      request_breakdown: typeBreakdownRes.rows,
      recent_logs: recentLogs.rows,
    };
  }

  /**
   * Admin AI Error Monitoring
   */
  static async getAdminAiErrors(): Promise<any[]> {
    const res = await query<any>(
      `SELECT l.id, l.request_type, l.model, l.error_message, l.response_time_ms, l.created_at,
              u.name as user_name, u.email as user_email
       FROM ai_usage_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.success = false
       ORDER BY l.created_at DESC LIMIT 50`
    );
    return res.rows;
  }
}
