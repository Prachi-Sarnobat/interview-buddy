🎯 Interview Buddy
AI-powered interview practice platform with real-time webcam proctoring, automated scoring, and instant AI feedback.

✨ Features
🎥 Live Webcam Proctoring — Real-time video capture with proctoring events to detect suspicious activity
🤖 AI-Powered Evaluation — Automated scoring of interview responses using OpenAI or Gemini
📊 Detailed Score Breakdown — Visual score ring with category-wise feedback
📝 Question Cards — Structured interview questions with a guided flow
🔐 Consent & Review — Pre-interview consent screen and post-interview review page
🔒 Secure Authentication — Supabase-powered auth with session management
📱 Responsive Design — Works seamlessly across desktop and mobile devices
🛠️ Tech Stack
Frontend
Technology	Purpose
React 19	UI framework
TanStack Start	Full-stack React framework (SSR)
Vite	Build tool & dev server
Tailwind CSS 4	Styling
Radix UI	Accessible component library
TanStack Router	Type-safe routing
TanStack Query	Data fetching & caching
Supabase	Authentication & session management
Backend
Technology	Purpose
Django 6	Web framework
Django REST Framework	REST API
django-cors-headers	Cross-origin support
SQLite	Database (easily swappable to PostgreSQL)
Gunicorn	Production WSGI server
AI Evaluation
Provider	Model
OpenAI	GPT-4o-mini
Google Gemini	Gemini 1.5 Flash
Mock	Built-in mock evaluator for testing
Infrastructure
Service	Purpose
Cloudflare Workers	Frontend hosting (SSR)
Render	Backend hosting (Django + Gunicorn)
GitHub	Version control & CI/CD via Cloudflare Builds
🏗️ Architecture
interview-buddy/
├── frontend/                # TanStack Start + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── interview/   # Interview flow components
│   │   │   │   ├── ConsentScreen.jsx
│   │   │   │   ├── InterviewFlow.jsx
│   │   │   │   ├── QuestionCard.jsx
│   │   │   │   ├── ScoreRing.jsx
│   │   │   │   └── WebcamTile.jsx
│   │   │   └── ui/          # Reusable UI components (Radix-based)
│   │   ├── routes/         # TanStack Router routes
│   │   ├── lib/             # Backend API client & utilities
│   │   ├── integrations/    # Supabase client & auth
│   │   └── hooks/           # Custom React hooks
│   ├── vite.config.js
│   └── package.json
├── backend/                # Django REST API
│   ├── backend/             # Django project settings
│   ├── interview/           # Interview app (models, views, AI eval)
│   ├── manage.py
│   ├── requirements.txt
│   └── wsgi.py
└── README.md
🚀 Live Demo
Frontend (Cloudflare Workers): https://interview-buddy.prachisarnobatsarnobat.workers.dev
Backend API (Render): https://interview-buddy-gls4.onrender.com/api/
🔧 Local Development
Prerequisites
Node.js 18+ and Bun
Python 3.11+
Git
Frontend Setup
cd frontend
bun install
Create a .env file in the frontend/ directory:

VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
Start the dev server:

bun run dev
Backend Setup
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Create a .env file in the backend/ directory:

DJANGO_SECRET_KEY=your_secret_key
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
AI_PROVIDER=mock
Run migrations and start the server:

python manage.py migrate
python manage.py runserver
📡 API Endpoints
Method	Endpoint	Description
GET	/api/	API root
GET	/api/sessions/	List interview sessions
POST	/api/sessions/	Create a new interview session
GET	/api/sessions/{id}/	Retrieve a specific session
POST	/api/sessions/{id}/evaluate/	Submit answers for AI evaluation
🧠 How It Works
Consent — User grants webcam access and agrees to proctoring terms
Interview Flow — Questions are presented one at a time with a live webcam feed
Proctoring — The system monitors for suspicious activity during the session
Submission — Answers are submitted to the backend for AI evaluation
Scoring — AI evaluates responses and returns a score with category-wise feedback
Review — User reviews their performance with a detailed score breakdown
🔐 Environment Variables
Frontend (Cloudflare Build Settings)
Variable	Description
VITE_API_URL	Backend API base URL
VITE_SUPABASE_URL	Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY	Supabase publishable (anon) key
VITE_SUPABASE_PROJECT_ID	Supabase project ID
Backend (Render Environment)
Variable	Description
DJANGO_SECRET_KEY	Django secret key
DJANGO_DEBUG	Debug mode (0 or 1)
DJANGO_ALLOWED_HOSTS	Comma-separated allowed hosts
CORS_ALLOWED_ORIGINS	Comma-separated allowed origins
AI_PROVIDER	AI evaluator: mock, openai, or gemini
OPENAI_API_KEY	OpenAI API key (if using OpenAI)
GEMINI_API_KEY	Gemini API key (if using Gemini)
📦 Deployment
Frontend → Cloudflare Workers
Connected to GitHub repo via Cloudflare Builds
Auto-deploys on push to main branch
Build command: bun install && bun run build
Deploy command: npx wrangler deploy
Backend → Render
Connected to GitHub repo
Auto-deploys on push to main branch
Build command: pip install -r requirements.txt && python manage.py migrate
Start command: gunicorn backend.wsgi:application
👩‍💻 Author
Prachi Sarnobat

GitHub: @Prachi-Sarnobat
📄 License
This project is licensed under the MIT License.

To use this, create or replace the README.md file at the root of your repo with this content, then:

git add README.md
git commit -m "update README for recruiters"
git push origin main
Want me to adjust anything — like adding a demo screenshot section, badges, or more detail on the AI evaluation logic?

>> 
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
Everything up-to-date


See reasoning
Agent
You need to create the README.md file first. You're in the frontend folder, but the README should be at the repo root. Run this:

cd ..
Then create the file:

@"
# 🎯 Interview Buddy

> AI-powered interview practice platform with real-time webcam proctoring, automated scoring, and instant AI feedback.

## ✨ Features

- 🎥 **Live Webcam Proctoring** — Real-time video capture with proctoring events to detect suspicious activity
- 🤖 **AI-Powered Evaluation** — Automated scoring of interview responses using OpenAI or Gemini
- 📊 **Detailed Score Breakdown** — Visual score ring with category-wise feedback
- 📝 **Question Cards** — Structured interview questions with a guided flow
- 🔐 **Consent & Review** — Pre-interview consent screen and post-interview review page
- 🔒 **Secure Authentication** — Supabase-powered auth with session management
- 📱 **Responsive Design** — Works seamlessly across desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TanStack Start** | Full-stack React framework (SSR) |
| **Vite** | Build tool & dev server |
| **Tailwind CSS 4** | Styling |
| **Radix UI** | Accessible component library |
| **TanStack Router** | Type-safe routing |
| **TanStack Query** | Data fetching & caching |
| **Supabase** | Authentication & session management |

### Backend
| Technology | Purpose |
|---|---|
| **Django 6** | Web framework |
| **Django REST Framework** | REST API |
| **django-cors-headers** | Cross-origin support |
| **SQLite** | Database (easily swappable to PostgreSQL) |
| **Gunicorn** | Production WSGI server |

### AI Evaluation
| Provider | Model |
|---|---|
| **OpenAI** | GPT-4o-mini |
| **Google Gemini** | Gemini 1.5 Flash |
| **Mock** | Built-in mock evaluator for testing |

### Infrastructure
| Service | Purpose |
|---|---|
| **Cloudflare Workers** | Frontend hosting (SSR) |
| **Render** | Backend hosting (Django + Gunicorn) |
| **GitHub** | Version control & CI/CD via Cloudflare Builds |

## 🏗️ Architecture

``````interview-buddy/
├── frontend/                # TanStack Start + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── interview/   # Interview flow components
│   │   │   │   ├── ConsentScreen.jsx
│   │   │   │   ├── InterviewFlow.jsx
│   │   │   │   ├── QuestionCard.jsx
│   │   │   │   ├── ScoreRing.jsx
│   │   │   │   └── WebcamTile.jsx
│   │   │   └── ui/          # Reusable UI components (Radix-based)
│   │   ├── routes/         # TanStack Router routes
│   │   ├── lib/             # Backend API client & utilities
│   │   ├── integrations/    # Supabase client & auth
│   │   └── hooks/           # Custom React hooks
│   ├── vite.config.js
│   └── package.json
├── backend/                # Django REST API
│   ├── backend/             # Django project settings
│   ├── interview/           # Interview app (models, views, AI eval)
│   ├── manage.py
│   ├── requirements.txt
│   └── wsgi.py
└── README.md
🚀 Live Demo
Frontend (Cloudflare Workers): https://interview-buddy.prachisarnobatsarnobat.workers.dev
Backend API (Render): https://interview-buddy-gls4.onrender.com/api/
🔧 Local Development
Prerequisites
Node.js 18+ and Bun
Python 3.11+
Git
Frontend Setup
cd frontend
bun install
Create a .env file in the frontend/ directory:

VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
Start the dev server:

bun run dev
Backend Setup
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Create a .env file in the backend/ directory:

DJANGO_SECRET_KEY=your_secret_key
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
AI_PROVIDER=mock
Run migrations and start the server:

python manage.py migrate
python manage.py runserver
📡 API Endpoints
Method	Endpoint	Description
GET	/api/	API root
GET	/api/sessions/	List interview sessions
POST	/api/sessions/	Create a new interview session
GET	/api/sessions/{id}/	Retrieve a specific session
POST	/api/sessions/{id}/evaluate/	Submit answers for AI evaluation
🧠 How It Works
Consent — User grants webcam access and agrees to proctoring terms
Interview Flow — Questions are presented one at a time with a live webcam feed
Proctoring — The system monitors for suspicious activity during the session
Submission — Answers are submitted to the backend for AI evaluation
Scoring — AI evaluates responses and returns a score with category-wise feedback
Review — User reviews their performance with a detailed score breakdown
🔐 Environment Variables
Frontend (Cloudflare Build Settings)
Variable	Description
VITE_API_URL	Backend API base URL
VITE_SUPABASE_URL	Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY	Supabase publishable (anon) key
VITE_SUPABASE_PROJECT_ID	Supabase project ID
Backend (Render Environment)
Variable	Description
DJANGO_SECRET_KEY	Django secret key
DJANGO_DEBUG	Debug mode (0 or 1)
DJANGO_ALLOWED_HOSTS	Comma-separated allowed hosts
CORS_ALLOWED_ORIGINS	Comma-separated allowed origins
AI_PROVIDER	AI evaluator: mock, openai, or gemini
OPENAI_API_KEY	OpenAI API key (if using OpenAI)
GEMINI_API_KEY	Gemini API key (if using Gemini)
📦 Deployment
Frontend → Cloudflare Workers
Connected to GitHub repo via Cloudflare Builds
Auto-deploys on push to main branch
Build command: bun install && bun run build
Deploy command: npx wrangler deploy
Backend → Render
Connected to GitHub repo
Auto-deploys on push to main branch
Build command: pip install -r requirements.txt && python manage.py migrate
Start command: gunicorn backend.wsgi:application
👩‍💻 Author
Prachi Sarnobat

GitHub: @Prachi-Sarnobat
📄 License
This project is licensed under the MIT License. "@ | Set-Content -Path "README.md" -Encoding utf8
