import { randomUUID } from 'node:crypto';
import { QUESTION_COUNT } from '../constants/mockTest.js';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** Normalize question text so exact duplicates can be detected reliably. */
export const normalizeQuestionText = (value) => value
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()
  .replace(/\s+/g, ' ');

/**
 * Validate and normalize untrusted LLM output before it can reach the client.
 * This checks structure and consistency, not the factual correctness of an answer.
 */
export const validateGeneratedQuestions = (payload) => {
  if (!payload || !Array.isArray(payload.questions)) {
    throw new Error('AI provider returned an invalid question payload.');
  }

  if (payload.questions.length !== QUESTION_COUNT) {
    throw new Error(`AI provider must return exactly ${QUESTION_COUNT} questions.`);
  }

  const seenQuestions = new Set();
  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };

  const questions = payload.questions.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Question ${index + 1} is not a valid object.`);
    }

    const questionText = typeof item.questionText === 'string' ? item.questionText.trim() : '';
    const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';
    const topic = typeof item.topic === 'string' ? item.topic.trim() : '';
    const difficulty = item.difficulty;

    if (questionText.length < 10 || questionText.length > 1200) {
      throw new Error(`Question ${index + 1} has invalid question text.`);
    }
    if (explanation.length < 5 || explanation.length > 2000) {
      throw new Error(`Question ${index + 1} has an invalid explanation.`);
    }
    if (topic.length < 2 || topic.length > 80) {
      throw new Error(`Question ${index + 1} has an invalid topic.`);
    }
    if (!DIFFICULTIES.includes(difficulty)) {
      throw new Error(`Question ${index + 1} has an invalid difficulty.`);
    }

    const normalizedText = normalizeQuestionText(questionText);
    if (seenQuestions.has(normalizedText)) {
      throw new Error(`Duplicate question detected at position ${index + 1}.`);
    }
    seenQuestions.add(normalizedText);

    if (!item.options || typeof item.options !== 'object' || Array.isArray(item.options)) {
      throw new Error(`Question ${index + 1} must contain four options.`);
    }

    const optionValues = OPTION_KEYS.map((key) => {
      const value = item.options[key];
      if (typeof value !== 'string' || !value.trim() || value.trim().length > 500) {
        throw new Error(`Question ${index + 1} has an invalid option ${key}.`);
      }
      return value.trim();
    });

    // Four distinct choices are required; repeated options make an MCQ ambiguous.
    if (new Set(optionValues.map((value) => value.toLowerCase())).size !== 4) {
      throw new Error(`Question ${index + 1} contains duplicate options.`);
    }

    if (!OPTION_KEYS.includes(item.correctOption)) {
      throw new Error(`Question ${index + 1} has an invalid correct option.`);
    }

    difficultyCounts[difficulty] += 1;

    return {
      questionId: randomUUID(),
      questionText,
      options: Object.fromEntries(OPTION_KEYS.map((key, optionIndex) => [key, optionValues[optionIndex]])),
      correctOption: item.correctOption,
      explanation,
      topic,
      difficulty,
    };
  });

  // Mixed mode aims for a balanced set instead of accidentally returning mostly one level.
  if (Object.values(difficultyCounts).some((count) => count < 8 || count > 12)) {
    throw new Error('Question difficulty distribution is not balanced. Generate approximately 10 questions per difficulty.');
  }

  return questions;
};

/** Fisher-Yates shuffle; unlike sort(() => Math.random() - 0.5), this is unbiased. */
export const shuffleQuestions = (questions, random = Math.random) => {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

/** Randomize answer positions too, while preserving the internal correct answer. */
export const shuffleOptions = (question, random = Math.random) => {
  const originalOptions = Object.entries(question.options).map(([key, value]) => ({
    value,
    isCorrect: key === question.correctOption,
  }));

  for (let index = originalOptions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [originalOptions[index], originalOptions[swapIndex]] = [originalOptions[swapIndex], originalOptions[index]];
  }

  const options = {};
  let correctOption;
  OPTION_KEYS.forEach((key, index) => {
    options[key] = originalOptions[index].value;
    if (originalOptions[index].isCorrect) correctOption = key;
  });

  return { ...question, options, correctOption };
};

/** Remove the answer key before question data is sent to an untrusted browser. */
export const toPublicQuestion = ({ correctOption, ...question }) => question;
