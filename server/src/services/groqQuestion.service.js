
import { EXAM_TYPES, QUESTION_COUNT, SUBJECTS } from '../constants/mockTest.js';

import {
  shuffleOptions,
  shuffleQuestions,
  validateGeneratedQuestions,
} from '../utils/questionValidation.js';

const GROQ_CHAT_COMPLETIONS_URL =
  'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 120000;
const BATCH_SIZE = 10;
const BATCH_ATTEMPTS = 2;

// Each batch contributes to a balanced final difficulty distribution.
// Final totals: 10 Easy, 10 Medium, 10 Hard.
const BATCH_DIFFICULTIES = [
  { Easy: 4, Medium: 3, Hard: 3 },
  { Easy: 3, Medium: 4, Hard: 3 },
  { Easy: 3, Medium: 3, Hard: 4 },
];

const QUESTION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionText: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              A: { type: 'string' },
              B: { type: 'string' },
              C: { type: 'string' },
              D: { type: 'string' },
            },
            required: ['A', 'B', 'C', 'D'],
            additionalProperties: false,
          },
          correctOption: {
            type: 'string',
            enum: ['A', 'B', 'C', 'D'],
          },
          explanation: { type: 'string' },
          topic: { type: 'string' },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
          },
        },
        required: [
          'questionText',
          'options',
          'correctOption',
          'explanation',
          'topic',
          'difficulty',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

const createGroqError = (message, statusCode = 502) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildQuestionPrompt = ({
  subject,
  examType,
  batchIndex,
  attempt,
}) => {
  const difficulty = BATCH_DIFFICULTIES[batchIndex];

  return `
You are an expert Indian competitive examination question setter.

Generate EXACTLY ${BATCH_SIZE} original MCQs.

EXAMINATION: ${examType}
SUBJECT: ${subject}

DIFFICULTY DISTRIBUTION FOR THIS BATCH:
- Easy: exactly ${difficulty.Easy}
- Medium: exactly ${difficulty.Medium}
- Hard: exactly ${difficulty.Hard}

REQUIREMENTS:

1. Generate exactly 10 questions, no more and no fewer.
2. Follow the syllabus and question style of ${examType}.
3. Cover different relevant topics within ${subject}.
4. Avoid duplicate questions and repeated concepts.
5. Every question must have exactly four distinct options: A, B, C, D.
6. Exactly one option must be correct.
7. correctOption must contain A, B, C or D only.
8. Include a useful explanation for every question.
9. Questions must be factually accurate and unambiguous.
10. Use clear English suitable for Indian competitive examinations.
11. Do not include rapidly changing current affairs.
12. Do not put question numbers inside questionText.
13. Keep explanations concise.
14. Do not include markdown or text outside the JSON response.

IMPORTANT:
- Follow the API-provided JSON schema exactly.
- Do not add extra properties.
- Do not omit required fields.
- Return all 10 complete questions in one response.
- Follow the exact difficulty distribution specified above.
- Do not truncate the final question.

${attempt > 1
      ? `
This is a retry because the previous batch failed validation.
Generate a completely fresh set of 10 questions.
Pay special attention to complete options, explanations and valid answers.
`
      : ''
    }
`;
};

const requestGroqBatch = async ({
  subject,
  examType,
  batchIndex,
  attempt,
}) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw createGroqError(
      'Groq API is not configured. Add GROQ_API_KEY to server/.env.',
      503,
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },

      signal: controller.signal,

      body: JSON.stringify({
        model,

        messages: [
          {
            role: 'system',
            content:
              'You are an expert Indian competitive examination question setter. Generate accurate original MCQs and strictly follow the supplied JSON schema.',
          },
          {
            role: 'user',
            content: buildQuestionPrompt({
              subject,
              examType,
              batchIndex,
              attempt,
            }),
          },
        ],

        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'exam_mock_questions',
            strict: true,
            schema: QUESTION_RESPONSE_SCHEMA,
          },
        },

        // Less reasoning overhead for straightforward MCQ generation.
        reasoning_effort: 'low',

        // Each request generates only 10 questions.
        max_completion_tokens: 8192,

        temperature: 0.6,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const providerMessage = data?.error?.message;
      const failedGeneration = data?.error?.failed_generation;

      if (response.status === 429) {
        const retryAfter = response.headers?.get('retry-after');

        throw createGroqError(
          `Groq rate limit reached${retryAfter ? `. Retry after ${retryAfter} seconds` : ''
          }. Please try again.`,
          503,
        );
      }

      if ([401, 403].includes(response.status)) {
        throw createGroqError(
          'Groq authentication failed. Check GROQ_API_KEY.',
          503,
        );
      }

      const diagnostic = failedGeneration
        ? ` Failed generation: ${String(failedGeneration).slice(0, 300)}`
        : '';

      throw createGroqError(
        `Groq batch ${batchIndex + 1} failed: ${providerMessage || 'Unable to generate questions.'
        }${diagnostic}`,
        response.status >= 500 ? 503 : 502,
      );
    }

    const choice = data?.choices?.[0];

    if (choice?.finish_reason === 'length') {
      throw createGroqError(
        `Groq truncated batch ${batchIndex + 1}. Output token limit reached.`,
      );
    }

    const responseText = choice?.message?.content?.trim();

    if (!responseText) {
      throw createGroqError(
        `Groq returned an empty response for batch ${batchIndex + 1}.`,
      );
    }

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      throw createGroqError(
        `Groq returned invalid JSON for batch ${batchIndex + 1}.`,
      );
    }

    if (
      !parsedResponse ||
      !Array.isArray(parsedResponse.questions) ||
      parsedResponse.questions.length !== BATCH_SIZE
    ) {
      throw createGroqError(
        `Batch ${batchIndex + 1} must contain exactly 10 questions.`,
      );
    }

    return parsedResponse.questions;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createGroqError(
        `Groq batch ${batchIndex + 1} timed out.`,
        504,
      );
    }

    if (error.statusCode) {
      throw error;
    }

    throw createGroqError(
      `Unable to connect to Groq: ${error.message}`,
      503,
    );
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Generate one batch and retry if its basic application validation fails.
 */
const generateValidatedBatch = async ({
  subject,
  examType,
  batchIndex,
}) => {
  let lastError;

  for (let attempt = 1; attempt <= BATCH_ATTEMPTS; attempt += 1) {
    try {
      const questions = await requestGroqBatch({
        subject,
        examType,
        batchIndex,
        attempt,
      });

      // Validate basic question structure for this batch.
      const seen = new Set();

      for (const [index, question] of questions.entries()) {
        if (
          !question ||
          typeof question.questionText !== 'string' ||
          question.questionText.trim().length < 10 ||
          typeof question.explanation !== 'string' ||
          question.explanation.trim().length < 5 ||
          typeof question.topic !== 'string' ||
          question.topic.trim().length < 2 ||
          !['Easy', 'Medium', 'Hard'].includes(question.difficulty) ||
          !['A', 'B', 'C', 'D'].includes(question.correctOption)
        ) {
          throw new Error(
            `Batch ${batchIndex + 1}, question ${index + 1} has invalid fields.`,
          );
        }

        const options = question.options;

        if (
          !options ||
          ['A', 'B', 'C', 'D'].some(
            (key) =>
              typeof options[key] !== 'string' ||
              !options[key].trim(),
          )
        ) {
          throw new Error(
            `Batch ${batchIndex + 1}, question ${index + 1} has invalid options.`,
          );
        }

        const optionValues = ['A', 'B', 'C', 'D'].map(
          (key) => options[key].trim().toLowerCase(),
        );

        if (new Set(optionValues).size !== 4) {
          throw new Error(
            `Batch ${batchIndex + 1}, question ${index + 1} has duplicate options.`,
          );
        }

        const normalizedText = question.questionText
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, ' ')
          .trim()
          .replace(/\s+/g, ' ');

        if (seen.has(normalizedText)) {
          throw new Error(
            `Duplicate question detected in batch ${batchIndex + 1}.`,
          );
        }

        seen.add(normalizedText);
      }

      const expected = BATCH_DIFFICULTIES[batchIndex];
      const actual = { Easy: 0, Medium: 0, Hard: 0 };

      questions.forEach((question) => {
        actual[question.difficulty] += 1;
      });

      for (const level of ['Easy', 'Medium', 'Hard']) {
        if (actual[level] !== expected[level]) {
          throw new Error(
            `Batch ${batchIndex + 1} has an incorrect ${level} distribution.`,
          );
        }
      }

      return questions;
    } catch (error) {
      lastError = error;

      // Authentication, rate limits and provider failures should
      // be reported instead of repeatedly making unnecessary requests.
      if (
        error.statusCode &&
        error.statusCode !== 502
      ) {
        throw error;
      }
    }
  }

  throw createGroqError(
    `Unable to generate valid batch ${batchIndex + 1} after ${BATCH_ATTEMPTS} attempts: ${lastError.message}`,
    502,
  );
};

/**
 * Generate 30 questions in three smaller batches.
 * Run the original complete validation after combining all batches.
 */
export const generateMockQuestions = async ({
  subject,
  examType,
}) => {
  if (!SUBJECTS.includes(subject)) {
    throw createGroqError('Select a supported subject.', 400);
  }

  if (!EXAM_TYPES.includes(examType)) {
    throw createGroqError('Select a supported examination.', 400);
  }

  const allQuestions = [];

  // Sequential execution avoids sending three large requests simultaneously.
  for (let batchIndex = 0; batchIndex < QUESTION_COUNT / BATCH_SIZE; batchIndex += 1) {
    const batchQuestions = await generateValidatedBatch({
      subject,
      examType,
      batchIndex,
    });

    allQuestions.push(...batchQuestions);
  }

  // Preserve your original full-set validation:
  // 30 questions, duplicate detection across batches,
  // difficulty distribution, options and answer validation.
  let validatedQuestions;

  try {
    validatedQuestions = validateGeneratedQuestions({
      questions: allQuestions,
    });
  } catch (error) {
    throw createGroqError(
      `Final question validation failed: ${error.message}. Please generate a new mock test.`,
      502,
    );
  }

  return shuffleQuestions(validatedQuestions).map(
    (question) => shuffleOptions(question),
  );
};
