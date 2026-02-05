window.APP_BASE_URL = new URL("./", window.location.href).href;
window.SCRAMJET_PREFIX = new URL("./service/", window.APP_BASE_URL).pathname;

window.ProxyService = {
    initialized: false,
    ready: null, // Promise
};

window.ProxyService.ready = new Promise(async (resolve, reject) => {
    try {
        // INCEPTION GUARD: Don't initialize proxy in Scramjet-created iframes
        // EXCEPT: Allow if parent is about:blank (our intentional cloak)
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
            let isAboutBlankCloak = false;
            try {
                const parentHref = window.parent.location.href;
                isAboutBlankCloak = parentHref === 'about:blank' ||
                    parentHref.includes('/github.io/a/') ||
                    parentHref.includes('/a/page1.html');
            } catch (e) {
                // Cross-origin iframe detected - allow initialization (UI already allows this case)
                isAboutBlankCloak = true;
                console.log('🌐 [PROXY] Cross-origin iframe detected - initialization allowed');
            }

            if (!isAboutBlankCloak) {
                console.log('🖼️ [PROXY] Inception detected - running in unauthorized iframe. Skipping initialization.');
                // Mark as "initialized" to prevent errors in browser.js
                window.ProxyService.initialized = true;
                resolve(true);
                return; // CRITICAL: Stop all initialization
            } else {
                console.log('🔐 [PROXY] Running in cloaked context - initialization allowed');
            }
        }

        // Signal to error handler that initialization has started
        if (window.ErrorHandler) {
            window.ErrorHandler.startTimeout();
        }

        console.log('🔧 [PROXY] Starting initialization...');

        // 1. PRE-FLIGHT HEALTH CHECK (NEW)
        if (window.StorageHealth) {
            console.log('🔍 [PROXY] Running pre-flight storage health check...');
            const healthResult = await window.StorageHealth.performHealthCheck();

            if (!healthResult.healthy && !healthResult.autoFixed) {
                throw new Error(`Storage health check failed: ${healthResult.issues.join(', ')}`);
            }

            if (healthResult.needsReload) {
                console.warn('⚠️ [PROXY] Storage recovered. Reloading to ensure clean state...');
                // Briefly wait for logs to be visible
                setTimeout(() => window.location.reload(), 500);
                throw new Error('RELOADING_FOR_CLEAN_STATE');
            }

            if (healthResult.autoFixed) {
                console.log('🔧 [PROXY] Storage issues auto-fixed, proceeding with clean state');
            }
        } else {
            console.warn('⚠️ [PROXY] Storage health module not loaded, skipping pre-flight check');
        }

        // 1. PRE-FLIGHT HEALTH CHECK (NEW)
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        const registration = await navigator.serviceWorker.register('./sw.js', {
            scope: './',
            updateViaCache: 'none'  // Prevent cache issues on updates
        });
        console.log('✅ [SW] Registered:', registration.scope);

        const handleUpdateFound = async (waitingWorker) => {
            console.log('🔄 [SW] New version available, applying automatically...');
            waitingWorker.postMessage('skipWaiting');
        };

        // 1. If there's already a waiting worker, check it
        if (registration.waiting) {
            handleUpdateFound(registration.waiting);
        }

        // 2. If a new worker is found, listen for it to be installed
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 [SW] Update found, installing...');
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                    handleUpdateFound(newWorker);
                }
            });
        });

        // 3. When the new worker takes control, reload the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('⚡ [SW] Controller changed, reloading...');
            window.location.reload();
        });

        // Wait for SW to be ready with timeout
        await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Service Worker ready timeout')), 5000)
            )
        ]);
        console.log('✅ [SW] Ready and Active');

        // 3. Handle Cross-Origin Isolation
        if (!window.crossOriginIsolated && window.isSecureContext) {
            if (!sessionStorage.getItem('coi_reloaded')) {
                sessionStorage.setItem('coi_reloaded', 'true');
                console.log('🔄 [PROXY] Reloading NOW for Isolation headers...');
                // Use setTimeout to ensure log is visible, then reload immediately
                setTimeout(() => window.location.reload(), 10);
                throw new Error('RELOADING'); // Stop all execution immediately
            }
        } else {
            sessionStorage.removeItem('coi_reloaded');
        }

        // 4. Load Core Libraries
        const loadScript = (src, fallbackSrc) => new Promise((resolveScript, rejectScript) => {
            const s = document.createElement('script');
            s.src = src;
            s.crossOrigin = "anonymous";
            s.onload = () => resolveScript(true);
            s.onerror = async () => {
                if (fallbackSrc) {
                    console.log(`🔄 [PROXY] Fallback to: ${fallbackSrc}`);
                    try {
                        await loadScript(fallbackSrc, null);
                        resolveScript(true);
                    } catch (e) { rejectScript(e); }
                } else {
                    rejectScript(new Error(`Failed to load ${src}`));
                }
            };
            document.head.appendChild(s);
        });

        // Paths
        const bareMuxPath = new URL("./lib/baremux/index.js", window.APP_BASE_URL).href;
        const bareMuxCDN = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.7/dist/index.js";
        const scramjetPath = new URL("./lib/scramjet/scramjet.all.js", window.APP_BASE_URL).href;
        const scramjetCDN = 'https://cdn.jsdelivr.net/gh/MercuryWorkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js';

        await Promise.all([
            loadScript(bareMuxPath, bareMuxCDN),
            loadScript(scramjetPath, scramjetCDN)
        ]);
        console.log('📦 [PROXY] Libraries loaded');

        // 5. Initialize Scramjet
        let scramjetBundle;
        try {
            if (typeof window.$scramjetLoadController === 'function') {
                scramjetBundle = window.$scramjetLoadController();
            } else if (window.__scramjet$bundle) {
                scramjetBundle = window.__scramjet$bundle;
            }
        } catch (crossOriginErr) {
            // In iframe context, accessing some globals may fail due to cross-origin restrictions
            console.warn('⚠️ [PROXY] Cross-origin access blocked, trying alternative:', crossOriginErr.message);
            // Try direct access as fallback
            scramjetBundle = window.__scramjet$bundle;
        }

        if (!scramjetBundle) throw new Error('Scramjet bundle not found');

        const { ScramjetController } = scramjetBundle;

        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://navigator.scholarnavigator.workers.dev/wisp/";

        // DIAGNOSTIC: Test WebSocket connectivity before proceeding
        if (window.WispHealthChecker) {
            console.log('🔬 [PROXY] Running WebSocket diagnostics...');
            const healthUrl = wispUrl.replace(/^wss?/, location.protocol.replace(':', ''))
                .replace('/wisp/', '/api/health');

            const diagResult = await window.WispHealthChecker.diagnose(wispUrl, healthUrl);
            console.log('📊 [PROXY] Diagnosis:', diagResult.diagnosis);

            if (diagResult.recommendations && diagResult.recommendations.length > 0) {
                console.log('💡 [PROXY] Recommendations:');
                diagResult.recommendations.forEach(rec => console.log(`   - ${rec}`));
            }

            // If WebSocket is explicitly confirmed blocked, show user-friendly warning
            if (window.WispHealthChecker.isHealthy === false) {
                console.warn('⚠️ [PROXY] WebSocket connection may be blocked or restricted');
                console.warn('⚠️ [PROXY] The proxy will attempt to connect, but may fail on this network');

                // Show warning banner to user
                setTimeout(() => {
                    const banner = document.getElementById('network-warning-banner');
                    const closeBtn = document.getElementById('warning-close-btn');

                    if (banner) {
                        banner.classList.remove('hidden');

                        // Auto-hide after 10 seconds
                        const autoHideTimer = setTimeout(() => {
                            banner.classList.add('hidden');
                        }, 10000);

                        // Close button handler
                        if (closeBtn) {
                            closeBtn.addEventListener('click', () => {
                                banner.classList.add('hidden');
                                clearTimeout(autoHideTimer);
                            }, { once: true });
                        }
                    }
                }, 1000); // Show after a brief delay
            }
        }

        // 6. Configure Scramjet with iframe-safe settings
        const scramjetConfig = {
            prefix: window.SCRAMJET_PREFIX,
            wisp: wispUrl,
            files: {
                wasm: new URL("./lib/scramjet/scramjet.wasm.wasm", window.APP_BASE_URL).href,
                all: new URL("./lib/scramjet/scramjet.all.js", window.APP_BASE_URL).href,
                sync: new URL("./lib/scramjet/scramjet.sync.js", window.APP_BASE_URL).href,
            },
            codec: {
                // Disable URL truncation to prevent "domain.com/..." links
                truncate: false,
            },
        };

        // Store config globally for recovery after SW restart
        window.ProxyService.scramjetConfig = scramjetConfig;

        // Note: We never run in iframe mode (inception guard aborts early)

        window.scramjet = new ScramjetController(scramjetConfig);

        // 7. Initialize Scramjet with improved error handling
        console.log('🔄 [PROXY] Initializing Scramjet...');

        try {
            await window.scramjet.init();
            console.log('✅ [PROXY] Scramjet Controller initialized');
        } catch (initErr) {
            console.error('❌ [PROXY] Scramjet init failed:', initErr);

            // If init fails, it's likely a fresh DB corruption during init
            // Try one more time after cleanup
            console.log('🗑️ [PROXY] Attempting recovery with fresh database...');

            if (window.StorageHealth) {
                await window.StorageHealth.deleteScramjetDB();
                await new Promise(r => setTimeout(r, 300));

                // Final attempt
                await window.scramjet.init();
                console.log('✅ [PROXY] Scramjet initialized after recovery');
            } else {
                throw initErr; // No recovery mechanism available
            }
        }

        // 7.5. Pre-load WASM rewriter (CRITICAL for inline script rewriting)
        console.log('📦 [PROXY] Pre-loading WASM rewriter...');
        try {
            // Fetch and cache the WASM file immediately
            const wasmUrl = new URL("./lib/scramjet/scramjet.wasm.wasm", window.APP_BASE_URL).href;
            const wasmResponse = await fetch(wasmUrl);
            if (!wasmResponse.ok) throw new Error(`WASM fetch failed: ${wasmResponse.status}`);
            const wasmBuffer = await wasmResponse.arrayBuffer();

            // Helper to safely convert buffer to base64 without stack overflow
            const bufferToBase64 = (buf) => {
                let binary = '';
                const bytes = new Uint8Array(buf);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i += 8192) {
                    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, len)));
                }
                return btoa(binary);
            };

            // Store in global for Scramjet to use (SAFE METHOD)
            if (typeof self !== 'undefined') {
                self.WASM = bufferToBase64(wasmBuffer);
            }
            console.log(`✅ [PROXY] WASM loaded safely (${(wasmBuffer.byteLength / 1024).toFixed(1)} KB)`);
        } catch (wasmErr) {
            console.warn('⚠️ [PROXY] WASM pre-load failed (will lazy-load):', wasmErr);
            // Non-fatal - Scramjet will try to load it when needed
        }



        // CRITICAL: Signal to Service Worker that database is ready
        // Wait for SW to be controlling (handles SW update race condition)
        let swController = navigator.serviceWorker.controller;

        if (!swController) {
            console.log('⏳ [PROXY] Waiting for Service Worker to take control...');

            // Wait up to 2 seconds for SW to take control
            const controllerTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 2000));
            const controllerReady = new Promise((resolve) => {
                const checkController = () => {
                    if (navigator.serviceWorker.controller) {
                        resolve(navigator.serviceWorker.controller);
                    } else {
                        setTimeout(checkController, 100);
                    }
                };
                checkController();
            });

            swController = await Promise.race([controllerReady, controllerTimeout]);
        }

        // Send signal to Service Worker - make globally accessible for recovery
        window.ProxyService.sendInitSignal = async () => {
            const config = window.ProxyService.scramjetConfig;
            if (!config) {
                console.warn('⚠️ [PROXY] No scramjet config available to send');
                return;
            }

            const msg = {
                type: 'init_complete',
                config: config
            };

            // 1. Try sending to current controller
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage(msg);
                console.log('📨 [PROXY] Sent init_complete to controller');
            }

            // 2. Try sending to all active registrations (more robust)
            try {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                    if (reg.active) {
                        reg.active.postMessage(msg);
                        console.log('📨 [PROXY] Sent init_complete to active registration');
                    }
                }
            } catch (err) {
                console.warn('⚠️ [PROXY] Failed to send signal to registrations:', err);
            }
        };

        // Execute immediately and also listen for controller changes
        await window.ProxyService.sendInitSignal();
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 [PROXY] SW controller changed, re-sending signal...');
            window.ProxyService.sendInitSignal();
        });

        // 7. Initialize BareMux Transport (only if cross-origin isolated)
        if (window.crossOriginIsolated) {
            const bareMuxWorkerPath = new URL("./lib/baremux/worker.js", window.APP_BASE_URL).href;
            window.bareMuxConnection = new BareMux.BareMuxConnection(bareMuxWorkerPath);
            const transportPath = new URL("./lib/libcurl/index.mjs", window.APP_BASE_URL).href;

            // Perform connection
            await window.bareMuxConnection.setTransport(transportPath, [{ websocket: wispUrl }]);
            console.log('✅ [PROXY] BareMux transport connected');

            // Store transport config for recovery
            window.ProxyService.transportConfig = {
                transportPath,
                wispUrl,
                bareMuxWorkerPath
            };
        } else {
            console.log('⚠️ [PROXY] Skipping BareMux (requires cross-origin isolation)');
            console.log('ℹ️ [PROXY] Using Scramjet direct WISP transport only');

            // Still store wispUrl for recovery system
            window.ProxyService.transportConfig = {
                wispUrl
            };
        }

        // 8. Connection Keep-Alive & Recovery System (ALWAYS RUN)
        // This ensures the Service Worker stays alive and initialized even when not using BareMux

        // Keep-alive ping interval (every 45 seconds) - also re-sends init signal to keep SW alive
        let keepAliveInterval = setInterval(async () => {
            try {
                // Re-send init signal to keep SW initialized (it may have been terminated)
                await window.ProxyService.sendInitSignal();
                console.log('💓 [PROXY] Keep-alive ping (SW re-initialized)');
            } catch (e) {
                console.warn('⚠️ [PROXY] Keep-alive ping failed:', e);
            }
        }, 45000);

        // Visibility-based recovery - when user returns to tab after being away
        let lastVisibilityChange = Date.now();
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {
                const timeSinceHidden = Date.now() - lastVisibilityChange;
                console.log(`👀 [PROXY] Tab became visible (was hidden for ${Math.round(timeSinceHidden / 1000)}s)`);

                // CRITICAL: Always re-send init signal when tab becomes visible
                // The SW may have been terminated by the browser during idle
                console.log('🔄 [PROXY] Re-initializing Service Worker after visibility change...');
                await window.ProxyService.sendInitSignal();

                // If tab was hidden for more than 30 seconds, also verify WebSocket connection
                if (timeSinceHidden > 30000) {
                    console.log('🔄 [PROXY] Long idle detected, verifying connection...');
                    try {
                        await window.ProxyService.verifyAndRecoverConnection();
                    } catch (e) {
                        console.error('❌ [PROXY] Recovery failed:', e);
                    }
                }
            } else {
                lastVisibilityChange = Date.now();
            }
        });

        // Connection verification and recovery function
        window.ProxyService.verifyAndRecoverConnection = async function () {
            const config = window.ProxyService.transportConfig;
            if (!config || !config.wispUrl) {
                console.warn('⚠️ [PROXY] No transport config available for recovery');
                return false;
            }

            console.log('🔍 [PROXY] Testing WebSocket connection...');

            // Quick WebSocket connectivity test
            const testPromise = new Promise((resolve) => {
                const ws = new WebSocket(config.wispUrl);
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve(false);
                }, 5000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve(true);
                };

                ws.onerror = () => {
                    clearTimeout(timeout);
                    resolve(false);
                };

                ws.onclose = (e) => {
                    // If closed before we resolved, it's a failure (unless we closed it ourselves)
                    if (e.code !== 1000) {
                        clearTimeout(timeout);
                        resolve(false);
                    }
                };
            });

            const isConnected = await testPromise;

            if (isConnected) {
                console.log('✅ [PROXY] WebSocket is reachable');

                // If we have BareMux, re-establish transport
                if (window.bareMuxConnection && config.transportPath) {
                    try {
                        console.log('🔄 [PROXY] Re-establishing BareMux transport...');
                        // Re-establish transport (this should handle stale connections internally)
                        await window.bareMuxConnection.setTransport(
                            config.transportPath,
                            [{ websocket: config.wispUrl }]
                        );
                        console.log('✅ [PROXY] Transport re-established successfully');
                    } catch (e) {
                        console.error('❌ [PROXY] Transport re-establishment failed:', e);
                    }
                }
                return true;
            } else {
                console.warn('⚠️ [PROXY] WebSocket unreachable, connection may fail');

                // If we have BareMux, still try to re-establish - the network might come back
                if (window.bareMuxConnection && config.transportPath) {
                    try {
                        await window.bareMuxConnection.setTransport(
                            config.transportPath,
                            [{ websocket: config.wispUrl }]
                        );
                    } catch (e) {
                        // Ignore - this is a best-effort recovery
                    }
                }
                return false;
            }
        };

        // Also try to recover before any navigation attempt
        window.ProxyService.ensureConnection = window.ProxyService.verifyAndRecoverConnection;

        console.log('🛡️ [PROXY] Connection recovery system initialized');


        window.ProxyService.initialized = true;

        // Signal to error handler that initialization succeeded
        if (window.ErrorHandler) {
            window.ErrorHandler.stopTimeout();
        }

        resolve(true);

    } catch (err) {
        console.error('❌ [PROXY] Initialization failed:', err);

        // Show emergency UI on critical failure
        if (window.ErrorHandler) {
            window.ErrorHandler.show(
                'Proxy initialization failed. This may be due to corrupted storage or network issues.',
                err.message || String(err)
            );
        }

        reject(err);
    }
});
