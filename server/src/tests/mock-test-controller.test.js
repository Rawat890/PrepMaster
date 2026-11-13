import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelMockTest,
  getMockTest,
  submitMockTest,
  updateMockAnswer,
  updateReviewStatus,
} from '../controllers/mockTest.controller.js';
import { createActiveMockSession, getActiveMockSession } from '../services/mockSessionStore.js';

const question = {
  questionId: 'controller-question-1',
  questionText: 'What is 2 + 2?',
  options: { A: '3', B: '4', C: '5', D: '6' },
  correctOption: 'B',
  explanation: 'Two plus two equals four.',
  topic: 'Arithmetic',
  difficulty: 'Easy',
};

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return response;
};

const createRequest = (testId, userId = 'controller-user', body = {}, mockHistoryModel = { create: async () => ({}) }) => ({
  params: { testId },
  user: { _id: userId },
  body,
  app: { locals: { mockHistoryModel } },
});

const createSession = () => createActiveMockSession({
  userId: 'controller-user',
  subject: 'Maths Aptitude',
  examType: 'SSC CGL',
  questions: [question],
});

test('active test endpoint never exposes the correct answer', () => {
  const session = createSession();
  const response = createResponse();
  getMockTest(createRequest(session.testId), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.questions[0].correctOption, undefined);
  assert.equal(response.body.data.questions.length, 1);
});

test('saves a valid answer and review marker, then scores on submission', async () => {
  const session = createSession();
  const answerResponse = createResponse();
  updateMockAnswer(createRequest(session.testId, 'controller-user', {
    questionId: question.questionId,
    selectedOption: 'B',
  }), answerResponse);
  assert.equal(answerResponse.statusCode, 200);

  const reviewResponse = createResponse();
  updateReviewStatus(createRequest(session.testId, 'controller-user', {
    questionId: question.questionId,
    marked: true,
  }), reviewResponse);
  assert.equal(reviewResponse.statusCode, 200);

  const submitResponse = createResponse();
  const persistedRecords = [];
  const mockHistoryModel = { create: async (record) => { persistedRecords.push(record); return record; } };
  await submitMockTest(createRequest(session.testId, 'controller-user', {}, mockHistoryModel), submitResponse);
  assert.equal(submitResponse.statusCode, 200);
  assert.equal(submitResponse.body.data.correct, 1);
  assert.equal(submitResponse.body.data.score, 3);
  assert.equal(submitResponse.body.data.questions[0].correctOption, 'B');
  assert.equal(persistedRecords.length, 1);
  assert.equal(persistedRecords[0].correct, 1);
  assert.equal(persistedRecords[0].topicPerformance[0].topic, 'Arithmetic');
  assert.equal('questions' in persistedRecords[0], false);
  assert.equal('correctOption' in persistedRecords[0], false);
  assert.equal(getActiveMockSession(session.testId, 'controller-user'), null);
});

test('rejects invalid options and prevents a different user from accessing a test', () => {
  const session = createSession();
  const invalidResponse = createResponse();
  updateMockAnswer(createRequest(session.testId, 'controller-user', {
    questionId: question.questionId,
    selectedOption: 'E',
  }), invalidResponse);
  assert.equal(invalidResponse.statusCode, 400);

  const ownerResponse = createResponse();
  getMockTest(createRequest(session.testId, 'not-the-owner'), ownerResponse);
  assert.equal(ownerResponse.statusCode, 404);
  assert.ok(getActiveMockSession(session.testId, 'controller-user'));
});

test('cancels and discards an active test without generating a result', () => {
  const session = createSession();
  const response = createResponse();
  cancelMockTest(createRequest(session.testId), response);
  assert.equal(response.statusCode, 200);
  assert.equal(getActiveMockSession(session.testId, 'controller-user'), null);
});


test('keeps the active test if saving its completed summary fails', async () => {
  const session = createSession();
  const response = createResponse();
  let forwardedError = null;
  const request = createRequest(session.testId, 'controller-user', {}, {
    create: async () => { throw new Error('database unavailable'); },
  });

  await submitMockTest(request, response, (error) => { forwardedError = error; });
  assert.equal(forwardedError?.message, 'database unavailable');
  assert.ok(getActiveMockSession(session.testId, 'controller-user'));
});
