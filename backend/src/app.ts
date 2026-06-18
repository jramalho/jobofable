import express from 'express';
import cors from 'cors';
import { analysisRoutes } from './routes/analysis.routes';
import { exportRoutes } from './routes/export.routes';
import { errorHandler } from './utils/errors';

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    }),
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', provider: process.env.AI_PROVIDER ?? 'groq' });
  });

  app.use('/api/analysis', analysisRoutes);
  app.use('/api/export', exportRoutes);

  app.use(errorHandler);

  return app;
}
