/*
 * Scramjet Proxy Service Worker
 * Intercepts requests and routes them through the Scramjet engine
 */

// Import Scramjet without BareMux - use direct Bare server connection
// importScripts('uv/bare-mux.js');  // REMOVED - not needed for direct bare connection
importScripts('https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@latest/dist/scramjet.codecs.js');
importScripts('js/scramjet.config.js');
importScripts('https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@latest/dist/scramjet.bundle.js');
importScripts('https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@latest/dist/scramjet.worker.js');

const scramjet = new ScramjetServiceWorker();

// Skip waiting to activate immediately
self.addEventListener('install', () => {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            const url = new URL(event.request.url);

            // Bypass Scramjet for static assets and API endpoints
            if (url.pathname.includes('/js/') ||
                url.pathname.includes('/css/') ||
                url.pathname.includes('/uv/') ||
                url.pathname.startsWith('/api/') ||
                url.pathname.endsWith('.png') ||
                url.pathname.endsWith('.jpg') ||
                url.pathname.endsWith('.ico')) {
                return await fetch(event.request);
            }

            // Check if this request should be handled by Scramjet
            if (scramjet.route(event)) {
                return await scramjet.fetch(event);
            }

            // Otherwise, pass through to normal fetch
            return await fetch(event.request);
        })()
    );
});
