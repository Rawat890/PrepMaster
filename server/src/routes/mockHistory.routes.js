import { Router } from 'express';
import { protect } from '../controllers/auth.controller.js';
import { getDashboardStats, getMockHistory, getMockHistoryItem } from '../controllers/mockHistory.controller.js';

const router = Router();
router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/', getMockHistory);
router.get('/:testId', getMockHistoryItem);

export default router;
