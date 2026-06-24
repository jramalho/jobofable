import express from 'express';
import cors from 'cors';
import { analysisRoutes } from './routes/analysis.routes';
import { applicationRoutes } from './routes/application.routes';
import { companyRoutes } from './routes/company.routes';
import { contactRoutes } from './routes/contact.routes';
import { exportRoutes } from './routes/export.routes';
import { followUpRoutes } from './routes/followUp.routes';
import { jobSearchRoutes } from './routes/jobSearch.routes';
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
  app.use('/api/companies', companyRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/follow-ups', followUpRoutes);
  app.use('/api/jobs', jobSearchRoutes);

  app.use(errorHandler);

  return app;
}
