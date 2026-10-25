// VSBEC IT TaskManager - Service Worker (Web Push & Caching)

const CACHE_NAME = 'vsbec-it-cache-v4.1.0-mobile-push';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => self.clients.claim()).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          if (client.url) {
            client.navigate(client.url).catch(() => {});
          }
        });
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Web Push Notification Handler (Google FCM / Apple APNs / Desktop) ────────
self.addEventListener('push', (event) => {
  const origin = self.location.origin || '';
  const defaultIcon = origin ? `${origin}/logo.png` : '/logo.png';
  const defaultBadge = origin ? `${origin}/badge.png` : '/badge.png';

  let notificationData = {
    title: 'VSBEC IT Vault',
    body: 'You have a new update in IT Vault!',
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
    requireInteraction: false,
    silent: false,
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

// ── Notification Click: Focus existing window or open target URL ──────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
  let targetUrl = rawUrl;
  try {
    targetUrl = new URL(rawUrl, self.location.origin).href;
  } catch (e) {
    targetUrl = `${self.location.origin}/`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl).catch(() => {});
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push Subscription Change / Auto-Renewal (Zero Drop on Token Rotation) ────
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        let subOptions = event.oldSubscription ? event.oldSubscription.options : null;

        // If old options are missing or expired, fetch current VAPID public key from backend
        if (!subOptions || !subOptions.applicationServerKey) {
          const keyRes = await fetch('/api/push/public-key');
          if (keyRes.ok) {
            const data = await keyRes.json();
            if (data.publicKey) {
              const padding = '='.repeat((4 - (data.publicKey.length % 4)) % 4);
              const base64 = (data.publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
              const rawData = atob(base64);
              const outputArray = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
              }
              subOptions = {
                userVisibleOnly: true,
                applicationServerKey: outputArray
              };
            }
          }
        }

        if (!subOptions) {
          console.warn('[SW] Cannot renew push subscription: no valid VAPID options available.');
          return;
        }

        const newSubscription = await self.registration.pushManager.subscribe(subOptions);
        const oldEndpoint = event.oldSubscription ? event.oldSubscription.endpoint : null;

        const renewRes = await fetch('/api/push/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint,
            newSubscription: newSubscription.toJSON ? newSubscription.toJSON() : newSubscription
          })
        });

        if (!renewRes.ok) {
          console.warn('[SW] Push subscription renewal responded with status:', renewRes.status);
        } else {
          console.log('[SW] ✅ Push subscription renewed seamlessly in background.');
        }
      } catch (err) {
        console.error('[SW] ❌ Error renewing push subscription in background:', err);
      }
    })()
  );
});
