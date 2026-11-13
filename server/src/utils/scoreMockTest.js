import { MARKS_PER_CORRECT_ANSWER, MARKS_PER_WRONG_ANSWER, TEST_DURATION_SECONDS } from '../constants/mockTest.js';

/** Calculate a final result from private server-side questions and saved answers. */
export const scoreMockTest = ({ questions, answers, startedAt, now = Date.now() }) => {
  const correctQuestions = [];
  const incorrectQuestions = [];
  const unattemptedQuestions = [];

  const questionResults = questions.map((question, index) => {
    const selectedOption = answers.get(question.questionId) || null;
    const status = selectedOption === null
      ? 'unattempted'
      : (selectedOption === question.correctOption ? 'correct' : 'incorrect');
    const marksAwarded = status === 'correct'
      ? MARKS_PER_CORRECT_ANSWER
      : (status === 'incorrect' ? MARKS_PER_WRONG_ANSWER : 0);

    const result = {
      questionId: question.questionId,
      questionNumber: index + 1,
      questionText: question.questionText,
      options: question.options,
      selectedOption,
      correctOption: question.correctOption,
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      status,
      marksAwarded,
    };

    if (status === 'correct') correctQuestions.push(result);
    else if (status === 'incorrect') incorrectQuestions.push(result);
    else unattemptedQuestions.push(result);
    return result;
  });

  const correct = correctQuestions.length;
  const incorrect = incorrectQuestions.length;
  const unattempted = unattemptedQuestions.length;
  const attempted = correct + incorrect;

  return {
    totalQuestions: questions.length,
    attempted,
    correct,
    incorrect,
    unattempted,
    score: (correct * MARKS_PER_CORRECT_ANSWER) + (incorrect * MARKS_PER_WRONG_ANSWER),
    maximumMarks: questions.length * MARKS_PER_CORRECT_ANSWER,
    accuracy: attempted ? Number(((correct / attempted) * 100).toFixed(2)) : 0,
    timeTaken: Math.min(TEST_DURATION_SECONDS, Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))),
    questions: questionResults,
  };
};
