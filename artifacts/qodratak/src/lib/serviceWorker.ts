const serviceWorkerPath = "/sw.js";
const appCachePrefix = "qodratak-";
const cleanupReloadKey = "qodratak-dev-service-worker-cleanup-reload";

function isQodratakServiceWorker(worker: ServiceWorker | null): boolean {
  if (!worker) return false;

  try {
    return new URL(worker.scriptURL).pathname === serviceWorkerPath;
  } catch {
    return false;
  }
}

export function unregisterDevelopmentServiceWorker(): void {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return;

  const pageIsControlledByAppWorker = isQodratakServiceWorker(
    navigator.serviceWorker.controller,
  );

  void (async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistrations = registrations.filter((registration) =>
      [
        registration.active,
        registration.waiting,
        registration.installing,
      ].some(isQodratakServiceWorker),
    );

    await Promise.all(appRegistrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(appCachePrefix))
          .map((cacheName) => caches.delete(cacheName)),
      );
    }

    if (pageIsControlledByAppWorker) {
      if (sessionStorage.getItem(cleanupReloadKey) !== "1") {
        sessionStorage.setItem(cleanupReloadKey, "1");
        window.location.reload();
        return;
      }
    } else {
      sessionStorage.removeItem(cleanupReloadKey);
    }
  })().catch((error) => {
    console.warn("[SW] Development cleanup failed:", error);
  });
}

export function registerQodratakServiceWorker(): void {
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;

  const register = () => {
    void navigator.serviceWorker
      .register(serviceWorkerPath, { scope: "/" })
      .then((registration) => {
        console.log("[SW] Registered, scope:", registration.scope);
      })
      .catch((error) => {
        console.warn("[SW] Registration failed:", error);
      });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
