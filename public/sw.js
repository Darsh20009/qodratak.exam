// Service Worker for Qodratak PWA — Push Notifications + Offline Cache
const CACHE_NAME = 'qudratak-app-v3';
const STATIC_CACHE = 'qudratak-static-v3';
const DYNAMIC_CACHE = 'qudratak-dynamic-v3';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => Promise.resolve()))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => {
        if (n !== STATIC_CACHE && n !== DYNAMIC_CACHE && n !== CACHE_NAME) {
          return caches.delete(n);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch (offline support) ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            caches.open(DYNAMIC_CACHE).then((c) => c.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((r) => r || caches.match('/'))
        )
    );
    return;
  }

  if (event.request.url.match(/\.(png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(event.request, res.clone()));
          return res;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) caches.open(DYNAMIC_CACHE).then((c) => c.put(event.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push notification received ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}

  const title   = data.title   || 'منصة قدراتك';
  const body    = data.body    || 'لديك إشعار جديد';
  const url     = data.url     || '/';
  const tag     = data.tag     || 'qodratak';
  const type    = data.type    || 'general';
  const actions = data.actions || [];

  // Vibration pattern per type
  const vibrations = {
    'exam-reminder': [200, 100, 200, 100, 200],
    'daily-study':   [100, 50, 100],
    'weekly-report': [100, 50, 100],
    'daily-goal':    [150, 75, 150],
    'achievement':   [100, 50, 200, 50, 100],
    'streak':        [100, 50, 100, 50, 200],
    'general':       [100, 50, 100],
  };

  const options = {
    body,
    icon:               '/icon-512x512.png',
    badge:              '/favicon-32x32.png',
    tag,
    dir:                'rtl',
    lang:               'ar',
    vibrate:            vibrations[type] || vibrations.general,
    requireInteraction: type === 'exam-reminder',
    silent:             false,
    timestamp:          Date.now(),
    data:               { url, type, ...(data.data || {}) },
    actions:            actions.slice(0, 2),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click — navigate to the right page ───────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl   = notifData.url || '/';

  // Action-specific overrides
  if (event.action === 'dismiss') return;
  if (event.action === 'strategy') targetUrl = '/strategy-library';
  if (event.action === 'open' && notifData.url) targetUrl = notifData.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(Promise.resolve());
  }
});
