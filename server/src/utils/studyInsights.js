/** Build a local-day activity series, current streak and weak-topic list from aggregate history only. */
export const buildStudyInsights = (records, now = new Date(), dailyGoal = 30) => {
  const dateKey = (date) => {
    const value = new Date(date);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const activity = new Map();
  const topics = new Map();
  for (const record of records) {
    const key = dateKey(record.completedAt);
    if ((record.attempted || 0) > 0) activity.set(key, (activity.get(key) || 0) + record.attempted);
    for (const item of record.topicPerformance || []) {
      const current = topics.get(item.topic) || { topic: item.topic, total: 0, correct: 0, incorrect: 0 };
      current.total += item.total || 0;
      current.correct += item.correct || 0;
      current.incorrect += item.incorrect || 0;
      topics.set(item.topic, current);
    }
  }

  const todayKey = dateKey(now);
  const todayQuestions = activity.get(todayKey) || 0;
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = dateKey(date);
    days.push({ date: key, questions: activity.get(key) || 0, goalMet: (activity.get(key) || 0) >= dailyGoal });
  }

  let streakDays = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // If no activity today, allow yesterday's streak to remain active until the day ends.
  if (!activity.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (activity.has(dateKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weakTopics = [...topics.values()]
    .map((item) => ({ ...item, attempted: item.correct + (item.incorrect || 0) }))
    .filter((item) => item.attempted >= 5)
    .map((item) => ({ topic: item.topic, questions: item.attempted, accuracy: Number(((item.correct / item.attempted) * 100).toFixed(1)) }))
    .sort((a, b) => a.accuracy - b.accuracy || b.questions - a.questions)
    .slice(0, 5);

  return { dailyGoal, todayQuestions, goalProgress: Math.min(100, Math.round((todayQuestions / dailyGoal) * 100)), streakDays, last7Days: days, weakTopics };
};
