/**
 * Custom Service Worker for DMS Production
 * Handles Web Push Notifications for downtime alerts
 */

// Cache name for offline assets
const CACHE_NAME = 'dms-push-v2';

// Assets to cache for offline support
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/badge-72x72.png'
];

// Listen for push messages from the server
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    let data = {};

    try {
        data = event.data?.json() || {};
    } catch (e) {
        console.warn('[Service Worker] Could not parse push data:', e);
        data = {
            title: 'DMS Alert',
            message: event.data?.text() || 'New notification'
        };
    }

    const options = {
        body: data.message || data.body || 'New downtime alert',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        tag: data.tag || data.id || 'downtime-alert',
        renotify: true,
        requireInteraction: data.requireInteraction || data.priority === 'critical' || data.priority === 'high',
        vibrate: data.priority === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200],
        data: {
            url: data.url || '/maintenance/alerts',
            alertId: data.id,
            ticketNumber: data.ticketNumber,
            workstation: data.workstation,
            priority: data.priority,
            timestamp: data.timestamp || new Date().toISOString()
        },
        actions: data.actions || [
            { action: 'view', title: 'Voir', icon: '/assets/icons/view-icon.png' },
            { action: 'dismiss', title: 'Ignorer', icon: '/assets/icons/dismiss-icon.png' }
        ]
    };

    // Add urgency indicator for critical/high priority
    if (data.priority === 'critical') {
        options.body = `[CRITICAL] ${options.body}`;
    } else if (data.priority === 'high') {
        options.body = `[URGENT] ${options.body}`;
    }

    const title = data.title || 'DMS Alert';

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event.action);

    event.notification.close();

    // Handle dismiss action
    if (event.action === 'dismiss') {
        return;
    }

    // Get the URL to open
    const urlToOpen = event.notification.data?.url || '/maintenance/alerts';
    const fullUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Check if there's already an open window for this app
            for (const client of windowClients) {
                // If we find an existing window, focus it and navigate
                if (client.url.includes(self.location.origin)) {
                    return client.focus().then((focusedClient) => {
                        if (focusedClient && 'navigate' in focusedClient) {
                            return focusedClient.navigate(fullUrl);
                        }
                    });
                }
            }

            // No existing window found, open a new one
            return clients.openWindow(fullUrl);
        })
    );
});

// Handle notification close (for analytics/tracking)
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed:', event.notification.tag);

    // Optional: Send analytics about dismissed notifications
    const data = event.notification.data;
    if (data && data.alertId) {
        // Could send a beacon to track dismissed notifications
        // navigator.sendBeacon('/api/maintenance/notifications/dismissed', JSON.stringify({ id: data.alertId }));
    }
});

// Service Worker installation - cache assets for offline support
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching assets for offline support');
            return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
                console.warn('[Service Worker] Some assets could not be cached:', error);
                // Continue even if some assets fail to cache
                return Promise.resolve();
            });
        })
    );
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Service Worker activation
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    // Claim all clients immediately
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Clean up old caches if needed
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
        ])
    );
});

// Handle fetch events - serve cached assets when offline
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests - let them go to network
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if available
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise fetch from network
            return fetch(event.request).then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response for caching
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // Return a fallback for navigation requests when offline
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return null;
            });
        })
    );
});

// Handle push subscription change (re-subscribe if needed)
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[Service Worker] Push subscription changed');

    event.waitUntil(
        // Re-subscribe with the same options
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: event.oldSubscription?.options?.applicationServerKey
        }).then((newSubscription) => {
            // Send new subscription to server
            return fetch('/api/maintenance/push/subscribe/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSubscription.toJSON())
            });
        }).catch((error) => {
            console.error('[Service Worker] Failed to re-subscribe:', error);
        })
    );
});

// Optional: Handle background sync for offline support
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-notifications') {
        event.waitUntil(
            // Sync any pending notification reads/dismissals
            Promise.resolve()
        );
    }
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});
