export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: string;
  text: string;
  difficulty: Difficulty;
}

export interface Topic {
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

export const TOPICS: Topic[] = [
  {
    id: "react",
    name: "React",
    blurb: "Hooks, rendering, state",
    questions: [
      { id: "r1", text: "Explain the difference between state and props in React.", difficulty: "Easy" },
      { id: "r2", text: "How does the useEffect dependency array affect when an effect runs?", difficulty: "Medium" },
      { id: "r3", text: "How would you diagnose and fix unnecessary re-renders in a large React tree?", difficulty: "Hard" },
    ],
  },
  {
    id: "python",
    name: "Python",
    blurb: "Core language and idioms",
    questions: [
      { id: "p1", text: "What is the difference between a list and a tuple in Python?", difficulty: "Easy" },
      { id: "p2", text: "Explain how decorators work and give a practical use case.", difficulty: "Medium" },
      { id: "p3", text: "How does the Global Interpreter Lock affect concurrency choices in Python?", difficulty: "Hard" },
    ],
  },
  {
    id: "django",
    name: "Django",
    blurb: "ORM, views, REST",
    questions: [
      { id: "d1", text: "What does the Django ORM do, and how do you define a model?", difficulty: "Easy" },
      { id: "d2", text: "How do you avoid N+1 queries in Django with select_related and prefetch_related?", difficulty: "Medium" },
      { id: "d3", text: "How would you design authentication and permissions for a Django REST API?", difficulty: "Hard" },
    ],
  },
  {
    id: "sql",
    name: "SQL",
    blurb: "Joins, indexes, tuning",
    questions: [
      { id: "s1", text: "What is the difference between an INNER JOIN and a LEFT JOIN?", difficulty: "Easy" },
      { id: "s2", text: "When would you use a window function instead of a GROUP BY?", difficulty: "Medium" },
      { id: "s3", text: "How do you diagnose a slow query and decide which indexes to add?", difficulty: "Hard" },
    ],
  },
];

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
    }, 1600);
  });
}
