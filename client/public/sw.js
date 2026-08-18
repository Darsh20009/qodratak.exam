/* ── Qodratak Service Worker v2 ── */
const CACHE_NAME = 'qodratak-v2';
const STATIC_ASSETS = ['/', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png'];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ── Push Notification received ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'إشعار جديد', body: event.data ? event.data.text() : '' };
  }

  const title   = data.title  || 'منصة قدراتك';
  const options = {
    body:    data.body    || '',
    icon:    data.icon    || '/icon-192x192.png',
    badge:   data.badge   || '/icon-192x192.png',
    tag:     data.tag     || 'qodratak-notif',
    dir:     'rtl',
    lang:    'ar',
    vibrate: [200, 100, 200],
    renotify: true,
    data:    { url: data.url || '/', ...( data.data || {}) },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Push subscription change (auto-resubscribe) ────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    fetch('/api/push/vapid-key')
      .then((r) => r.json())
      .then(({ publicKey }) => {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      })
      .then((sub) =>
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: sub.toJSON().keys,
          }),
        })
      )
      .catch((err) => console.warn('[SW] pushsubscriptionchange failed:', err))
  );
});

// ── Helper: base64url → Uint8Array ────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  const output  = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}
