import {
  MARKS_PER_CORRECT_ANSWER,
  MARKS_PER_WRONG_ANSWER,
  QUESTION_COUNT,
  SUBJECTS,
  EXAM_TYPES,
  TEST_DURATION_SECONDS,
} from '../constants/mockTest.js';
import { generateMockQuestions } from '../services/groqQuestion.service.js';
import {
  createActiveMockSession,
  deleteActiveMockSession,
  getActiveMockSession,
  saveSessionAnswer,
  setSessionReview,
} from '../services/mockSessionStore.js';
import { toPublicQuestion } from '../utils/questionValidation.js';
import { scoreMockTest } from '../utils/scoreMockTest.js';
import { buildTopicPerformance } from '../utils/topicPerformance.js';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const findOwnedSession = (req) => getActiveMockSession(req.params.testId, req.user._id);

/** Generate a fresh test without persisting questions or answers in MongoDB. */
export const generateMockTest = async (req, res, next) => {
  try {
    const { subject, examType } = req.body || {};
    if (!SUBJECTS.includes(subject)) {
      return res.status(400).json({ success: false, message: 'Please select a valid subject.', allowedSubjects: SUBJECTS });
    }
    if (!EXAM_TYPES.includes(examType)) {
      return res.status(400).json({ success: false, message: 'Please select a valid examination.', allowedExamTypes: EXAM_TYPES });
    }

    const questions = await generateMockQuestions({ subject, examType });
    const session = createActiveMockSession({ userId: req.user._id, subject, examType, questions });

    return res.status(201).json({
      success: true,
      message: 'Your mock test has been generated successfully.',
      data: {
        testId: session.testId,
        subject,
        examType,
        difficulty: 'Mixed',
        totalQuestions: QUESTION_COUNT,
        durationSeconds: TEST_DURATION_SECONDS,
        markingScheme: { correct: MARKS_PER_CORRECT_ANSWER, incorrect: MARKS_PER_WRONG_ANSWER, unattempted: 0 },
        questions: questions.map(toPublicQuestion),
        answers: {},
        reviewQuestionIds: [],
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/** Resume an active in-memory test after a page refresh, without revealing its answer key. */
export const getMockTest = (req, res) => {
  const session = findOwnedSession(req);
  if (!session) {
    return res.status(404).json({ success: false, message: 'This mock test is no longer available. It may have been cancelled, submitted, expired or the server restarted.' });
  }

  const now = Date.now();
  return res.status(200).json({
    success: true,
    data: {
      testId: session.testId,
      subject: session.subject,
      examType: session.examType,
      totalQuestions: session.questions.length,
      durationSeconds: TEST_DURATION_SECONDS,
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      remainingSeconds: Math.max(0, Math.ceil((session.expiresAt.getTime() - now) / 1000)),
      questions: session.questions.map(toPublicQuestion),
      answers: Object.fromEntries(session.answers),
      reviewQuestionIds: [...session.reviewQuestionIds],
    },
  });
};

/** Save or clear a selected option in the temporary server-side session. */
export const updateMockAnswer = (req, res) => {
  const session = findOwnedSession(req);
  if (!session) return res.status(404).json({ success: false, message: 'This mock test is no longer active.' });
  if (Date.now() >= session.expiresAt.getTime()) {
    return res.status(410).json({ success: false, message: 'The test time has ended. Submit your test to see the result.' });
  }

  const { questionId, selectedOption } = req.body || {};
  if (typeof questionId !== 'string' || !questionId) {
    return res.status(400).json({ success: false, message: 'A valid questionId is required.' });
  }
  if (selectedOption !== null && !OPTION_KEYS.includes(selectedOption)) {
    return res.status(400).json({ success: false, message: 'selectedOption must be A, B, C, D or null.' });
  }
  if (!saveSessionAnswer(session, questionId, selectedOption)) {
    return res.status(404).json({ success: false, message: 'Question not found in this test.' });
  }

  return res.status(200).json({ success: true, message: 'Answer saved.', data: { questionId, selectedOption } });
};

/** Mark or unmark a question for review in the temporary session. */
export const updateReviewStatus = (req, res) => {
  const session = findOwnedSession(req);
  if (!session) return res.status(404).json({ success: false, message: 'This mock test is no longer active.' });
  if (Date.now() >= session.expiresAt.getTime()) {
    return res.status(410).json({ success: false, message: 'The test time has ended. Submit your test to see the result.' });
  }

  const { questionId, marked } = req.body || {};
  if (typeof questionId !== 'string' || typeof marked !== 'boolean') {
    return res.status(400).json({ success: false, message: 'questionId and boolean marked are required.' });
  }
  if (!setSessionReview(session, questionId, marked)) {
    return res.status(404).json({ success: false, message: 'Question not found in this test.' });
  }
  return res.status(200).json({ success: true, data: { questionId, marked } });
};

/** Score in memory, persist aggregate-only history, then discard the active session. */
export const submitMockTest = async (req, res, next) => {
  const session = findOwnedSession(req);
  if (!session) return res.status(404).json({ success: false, message: 'This mock test is no longer active or has already been submitted.' });

  try {
    const now = Date.now();
    const result = scoreMockTest({
      questions: session.questions,
      answers: session.answers,
      startedAt: session.startedAt,
      now,
    });
    const expired = now >= session.expiresAt.getTime();
    const completedAt = new Date(now);
    const historyRepository = req.app?.locals?.mockHistoryModel || (await import('../models/MockHistory.js')).default;

    // Deliberately persist only totals and topic aggregates, never question content or answer keys.
    await historyRepository.create({
      userId: session.userId,
      testId: session.testId,
      subject: session.subject,
      examType: session.examType,
      totalQuestions: result.totalQuestions,
      attempted: result.attempted,
      correct: result.correct,
      incorrect: result.incorrect,
      unattempted: result.unattempted,
      score: result.score,
      maximumMarks: result.maximumMarks,
      accuracy: result.accuracy,
      timeTaken: result.timeTaken,
      autoSubmitted: expired,
      completedAt,
      topicPerformance: buildTopicPerformance(result.questions),
    });

    // Only remove the session after MongoDB confirms the history write.
    deleteActiveMockSession(session.testId);

    return res.status(200).json({
      success: true,
      message: expired ? 'Time is up. Your test has been submitted automatically.' : 'Your mock test has been submitted successfully.',
      data: {
        testId: session.testId,
        subject: session.subject,
        examType: session.examType,
        ...result,
        completedAt: completedAt.toISOString(),
        autoSubmitted: expired,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/** Discard an in-progress test without creating any history record. */
export const cancelMockTest = (req, res) => {
  const session = findOwnedSession(req);
  if (!session) return res.status(404).json({ success: false, message: 'This mock test is no longer active.' });
  deleteActiveMockSession(session.testId);
  return res.status(200).json({ success: true, message: 'Mock test cancelled and discarded.' });
};
