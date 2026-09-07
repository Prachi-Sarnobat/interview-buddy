import { backendRequest } from "./backend";

export async function createSession(_topic, candidateLabel) {
  const session = await backendRequest("/sessions/", {
    method: "POST",
    body: JSON.stringify({ candidate_label: candidateLabel ?? null })
  });
  return session.id;
}
export async function logProctoringEvent(sessionId, eventType, label) {
  return backendRequest(`/sessions/${sessionId}/events/`, {
    method: "POST",
    body: JSON.stringify({ event_type: eventType, label })
  });
}
export async function updateSession(sessionId, patch) {
  return backendRequest(`/sessions/${sessionId}/`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}
export async function listSessions() {
  const result = await backendRequest("/sessions/");
  return result?.results ?? result ?? [];
}
export async function listEvents(sessionId) {
  return backendRequest(`/sessions/${sessionId}/events/`);
}
