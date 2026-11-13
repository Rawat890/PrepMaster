import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  cancelMockTest,
  generateMockTest,
  getMockTest,
  submitMockTest,
  updateMockAnswer,
  updateReviewStatus,
} from '../controllers/mockTest.controller.js';
import { protect } from '../controllers/auth.controller.js';

const router = Router();

// Generation invokes a paid/limited LLM API, so it has a stricter rate limit.
const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'You have generated several mock tests recently. Please try again in 15 minutes.' },
});

router.use(protect);
router.post('/generate', generationLimiter, generateMockTest);
router.get('/:testId', getMockTest);
router.put('/:testId/answer', updateMockAnswer);
router.put('/:testId/review', updateReviewStatus);
router.post('/:testId/submit', submitMockTest);
router.delete('/:testId', cancelMockTest);

export default router;
