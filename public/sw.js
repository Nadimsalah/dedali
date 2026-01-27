self.addEventListener('push', function (event) {
    if (!event.data) {
        console.log('Push event with no data');
        return;
    }

    try {
        const data = event.data.json();
        const title = data.title || 'New Notification';
        const options = {
            body: data.body || 'You have a new update.',
            icon: '/logo.webp', // Diar Argan Logo
            badge: '/icon-light-32x32.png',
            data: {
                url: data.url || '/admin/dashboard'
            },
            vibrate: [200, 100, 200],
            tag: data.tag || 'new-order'
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (err) {
        console.error('Error parsing push data:', err);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Open the targeted URL or default to dashboard
    const targetUrl = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
