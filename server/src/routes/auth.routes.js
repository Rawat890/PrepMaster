import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getCurrentUser, login, logout, protect, register } from '../controllers/auth.controller.js';

const router = Router();

// Slow repeated authentication attempts without affecting normal API usage.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getCurrentUser);

export default router;
