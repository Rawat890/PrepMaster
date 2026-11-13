import { randomUUID } from 'node:crypto';
import { TEST_DURATION_SECONDS } from '../constants/mockTest.js';

// Active test sessions live only in this Node.js process. Neither questions nor
// answers are written to MongoDB. Completed summaries are added in Phase 5.
const activeSessions = new Map();
const SESSION_GRACE_PERIOD_MS = 5 * 60 * 1000;

/** Remove abandoned sessions after the test deadline and submission grace period. */
const removeExpiredSessions = (now = Date.now()) => {
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.expiresAt.getTime() + SESSION_GRACE_PERIOD_MS <= now) {
      activeSessions.delete(sessionId);
    }
  }
};

/** Create a private server-side session and return only its public identifiers/timing. */
export const createActiveMockSession = ({ userId, subject, examType, questions }) => {
  const now = Date.now();
  removeExpiredSessions(now);

  const testId = randomUUID();
  const startedAt = new Date(now);
  const expiresAt = new Date(now + (TEST_DURATION_SECONDS * 1000));

  activeSessions.set(testId, {
    testId,
    userId: String(userId),
    subject,
    examType,
    questions,
    answers: new Map(),
    reviewQuestionIds: new Set(),
    startedAt,
    expiresAt,
    status: 'active',
  });

  return {
    testId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

/** Return a session only to its owner and during the allowed submission window. */
export const getActiveMockSession = (testId, userId, now = Date.now()) => {
  const session = activeSessions.get(testId);
  if (!session) return null;

  if (session.expiresAt.getTime() + SESSION_GRACE_PERIOD_MS <= now) {
    activeSessions.delete(testId);
    return null;
  }

  if (session.userId !== String(userId) || session.status !== 'active') return null;
  return session;
};

/** Store one answer in memory; callers must check ownership and expiry first. */
export const saveSessionAnswer = (session, questionId, selectedOption) => {
  if (!session.questions.some((question) => question.questionId === questionId)) return false;
  if (selectedOption === null) session.answers.delete(questionId);
  else session.answers.set(questionId, selectedOption);
  return true;
};

/** Toggle a question's review marker without persisting it outside this session. */
export const setSessionReview = (session, questionId, shouldReview) => {
  if (!session.questions.some((question) => question.questionId === questionId)) return false;
  if (shouldReview) session.reviewQuestionIds.add(questionId);
  else session.reviewQuestionIds.delete(questionId);
  return true;
};

/** Delete a session after cancellation or successful submission. */
export const deleteActiveMockSession = (testId) => activeSessions.delete(testId);

/** Test-only visibility into the in-memory store; never exposed through an API. */
export const getActiveSessionCount = () => activeSessions.size;
export const getSessionExpiryGracePeriodMs = () => SESSION_GRACE_PERIOD_MS;
