CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  candidate_label TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  screen_share_active BOOLEAN NOT NULL DEFAULT false,
  tab_switch_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.proctoring_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  label TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proctoring_events_session ON public.proctoring_events(session_id, occurred_at);

GRANT SELECT, INSERT, UPDATE ON public.interview_sessions TO anon, authenticated;
GRANT SELECT, INSERT ON public.proctoring_events TO anon, authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
GRANT ALL ON public.proctoring_events TO service_role;

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sessions" ON public.interview_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create sessions" ON public.interview_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.interview_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read events" ON public.proctoring_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create events" ON public.proctoring_events FOR INSERT TO anon, authenticated WITH CHECK (true);