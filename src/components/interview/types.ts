export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: string;
  text: string;
  difficulty: Difficulty;
  stage: string;
}

export interface InterviewStage {
  id: string;
  name: string;
  blurb: string;
  questions: Question[];
}

export interface Evaluation {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
}

export interface AnswerRecord {
  question: Question;
  transcript: string;
  evaluation: Evaluation;
}

/** Fixed full-stack interview sequence — always in this order. */
export const INTERVIEW_STAGES: InterviewStage[] = [
  {
    id: "htmlcss",
    name: "HTML & CSS",
    blurb: "Semantics, layout, responsive design",
    questions: [
      { id: "h1", stage: "HTML & CSS", text: "What does semantic HTML mean, and why does it matter?", difficulty: "Easy" },
      { id: "h2", stage: "HTML & CSS", text: "Explain the difference between Flexbox and CSS Grid, and when you would use each.", difficulty: "Medium" },
      { id: "h3", stage: "HTML & CSS", text: "How would you debug and fix a layout that breaks on small screens?", difficulty: "Hard" },
    ],
  },
  {
    id: "react",
    name: "React.js",
    blurb: "Hooks, rendering, state",
    questions: [
      { id: "r1", stage: "React.js", text: "Explain the difference between state and props in React.", difficulty: "Easy" },
      { id: "r2", stage: "React.js", text: "How does the useEffect dependency array affect when an effect runs?", difficulty: "Medium" },
      { id: "r3", stage: "React.js", text: "How would you diagnose and fix unnecessary re-renders in a large React tree?", difficulty: "Hard" },
    ],
  },
  {
    id: "python",
    name: "Python",
    blurb: "Core language and idioms",
    questions: [
      { id: "p1", stage: "Python", text: "What is the difference between a list and a tuple in Python?", difficulty: "Easy" },
      { id: "p2", stage: "Python", text: "Explain how decorators work and give a practical use case.", difficulty: "Medium" },
      { id: "p3", stage: "Python", text: "How does the Global Interpreter Lock affect concurrency choices in Python?", difficulty: "Hard" },
    ],
  },
  {
    id: "backend",
    name: "Node.js, PostgreSQL & Django",
    blurb: "APIs, data modelling, performance",
    questions: [
      { id: "b1", stage: "Node.js, PostgreSQL & Django", text: "How does the Node.js event loop handle asynchronous work?", difficulty: "Easy" },
      { id: "b2", stage: "Node.js, PostgreSQL & Django", text: "In PostgreSQL, when would you add an index, and what does it cost you?", difficulty: "Medium" },
      { id: "b3", stage: "Node.js, PostgreSQL & Django", text: "How would you design authentication and permissions for a Django REST API?", difficulty: "Hard" },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = INTERVIEW_STAGES.flatMap((s) => s.questions);

const STRENGTHS = [
  "Clear structure — you led with a definition before the example.",
  "Good use of concrete terminology from the domain.",
  "You covered the practical trade-offs, not just the theory.",
  "Confident pacing with very few filler words.",
];

const IMPROVEMENTS = [
  "Add a short real-world example to anchor the explanation.",
  "Mention edge cases or failure modes to show depth.",
  "Tighten the opening — get to the core idea in the first sentence.",
  "Quantify impact where you can (latency, queries saved, bundle size).",
];

const VERDICTS = {
  low: "Right idea, needs more depth",
  mid: "Solid answer with room to sharpen",
  high: "Strong, interview-ready answer",
};

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

/** Placeholder evaluator — swap for a Django REST call later. */
export function evaluateAnswer(_question: Question, transcript: string): Promise<Evaluation> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const base = transcript.trim().length > 120 ? 6 : 4;
      const score = Math.min(10, Math.max(1, base + Math.floor(Math.random() * 5)));
      resolve({
        score,
        verdict: score >= 8 ? VERDICTS.high : score >= 5 ? VERDICTS.mid : VERDICTS.low,
        strengths: pick(STRENGTHS, 2),
        improvements: pick(IMPROVEMENTS, 2),
      });
    }, 1200);
  });
}
