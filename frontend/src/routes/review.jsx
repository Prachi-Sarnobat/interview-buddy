import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listEvents, listSessions } from "@/lib/proctoring";
const title = "Session Review — AI Interviewer Proctoring Log";
const description = "Review recorded mock interview sessions with tab-switch counts, screen share status and a full proctoring event timeline.";
export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [{
      title
    }, {
      name: "description",
      content: description
    }, {
      property: "og:title",
      content: title
    }, {
      property: "og:description",
      content: description
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary_large_image"
    }]
  }),
  component: ReviewPage
});
function fmt(v) {
  return v ? new Date(v).toLocaleString() : "—";
}
function ReviewPage() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState({});
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    listSessions().then(setSessions).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  const toggle = async id => {
    setOpen(open === id ? null : id);
    if (!events[id]) {
      const rows = await listEvents(id);
      setEvents(prev => ({
        ...prev,
        [id]: rows
      }));
    }
  };
  return <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proctoring</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Session review</h1>
          </div>
          <Link to="/" className="font-mono text-[11px] uppercase tracking-widest text-primary">
            New interview
          </Link>
        </div>

        {loading && <p className="mt-8 text-sm text-muted-foreground">Loading sessions…</p>}
        {error && <p className="mt-8 font-mono text-[11px] text-danger">{error}</p>}
        {!loading && !error && sessions.length === 0 && <p className="mt-8 text-sm text-muted-foreground">No sessions recorded yet.</p>}

        <ul className="mt-8 space-y-4">
          {sessions.map(s => <li key={s.id} className="rounded-3xl border border-border bg-card p-6">
              <button onClick={() => void toggle(s.id)} className="flex w-full items-start justify-between gap-4 text-left">
                <div>
                  <p className="text-lg font-semibold text-foreground">{s.candidate_label || "Full-stack interview"}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {fmt(s.started_at)} → {fmt(s.ended_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Tab switches: <span className="text-foreground">{s.tab_switch_count}</span>
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Screen share:{" "}
                    <span className={s.screen_share_active ? "text-success" : "text-warning"}>
                      {s.screen_share_active ? "active" : "off"}
                    </span>
                  </p>
                </div>
              </button>

              {open === s.id && <ul className="mt-4 space-y-1 border-t border-border pt-4">
                  {(events[s.id] ?? []).map(e => <li key={e.id} className="font-mono text-[11px] text-muted-foreground">
                      {new Date(e.occurred_at).toLocaleTimeString()} — {e.label}
                    </li>)}
                  {(events[s.id] ?? []).length === 0 && <li className="font-mono text-[11px] text-muted-foreground">No events logged.</li>}
                </ul>}
            </li>)}
        </ul>
      </div>
    </main>;
}
