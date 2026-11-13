/** OpenAPI 3.1 specification served by Swagger UI. */
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'ExamPrep AI API',
    version: '1.0.0',
    description: 'API for authentication, AI-generated mock tests, progress history, and personal exam updates.',
  },
  servers: [{ url: '/api', description: 'Current API host' }],
  tags: [
    { name: 'Health' },
    { name: 'Authentication' },
    { name: 'Mock tests' },
    { name: 'History & analytics' },
    { name: 'Exam updates' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'examprep_token',
        description: 'HTTP-only JWT cookie set by register/login. Use the browser session or authenticate through the API first.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: false },
          message: { type: 'string' },
        },
        required: ['success', 'message'],
      },
      GenerateMockTestRequest: {
        type: 'object',
        required: ['subject', 'examType'],
        properties: {
          subject: { type: 'string', enum: ['Maths Aptitude', 'Reasoning', 'English', 'General Awareness'] },
          examType: { type: 'string', enum: ['SSC CGL', 'SBI PO', 'SBI SO', 'IBPS RRB PO', 'Railway'] },
        },
      },
      SaveAnswerRequest: {
        type: 'object',
        required: ['questionId', 'selectedOption'],
        properties: {
          questionId: { type: 'string' },
          selectedOption: { type: ['string', 'null'], enum: ['A', 'B', 'C', 'D', null] },
        },
      },
      ReviewMarkerRequest: {
        type: 'object',
        required: ['questionId', 'marked'],
        properties: { questionId: { type: 'string' }, marked: { type: 'boolean' } },
      },
      ExamUpdateRequest: {
        type: 'object',
        required: ['examName', 'title'],
        properties: {
          examName: { type: 'string', maxLength: 80 },
          title: { type: 'string', maxLength: 160 },
          category: { type: 'string', enum: ['Notification', 'Application', 'Admit Card', 'Exam Date', 'Answer Key', 'Result', 'Other'] },
          details: { type: 'string', maxLength: 2000 },
          sourceUrl: { type: 'string', maxLength: 500, format: 'uri' },
          importantDate: { type: ['string', 'null'], format: 'date' },
          status: { type: 'string', enum: ['Upcoming', 'In Progress', 'Completed', 'Archived'] },
        },
      },
    },
    parameters: {
      TestId: { name: 'testId', in: 'path', required: true, schema: { type: 'string' } },
      UpdateId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'], summary: 'Check API and MongoDB connectivity',
        responses: { 200: { description: 'API and database are healthy' }, 503: { description: 'Database is unavailable' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'], summary: 'Register and authenticate a user',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } } } } } },
        responses: { 201: { description: 'Account created; auth cookie set' }, 400: { description: 'Validation error' }, 409: { description: 'Email already registered' }, 429: { description: 'Rate limit exceeded' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'], summary: 'Log in and set the auth cookie',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Login successful; auth cookie set' }, 400: { description: 'Validation error' }, 401: { description: 'Invalid credentials' }, 429: { description: 'Rate limit exceeded' } },
      },
    },
    '/auth/logout': {
      post: { tags: ['Authentication'], summary: 'Clear the auth cookie', responses: { 200: { description: 'Logged out' } } },
    },
    '/auth/me': {
      get: { tags: ['Authentication'], summary: 'Get the authenticated user', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Current user' }, 401: { description: 'Authentication required' } } },
    },
    '/mock-tests/generate': {
      post: {
        tags: ['Mock tests'], summary: 'Generate a fresh 30-question mock test', security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateMockTestRequest' } } } },
        responses: { 201: { description: 'Mock test generated; answer key remains server-side' }, 400: { description: 'Unsupported subject or exam' }, 429: { description: 'Generation rate limit exceeded' }, 503: { description: 'Groq unavailable or not configured' } },
      },
    },
    '/mock-tests/{testId}': {
      parameters: [{ $ref: '#/components/parameters/TestId' }],
      get: { tags: ['Mock tests'], summary: 'Resume an active test', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Active test without correct answers' }, 404: { description: 'Test unavailable' } } },
      delete: { tags: ['Mock tests'], summary: 'Cancel and discard an active test', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Test discarded without history' }, 404: { description: 'Active test not found' } } },
    },
    '/mock-tests/{testId}/answer': {
      put: {
        tags: ['Mock tests'], summary: 'Save or clear an answer', security: [{ cookieAuth: [] }], parameters: [{ $ref: '#/components/parameters/TestId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SaveAnswerRequest' } } } },
        responses: { 200: { description: 'Answer saved' }, 400: { description: 'Invalid answer payload' }, 404: { description: 'Question or test not found' }, 410: { description: 'Test time ended' } },
      },
    },
    '/mock-tests/{testId}/review': {
      put: {
        tags: ['Mock tests'], summary: 'Set or clear a review marker', security: [{ cookieAuth: [] }], parameters: [{ $ref: '#/components/parameters/TestId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewMarkerRequest' } } } },
        responses: { 200: { description: 'Review marker updated' }, 400: { description: 'Invalid payload' }, 404: { description: 'Question or test not found' }, 410: { description: 'Test time ended' } },
      },
    },
    '/mock-tests/{testId}/submit': {
      post: { tags: ['Mock tests'], summary: 'Score test and persist aggregate result', security: [{ cookieAuth: [] }], parameters: [{ $ref: '#/components/parameters/TestId' }], responses: { 200: { description: 'Scored result returned; aggregate summary saved' }, 404: { description: 'Active test not found' } } },
    },
    '/history/stats': {
      get: { tags: ['History & analytics'], summary: 'Get dashboard and study analytics', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Overview, subject performance, activity, and weak topics' } } },
    },
    '/history': {
      get: {
        tags: ['History & analytics'], summary: 'List completed tests', security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
        ],
        responses: { 200: { description: 'Paginated summary-only history' } },
      },
    },
    '/history/{testId}': {
      get: { tags: ['History & analytics'], summary: 'Get one completed test summary', security: [{ cookieAuth: [] }], parameters: [{ $ref: '#/components/parameters/TestId' }], responses: { 200: { description: 'Saved aggregate result' }, 404: { description: 'History item not found' } } },
    },
    '/exam-updates': {
      get: { tags: ['Exam updates'], summary: 'List personal exam updates', security: [{ cookieAuth: [] }], responses: { 200: { description: 'User exam updates' } } },
      post: {
        tags: ['Exam updates'], summary: 'Create a personal exam update', security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ExamUpdateRequest' } } } },
        responses: { 201: { description: 'Update created' }, 400: { description: 'Invalid update data' } },
      },
    },
    '/exam-updates/{id}': {
      parameters: [{ $ref: '#/components/parameters/UpdateId' }],
      put: {
        tags: ['Exam updates'], summary: 'Edit a personal exam update', security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ExamUpdateRequest' } } } },
        responses: { 200: { description: 'Update saved' }, 400: { description: 'Invalid update data' }, 404: { description: 'Update not found' } },
      },
      delete: { tags: ['Exam updates'], summary: 'Delete a personal exam update', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Update deleted' }, 404: { description: 'Update not found' } } },
    },
  },
};

export default openApiSpec;
