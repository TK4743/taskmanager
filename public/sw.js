// VSBEC IT TaskManager - PWA Push Notification & Offline Service Worker (v1.3.0)
// Supports: Offline Caching, Background Sync, Periodic Sync, Web Push & Badging

const CACHE_VERSION = 'vsbec-it-taskmanager-v1.3.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Core offline assets to pre-cache upon service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/badge.png',
  '/robots.txt'
];

// ── 1. Install Event: Pre-cache Essential Assets ─────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] ⚡ Install Event v1.3.0');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] 📦 Pre-caching offline assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache non-fatal error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── 2. Activate Event: Clean up outdated caches ──────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] 🚀 Activate Event v1.3.0');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('vsbec-it-taskmanager-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[ServiceWorker] 🧹 Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── 3. Fetch Event: Offline-first with Network Fallback & Runtime Caching ────
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions / analytics
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle HTML navigation (Network first, fall back to cached index.html)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline - IT TaskManager</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,sans-serif;text-align:center;padding:2rem;color:#1e293b;"><h2>📡 You are currently offline</h2><p>Please check your internet connection to access live tasks and updates.</p><button onclick="location.reload()" style="padding:0.75rem 1.5rem;background:#4f46e5;color:white;border:none;border-radius:0.5rem;cursor:pointer;font-weight:600;margin-top:1rem;">Retry</button></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Handle Static Assets: Images, CSS, JS, Fonts (Cache first, then network fallback)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2|woff|ttf|css|js)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Asynchronously update cache in background (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback for other GET requests
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── 4. Web Push Notifications (Google FCM / Apple APNs / Mozilla) ─────────────
self.addEventListener('push', (event) => {
  const origin = self.location.origin || '';
  const defaultIcon = origin ? `${origin}/logo.png` : '/logo.png';
  const defaultBadge = origin ? `${origin}/badge.png` : '/badge.png';

  let notificationData = {
    title: 'VSBEC IT TaskManager',
    body: 'You have a new update in IT TaskManager!',
    icon: defaultIcon,
    badge: defaultBadge,
    url: '/',
    tag: `vsbec-${Date.now()}`
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = { ...notificationData, ...parsed };
      if (notificationData.icon && !notificationData.icon.startsWith('http')) {
        notificationData.icon = `${origin}${notificationData.icon.startsWith('/') ? '' : '/'}${notificationData.icon}`;
      }
      if (notificationData.badge && !notificationData.badge.startsWith('http')) {
        notificationData.badge = `${origin}${notificationData.badge.startsWith('/') ? '' : '/'}${notificationData.badge}`;
      }
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  console.log('[ServiceWorker] 🔔 Received Push Notification:', notificationData.title, notificationData.body);

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || defaultIcon,
    badge: notificationData.badge || defaultBadge,
    tag: notificationData.tag || `taskmanager-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// ── 5. Notification Click Action ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this origin
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── 6. Push Subscription Refresh Hook ────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((newSubscription) => {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSubscription })
        });
      })
      .catch((err) => {
        console.error('[SW] Failed to renew push subscription:', err);
      })
  );
});

// ── 7. Background Sync Event (PWABuilder & Modern PWA Spec) ──────────────────
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] 🔄 Background Sync triggered:', event.tag);
  if (event.tag === 'sync-pending-submissions' || event.tag === 'sync-tasks') {
    event.waitUntil(
      // Perform background sync logic or wake clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGERED', tag: event.tag });
        });
      })
    );
  }
});

// ── 8. Periodic Background Sync Event (PWABuilder & Chromium PWA Spec) ────────
self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] ⏰ Periodic Sync triggered:', event.tag);
  if (event.tag === 'check-tasks-streak' || event.tag === 'update-notices') {
    event.waitUntil(
      // Fetch latest notice count or trigger badge update
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PERIODIC_SYNC_TRIGGERED', tag: event.tag });
        });
      })
    );
  }
});

// ── 9. Message Handling (Skip Waiting, Cache Maintenance) ───────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
