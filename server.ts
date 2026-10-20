import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './backend/src/app.js';
import { runMigrationsAndSeeds } from './backend/src/services/migrationService.js';

async function startServer() {
  console.log('[AgroRent] Initializing AgroRent Platform...');

  // Initialize Express application with all backend routes and middleware
  const app = createExpressApp();
  const PORT = 3000;

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind port 3000 immediately so the dev server is active and reachable right away
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AgroRent] Server successfully running at http://0.0.0.0:${PORT}`);
    console.log(`[AgroRent] API health available at: http://0.0.0.0:${PORT}/api/health`);
  });

  // Run database migrations and initial seed data in background
  runMigrationsAndSeeds()
    .then(() => {
      console.log('[AgroRent] Database migrations and seed verification complete.');
    })
    .catch((err) => {
      console.error('[AgroRent] Migration error:', err);
    });
}

startServer();
