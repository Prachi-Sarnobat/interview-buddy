import type { Question } from "./types";

const DIFF: Record<Question["difficulty"], string> = {
  Easy: "border-success/40 text-success",
  Medium: "border-warning/40 text-warning",
  Hard: "border-danger/40 text-danger",
};

export function QuestionCard({ question, index, total }: { question: Question; index: number; total: number }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Question {index + 1} of {total}
        </span>
        <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${DIFF[question.difficulty]}`}>
          {question.difficulty}
        </span>
      </div>
      <p className="mt-4 text-xl leading-relaxed text-foreground">{question.text}</p>
    </div>
  );
}
