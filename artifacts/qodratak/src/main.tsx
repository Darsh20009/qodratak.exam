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

function formatReactRuntimeError(
  label: string,
  error: unknown,
  componentStack?: string | null,
) {
  const errorDetails = error instanceof Error
    ? `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}`
    : String(error);
  const reactStack = componentStack
    ? `\nReact component stack:\n${componentStack}`
    : "";

  return `[${label}]\n${errorDetails}${reactStack}`;
}

const root = createRoot(
  document.getElementById("root")!,
  import.meta.env.DEV
    ? {
        onCaughtError: (error, info) =>
          console.error(formatReactRuntimeError("React caught", error, info.componentStack)),
        onUncaughtError: (error, info) =>
          console.error(formatReactRuntimeError("React uncaught", error, info.componentStack)),
        onRecoverableError: (error, info) =>
          console.error(formatReactRuntimeError("React recoverable", error, info.componentStack)),
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
