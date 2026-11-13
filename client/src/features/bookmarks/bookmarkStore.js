const STORAGE_KEY = 'examprep-ai-bookmarked-questions-v1';

/** Question bookmarks are stored only in this browser, never in MongoDB. */
export const getBookmarks = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

export const isBookmarked = (questionId) => getBookmarks().some((item) => item.questionId === questionId);

export const toggleBookmark = (question, context) => {
  const current = getBookmarks();
  const exists = current.some((item) => item.questionId === question.questionId);
  const next = exists
    ? current.filter((item) => item.questionId !== question.questionId)
    : [{
      questionId: question.questionId,
      questionText: question.questionText,
      options: question.options,
      topic: question.topic,
      difficulty: question.difficulty,
      subject: context.subject,
      examType: context.examType,
      savedAt: new Date().toISOString(),
    }, ...current];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return !exists;
};

export const removeBookmark = (questionId) => {
  const next = getBookmarks().filter((item) => item.questionId !== questionId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};
