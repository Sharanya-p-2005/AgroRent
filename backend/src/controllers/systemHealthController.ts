import { Request, Response } from 'express';
import { query } from '../config/db.js';

export class SystemHealthController {
  static async getSystemHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    // 1. Backend Server Metrics
    const uptimeSeconds = Math.floor(process.uptime());
    const memory = process.memoryUsage();
    const serverMetrics = {
      status: 'HEALTHY',
      uptimeSeconds,
      uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
    };

    // 2. Database Connectivity & Query Latency Check
    let dbStatus = 'HEALTHY';
    let dbLatencyMs = 0;
    let tableCount = 0;
    try {
      const dbStart = Date.now();
      const testRes = await query('SELECT 1 as ping');
      dbLatencyMs = Date.now() - dbStart;

      const tablesRes = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
      );
      tableCount = parseInt(tablesRes.rows[0]?.count || '0', 10);
    } catch (err: any) {
      dbStatus = 'DOWN';
      console.error('[SystemHealth] Database check failed:', err.message);
    }

    // 3. Payment Gateway Config Status (No secrets exposed)
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayConfigured = Boolean(razorpayKeyId && razorpayKeyId.trim().length > 0);
    const paymentStatus = {
      status: 'HEALTHY',
      gateways: {
        razorpay: {
          configured: razorpayConfigured,
          mode: razorpayConfigured ? 'Live / Test Active' : 'Simulation Mode (Auto-confirm active)',
        },
        dynamicUpiQr: {
          configured: true,
          mode: 'Active (Direct VPA QR Generator)',
        },
        cashOnDelivery: {
          configured: true,
          mode: 'Active (Physical handoff verification)',
        },
      },
    };

    // 4. AI Assistant Service Status
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const aiConfigured = Boolean(geminiApiKey && geminiApiKey.trim().length > 0);
    const aiStatus = {
      status: 'HEALTHY',
      service: 'Google Gemini Pro / Flash AI Provider',
      configured: aiConfigured,
      mode: aiConfigured ? 'Active Gemini Integration' : 'Smart Agricultural Fallback Engine',
    };

    const overallStatus = dbStatus === 'HEALTHY' ? 'HEALTHY' : 'DEGRADED';
    const totalLatencyMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      data: {
        overallStatus,
        checkTimestamp: new Date().toISOString(),
        totalLatencyMs,
        server: serverMetrics,
        database: {
          status: dbStatus,
          engine: 'PostgreSQL',
          queryLatencyMs: dbLatencyMs,
          totalTables: tableCount,
        },
        payments: paymentStatus,
        ai: aiStatus,
      },
    });
  }
}
