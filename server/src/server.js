import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) {
  console.error('JWT_SECRET is missing or too short. Configure a random secret of at least 32 bytes in server/.env.');
  process.exit(1);
}

/** Connect to MongoDB first, then begin accepting HTTP requests. */
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`ExamPrep AI API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Close cleanly when the process receives a termination signal.
    const shutdown = (signal) => {
      console.log(`${signal} received. Closing HTTP server...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(`Unable to start ExamPrep AI API: ${error.message}`);
    process.exit(1);
  }
};

startServer();
