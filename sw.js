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

// Initialize Scramjet Worker
try {
    console.log('[SW] Initializing Scramjet Worker...');

    // Npm package compatibility: Check for __scramjet$bundle
    if (typeof self.$scramjetLoadWorker === 'undefined' && self.__scramjet$bundle) {
        console.log('[SW] Found __scramjet$bundle, creating compatibility layer');
        self.$scramjetLoadWorker = () => self.__scramjet$bundle;
    }

    // Demo uses: const { ScramjetServiceWorker } = $scramjetLoadWorker();
    if (typeof $scramjetLoadWorker !== 'function') {
        // Debugging info
        console.error('[SW] Globals:', Object.keys(self).filter(k => k.includes('scramjet')));
        throw new Error('$scramjetLoadWorker is not defined');
    }
    const { ScramjetServiceWorker } = $scramjetLoadWorker();
    const scramjet = new ScramjetServiceWorker();

    // Make scramjet instance available to handleRequest
    self.scramjet = scramjet;
    console.log('[SW] ✅ ScramjetServiceWorker initialized');
} catch (e) {
    console.error('[SW] ❌ Failed to initialize ScramjetServiceWorker:', e);
    // Don't throw here, let handleRequest fail gracefully or try again
}

async function handleRequest(event) {
    if (!self.scramjet) {
        return fetch(event.request);
    }
    try {
        await self.scramjet.loadConfig();
        if (self.scramjet.route(event)) {
            return self.scramjet.fetch(event);
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
