# ExamPrep AI 

A personal MERN application for practising Indian competitive examinations with freshly generated AI mock tests, test history, topic analytics, bookmarks, daily practice insights, and a personal exam-deadline tracker.

> **Project status:** Core implementation and automated backend unit tests are complete. A live Groq request, live MongoDB integration, browser end-to-end test, and production deployment have not been verified in this environment. Review AI-generated questions before relying on them for exam preparation.

## Features

- Account registration, login, logout, and current-user session using an HTTP-only JWT cookie.
- AI-generated mock tests for **SSC CGL, SBI PO, SBI SO, IBPS RRB PO, and Railway** preparation.
- Four subjects: **Maths Aptitude, Reasoning, English, and General Awareness**.
- Exactly 30 multiple-choice questions per test, with four options and mixed difficulty.
- 25-minute test timer; previous/next navigation, question palette, answer saving, review markers, and confirmation before cancellation/submission.
- Marking scheme: **+3 correct, −1 incorrect, 0 unattempted**.
- Server-side scoring and completed-test history.
- Dashboard totals, subject-level performance, weak-topic insights, daily goal, seven-day activity, and streak.
- Question bookmarks stored in the current browser's local storage.
- Personal exam-update tracker for notifications, application dates, admit cards, exam dates, answer keys, and results.
- Backend rate limits for authentication and mock-test generation, security headers, CORS allow-list, request validation, and health endpoint.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | JWT in an HTTP-only cookie, bcryptjs password hashing |
| Question generation | Groq API with OpenAI-compatible Chat Completions (JSON mode) |
| API documentation | OpenAPI 3.1 and Swagger UI |
| Tests | Node.js built-in test runner |

The codebase uses JavaScript and JSX. It does not require TypeScript.

## Project structure

```text
examprep-ai/
├── client/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── components/       # Protected route
│       ├── features/         # Auth, mock-test API, bookmarks
│       ├── pages/            # Home, auth, dashboard, test, history, etc.
│       ├── services/         # API client and Redux store
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── config/            # MongoDB connection
│       ├── constants/         # Subjects, exams, scoring, duration
│       ├── controllers/       # Request handlers
│       ├── docs/              # OpenAPI specification for Swagger UI
│       ├── middleware/        # Error and 404 handling
│       ├── models/            # User, MockHistory, ExamUpdate
│       ├── routes/            # REST API routes
│       ├── services/          # Groq question generation, temporary sessions
│       ├── tests/             # Automated backend tests
│       └── utils/             # Auth, validation, scoring, analytics
├── package.json
└── README.md
```

## Requirements

- Node.js 20 or newer (Node 20 LTS or a current LTS release is recommended).
- npm (included with Node.js).
- A running MongoDB instance, either local MongoDB or MongoDB Atlas.
- A Groq API key from [Groq Console](https://console.groq.com/keys).

## Local installation

### 1. Get the source and install dependencies

Open a terminal in the project root (`examprep-ai/`):

```bash
npm install
```

The root package uses npm workspaces to install both the React client and Express server.

### 2. Configure the backend

Copy `server/.env.example` to `server/.env` and fill in the values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/examprep_ai
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_bytes
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Generate a strong JWT secret instead of using the placeholder. For example, with OpenSSL:

```bash
openssl rand -base64 48
```

Keep `GROQ_API_KEY` and `JWT_SECRET` on the server only. Never put either value in a `VITE_` variable or commit `.env` files to Git.

The configured default model is `openai/gpt-oss-120b`. Confirm model availability and your account limits in the [Groq model documentation](https://console.groq.com/docs/models). You can change `GROQ_MODEL` without editing source code.

### 3. Configure the frontend

Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=/api
```

For local development, Vite proxies `/api` requests to `http://localhost:5000`, so the default value is correct.

### 4. Start MongoDB

Make sure your local MongoDB service is running, or replace `MONGO_URI` with your Atlas connection string. For Atlas, allow network access from the machine or deployment host and use a database user with appropriate permissions.

### 5. Start both applications

From the project root:

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>
- Interactive Swagger documentation: <http://localhost:5000/api/docs>

You can also start each side independently:

```bash
npm run dev:server
npm run dev:client
```

Create an account in the browser, select an examination and subject, and generate a mock test. Groq generation requires a valid API key, an available model, internet access, and sufficient API quota.

## Useful commands

Run these from the project root:

| Command | Purpose |
|---|---|
| `npm install` | Install workspace dependencies |
| `npm run dev` | Run frontend and backend together |
| `npm run dev:server` | Run only Express with nodemon |
| `npm run dev:client` | Run only Vite |
| `npm test` | Run backend unit tests |
| `npm run check` | Run backend JavaScript syntax checks |
| `npm run build` | Build the frontend for production |
| `npm start` | Start the backend in production mode |

## API overview

All API routes are prefixed with `/api`. Private routes require the `examprep_token` HTTP-only cookie created during login or registration. The frontend API client sends credentials automatically.

| Method | Endpoint | Authentication | Purpose |
|---|---|---:|---|
| `GET` | `/api/health` | No | API and database health |
| `GET` | `/api/docs` | No | Interactive Swagger UI (OpenAPI 3.1) |
| `POST` | `/api/auth/register` | No | Create account |
| `POST` | `/api/auth/login` | No | Log in |
| `POST` | `/api/auth/logout` | No | Clear auth cookie |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `POST` | `/api/mock-tests/generate` | Yes | Generate a new mock test |
| `GET` | `/api/mock-tests/:testId` | Yes | Resume an active test |
| `PUT` | `/api/mock-tests/:testId/answer` | Yes | Save or clear an answer |
| `PUT` | `/api/mock-tests/:testId/review` | Yes | Mark/unmark for review |
| `POST` | `/api/mock-tests/:testId/submit` | Yes | Score and submit test |
| `DELETE` | `/api/mock-tests/:testId` | Yes | Cancel and discard active test |
| `GET` | `/api/history/stats` | Yes | Dashboard and study analytics |
| `GET` | `/api/history?page=1&limit=10` | Yes | Paginated completed-test history |
| `GET` | `/api/history/:testId` | Yes | One saved result summary |
| `GET` | `/api/exam-updates` | Yes | List personal exam updates |
| `POST` | `/api/exam-updates` | Yes | Create an exam update |
| `PUT` | `/api/exam-updates/:id` | Yes | Edit an exam update |
| `DELETE` | `/api/exam-updates/:id` | Yes | Delete an exam update |

### Example request bodies

Generate a test:

```json
{
  "subject": "Maths Aptitude",
  "examType": "SSC CGL"
}
```

Save an answer:

```json
{
  "questionId": "question-id-from-active-test",
  "selectedOption": "B"
}
```

Clear an answer by setting `selectedOption` to `null`. To update the review marker, send `questionId` and a boolean `marked` value to the review endpoint.

Create an exam update:

```json
{
  "examName": "SSC CGL",
  "title": "Application closing date",
  "category": "Application",
  "details": "Check the official notification and required documents.",
  "sourceUrl": "https://ssc.gov.in/",
  "importantDate": "2026-12-15",
  "status": "Upcoming"
}
```

## Data storage and privacy design

| Data | Storage | Notes |
|---|---|---|
| User account | MongoDB | Password is hashed; it is not returned by auth APIs |
| Active mock questions and answer key | Server memory | Not saved to MongoDB; removed after submission/cancellation/expiry cleanup |
| Active answers and review markers | Server memory | Used to resume an active test while the server process remains alive |
| Completed test summary | MongoDB | Scores, counts, timing, subject/exam, and topic aggregates only |
| Exam updates | MongoDB | Scoped to the authenticated user |
| Bookmarked question text/options | Browser local storage | Stays in that browser profile; not synced to MongoDB or other devices |

**Important limitations:**

- Active mock sessions use an in-memory `Map`. Restarting the backend, deploying a new server version, or sending requests to a different server instance can lose an in-progress test. Use a shared store such as Redis before horizontal scaling or production use where active-test continuity matters.
- Completed history intentionally does not store question text, options, correct answers, or explanations. Reopened history pages therefore show saved summaries and topic analytics, not the original question-by-question review.
- Bookmarks are browser-local. Clearing browser storage or switching browsers/devices removes access to those bookmarks.
- The daily goal and streak are derived from completed mock-test activity. In-progress work does not count until submission.
- Exam updates are manually entered by the user. The app does not automatically scrape official recruitment sites or send deadline notifications.
- AI-generated output can contain factual or answer-key errors. Treat it as practice material and cross-check important concepts with authoritative study sources.

## Deployment checklist

This is a deployment checklist, not a claim that the project has already been deployed or production-tested.

### Backend host

1. Create a Node.js service and deploy the repository/project root with the backend workspace as the start target, or configure the platform to run `npm install` at the root and `npm start` from the root.
2. Provide production environment variables: `NODE_ENV=production`, `PORT` (if required by the host), `MONGO_URI`, `CLIENT_URL`, a strong `JWT_SECRET`, `GROQ_API_KEY`, and `GROQ_MODEL`.
3. Use a managed MongoDB database and restrict its network/database-user permissions.
4. Keep secrets in the hosting provider's environment-variable settings; do not upload `.env` files.
5. Check `/api/health` after deployment. It returns an unsuccessful status if MongoDB is disconnected.
6. Configure the host's allowed origin exactly in `CLIENT_URL` (comma-separated if multiple origins are intentionally supported).

### Frontend host

1. Build the `client` workspace using `npm run build --workspace client` (or `npm run build` from the root).
2. Publish the generated `client/dist` directory on a static hosting service.
3. Set `VITE_API_URL` to the backend API base, for example `https://api.example.com/api`.
4. Configure the frontend host to serve `index.html` for client-side routes such as `/dashboard`, `/history`, and `/mock-test/...`.

### Cookie and domain configuration

Authentication uses an HTTP-only cookie. In production it is marked `Secure` and uses `SameSite=Lax`. Prefer serving the frontend and API from the same site using a custom domain and subdomains (for example `app.example.com` and `api.example.com`) so browser cookie rules remain compatible. A frontend and API hosted on unrelated domains may require a deliberate cookie/CSRF architecture change; do not simply loosen cookie settings without adding appropriate CSRF protection and testing browser behavior.

### Before real users rely on it

- Run the frontend production build and smoke-test registration, login, logout, mock generation, timer expiry, cancellation, submission, history, bookmarks, and exam updates in a real browser.
- Test a real Groq request with the configured API key/model and verify returned questions, answer keys, and explanations manually.
- Test MongoDB persistence, indexes, backups, and restore procedure.
- Add a shared session store (for example Redis) before running multiple backend instances or if active tests must survive restarts.
- Add monitoring, structured logs, error reporting, rate-limit review, and abuse controls appropriate to expected usage.
- Review cookie/CSRF behavior and deployment CORS settings from the actual production origins.
- Review accessibility, mobile layouts, and keyboard-only test navigation.

## Automated tests

Backend tests use Node's built-in test runner and do not require a live Groq API call or MongoDB instance for the covered unit cases:

```bash
npm test
npm run check
```

The Groq service test stubs the network request. It verifies request construction and validation flow, not live provider availability or real-world factual accuracy. The current checked-in automated suite covers auth validation, Groq response handling, temporary sessions, mock-test controller behavior, question validation/shuffling, scoring, topic aggregation, and study insights.

## Troubleshooting

- **Server exits on startup:** Check that `MONGO_URI` is reachable and `JWT_SECRET` is at least 32 bytes.
- **Browser reports an API/CORS error:** Confirm the frontend origin matches `CLIENT_URL`, and that `VITE_API_URL` points to the correct API base.
- **Mock generation reports Groq configuration error:** Confirm `GROQ_API_KEY` is set in the backend environment, not the frontend.
- **Groq returns 404 or model-not-found:** Check the model ID and account availability in the official Groq model documentation; update `GROQ_MODEL` as needed.
- **Groq returns 429:** Wait for quota/rate-limit recovery, inspect the `Retry-After` response header, and check your Groq account limits.
- **An active test disappears after server restart:** This is expected with the current in-memory session store. Submit tests before deployments; add Redis for durable active sessions.
- **Bookmarks do not appear on another device:** Bookmarks are intentionally saved in local storage and are not cloud-synced.

## License

No open-source license has been added. Add a license file before distributing or accepting external contributions under specific reuse terms.
