/**
 * Proxy Handler Module
 * 
 * EDUCATIONAL PURPOSE:
 * This is the core module that handles the actual proxying of requests.
 * It demonstrates:
 * - HTTP request forwarding
 * - Response processing
 * - Header manipulation
 * - Content transformation
 * 
 * HOW PROXYING WORKS:
 * 
 * 1. Client sends request to our proxy with target URL
 * 2. Proxy validates and decodes the target URL
 * 3. Proxy makes a new request to the target server
 * 4. Target server sends response to proxy
 * 5. Proxy processes/transforms the response
 * 6. Proxy sends the processed response to the client
 * 
 * This is a "forward proxy" - it forwards requests on behalf of clients.
 * Compare to a "reverse proxy" which sits in front of servers.
 */

const fetch = require('node-fetch');
const { decodeUrl, isValidUrl, extractDomain } = require('../utils/urlEncoder');
const { InvalidUrlError, NetworkError, ContentError } = require('../middleware/errorHandler');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROXY_CONFIG = {
    // Maximum time to wait for target server response (milliseconds)
    timeout: 30000,

    // Maximum response size to prevent memory issues (bytes)
    maxResponseSize: 10 * 1024 * 1024, // 10MB

    // User agent to identify as (important for some websites)
    userAgent: 'PracticeProblems/1.0 (Educational Tool)',

    // Headers to forward from client to target
    forwardHeaders: [
        'accept',
        'accept-language',
        'accept-encoding'
    ],

    // Headers to remove from target response
    stripHeaders: [
        'x-frame-options',      // Allows embedding in iframe
        'content-security-policy',
        'x-content-type-options',
        'strict-transport-security'
    ]
};

// ============================================================================
// PROXY FUNCTIONS
// ============================================================================

/**
 * Main proxy request handler
 * This is the endpoint that clients call to fetch remote content
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function handleProxyRequest(req, res, next) {
    try {
        // ========================================
        // STEP 1: Extract and validate the target URL
        // ========================================

        // Get URL from query parameter (GET) or body (POST)
        let targetUrl = req.query.url || req.body.url;
        const isEncoded = req.query.encoded === 'true' || req.body.encoded === true;

        console.log(`[Proxy] Received request for: ${targetUrl} (encoded: ${isEncoded})`);

        // Decode if the URL was Base64 encoded
        if (isEncoded && targetUrl) {
            targetUrl = decodeUrl(targetUrl);
            console.log(`[Proxy] Decoded URL: ${targetUrl}`);
        }

        // Validate the URL
        if (!targetUrl || !isValidUrl(targetUrl)) {
            throw new InvalidUrlError(targetUrl);
        }

        // ========================================
        // STEP 2: Build the proxy request
        // ========================================

        // Prepare headers to send to target server
        const proxyHeaders = buildProxyHeaders(req);

        console.log(`[Proxy] Fetching: ${targetUrl}`);
        console.log(`[Proxy] Domain: ${extractDomain(targetUrl)}`);

        // ========================================
        // STEP 3: Make the request to target server
        // ========================================

        const startTime = Date.now();

        const targetResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: proxyHeaders,
            timeout: PROXY_CONFIG.timeout,
            // Important: Don't follow redirects automatically
            // This lets us rewrite redirect URLs if needed
            redirect: 'manual'
        });

        const fetchTime = Date.now() - startTime;
        console.log(`[Proxy] Response received in ${fetchTime}ms - Status: ${targetResponse.status}`);

        // ========================================
        // STEP 4: Handle redirects
        // ========================================

        if (targetResponse.status >= 300 && targetResponse.status < 400) {
            const redirectUrl = targetResponse.headers.get('location');
            if (redirectUrl) {
                console.log(`[Proxy] Redirect to: ${redirectUrl}`);

                // Return redirect info to client
                return res.json({
                    success: true,
                    type: 'redirect',
                    statusCode: targetResponse.status,
                    redirectUrl: redirectUrl,
                    explanation: 'The server requested a redirect. The client should fetch the new URL.'
                });
            }
        }

        // ========================================
        // STEP 5: Process the response
        // ========================================

        const contentType = targetResponse.headers.get('content-type') || 'text/html';

        // Check if content type is something we can handle
        if (!isProcessableContent(contentType)) {
            throw new ContentError(contentType, 'This content type cannot be displayed in the browser');
        }

        // Get the response body
        const responseBody = await targetResponse.text();

        // Check response size
        if (responseBody.length > PROXY_CONFIG.maxResponseSize) {
            throw new ContentError(contentType, 'Response is too large to process');
        }

        // ========================================
        // STEP 6: Transform HTML content
        // ========================================

        let processedContent = responseBody;

        if (contentType.includes('text/html')) {
            processedContent = transformHtml(responseBody, targetUrl);
        }

        // ========================================
        // STEP 7: Build and send the response
        // ========================================

        // Build response headers
        const responseHeaders = buildResponseHeaders(targetResponse);

        res.json({
            success: true,
            type: 'content',
            metadata: {
                url: targetUrl,
                domain: extractDomain(targetUrl),
                statusCode: targetResponse.status,
                contentType: contentType,
                contentLength: processedContent.length,
                fetchTimeMs: fetchTime
            },
            headers: responseHeaders,
            content: processedContent
        });

    } catch (error) {
        // Handle fetch errors specifically
        if (error.name === 'FetchError' || error.code) {
            return next(new NetworkError(error, req.query.url || req.body.url));
        }

        // Pass other errors to error handler
        next(error);
    }
}

/**
 * Builds headers to send to the target server
 * 
 * EDUCATIONAL NOTE:
 * Not all client headers should be forwarded:
 * - Some reveal proxy infrastructure
 * - Some contain authentication meant for the proxy
 * - Some might confuse the target server
 */
function buildProxyHeaders(req) {
    const headers = {
        'User-Agent': PROXY_CONFIG.userAgent,
        // Some servers require an Accept header
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    };

    // Forward selected headers from the original request
    PROXY_CONFIG.forwardHeaders.forEach(headerName => {
        const value = req.get(headerName);
        if (value) {
            headers[headerName] = value;
        }
    });

    return headers;
}

/**
 * Builds response headers to send back to the client
 * Strips headers that would prevent embedding or cause issues
 */
function buildResponseHeaders(targetResponse) {
    const headers = {};

    targetResponse.headers.forEach((value, name) => {
        // Skip headers we want to strip
        if (PROXY_CONFIG.stripHeaders.includes(name.toLowerCase())) {
            return;
        }

        headers[name] = value;
    });

    return headers;
}

/**
 * Checks if the content type is something we can process
 */
function isProcessableContent(contentType) {
    const processableTypes = [
        'text/html',
        'text/plain',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/xml'
    ];

    return processableTypes.some(type => contentType.includes(type));
}

/**
 * Transforms HTML content for display through the proxy
 * 
 * EDUCATIONAL NOTE:
 * This is a simplified transformation. A production proxy would need to:
 * - Rewrite all relative URLs to absolute
 * - Proxy JavaScript requests
 * - Handle CSS @import statements
 * - Process srcset attributes
 * - Handle iframes
 */
function transformHtml(html, baseUrl) {
    // Add base tag to help resolve relative URLs
    // This is a simple approach - production proxies use more sophisticated rewriting
    const baseTag = `<base href="${baseUrl}">`;

    // Insert base tag after <head> if present
    if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n${baseTag}`);
    } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>\n${baseTag}`);
    } else {
        // Prepend if no head tag
        html = baseTag + '\n' + html;
    }

    return html;
}

module.exports = {
    handleProxyRequest,
    PROXY_CONFIG
};
