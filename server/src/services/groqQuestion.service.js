
import { EXAM_TYPES, QUESTION_COUNT, SUBJECTS } from '../constants/mockTest.js';

import {
  shuffleOptions,
  shuffleQuestions,
  validateGeneratedQuestions,
} from '../utils/questionValidation.js';

const GROQ_CHAT_COMPLETIONS_URL =
  'https://api.groq.com/openai/v1/chat/completions';

const REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

/**
 * Strict JSON schema supported by GPT-OSS 120B.
 * The existing validateGeneratedQuestions() function still performs
 * additional business validation after the response is received.
 */
const QUESTION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionText: {
            type: 'string',
          },
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
          explanation: {
            type: 'string',
          },
          topic: {
            type: 'string',
          },
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

/** Build the question-generation prompt. */
const buildQuestionPrompt = ({ subject, examType, attempt }) => `
You are an expert Indian competitive examination question setter.

Generate exactly ${QUESTION_COUNT} original multiple-choice questions.

EXAMINATION: ${examType}
SUBJECT: ${subject}

REQUIREMENTS:

1. Generate exactly 30 questions.
2. Generate approximately:
   - 10 Easy questions
   - 10 Medium questions
   - 10 Hard questions
3. Follow the actual syllabus and question style of ${examType}.
4. Cover different relevant topics within ${subject}.
5. Avoid repeated concepts and duplicate questions.
6. Every question must have exactly four distinct options:
   A, B, C and D.
7. Exactly one option must be correct.
8. correctOption must contain only A, B, C or D.
9. Provide a useful explanation for every question.
10. Quantitative questions must include the essential calculation.
11. Questions must be factually accurate and unambiguous.
12. Do not create questions requiring rapidly changing current affairs.
13. Use clear English suitable for Indian competitive examinations.
14. Do not add question numbering inside questionText.
15. Keep explanations concise and educational.
16. Do not include markdown, comments or text outside the JSON object.

IMPORTANT:
- Return all 30 questions in one response.
- Follow the supplied JSON schema exactly.
- Do not omit any required field.
- Do not add extra properties.
- Do not return fewer questions.

${
  attempt > 1
    ? `
PREVIOUS ATTEMPT FAILED APPLICATION VALIDATION.
Generate a completely fresh set.
Pay particular attention to:
- Balanced difficulty distribution.
- Unique question text.
- Four distinct options.
- Correct answer consistency.
`
    : ''
}
`;

/** Create a consistent application error. */
const createGroqError = (message, statusCode = 502) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/** Make one Groq API request. */
const requestGroqQuestions = async ({
  subject,
  examType,
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
              'You are an expert Indian competitive examination question setter. Generate original, accurate multiple-choice questions. Follow the JSON schema provided by the API exactly.',
          },
          {
            role: 'user',
            content: buildQuestionPrompt({
              subject,
              examType,
              attempt,
            }),
          },
        ],

        // Strict structured output instead of basic JSON mode.
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'exam_mock_questions',
            strict: true,
            schema: QUESTION_RESPONSE_SCHEMA,
          },
        },

        // GPT-OSS 120B supports low, medium and high.
        reasoning_effort: 'medium',

        // Allow sufficient room for 30 questions and explanations.
        max_completion_tokens: 16384,

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
          `Groq rate limit reached${
            retryAfter ? `. Retry after ${retryAfter} seconds` : ''
          }. Please try again shortly.`,
          503,
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw createGroqError(
          'Groq authentication failed. Check GROQ_API_KEY in server/.env.',
          503,
        );
      }

      const diagnostic = failedGeneration
        ? ` Failed generation: ${String(failedGeneration).slice(0, 400)}`
        : '';

      throw createGroqError(
        `Groq request failed: ${
          providerMessage || 'Unable to generate questions.'
        }${diagnostic}`,
        response.status >= 500 ? 503 : 502,
      );
    }

    const choice = data?.choices?.[0];

    const responseText = choice?.message?.content?.trim();

    if (choice?.finish_reason === 'length') {
      throw createGroqError(
        'Groq reached its output token limit. Please try again.',
      );
    }

    if (!responseText) {
      throw createGroqError(
        'Groq returned an empty response. Please try again.',
      );
    }

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      throw createGroqError(
        'Groq returned invalid JSON despite structured output mode.',
      );
    }

    return parsedResponse;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createGroqError(
        'Question generation timed out after 120 seconds. Please try again.',
        504,
      );
    }

    if (error.statusCode) {
      throw error;
    }

    throw createGroqError(
      `Unable to reach Groq: ${error.message}`,
      503,
    );
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Generate and validate fresh questions.
 *
 * Existing application validation is preserved:
 * - Exactly 30 questions
 * - Four distinct options
 * - Valid answer key
 * - Valid difficulty
 * - Balanced difficulty distribution
 * - Duplicate-question detection
 *
 * Questions are never stored in MongoDB.
 */
export const generateMockQuestions = async ({
  subject,
  examType,
}) => {
  if (!SUBJECTS.includes(subject)) {
    throw createGroqError(
      'Select a supported subject.',
      400,
    );
  }

  if (!EXAM_TYPES.includes(examType)) {
    throw createGroqError(
      'Select a supported examination.',
      400,
    );
  }

  let lastValidationError;

  // First generation + one regeneration if application validation fails.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const payload = await requestGroqQuestions({
      subject,
      examType,
      attempt,
    });

    try {
      const validatedQuestions =
        validateGeneratedQuestions(payload);

      return shuffleQuestions(validatedQuestions).map(
        (question) => shuffleOptions(question),
      );
    } catch (error) {
      lastValidationError = error;
    }
  }

  throw createGroqError(
    `Groq could not produce a valid question set after two attempts: ${lastValidationError.message}`,
    502,
  );
};
