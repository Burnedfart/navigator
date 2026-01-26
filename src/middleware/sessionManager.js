/**
 * Session Management Module
 * 
 * EDUCATIONAL PURPOSE:
 * This module demonstrates how web applications track user sessions without
 * relying on persistent storage like cookies or localStorage.
 * 
 * SESSION MANAGEMENT CONCEPTS:
 * 
 * 1. Session ID - A unique identifier for each user session
 *    Generated server-side and sent to the client in response headers
 * 
 * 2. In-Memory Storage - Sessions stored in server RAM
 *    Pros: Fast, simple, no external dependencies
 *    Cons: Lost on server restart, doesn't scale across multiple servers
 * 
 * 3. Session Expiration - Sessions expire after inactivity
 *    Prevents memory leaks and improves security
 * 
 * 4. Stateless Alternative - JWT (JSON Web Tokens)
 *    Store session data in an encoded token sent with each request
 *    We demonstrate the traditional approach here for educational purposes
 */

const crypto = require('crypto');

// ============================================================================
// SESSION STORAGE
// In production, you'd use Redis, Memcached, or a database
// ============================================================================

const sessions = new Map();

// Session configuration
const SESSION_CONFIG = {
    // How long before a session expires (in milliseconds)
    expirationTime: 30 * 60 * 1000, // 30 minutes

    // How often to clean up expired sessions
    cleanupInterval: 5 * 60 * 1000, // 5 minutes

    // Header name for session ID
    headerName: 'X-Session-ID'
};

// ============================================================================
// SESSION FUNCTIONS
// ============================================================================

/**
 * Generates a cryptographically secure session ID
 * 
 * WHY CRYPTO.RANDOMUUID()?
 * - Uses system's cryptographic random number generator
 * - Extremely low probability of collisions
 * - Unpredictable - can't be guessed by attackers
 * 
 * @returns {string} A unique session ID
 */
function generateSessionId() {
    // crypto.randomUUID() generates a RFC 4122 compliant UUID
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return crypto.randomUUID();
}

/**
 * Creates a new session
 * 
 * @returns {object} The new session object with its ID
 */
function createSession() {
    const sessionId = generateSessionId();
    const now = Date.now();

    const session = {
        id: sessionId,
        created: new Date(now).toISOString(),
        lastAccess: new Date(now).toISOString(),
        lastAccessTimestamp: now,
        requestCount: 0,
        data: {} // Extensible data storage
    };

    sessions.set(sessionId, session);

    console.log(`[Session] Created new session: ${sessionId}`);
    return session;
}

/**
 * Retrieves a session by ID
 * Updates the last access time if found
 * 
 * @param {string} sessionId - The session ID to look up
 * @returns {object|null} The session object or null if not found/expired
 */
function getSession(sessionId) {
    if (!sessionId) return null;

    const session = sessions.get(sessionId);

    if (!session) {
        return null;
    }

    const now = Date.now();

    // Check if session has expired
    if (now - session.lastAccessTimestamp > SESSION_CONFIG.expirationTime) {
        console.log(`[Session] Session expired: ${sessionId}`);
        sessions.delete(sessionId);
        return null;
    }

    // Update last access time
    session.lastAccess = new Date(now).toISOString();
    session.lastAccessTimestamp = now;
    session.requestCount++;

    return session;
}

/**
 * Destroys a session
 * 
 * @param {string} sessionId - The session ID to destroy
 */
function destroySession(sessionId) {
    if (sessions.has(sessionId)) {
        sessions.delete(sessionId);
        console.log(`[Session] Destroyed session: ${sessionId}`);
    }
}

/**
 * Stores data in a session
 * 
 * @param {string} sessionId - The session ID
 * @param {string} key - The data key
 * @param {any} value - The data value
 */
function setSessionData(sessionId, key, value) {
    const session = sessions.get(sessionId);
    if (session) {
        session.data[key] = value;
    }
}

/**
 * Retrieves data from a session
 * 
 * @param {string} sessionId - The session ID
 * @param {string} key - The data key
 * @returns {any} The stored value or undefined
 */
function getSessionData(sessionId, key) {
    const session = sessions.get(sessionId);
    return session?.data[key];
}

/**
 * Gets session statistics (for monitoring)
 * 
 * @returns {object} Statistics about active sessions
 */
function getStats() {
    return {
        activeSessions: sessions.size,
        config: {
            expirationMinutes: SESSION_CONFIG.expirationTime / 60000
        }
    };
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

/**
 * Express middleware for session management
 * 
 * This middleware:
 * 1. Checks for existing session ID in request header
 * 2. Validates the session if it exists
 * 3. Creates a new session if needed
 * 4. Attaches session ID to the request for use in route handlers
 * 5. Adds session ID to response headers
 */
function middleware(req, res, next) {
    // Try to get existing session ID from header
    let sessionId = req.get(SESSION_CONFIG.headerName);
    let session = null;

    if (sessionId) {
        // Validate existing session
        session = getSession(sessionId);
    }

    if (!session) {
        // Create new session
        session = createSession();
        sessionId = session.id;
    }

    // Attach session ID to request for use in route handlers
    req.sessionId = sessionId;
    req.session = session;

    // Add session ID to response headers
    if (!res.headersSent) {
        res.set(SESSION_CONFIG.headerName, sessionId);
    }

    next();
}

// ============================================================================
// CLEANUP ROUTINE
// Periodically remove expired sessions to prevent memory leaks
// ============================================================================

setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of sessions) {
        if (now - session.lastAccessTimestamp > SESSION_CONFIG.expirationTime) {
            sessions.delete(sessionId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`[Session] Cleaned up ${cleaned} expired sessions`);
    }
}, SESSION_CONFIG.cleanupInterval);

module.exports = {
    middleware,
    createSession,
    getSession,
    destroySession,
    setSessionData,
    getSessionData,
    getStats,
    SESSION_CONFIG
};
