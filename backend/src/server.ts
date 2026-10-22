
import { createExpressApp } from './app.js';
import { runMigrationsAndSeeds } from './services/migrationService.js';

const app = createExpressApp();
const PORT = Number(process.env.PORT || 10000);

async function startServer() {
  try {
    await runMigrationsAndSeeds();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AgroRent backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('AgroRent startup failed:', error);
    process.exit(1);
  }
}

startServer();
