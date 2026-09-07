# Interview Buddy

Build a React + Tailwind CSS web app called "AI Interviewer" — a mock interview platform with voice interaction, styled with a dark theme (slate-900 page background, slate-800 cards with slate-700 borders, rounded-3xl corners, indigo-500 accent buttons, font-mono for labels/badges).

SCREENS / FLOW:

1. Consent screen

   - Title "Before you start"

   - 4 bullet notices: recording is saved, this session is proctored, stay on this tab, avoid external AI tools during answers

   - Button "Sounds good, start interview"

2. Topic selection screen

   - Title "Pick a topic to start"

   - 4 clickable topic cards: React, Python, Django, SQL — each shows topic name and question count

   - Note: "Your camera and mic will turn on once you begin"

3. Interview screen (two-column layout)

   - Left column: small persistent webcam preview tile (use getUserMedia), with a "LIVE" badge

   - Right column:

     - Progress bar (segmented, one segment per question)

     - Question card with a difficulty badge (Easy/Medium/Hard, color-coded green/amber/rose) and the question text

     - "AI speaking" indicator with a pulsing dot when the question is being read aloud (use SpeechSynthesisUtterance)

     - A listening state: pulsing red dot, live transcript area showing speech-to-text output (use the Web SpeechRecognition API, continuous + interimResults), and a manual "Submit now" button as a fallback

     - Auto-submit the answer after ~2.5 seconds of silence (reset a timer on every new speech result)

     - An "evaluating" loading state with a spinner

     - A feedback card: a circular SVG score ring (0–10, color-coded red/amber/green), a verdict headline, a "Strengths" section, and a "To improve" section, then a "Next question" / "See summary" button

4. Screen share + tab-switch tracking (proctoring)

   - A "Share your screen" step using getDisplayMedia(), with a status bar like "You are sharing your screen — Stop sharing"

   - Detect tab switches / window blur using the visibilitychange and blur events, and log them with timestamps

   - Detect if screen sharing stops mid-interview (listen for the 'ended' event on the video track)

5. Summary screen

   - Average score shown in the same circular score ring component

   - List of every question with its individual score

   - A "Proctoring notes" section showing tab-switch count and screen-share status (factual tone, not alarmist)

   - "Start another topic" button to restart

TECHNICAL NOTES:

- Use only browser-native APIs for voice/camera/screen (SpeechSynthesis, SpeechRecognition, getUserMedia, getDisplayMedia) — no external voice API needed on the frontend

- For now, use mock/hardcoded questions (2–3 per topic) and a fake evaluate function (setTimeout + random score) — this will later be replaced with a real Django REST API call

- Keep components modular: ConsentScreen, TopicSelect, WebcamTile, ScoreRing, QuestionCard, InterviewFlow (parent)

- No localStorage — keep all state in React state, since it needs to reset per session

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/385802d9-5abe-4b3d-8bbb-967859632ef2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
