import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// ── Service Worker registration (Web Push support) ──────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}

if (import.meta.env.DEV) {
  const logBrowserError = (
    label: string,
    error: unknown,
    fallbackMessage: string,
    source?: string,
  ) => {
    const message = error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error ?? fallbackMessage);
    console.error(`[${label}] ${message}`);

    if (error instanceof Error && error.stack) {
      for (const frame of error.stack.split("\n").slice(1)) {
        console.error(`[${label} stack] ${frame.trim()}`);
      }
    }

    if (source) console.error(`[${label} source] ${source}`);
  };

  window.addEventListener("error", (event) => {
    const source = event.filename
      ? `${event.filename}:${event.lineno}:${event.colno}`
      : undefined;
    logBrowserError("Window error", event.error, event.message, source);
  });

  window.addEventListener("unhandledrejection", (event) => {
    logBrowserError("Unhandled rejection", event.reason, "Unhandled promise rejection");
  });
}

function logReactRuntimeError(
  label: string,
  error: unknown,
  componentStack?: string | null,
) {
  const message = error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
  console.error(`[${label}] ${message}`);

  if (error instanceof Error && error.stack) {
    for (const frame of error.stack.split("\n").slice(1)) {
      console.error(`[${label} JS stack] ${frame.trim()}`);
    }
  }

  if (componentStack) {
    console.error(`[${label}] React component stack:`);
    for (const frame of componentStack.split("\n")) {
      if (frame.trim()) console.error(`[${label} component] ${frame.trim()}`);
    }
  }
}

const root = createRoot(
  document.getElementById("root")!,
  import.meta.env.DEV
    ? {
        onCaughtError: (error, info) =>
          logReactRuntimeError("React caught", error, info.componentStack),
        onUncaughtError: (error, info) =>
          logReactRuntimeError("React uncaught", error, info.componentStack),
        onRecoverableError: (error, info) =>
          logReactRuntimeError("React recoverable", error, info.componentStack),
      }
    : undefined,
);

root.render(
  <ErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </ErrorBoundary>
);
