// Scramjet Configuration
self.__scramjet$config = {
    // The prefix for rewritten URLs
    prefix: '/service/',
    // The Bare server URL (your Oracle Cloud instance)
    bare: 'https://my-site.boxathome.net/bare/',
    // Use the directory where the files are hosted
    directory: 'https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@latest/dist/',
    // Codec for encoding URLs (xor is standard)
    codec: self.__scramjet$codecs.xor,
    // File paths relative to the 'directory' or absolute CDN paths
    bundle: 'scramjet.bundle.js',
    worker: 'scramjet.worker.js',
    client: 'scramjet.client.js',
    codecs: 'scramjet.codecs.js',
    // Using the same path logic as before for Service Worker scope
    config: 'js/scramjet.config.js'
};
