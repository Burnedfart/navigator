import { createServer } from "node:https";
import { createServer as createHttpServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "url";
import path from "path";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import express from "express";

const DOMAIN = "scholarnavigator.top";
let httpsOptions;
try {
    httpsOptions = {
        key: readFileSync(`/etc/letsencrypt/live/${DOMAIN}/privkey.pem`),
        cert: readFileSync(`/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`)
    };
    console.log("✅ SSL certificates loaded successfully");
} catch (err) {
    console.error("❌ Failed to load SSL certificates:", err.message);
    console.error("   Running in HTTP-only mode (Cloudflare Tunnel/Worker will handle SSL)");
    httpsOptions = null;
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const app = express();

logging.set_level(logging.DEBUG);
Object.assign(wisp.options, {
    allow_udp_streams: false,
    hostname_blacklist: [],
    dns_servers: ["1.1.1.1", "1.0.0.1"],
});

// CORS headers for cross-origin requests
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://burnedfart.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Health check 
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        wisp: 'active',
        uptime: process.uptime()
    });
});

// Serve static files
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        // Keep relaxed embedding headers to avoid COEP/COOP mismatches in Firefox
        res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");

        if (path.endsWith('.js') || path.endsWith('.wasm') || path.endsWith('.mjs')) {
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        }
    }
}));

// Serve 'lib' directory for static assets
app.use("/lib/", express.static(path.join(__dirname, "lib"), {
    setHeaders: (res) => {
        // Keep relaxed embedding headers to avoid COEP/COOP mismatches in Firefox
        res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }
}));

// Create HTTPS server with SSL certificates
const server = createServer(httpsOptions);

// Handle HTTP requests with Express
server.on("request", (req, res) => {
    app(req, res);
});

// Create HTTP server for Cloudflare Worker (internal only, no SSL)
const httpServer = createHttpServer();
httpServer.on("request", (req, res) => {
    app(req, res);
});

// Handle WebSocket upgrade for WISP on HTTP server too
httpServer.on("upgrade", (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        console.log("📡 WISP WebSocket connection (HTTP) from:", req.headers.origin);
        wisp.routeRequest(req, socket, head);
    } else {
        socket.end();
    }
});

// Handle WebSocket upgrade for WISP
server.on("upgrade", (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        console.log("📡 WISP WebSocket connection established from:", req.headers.origin);
        wisp.routeRequest(req, socket, head);
    } else {
        socket.end();
    }
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("\n🛑 Shutting down server...");
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
}

// Start
const PORT = parseInt(process.env.PORT || "3000");
const HOST = "0.0.0.0";

if (httpsOptions) {
    server.listen(PORT, HOST, () => {
        console.log("🚀 Scramjet Proxy Server with WISP (Dual HTTP/HTTPS)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📡 HTTPS Server: https://${DOMAIN}:${PORT}`);
        console.log(`🔌 WISP Endpoint: wss://${DOMAIN}:${PORT}/wisp/`);
        console.log(`🏥 Health Check: https://${DOMAIN}:${PORT}/api/health`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("\nServing static files:");
        console.log(`  📂 Root: ${__dirname}`);
        console.log(`  📦 Lib: /lib/ (Static Assets)`);
        console.log("\nPress Ctrl+C to stop");
    });
} else {
    console.log("⚠️ SSL not active. HTTPS server skipped.");
}

// Start HTTP server on port 8080 for Cloudflare Worker
const HTTP_PORT = 8080;
httpServer.listen(HTTP_PORT, HOST, () => {
    console.log("\n🌐 HTTP Server (Internal - for Cloudflare Worker only)");
    console.log(`📡 HTTP Endpoint: http://${DOMAIN}:${HTTP_PORT}`);
    console.log(`🔌 WISP over WS: ws://${DOMAIN}:${HTTP_PORT}/wisp/`);
});
