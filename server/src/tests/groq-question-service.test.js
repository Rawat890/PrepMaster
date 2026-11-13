import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMockQuestions } from '../services/groqQuestion.service.js';

const makeValidPayload = () => ({
  questions: Array.from({ length: 30 }, (_, index) => ({
    questionText: `Which statement describes the unique sample concept number ${index + 1}?`,
    options: { A: `Choice alpha ${index}`, B: `Choice beta ${index}`, C: `Choice gamma ${index}`, D: `Choice delta ${index}` },
    correctOption: 'C',
    explanation: `Choice gamma ${index} is correct because the sample explanation supports it.`,
    topic: 'Sample topic',
    difficulty: ['Easy', 'Medium', 'Hard'][index % 3],
  })),
});

const withGroqEnv = async (run) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.GROQ_MODEL = 'openai/gpt-oss-120b-test';
  try { await run(); }
  finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalModel;
  }
};

test('sends Groq JSON-mode request and returns 30 shuffled validated questions', async () => {
  await withGroqEnv(async () => {
    let capturedUrl;
    let capturedOptions;
    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return {
        ok: true,
        headers: { get: () => null },
        json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(makeValidPayload()) } }] }),
      };
    };

    const questions = await generateMockQuestions({ subject: 'Maths Aptitude', examType: 'SSC CGL' });
    const body = JSON.parse(capturedOptions.body);
    assert.equal(questions.length, 30);
    assert.equal(capturedUrl, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer test-groq-key');
    assert.equal(body.model, 'openai/gpt-oss-120b-test');
    assert.deepEqual(body.response_format, { type: 'json_object' });
    assert.equal(body.max_completion_tokens, 8192);
    assert.ok(questions.every((question) => question.correctOption));
    assert.deepEqual(questions.map((question) => question.difficulty).sort(), [...Array(10).fill('Easy'), ...Array(10).fill('Hard'), ...Array(10).fill('Medium')].sort());
  });
});

test('rejects unsupported subjects before calling Groq', async () => {
  await assert.rejects(generateMockQuestions({ subject: 'History', examType: 'SSC CGL' }), { message: 'Select a supported subject.' });
});

test('maps Groq rate limiting to a safe service-unavailable error', async () => {
  await withGroqEnv(async () => {
    globalThis.fetch = async () => ({
      ok: false, status: 429,
      headers: { get: (name) => name === 'retry-after' ? '3' : null },
      json: async () => ({ error: { message: 'rate limit reached' } }),
    });
    await assert.rejects(
      generateMockQuestions({ subject: 'Maths Aptitude', examType: 'SSC CGL' }),
      (error) => error.statusCode === 503 && error.message.includes('Retry after 3 seconds'),
    );
  });
});

test('regenerates once when Groq returns invalid question structure', async () => {
  await withGroqEnv(async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      const payload = makeValidPayload();
      if (calls === 1) payload.questions.pop();
      return { ok: true, headers: { get: () => null }, json: async () => ({ choices: [{ message: { content: JSON.stringify(payload) } }] }) };
    };
    const questions = await generateMockQuestions({ subject: 'English', examType: 'SBI PO' });
    assert.equal(calls, 2);
    assert.equal(questions.length, 30);
  });
});
