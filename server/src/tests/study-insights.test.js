import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStudyInsights } from '../utils/studyInsights.js';

test("study insights calculate today's answered questions and seven-day goal progress", () => {
  const now = new Date(2026, 10, 13, 12);
  const records = [
    { completedAt: new Date(2026, 10, 13, 9), attempted: 12, topicPerformance: [] },
    { completedAt: new Date(2026, 10, 12, 9), attempted: 30, topicPerformance: [] },
  ];
  const result = buildStudyInsights(records, now, 30);
  assert.equal(result.todayQuestions, 12);
  assert.equal(result.goalProgress, 40);
  assert.equal(result.streakDays, 2);
  assert.equal(result.last7Days.length, 7);
  assert.equal(result.last7Days.at(-1).date, '2026-11-13');
});

test('study insights preserve a yesterday streak when there is no activity today', () => {
  const now = new Date(2026, 10, 13, 12);
  const result = buildStudyInsights([{ completedAt: new Date(2026, 10, 12, 9), attempted: 10, topicPerformance: [] }], now);
  assert.equal(result.todayQuestions, 0);
  assert.equal(result.streakDays, 1);
});

test('weak topics require five questions and sort by lowest accuracy', () => {
  const now = new Date(2026, 10, 13);
  const result = buildStudyInsights([{
    completedAt: now, attempted: 20,
    topicPerformance: [
      { topic: 'Algebra', total: 10, correct: 3, incorrect: 7 },
      { topic: 'Grammar', total: 8, correct: 7, incorrect: 1 },
      { topic: 'Tiny topic', total: 2, correct: 0, incorrect: 2 },
    ],
  }], now);
  assert.deepEqual(result.weakTopics.map((item) => item.topic), ['Algebra', 'Grammar']);
  assert.equal(result.weakTopics[0].accuracy, 30);
});
