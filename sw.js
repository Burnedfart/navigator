/*
 * Ultraviolet Service Worker Registration Handler
 * This SW intercepts all requests and routes them through Ultraviolet
 */
importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts('/uv/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            // Bypass UV for static UV files and API endpoints
            const url = new URL(event.request.url);
            if (url.pathname.startsWith('/uv/') || url.pathname.startsWith('/api/')) {
                return await fetch(event.request);
            }

            // Check if this request should be handled by UV
            if (uv.route(event)) {
                return await uv.fetch(event);
            }
            // Otherwise, pass through to normal fetch
            return await fetch(event.request);
        })()
    );
});
