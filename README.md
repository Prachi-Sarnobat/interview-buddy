# Interview Buddy

An AI-powered mock interview platform that runs a full-stack developer through a live, voice-based technical interview — asking questions out loud, listening to spoken answers, and scoring each response with real AI feedback.

**Live app:** https://interview-buddy.prachisarnobatsarnobat.workers.dev

## What it does

- Runs a **fixed full-stack interview sequence**: HTML & CSS → React.js → Python → Node.js/Django & PostgreSQL
- The AI interviewer **speaks each question aloud** (text-to-speech) and **listens to the candidate's spoken answer**, auto-submitting once it detects a pause — no typing, no "done" button
- **Webcam and screen-share** stay active during the interview, with tab-switch detection, in the style of proctored technical interviews
- Every question, transcript, and AI evaluation is **recorded** to the candidate's session
- **Feedback is withheld until the end** of the interview — no score is shown after individual answers, only in the final summary — to keep the experience closer to a real interview
- Each answer is graded by a real AI model (not a rule-based scorer): score out of 10, a verdict, strengths, and areas to improve

## Tech stack

**Frontend**
- React 19 + [TanStack Start](https://tanstack.com/start) (file-based routing, SSR)
- Plain JavaScript/JSX — no TypeScript
- Tailwind CSS
- Deployed on **Cloudflare Workers**

**Backend**
- Django + Django REST Framework
- AI evaluation via the OpenAI API (provider is swappable — Gemini supported too)
- SQLite (dev) — deployed on **Render**

## Project structure

```
interview-buddy/
├── frontend/                 # React + TanStack Start app
│   └── src/
│       ├── components/
│       │   └── interview/    # WebcamTile, QuestionCard, InterviewFlow, etc.
│       └── routes/
└── backend/                  # Django REST Framework API
    ├── config/                # settings, urls
    └── interview/              # sessions, evaluation, AI integration
        ├── models.py            # InterviewSession, QAExchange
        ├── ai.py                # AI provider call (OpenAI/Gemini)
        └── views.py
```

## Getting started

### Frontend

```bash
cd frontend
bun install
bun dev
```

Runs at `http://localhost:3000` (or similar — check terminal output).

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then add your OPENAI_API_KEY
python manage.py migrate
python manage.py runserver
```

Runs at `http://localhost:8000`.

## Environment variables

**Frontend** (`frontend/.env` or your host's build variables):

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL of the deployed backend, e.g. `https://interview-buddy-api.onrender.com` |

**Backend** (`backend/.env`):

| Variable | Description |
|---|---|
| `AI_PROVIDER` | `openai` or `gemini` |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins |
| `DJANGO_SECRET_KEY` | Any random string |
| `DJANGO_DEBUG` | `0` in production |

## API overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sessions/` | Start a new interview session |
| `PATCH` | `/api/sessions/<id>/` | Update session (e.g. end time, tab-switch count) |
| `GET` | `/api/sessions/` | List past sessions |
| `POST` | `/api/evaluate/` | Evaluate one answer via AI — returns score, verdict, strengths, improvements |
| `GET`/`POST` | `/api/sessions/<id>/qa-history/` | Fetch or bulk-save a session's full Q&A history |

## Deployment

- **Frontend:** Cloudflare Workers, via `bun run build && npx wrangler deploy`
- **Backend:** Render, via `gunicorn config.wsgi`

## Roadmap / ideas

- [ ] Support for additional interview tracks beyond full-stack web
- [ ] Persist and visualize score trends across multiple sessions
- [ ] Detect AI-assisted answers during the interview
