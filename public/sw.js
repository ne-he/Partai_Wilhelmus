// Service Worker untuk Push Notifications — Partai Wilhelmus v8
// Handles push events dan notification clicks

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: 'Partai Wilhelmus', body: event.data?.text() ?? '' };
  }

  const title = data.title ?? 'Partai Wilhelmus';
  const options = {
    body: data.body ?? '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data ?? {},
    vibrate: [100, 50, 100],
    tag: data.data?.task_id ?? 'partai-wilhelmus',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? '/family';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Fokus ke tab yang sudah ada jika ada
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Buka tab baru jika tidak ada
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
