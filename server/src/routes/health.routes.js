import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/** Basic service and database health check for local development and deployment monitoring. */
router.get('/', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected ? 'ExamPrep AI API is healthy' : 'Database is not connected',
    data: {
      api: 'up',
      database: databaseConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
