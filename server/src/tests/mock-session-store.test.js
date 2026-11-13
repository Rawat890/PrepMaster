import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createActiveMockSession,
  deleteActiveMockSession,
  getActiveMockSession,
  getActiveSessionCount,
  saveSessionAnswer,
  setSessionReview,
} from '../services/mockSessionStore.js';

const sampleQuestions = [{ questionId: 'question-1', questionText: 'A temporary test question', correctOption: 'C' }];

test('creates an active session in memory and returns its timer metadata', () => {
  const before = getActiveSessionCount();
  const metadata = createActiveMockSession({
    userId: 'user-123',
    subject: 'Maths Aptitude',
    examType: 'SSC CGL',
    questions: sampleQuestions,
  });

  const session = getActiveMockSession(metadata.testId, 'user-123');
  assert.ok(metadata.testId);
  assert.ok(metadata.startedAt);
  assert.ok(metadata.expiresAt);
  assert.equal(session.questions[0].correctOption, 'C');
  assert.equal(getActiveSessionCount(), before + 1);
  deleteActiveMockSession(metadata.testId);
});

test('does not return an active session to a different user', () => {
  const metadata = createActiveMockSession({
    userId: 'owner',
    subject: 'Reasoning',
    examType: 'SBI PO',
    questions: sampleQuestions,
  });
  assert.equal(getActiveMockSession(metadata.testId, 'someone-else'), null);
  deleteActiveMockSession(metadata.testId);
});

test('removes expired sessions when accessed', () => {
  const metadata = createActiveMockSession({
    userId: 'user-expiry',
    subject: 'English',
    examType: 'Railway',
    questions: sampleQuestions,
  });
  const expiredLookup = getActiveMockSession(metadata.testId, 'user-expiry', Date.now() + (31 * 60 * 1000));
  assert.equal(expiredLookup, null);
  assert.equal(getActiveMockSession(metadata.testId, 'user-expiry'), null);
});


test('stores and clears answers and review markers only in the active session', () => {
  const metadata = createActiveMockSession({
    userId: 'session-user',
    subject: 'Maths Aptitude',
    examType: 'SSC CGL',
    questions: sampleQuestions,
  });
  const session = getActiveMockSession(metadata.testId, 'session-user');
  assert.equal(saveSessionAnswer(session, 'question-1', 'B'), true);
  assert.equal(session.answers.get('question-1'), 'B');
  assert.equal(saveSessionAnswer(session, 'question-1', null), true);
  assert.equal(session.answers.has('question-1'), false);
  assert.equal(setSessionReview(session, 'question-1', true), true);
  assert.equal(session.reviewQuestionIds.has('question-1'), true);
  assert.equal(setSessionReview(session, 'question-1', false), true);
  assert.equal(session.reviewQuestionIds.has('question-1'), false);
  assert.equal(saveSessionAnswer(session, 'missing-question', 'A'), false);
  deleteActiveMockSession(metadata.testId);
});
