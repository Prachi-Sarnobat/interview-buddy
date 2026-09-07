const DIFF = {
  Easy: "difficulty-easy",
  Medium: "difficulty-medium",
  Hard: "difficulty-hard"
};
export function QuestionCard({
  question,
  index,
  total
}) {
  return <div className="question-bubble p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Question {index + 1} of {total}
        </span>
        <span className={`difficulty-badge rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${DIFF[question.difficulty]}`}>
          {question.difficulty}
        </span>
      </div>
      <p className="mt-4 text-xl leading-relaxed text-foreground">{question.text}</p>
    </div>;
}
