import express from 'express';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  getNextQuestion,
  submitAnswer,
  finishInterview,
  deleteInterview,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All interview routes require user authentication
router.use(protect);

router.route('/')
  .post(createInterview)
  .get(getInterviews);

router.route('/:id')
  .get(getInterviewById)
  .delete(deleteInterview);

router.post('/:id/next-question', getNextQuestion);
router.post('/:id/answers', submitAnswer);
router.post('/:id/finish', finishInterview);

export default router;
