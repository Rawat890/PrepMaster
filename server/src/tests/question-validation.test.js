import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeQuestionText,
  shuffleOptions,
  shuffleQuestions,
  toPublicQuestion,
  validateGeneratedQuestions,
} from '../utils/questionValidation.js';

const buildQuestions = () => Array.from({ length: 30 }, (_, index) => ({
  questionText: `What is the unique practice question number ${index + 1}?`,
  options: { A: 'Option one', B: 'Option two', C: 'Option three', D: 'Option four' },
  correctOption: 'B',
  explanation: 'Option two is correct because this is a test fixture explanation.',
  topic: 'Test topic',
  difficulty: ['Easy', 'Medium', 'Hard'][index % 3],
}));

test('accepts exactly 30 valid questions with a balanced difficulty mix', () => {
  const questions = validateGeneratedQuestions({ questions: buildQuestions() });
  assert.equal(questions.length, 30);
  assert.ok(questions.every((question) => question.questionId));
});

test('rejects a question set that does not contain exactly 30 questions', () => {
  assert.throws(() => validateGeneratedQuestions({ questions: buildQuestions().slice(0, 29) }), /exactly 30/);
});

test('rejects duplicate question text', () => {
  const questions = buildQuestions();
  questions[1].questionText = questions[0].questionText;
  assert.throws(() => validateGeneratedQuestions({ questions }), /Duplicate question/);
});

test('rejects duplicate options', () => {
  const questions = buildQuestions();
  questions[0].options.D = questions[0].options.C;
  assert.throws(() => validateGeneratedQuestions({ questions }), /duplicate options/);
});

test('normalizes punctuation and whitespace for duplicate checks', () => {
  assert.equal(normalizeQuestionText('  What, IS this? '), 'what is this');
});

test('shuffles questions without adding or losing any item', () => {
  const questions = buildQuestions();
  const shuffled = shuffleQuestions(questions, () => 0);
  assert.equal(shuffled.length, questions.length);
  assert.deepEqual(new Set(shuffled.map((question) => question.questionText)), new Set(questions.map((question) => question.questionText)));
});

test('shuffles options while preserving the correct answer', () => {
  const question = buildQuestions()[0];
  const shuffled = shuffleOptions(question, () => 0);
  assert.equal(shuffled.options[shuffled.correctOption], question.options.B);
  assert.deepEqual(new Set(Object.values(shuffled.options)), new Set(Object.values(question.options)));
});

test('removes the correct answer before a question is sent to the browser', () => {
  const question = buildQuestions()[0];
  const publicQuestion = toPublicQuestion(question);
  assert.equal('correctOption' in publicQuestion, false);
});
