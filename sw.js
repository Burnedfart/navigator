// Service Worker with error handling to debug initialization issues
console.log('[SW] Service worker script loaded');

try {
    console.log('[SW] Attempting to load scramjet.codecs.js...');
    importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@latest/dist/scramjet.codecs.js");
    console.log('[SW] ✅ scramjet.codecs.js loaded');
} catch (e) {
    console.error('[SW] ❌ Failed to load scramjet.codecs.js:', e);
    throw e;
}

try {
    console.log('[SW] Attempting to load scramjet.bundle.js...');
    importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@latest/dist/scramjet.bundle.js");
    console.log('[SW] ✅ scramjet.bundle.js loaded');
} catch (e) {
    console.error('[SW] ❌ Failed to load scramjet.bundle.js:', e);
    throw e;
}

console.log('[SW] Checking if ScramjetServiceWorker is defined:', typeof ScramjetServiceWorker);

let scramjet;
try {
    console.log('[SW] Attempting to create ScramjetServiceWorker instance...');
    scramjet = new ScramjetServiceWorker();
    console.log('[SW] ✅ ScramjetServiceWorker instance created');
} catch (e) {
    console.error('[SW] ❌ Failed to create ScramjetServiceWorker:', e);
    throw e;
}

async function handleRequest(event) {
    try {
        await scramjet.loadConfig();
        if (scramjet.route(event)) {
            return scramjet.fetch(event);
        }
        return fetch(event.request);
    } catch (e) {
        console.error('[SW] Error in handleRequest:', e);
        return fetch(event.request);
    }
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});

console.log('[SW] Service worker fully initialized');
