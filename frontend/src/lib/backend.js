const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl ? configuredApiUrl.replace(/\/$/, "") : "";

function requireApiUrl() {
  if (!API_URL) {
    throw new Error("Backend URL is not configured. Set VITE_API_URL in the frontend deployment settings.");
  }
  return API_URL;
}

export async function backendRequest(path, options = {}) {
  const response = await fetch(`${requireApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail ?? `Backend request failed (${response.status})`);
  }
  return body;
}

export { API_URL, requireApiUrl };
