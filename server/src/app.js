import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from './docs/openapi.js';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import mockTestRoutes from './routes/mockTest.routes.js';
import mockHistoryRoutes from './routes/mockHistory.routes.js';
import examUpdateRoutes from './routes/examUpdate.routes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Set common HTTP security headers.
app.use(helmet());

// Allow only configured frontend origins and permit browser cookies for JWT auth.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Requests without an Origin header include tools such as curl and server-to-server calls.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by the CORS policy.'));
  },
}));

// Parse small JSON bodies and browser cookies before routes use them.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Interactive OpenAPI reference. Keep it public for local development and API exploration.
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));

app.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to ExamPrep AI API' });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/history', mockHistoryRoutes);
app.use('/api/exam-updates', examUpdateRoutes);

// Keep these handlers after all valid routes.
app.use(notFound);
app.use(errorHandler);

export default app;
