/**
 * Error Handling Module
 * 
 * EDUCATIONAL PURPOSE:
 * This module demonstrates comprehensive error handling for web applications.
 * 
 * ERROR HANDLING PRINCIPLES:
 * 
 * 1. Categorization - Different error types need different responses
 *    - Client errors (4xx) - Bad requests, not found, unauthorized
 *    - Server errors (5xx) - Internal errors, service unavailable
 *    - Network errors - DNS failures, timeouts, connection refused
 * 
 * 2. User-Friendly Messages - Technical details confuse users
 *    Provide clear, actionable messages that help users understand what happened
 * 
 * 3. Logging - Record errors for debugging
 *    Include stack traces, request details, and context
 * 
 * 4. Security - Don't expose sensitive information
 *    Never show stack traces or internal paths to end users in production
 */

// ============================================================================
// ERROR TYPES
// Custom error classes for different scenarios
// ============================================================================

/**
 * Base class for application errors
 * Extends the built-in Error class with additional properties
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = true; // Distinguishes from programming errors

        // Captures the stack trace (V8 specific)
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error for invalid URLs
 */
class InvalidUrlError extends AppError {
    constructor(url) {
        super(
            'The provided URL is not valid or is not allowed',
            400,
            'INVALID_URL',
            {
                url: url,
                explanation: 'URLs must start with http:// or https:// and point to a public website',
                suggestions: [
                    'Make sure the URL includes the protocol (http:// or https://)',
                    'Check for typos in the domain name',
                    'Verify the website is publicly accessible'
                ]
            }
        );
    }
}

/**
 * Error for network failures when fetching target URLs
 */
class NetworkError extends AppError {
    constructor(originalError, targetUrl) {
        const errorInfo = NetworkError.analyzeError(originalError);

        super(
            errorInfo.message,
            502, // Bad Gateway - appropriate for proxy errors
            errorInfo.code,
            {
                targetUrl: targetUrl,
                explanation: errorInfo.explanation,
                technicalDetails: originalError.message,
                suggestions: errorInfo.suggestions
            }
        );
    }

    /**
     * Analyzes the original error to provide helpful context
     */
    static analyzeError(error) {
        const errorCode = error.code || error.message;

        // Map common network errors to user-friendly explanations
        const errorMappings = {
            'ENOTFOUND': {
                message: 'The website could not be found',
                code: 'DNS_LOOKUP_FAILED',
                explanation: 'The domain name could not be resolved to an IP address. This usually means the website does not exist or there is a DNS configuration issue.',
                suggestions: [
                    'Check that the domain name is spelled correctly',
                    'Try accessing the website directly in your browser',
                    'The website might be temporarily unavailable'
                ]
            },
            'ECONNREFUSED': {
                message: 'Connection was refused by the server',
                code: 'CONNECTION_REFUSED',
                explanation: 'The server exists but actively refused the connection. This could mean the web server is not running or is blocking connections.',
                suggestions: [
                    'The website might be down for maintenance',
                    'Try again later',
                    'The server might be blocking proxy requests'
                ]
            },
            'ETIMEDOUT': {
                message: 'Connection timed out',
                code: 'CONNECTION_TIMEOUT',
                explanation: 'The server took too long to respond. This could be due to slow network conditions or an overloaded server.',
                suggestions: [
                    'Check your internet connection',
                    'The website might be experiencing high traffic',
                    'Try again in a few moments'
                ]
            },
            'ECONNRESET': {
                message: 'Connection was reset',
                code: 'CONNECTION_RESET',
                explanation: 'The connection was unexpectedly closed by the server. This can happen due to network issues or server configuration.',
                suggestions: [
                    'Try the request again',
                    'Check if the website is accessible directly'
                ]
            },
            'CERT_HAS_EXPIRED': {
                message: 'SSL certificate has expired',
                code: 'SSL_CERT_EXPIRED',
                explanation: 'The website\'s security certificate has expired. This is a configuration issue on the target website.',
                suggestions: [
                    'Contact the website administrator',
                    'Try a different website'
                ]
            }
        };

        // Find matching error or use default
        const mapping = errorMappings[errorCode] || {
            message: 'Unable to connect to the website',
            code: 'NETWORK_ERROR',
            explanation: `A network error occurred while trying to fetch the content: ${error.message}`,
            suggestions: [
                'Check your internet connection',
                'Verify the URL is correct',
                'Try again later'
            ]
        };

        return mapping;
    }
}

/**
 * Error for content that cannot be processed
 */
class ContentError extends AppError {
    constructor(contentType, reason) {
        super(
            'Cannot process this type of content',
            415,
            'UNSUPPORTED_CONTENT',
            {
                contentType: contentType,
                explanation: reason,
                suggestions: [
                    'Try fetching a regular web page (HTML content)',
                    'Some file types cannot be displayed through the proxy'
                ]
            }
        );
    }
}

/**
 * Error for rate limiting
 */
class RateLimitError extends AppError {
    constructor(retryAfter) {
        super(
            'Too many requests - please slow down',
            429,
            'RATE_LIMITED',
            {
                retryAfter: retryAfter,
                explanation: 'You have made too many requests in a short period. This limit protects the server and ensures fair usage.',
                suggestions: [
                    `Wait ${retryAfter} seconds before trying again`,
                    'Reduce the frequency of your requests'
                ]
            }
        );
    }
}

// ============================================================================
// EXPRESS ERROR MIDDLEWARE
// ============================================================================

/**
 * Express error handling middleware
 * 
 * IMPORTANT: Error middleware must have 4 parameters (err, req, res, next)
 * Express identifies error handlers by their function signature
 */
function middleware(err, req, res, next) {
    // Default values
    let statusCode = err.statusCode || 500;
    let errorCode = err.errorCode || 'INTERNAL_ERROR';
    let message = err.message || 'An unexpected error occurred';
    let details = err.details || null;

    // Log the error for debugging
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[Error] ${new Date().toISOString()}`);
    console.error(`Code: ${errorCode}`);
    console.error(`Message: ${message}`);
    console.error(`Path: ${req.method} ${req.originalUrl}`);
    console.error(`Session: ${req.sessionId}`);

    // Only log stack trace for non-operational errors (bugs)
    if (!err.isOperational) {
        console.error('Stack:', err.stack);
    }

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Build the error response
    const errorResponse = {
        success: false,
        error: {
            code: errorCode,
            message: message,
            timestamp: new Date().toISOString()
        }
    };

    // Include details if available
    if (details) {
        errorResponse.error.details = details;
    }

    // In development, include more technical information
    if (process.env.NODE_ENV === 'development' && err.stack) {
        errorResponse.error.stack = err.stack.split('\n');
    }

    // If headers are already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode).json(errorResponse);
}

/**
 * Wraps async route handlers to catch errors
 * 
 * EDUCATIONAL NOTE:
 * Express doesn't automatically catch errors in async functions.
 * This wrapper ensures async errors are passed to the error middleware.
 * 
 * Usage:
 *   app.get('/route', asyncHandler(async (req, res) => {
 *       // async code here
 *   }));
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    middleware,
    asyncHandler,
    AppError,
    InvalidUrlError,
    NetworkError,
    ContentError,
    RateLimitError
};
