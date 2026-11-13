import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreMockTest } from '../utils/scoreMockTest.js';

const questions = [
  { questionId: 'q1', questionText: 'Question one?', options: { A: 'one', B: 'two', C: 'three', D: 'four' }, correctOption: 'A', explanation: 'A is right.', topic: 'Basics', difficulty: 'Easy' },
  { questionId: 'q2', questionText: 'Question two?', options: { A: 'one', B: 'two', C: 'three', D: 'four' }, correctOption: 'B', explanation: 'B is right.', topic: 'Basics', difficulty: 'Medium' },
  { questionId: 'q3', questionText: 'Question three?', options: { A: 'one', B: 'two', C: 'three', D: 'four' }, correctOption: 'C', explanation: 'C is right.', topic: 'Basics', difficulty: 'Hard' },
];

test('scores correct, incorrect and unattempted answers using +3/-1/0', () => {
  const result = scoreMockTest({
    questions,
    answers: new Map([['q1', 'A'], ['q2', 'D']]),
    startedAt: new Date(Date.now() - 60_000),
  });
  assert.equal(result.totalQuestions, 3);
  assert.equal(result.attempted, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.incorrect, 1);
  assert.equal(result.unattempted, 1);
  assert.equal(result.score, 2);
  assert.equal(result.maximumMarks, 9);
  assert.equal(result.accuracy, 50);
  assert.deepEqual(result.questions.map((question) => question.status), ['correct', 'incorrect', 'unattempted']);
});

test('returns zero accuracy and zero score when every question is unattempted', () => {
  const result = scoreMockTest({ questions, answers: new Map(), startedAt: Date.now() });
  assert.equal(result.score, 0);
  assert.equal(result.accuracy, 0);
  assert.equal(result.attempted, 0);
  assert.equal(result.unattempted, 3);
});

test('can return a negative score when incorrect answers exceed correct answers', () => {
  const result = scoreMockTest({
    questions,
    answers: new Map([['q1', 'B'], ['q2', 'A'], ['q3', 'D']]),
    startedAt: Date.now(),
  });
  assert.equal(result.score, -3);
});
