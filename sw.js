importScripts("./lib/scramjet/scramjet.all.js");


// Ensure immediate control
self.addEventListener('install', () => {
    self.skipWaiting();
    console.log('SW: ⏩ Skipped waiting');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('SW: ⚡ Clients claimed');
});

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
    await scramjet.loadConfig();

    // Check if we need to route via Scramjet
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }

    // Normal fetch implementation with COOP/COEP injection
    const response = await fetch(event.request);

    // Create a new response with the same body and status
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});

self.addEventListener("message", async (event) => {
    if (event.data && event.data.type === 'config') {
        console.log('SW: Received config', event.data.config);
        try {
            await scramjet.configure(event.data.config);
            console.log('SW: Scramjet configured successfully');
        } catch (err) {
            console.error('SW: Configuration failed', err);
        }
    }
});
