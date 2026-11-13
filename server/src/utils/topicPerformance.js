/** Reduce detailed in-memory question results to topic aggregates safe for persistence. */
export const buildTopicPerformance = (questions = []) => {
  const topics = new Map();

  for (const question of questions) {
    const topic = String(question.topic || 'General').trim().slice(0, 100) || 'General';
    if (!topics.has(topic)) {
      topics.set(topic, { topic, total: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0 });
    }
    const stats = topics.get(topic);
    stats.total += 1;
    stats[question.status] += 1;
    stats.score += Number(question.marksAwarded) || 0;
  }

  return [...topics.values()].map((stats) => ({
    ...stats,
    accuracy: stats.correct + stats.incorrect
      ? Number(((stats.correct / (stats.correct + stats.incorrect)) * 100).toFixed(2))
      : 0,
  }));
};
