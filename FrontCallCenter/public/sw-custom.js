// Evento Push para recibir alertas Web Push en background
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Alerta GAMC', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Alerta GAMC - Asignación de Campo';
  const options = {
    body: data.body || 'Tienes una nueva denuncia asignada',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'gamc-push-notification',
    renotify: true,
    data: { url: data.url || '/tecnico' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Evento al hacer clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/tecnico';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/tecnico') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
