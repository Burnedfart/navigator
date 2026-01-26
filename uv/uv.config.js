/*
 * Ultraviolet Configuration
 * This tells UV how to proxy URLs
 */
// Dynamically determine the base path for UV scripts
// This ensures compatibility with GitHub Pages subdirectories
const uvPath = new URL('.', self.location.href).pathname;

self.__uv$config = {
    prefix: new URL('../service/', self.location.href).pathname,
    bare: 'https://uv.studentportal.lol/bare/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: uvPath + 'uv.handler.js',
    client: uvPath + 'uv.client.js',
    bundle: uvPath + 'uv.bundle.js',
    config: uvPath + 'uv.config.js',
    sw: uvPath + 'uv.sw.js',
};
