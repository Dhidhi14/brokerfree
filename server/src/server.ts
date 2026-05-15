import http from 'http';
import { createApp } from '@/app';
import { connectDB, disconnectDB } from '@/config/db';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: http.Server | null = null;

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();
  server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`, { env: env.NODE_ENV });
  });
}

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down gracefully`);

  const forceExitTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceExitTimer.unref();

  const closeServer = new Promise<void>((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  Promise.all([closeServer, disconnectDB()])
    .then(() => {
      logger.info('Shutdown complete');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

bootstrap().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
