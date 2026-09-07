export const STAGES = [{
  id: "html-css",
  name: "HTML & CSS",
  questions: [{
    id: "hc1",
    text: "How would you build an accessible, responsive layout using semantic HTML and modern CSS?",
    difficulty: "Easy"
  }, {
    id: "hc2",
    text: "Explain the CSS box model, and how would you debug an element that is the wrong size?",
    difficulty: "Medium"
  }]
}, {
  id: "react",
  name: "React.js",
  questions: [{
    id: "r1",
    text: "Explain the difference between state and props in React.",
    difficulty: "Easy"
  }, {
    id: "r2",
    text: "How does the useEffect dependency array affect when an effect runs?",
    difficulty: "Medium"
  }, {
    id: "r3",
    text: "How would you diagnose and fix unnecessary re-renders in a large React tree?",
    difficulty: "Hard"
  }]
}, {
  id: "python",
  name: "Python",
  questions: [{
    id: "p1",
    text: "What is the difference between a list and a tuple in Python?",
    difficulty: "Easy"
  }, {
    id: "p2",
    text: "Explain how decorators work and give a practical use case.",
    difficulty: "Medium"
  }, {
    id: "p3",
    text: "How does the Global Interpreter Lock affect concurrency choices in Python?",
    difficulty: "Hard"
  }]
}, {
  id: "backend",
  name: "Backend: PostgreSQL & Django",
  questions: [{
    id: "b1",
    text: "How would you design a PostgreSQL schema with reliable constraints, indexes, and transaction boundaries?",
    difficulty: "Easy"
  }, {
    id: "b2",
    text: "How would you model a common Django relationship and use PostgreSQL indexes to avoid N+1 queries?",
    difficulty: "Medium"
  }, {
    id: "b3",
    text: "How would you design authentication, permissions, transactions, and migrations for a Django application backed by PostgreSQL?",
    difficulty: "Hard"
  }]
}];
export const QUESTIONS = STAGES.flatMap((stage, stageIndex) => stage.questions.map(question => ({
  ...question,
  stageId: stage.id,
  stageName: stage.name,
  stageIndex
})));
const STRENGTHS = ["Clear structure — you led with a definition before the example.", "Good use of concrete terminology from the domain.", "You covered the practical trade-offs, not just the theory.", "Confident pacing with very few filler words."];
const IMPROVEMENTS = ["Add a short real-world example to anchor the explanation.", "Mention edge cases or failure modes to show depth.", "Tighten the opening — get to the core idea in the first sentence.", "Quantify impact where you can (latency, queries saved, bundle size)."];
const VERDICTS = {
  low: "Right idea, needs more depth",
  mid: "Solid answer with room to sharpen",
  high: "Strong, interview-ready answer"
};
function pick(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

/** Placeholder evaluator — swap for a Django REST call later. */
export async function evaluateAnswer(question, transcript, sessionId, order = 0) {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api"}/evaluate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: question.id,
      question: question.text,
      stage: question.stageName,
      transcript,
      order
    })
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.detail ?? "Answer evaluation failed.");
  return result;
}
