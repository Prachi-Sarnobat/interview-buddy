export type OrbState = "speaking" | "listening" | "recorded" | "idle";

const COPY: Record<OrbState, string> = {
  speaking: "Zara is speaking",
  listening: "Listening",
  recorded: "Answer recorded",
  idle: "Ready",
};

export function AvatarOrb({ state, caption }: { state: OrbState; caption?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`orb orb-${state}`}>
        <div className="orb-core">
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground">
            Zara
          </span>
        </div>
      </div>
      <p className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        <span className={`orb-dot orb-dot-${state}`} />
        {caption ?? COPY[state]}
      </p>
    </div>
  );
}
