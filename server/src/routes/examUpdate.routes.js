import { Router } from 'express';
import { protect } from '../controllers/auth.controller.js';
import { createExamUpdate, deleteExamUpdate, listExamUpdates, updateExamUpdate } from '../controllers/examUpdate.controller.js';

const router = Router();
router.use(protect);
router.get('/', listExamUpdates);
router.post('/', createExamUpdate);
router.put('/:id', updateExamUpdate);
router.delete('/:id', deleteExamUpdate);
export default router;
