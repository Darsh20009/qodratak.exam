const recentClientReports = new Map<string, number>();

function redactClientText(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "[credential]")
    .replace(/\b(?:sk|rk|pk)-[A-Za-z0-9_-]{12,}\b/gi, "[credential]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/(?:\+?966|0)?5\d{8}/g, "[phone]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export function reportClientError(kind: string, error: unknown) {
  if (import.meta.env.DEV || typeof window === "undefined") return;
  const errorName = error instanceof Error ? error.name : kind;
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "A browser runtime error occurred.";
  const message = redactClientText(rawMessage);
  const path = window.location.pathname.slice(0, 140);
  const key = `${kind}:${errorName}:${path}`;
  const now = Date.now();
  if (now - (recentClientReports.get(key) || 0) < 60_000) return;
  recentClientReports.set(key, now);
  if (recentClientReports.size > 100) recentClientReports.clear();

  void fetch("/api/diagnostics/client-error", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, errorName, message, path }),
  }).catch(() => undefined);
}
