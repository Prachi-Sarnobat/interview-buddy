import { TOPICS, type Topic } from "./types";

export function TopicSelect({ onPick }: { onPick: (t: Topic) => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step 2 / 3</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Pick a topic to start</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onPick(topic)}
            className="group rounded-3xl border border-border bg-card p-6 text-left transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{topic.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{topic.blurb}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:border-primary group-hover:text-primary">
                {topic.questions.length} Qs
              </span>
            </div>
          </button>
        ))}
      </div>
      <p className="mt-6 font-mono text-[11px] text-muted-foreground">
        Your camera and mic will turn on once you begin.
      </p>
    </div>
  );
}
