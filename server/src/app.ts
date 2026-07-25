import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/error-handler';
import { notFoundHandler } from '@/middleware/not-found';
import { morganStream } from '@/utils/logger';
import { agreementRoutes } from '@/routes/agreement.routes';
import { applicationRoutes } from '@/routes/application.routes';
import { authRoutes } from '@/routes/auth.routes';
import { chatRoutes } from '@/routes/chat.routes';
import { escrowRoutes } from '@/routes/escrow.routes';
import { kycRoutes } from '@/routes/kyc.routes';
import { propertyRoutes } from '@/routes/property.routes';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        // Preserve exact bytes for Razorpay webhook HMAC (X-Razorpay-Signature)
        (req as express.Request).rawBody = buf.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined', {
      stream: morganStream,
    })
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/kyc', kycRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/agreements', agreementRoutes);
  app.use('/api/escrow', escrowRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
