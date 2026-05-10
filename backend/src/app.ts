import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './shared/middleware/errorHandler';
import { authRouter } from './features/auth/auth.routes';
import { pantryRouter } from './features/pantry/pantry.routes';
import { recipeRouter } from './features/recipes/recipe.routes';
import { shoppingListRouter } from './features/shopping-list/shopping-list.routes';
import { analyticsRouter } from './features/analytics/analytics.routes';
import { notificationRouter } from './features/notifications/notification.routes';
import { adminRouter } from './features/admin/admin.routes';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true,
  }));

  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/pantry', pantryRouter);
  app.use('/api/v1/recipes', recipeRouter);
  app.use('/api/v1/shopping-lists', shoppingListRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  });

  app.use(globalErrorHandler);

  return app;
}
