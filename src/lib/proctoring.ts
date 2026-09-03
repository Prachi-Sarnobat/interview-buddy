import { supabase } from "@/integrations/supabase/client";

export type ProctoringEventType = "tab_switch" | "window_blur" | "share_started" | "share_stopped";

export interface SessionRow {
  id: string;
  topic: string;
  candidate_label: string | null;
  started_at: string;
  ended_at: string | null;
  screen_share_active: boolean;
  tab_switch_count: number;
}

export interface EventRow {
  id: string;
  session_id: string;
  event_type: string;
  label: string;
  occurred_at: string;
}

export async function createSession(topic: string, candidateLabel?: string) {
  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({ topic, candidate_label: candidateLabel ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function logProctoringEvent(
  sessionId: string,
  eventType: ProctoringEventType,
  label: string,
) {
  const { error } = await supabase
    .from("proctoring_events")
    .insert({ session_id: sessionId, event_type: eventType, label });
  if (error) throw error;
}

export async function updateSession(
  sessionId: string,
  patch: Partial<Pick<SessionRow, "screen_share_active" | "tab_switch_count" | "ended_at">>,
) {
  const { error } = await supabase.from("interview_sessions").update(patch).eq("id", sessionId);
  if (error) throw error;
}

export async function listSessions() {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, topic, candidate_label, started_at, ended_at, screen_share_active, tab_switch_count")
    .order("started_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as SessionRow[];
}

export async function listEvents(sessionId: string) {
  const { data, error } = await supabase
    .from("proctoring_events")
    .select("id, session_id, event_type, label, occurred_at")
    .eq("session_id", sessionId)
    .order("occurred_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}
