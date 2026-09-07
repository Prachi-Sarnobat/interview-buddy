# interview-buddy — frontend only

```
interview-buddy/
└── frontend/   React + TanStack Start app, converted to plain JS/JSX
```

Backend is intentionally not included — you're building that yourself.

## What changed from your original zip

- Every `.ts` / `.tsx` file converted to `.js` / `.jsx` (types stripped with
  Babel, nothing else touched — same logic, same JSX, same imports)
- `tsconfig.json` removed; replaced with `jsconfig.json` so the `@/...`
  path alias still works (also set directly in `vite.config.js` as backup)
- `eslint.config.js` rewired for plain JS (dropped `typescript-eslint`)
- `components.json`: `"tsx": false` (so future shadcn components generate as `.jsx`)
- `package.json`: removed `typescript`, `typescript-eslint`, and `@types/*`
  dev dependencies
- Removed `.lovable/`, `AGENTS.md` (Lovable editor metadata, unused by code)
- `src/routeTree.gen.ts` removed — TanStack Router regenerates this file
  itself (still as `.ts`, since that's the plugin's own generated output,
  not something you write or edit) the moment you run `bun dev` / `bun run build`

I test-built this (`vite build`) end to end and it completed clean.

## Run it

```
cd frontend
bun install
bun dev
```

# backend

Django REST Framework backend for interview-buddy. Tested end-to-end
(sessions, evaluate, and QA-history endpoints all verified working).

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/                 # settings, urls
└── interview/               # the one app
    ├── models.py             # InterviewSession, QAExchange
    ├── ai.py                 # AI call — swap providers here only
    ├── serializers.py
    ├── views.py
    ├── urls.py
    └── admin.py
```

## Setup

```
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and set:
```
AI_PROVIDER=openai          # or "gemini"
OPENAI_API_KEY=sk-...       # get one at platform.openai.com
```

Then:
```
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://localhost:8000`.

## Endpoints

| Method | URL | Does |
|---|---|---|
| POST | `/api/sessions/` | start a session, returns `id` |
| PATCH | `/api/sessions/<id>/` | update (e.g. `ended_at`, `tab_switch_count`) |
| GET | `/api/sessions/` | list sessions (for "Review sessions") |
| **POST** | **`/api/evaluate/`** | **evaluates one answer via AI — this replaces your mock `evaluateAnswer()`** |
| GET/POST | `/api/sessions/<id>/qa-history/` | fetch or bulk-save a session's full Q&A history |

### `/api/evaluate/` — request

```json
{
  "session_id": "optional-uuid, omit if you'll bulk-save history at the end instead",
  "question_id": "b1",
  "question": "...",
  "stage": "Backend: PostgreSQL & Django",
  "transcript": "candidate answer"
}
```

### `/api/evaluate/` — response

```json
{
  "score": 8,
  "verdict": "Strong answer",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}
```

If `session_id` is included, this exchange (question + transcript + the AI's
evaluation) is saved to that session automatically. If you'd rather save
everything in one shot at the end of the interview instead of per-question,
leave `session_id` out here and call the bulk endpoint once at the end.

## Frontend integration

Replace your mock function with a real call:

```js
async function evaluateAnswer(question, transcript, { questionId, stage, sessionId } = {}) {
  const res = await fetch("http://localhost:8000/api/evaluate/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId ?? null,
      question_id: questionId,
      question,
      stage,
      transcript,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Evaluation failed");
  }

  return res.json(); // { score, verdict, strengths, improvements }
}
```

## Notes

- No API key set yet? The endpoint returns a clean `503` with
  `{"detail": "OPENAI_API_KEY is not set..."}` instead of crashing, so you
  can build/test everything else first and wire in the key later.
- Switching from OpenAI to Gemini later is a one-line change:
  `AI_PROVIDER=gemini` in `.env`, plus `GEMINI_API_KEY`. No other file needs
  to change — `interview/ai.py` is the only place that knows about either
  provider.
- CORS is already open for `localhost:3000`, `:5173`, and `:8080` (covers
  common Vite/dev ports). Add your deployed frontend origin to
  `CORS_ALLOWED_ORIGINS` in `.env` when you deploy.
