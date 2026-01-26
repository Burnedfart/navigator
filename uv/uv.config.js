/*
 * Ultraviolet Configuration
 * This tells UV how to proxy URLs
 */
self.__uv$config = {
    prefix: new URL('./service/', self.location.href).pathname,
    bare: 'https://uv.studentportal.lol/bare/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: new URL('./uv/uv.handler.js', self.location.href).pathname,
    client: new URL('./uv/uv.client.js', self.location.href).pathname,
    bundle: new URL('./uv/uv.bundle.js', self.location.href).pathname,
    config: new URL('./uv/uv.config.js', self.location.href).pathname,
    sw: new URL('./uv/uv.sw.js', self.location.href).pathname,
};
