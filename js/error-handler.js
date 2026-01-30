/**
 * Early Error Detection & Recovery System
 * Prevents infinite loading due to corrupted IndexedDB or other initialization failures
 */

(function () {
    'use strict';

    // Configuration
    const INIT_TIMEOUT = 5000; // 5 seconds max for initialization (reduced from 15s)
    const ERROR_UI_ID = 'emergency-error-ui';

    let initTimer;
    let emergencyUIShown = false;

    // Create emergency error UI (injected immediately, hidden by default)
    function createEmergencyUI() {
        const style = document.createElement('style');
        style.textContent = `
            #${ERROR_UI_ID} {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(180, 180, 180, 0.4);
                backdrop-filter: blur(2px);
                -webkit-backdrop-filter: blur(2px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                animation: fadeIn 0.3s ease-in;
            }
            
            #${ERROR_UI_ID}.show {
                display: flex;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .error-card {
                background: #6d6d6dff;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                max-width: 450px;
                width: 90%;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                color: white;
            }
            
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .error-icon {
                margin-bottom: 24px;
                animation: bounce 2s ease-in-out infinite;
                display: flex;
                justify-content: center;
            }

            .error-icon img {
                width: 80px;
                height: 80px;
                object-fit: contain;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            
            .error-title {
                font-size: 24px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 12px;
            }
            
            .error-message {
                font-size: 15px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 24px;
                line-height: 1.6;
            }
            
            .error-details {
                background: rgba(0, 0, 0, 0.3);
                border-left: 4px solid #ff3333;
                padding: 12px;
                margin: 20px 0;
                text-align: left;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.5);
                border-radius: 4px;
                max-height: 120px;
                overflow-y: auto;
            }
            
            .error-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-direction: column;
            }
            
            .error-btn {
                padding: 14px 28px;
                border: none;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
            }
            
            .error-btn-primary {
                background: linear-gradient(135deg, #ff3333 0%, #d10000 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(255, 51, 51, 0.3);
            }
            
            .error-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 51, 51, 0.4);
            }
            
            .error-btn-secondary {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .error-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-1px);
            }
            
            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
                margin-left: 8px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .hidden-btn {
                opacity: 0.5;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);

        const ui = document.createElement('div');
        ui.id = ERROR_UI_ID;
        ui.innerHTML = `
            <div class="error-card">
                <div class="error-icon">
                    <img src="assets/warning.png" alt="Warning">
                </div>
                <h1 class="error-title">Application Failed to Load</h1>
                <p class="error-message" id="error-msg-text">
                    The application is taking too long to initialize. This usually happens due to corrupted storage.
                </p>
                <div class="error-details" id="error-details" style="display: none;">
                    <strong>Error Details:</strong><br>
                    <span id="error-details-text">Unknown error</span>
                </div>
                <div class="error-actions">
                    <button class="error-btn error-btn-primary" id="clear-storage-btn">
                        Clear Storage
                    </button>
                    <button class="error-btn error-btn-secondary" id="reload-btn">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(ui);

        // Set up button handlers
        document.getElementById('clear-storage-btn').addEventListener('click', clearAllStorage);
        document.getElementById('reload-btn').addEventListener('click', () => window.location.reload());
    }

    // Show emergency UI
    function showEmergencyUI(message, details = null) {
        if (emergencyUIShown) return;
        emergencyUIShown = true;

        const ui = document.getElementById(ERROR_UI_ID);
        if (!ui) {
            createEmergencyUI();
        }

        // Update message
        if (message) {
            document.getElementById('error-msg-text').textContent = message;
        }

        // Show details if provided
        if (details) {
            document.getElementById('error-details').style.display = 'block';
            document.getElementById('error-details-text').textContent = details;
        }

        document.getElementById(ERROR_UI_ID).classList.add('show');
        console.error('🚨 [ERROR HANDLER] Emergency UI displayed:', message);
    }

    // Hide emergency UI
    function hideEmergencyUI() {
        document.getElementById(ERROR_UI_ID).classList.remove('show');
        emergencyUIShown = false;
        if (initTimer) {
            clearTimeout(initTimer);
        }
    }

    // Clear all storage (IndexedDB, localStorage, sessionStorage, caches)
    async function clearAllStorage() {
        const btn = document.getElementById('clear-storage-btn');
        const originalText = btn.innerHTML;
        btn.classList.add('hidden-btn');
        btn.innerHTML = 'Clearing...<span class="loading-spinner"></span>';

        try {
            console.log('🗑️ [ERROR HANDLER] Starting storage cleanup...');

            // 1. Clear IndexedDB databases
            if (window.indexedDB) {
                const databases = await indexedDB.databases();
                for (const db of databases) {
                    console.log(`🗑️ Deleting IndexedDB: ${db.name}`);
                    indexedDB.deleteDatabase(db.name);
                }
                // Also try known databases
                ['$scramjet', 'baremux'].forEach(name => {
                    indexedDB.deleteDatabase(name);
                });
            }

            // 2. Clear localStorage
            if (window.localStorage) {
                console.log('🗑️ Clearing localStorage');
                localStorage.clear();
            }

            // 3. Clear sessionStorage
            if (window.sessionStorage) {
                console.log('🗑️ Clearing sessionStorage');
                sessionStorage.clear();
            }

            // 4. Clear caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    console.log(`🗑️ Deleting cache: ${cacheName}`);
                    await caches.delete(cacheName);
                }
            }

            // 5. Unregister service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    console.log('🗑️ Unregistering service worker');
                    await registration.unregister();
                }
            }

            console.log('✅ [ERROR HANDLER] Storage cleanup complete');

            // Show success message
            btn.innerHTML = '✅ Cleared! Reloading...';

        } catch (err) {
            console.error('❌ [ERROR HANDLER] Storage cleanup failed:', err);
            btn.classList.remove('hidden-btn');
            btn.innerHTML = '❌ Failed - Try Manual Reload';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 3000);
        }
    }

    // Start initialization timeout
    function startInitTimeout() {
        if (initTimer) {
            clearTimeout(initTimer);
        }

        console.log(`⏱️ [ERROR HANDLER] Starting ${INIT_TIMEOUT / 1000}s initialization timeout`);

        initTimer = setTimeout(() => {
            if (window.ProxyService && window.ProxyService.initialized) {
                console.log('✅ [ERROR HANDLER] Ignored timeout: already initialized');
                return;
            }

            console.error('⏰ [ERROR HANDLER] Initialization timeout exceeded!');
            showEmergencyUI(
                'Initialization is taking too long. The application may be stuck due to corrupted storage.',
                'Timeout: Initialization exceeded 5 seconds'
            );
        }, INIT_TIMEOUT);
    }

    // Stop initialization timeout (called when init succeeds)
    function stopInitTimeout() {
        if (initTimer) {
            clearTimeout(initTimer);
            initTimer = null;
        }
        console.log('✅ [ERROR HANDLER] Initialization completed within timeout');
    }

    // Global error handlers
    window.addEventListener('error', (event) => {
        // Only show for critical errors
        if (event.error && event.error.message &&
            (event.error.message.includes('IndexedDB') ||
                event.error.message.includes('database') ||
                event.error.message.includes('QUOTA_EXCEEDED'))) {
            console.error('🚨 [ERROR HANDLER] Critical error detected:', event.error);
            showEmergencyUI(
                'A critical storage error occurred.',
                event.error.message
            );
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        // Only show for critical promise rejections
        if (event.reason && event.reason.message &&
            (event.reason.message.includes('IndexedDB') ||
                event.reason.message.includes('database') ||
                event.reason.message.includes('QUOTA_EXCEEDED'))) {
            console.error('🚨 [ERROR HANDLER] Critical promise rejection:', event.reason);
            showEmergencyUI(
                'A critical storage error occurred.',
                event.reason.message
            );
        }
    });

    // Expose API
    window.ErrorHandler = {
        show: showEmergencyUI,
        hide: hideEmergencyUI,
        clearStorage: clearAllStorage,
        startTimeout: startInitTimeout,
        stopTimeout: stopInitTimeout
    };

    // Create UI on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createEmergencyUI);
    } else {
        createEmergencyUI();
    }

    // Start timeout when page loads
    if (document.readyState === 'complete') {
        startInitTimeout();
    } else {
        window.addEventListener('load', startInitTimeout);
    }

    console.log('✅ [ERROR HANDLER] Emergency error handler initialized');
})();
