const NOTICES = [
  "This session is recorded and the recording is saved.",
  "The session is proctored while you answer.",
  "Please stay on this tab for the whole interview.",
  "Avoid external AI tools while answering questions.",
];

export function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step 1 / 3</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Before you start</h1>
      <ul className="mt-6 space-y-3">
        {NOTICES.map((n) => (
          <li key={n} className="flex gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">{n}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onAccept}
        className="mt-8 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Sounds good, start interview
      </button>
    </div>
  );
}
