const NOTICES = ["This session is recorded and the recording is saved.", "The session is proctored while you answer.", "Please stay on this tab for the whole interview.", "Avoid external AI tools while answering questions."];
export function ConsentScreen({
  onAccept
}) {
    return <div className="start-panel mx-auto max-w-xl rounded-3xl border border-border bg-card p-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step 1 / 2</p>
      <p className="start-greeting mt-5">Meet Zara</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Your AI interview partner</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Zara will guide you through each question with a warm, natural voice.</p>
      <ul className="mt-6 space-y-3">
        {NOTICES.map(n => <li key={n} className="flex gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">{n}</span>
          </li>)}
      </ul>
      <button onClick={onAccept} className="primary-action mt-8 w-full rounded-full px-5 py-3 text-sm font-medium transition-opacity">
        Sounds good, start interview
      </button>
    </div>;
}
