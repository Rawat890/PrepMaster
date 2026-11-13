import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTopicPerformance } from '../utils/topicPerformance.js';

test('aggregates question outcomes by topic without retaining question content', () => {
  const result = buildTopicPerformance([
    { topic: 'Arithmetic', status: 'correct', marksAwarded: 3, questionText: 'secret question' },
    { topic: 'Arithmetic', status: 'incorrect', marksAwarded: -1, correctOption: 'A' },
    { topic: 'English', status: 'unattempted', marksAwarded: 0 },
  ]);

  assert.deepEqual(result, [
    { topic: 'Arithmetic', total: 2, correct: 1, incorrect: 1, unattempted: 0, score: 2, accuracy: 50 },
    { topic: 'English', total: 1, correct: 0, incorrect: 0, unattempted: 1, score: 0, accuracy: 0 },
  ]);
  assert.equal(JSON.stringify(result).includes('secret question'), false);
  assert.equal(JSON.stringify(result).includes('correctOption'), false);
});

test('handles empty topic input', () => {
  assert.deepEqual(buildTopicPerformance([]), []);
});
