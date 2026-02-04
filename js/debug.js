(function () {
    'use strict';

    const DEBUG_MENU_ID = 'dev-debug-menu';

    function createDebugMenu() {
        if (document.getElementById(DEBUG_MENU_ID)) return;

        const style = document.createElement('style');
        style.textContent = `
            #${DEBUG_MENU_ID} {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                max-width: 95vw;
                max-height: 85vh;
                background: var(--window-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                z-index: 1000000;
                color: var(--text-primary);
                font-family: 'Montserrat', sans-serif;
                padding: 24px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                animation: debugFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes debugFadeIn {
                from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }

            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 12px;
            }

            .debug-title {
                font-size: 18px;
                font-weight: 700;
                color: var(--accent-color);
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .debug-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 20px;
                transition: color 0.2s;
            }

            .debug-close:hover {
                color: var(--text-primary);
            }

            .debug-content {
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 20px;
                padding-right: 8px;
            }

            .debug-section {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .debug-section-title {
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--text-secondary);
                opacity: 0.7;
            }

            .debug-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .debug-btn {
                background: var(--omnibox-bg);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                padding: 10px 14px;
                color: var(--text-primary);
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .debug-btn:hover {
                background: var(--tab-hover-bg);
                border-color: var(--accent-color);
                transform: translateY(-1px);
            }

            .debug-btn:active { transform: translateY(0); }

            .debug-btn.danger { color: var(--danger-color); }
            .debug-btn.danger:hover { background: rgba(217, 48, 37, 0.1); }

            .debug-info-card {
                background: var(--bg-color);
                border-radius: var(--radius-md);
                padding: 12px;
                font-size: 12px;
                font-family: monospace;
                border: 1px solid var(--border-color);
            }

            .debug-info-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .debug-info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .debug-info-label { color: var(--text-secondary); }
            .debug-info-value { color: var(--accent-color); font-weight: 600; }

            .debug-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999999;
                display: none;
                backdrop-filter: blur(4px);
            }

            .debug-overlay.show { display: block; }

            .debug-content::-webkit-scrollbar { width: 6px; }
            .debug-content::-webkit-scrollbar-track { background: transparent; }
            .debug-content::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 3px;
            }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.className = 'debug-overlay';
        overlay.id = 'debug-overlay';
        document.body.appendChild(overlay);

        const menu = document.createElement('div');
        menu.id = DEBUG_MENU_ID;
        menu.style.display = 'none';
        menu.innerHTML = `
            <div class="debug-header">
                <div class="debug-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    Navigator Debug
                </div>
                <button class="debug-close" id="debug-close-btn">✕</button>
            </div>
            <div class="debug-content">
                <div class="debug-section">
                    <div class="debug-section-title">Proxy & Network</div>
                    <div class="debug-grid">
                        <button class="debug-btn" id="db-btn-diagnose">
                            🔬 Diagnostics
                        </button>
                        <button class="debug-btn" id="db-btn-recover">
                            🔄 Recover Conn
                        </button>
                        <button class="debug-btn" id="db-btn-signal">
                            📨 Re-init SW
                        </button>
                        <button class="debug-btn" id="db-btn-bypass">
                            🔓 Bypass Restrict
                        </button>
                    </div>
                </div>

                <div class="debug-section">
                    <div class="debug-section-title">System & Storage</div>
                    <div class="debug-grid">
                        <button class="debug-btn" id="db-btn-sw-update">
                            📦 Force SW Update
                        </button>
                        <button class="debug-btn" id="db-btn-clear-cache">
                            🗑️ Clear Caches
                        </button>
                        <button class="debug-btn" id="db-btn-dump">
                            📑 Dump App State
                        </button>
                        <button class="debug-btn danger" id="db-btn-reset">
                            ☢️ Full Factory Reset
                        </button>
                    </div>
                </div>

                <div class="debug-section">
                    <div class="debug-section-title">UI & Performance</div>
                    <div class="debug-grid">
                        <button class="debug-btn" id="db-btn-err-ui">
                            🚨 Test Error UI
                        </button>
                        <button class="debug-btn" id="db-btn-spinner">
                            🔄 Toggle Spinner
                        </button>
                        <button class="debug-btn" id="db-btn-tab-data">
                            📑 Log Tab Objects
                        </button>
                         <button class="debug-btn" id="db-btn-banner">
                            ⚠️ Toggle Banner
                        </button>
                    </div>
                </div>

                <div class="debug-section">
                    <div class="debug-section-title">Live Diagnostics</div>
                    <div class="debug-info-card">
                        <div class="debug-info-list" id="debug-stats">
                            <div class="debug-info-item">
                                <span class="debug-info-label">WISP Health:</span>
                                <span class="debug-info-value" id="stat-wisp">Checking...</span>
                            </div>
                            <div class="debug-info-item">
                                <span class="debug-info-label">Service Worker:</span>
                                <span class="debug-info-value" id="stat-sw">Checking...</span>
                            </div>
                            <div class="debug-info-item">
                                <span class="debug-info-label">IndexedDB:</span>
                                <span class="debug-info-value" id="stat-idb">Checking...</span>
                            </div>
                            <div class="debug-info-item">
                                <span class="debug-info-label">Active Tabs:</span>
                                <span class="debug-info-value" id="stat-tabs">0</span>
                            </div>
                             <div class="debug-info-item">
                                <span class="debug-info-label">Memory JS Heap:</span>
                                <span class="debug-info-value" id="stat-mem">N/A</span>
                            </div>
                            <div class="debug-info-item">
                                <span class="debug-info-label">Uptime:</span>
                                <span class="debug-info-value" id="stat-uptime">0:00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        // Event Listeners
        document.getElementById('debug-close-btn').addEventListener('click', hideDebugMenu);
        overlay.addEventListener('click', hideDebugMenu);

        // Button Handlers
        document.getElementById('db-btn-diagnose').addEventListener('click', async () => {
            const btn = document.getElementById('db-btn-diagnose');
            btn.disabled = true;
            btn.innerHTML = 'Running...';

            if (window.WispHealthChecker) {
                const wispUrl = window.ProxyService?.transportConfig?.wispUrl ||
                    (location.protocol === "https:" ? "wss" : "ws") + "://navigator.scholarnavigator.workers.dev/wisp/";
                const httpUrl = wispUrl.replace(/^wss?/, location.protocol.replace(':', '')).replace('/wisp/', '/api/health');

                console.log('🧪 Starting manual diagnostics...');
                const results = await window.WispHealthChecker.diagnose(wispUrl, httpUrl);
                console.log('🧪 Results:', results);
                alert(`Diagnosis: ${results.diagnosis}\n\nRecommendations:\n- ${results.recommendations.join('\n- ')}`);
            } else {
                alert('WispHealthChecker not loaded');
            }

            btn.disabled = false;
            btn.innerHTML = '🔬 Diagnostics';
            updateStats();
        });

        document.getElementById('db-btn-recover').addEventListener('click', async () => {
            if (window.ProxyService?.verifyAndRecoverConnection) {
                const success = await window.ProxyService.verifyAndRecoverConnection();
                alert(success ? 'Connection recovered!' : 'Recovery failed. Check console.');
                updateStats();
            }
        });

        document.getElementById('db-btn-signal').addEventListener('click', async () => {
            if (window.ProxyService?.sendInitSignal) {
                await window.ProxyService.sendInitSignal();
                alert('Sent init signal to Service Worker.');
            }
        });

        document.getElementById('db-btn-bypass').addEventListener('click', () => {
            if (window.app && window.app.securitySettings) {
                const newState = !window.app.securitySettings.disableRestrictions;
                window.app.securitySettings.disableRestrictions = newState;
                localStorage.setItem('sec_disableRestrictions', newState ? 'true' : 'false');
                alert(`Restrictions ${newState ? 'DISABLED' : 'ENABLED'}`);
            }
        });

        document.getElementById('db-btn-evasion').addEventListener('click', async () => {
            if (window.WispEvasion) {
                const wispUrl = window.ProxyService?.transportConfig?.wispUrl || (location.protocol === "https:" ? "wss" : "ws") + "://navigator.scholarnavigator.workers.dev/wisp/";
                const working = await window.WispEvasion.findWorkingEndpoint(wispUrl);
                alert(working ? `Found working endpoint: ${working}` : 'No working endpoints found.');
            }
        });

        document.getElementById('db-btn-sw-update').addEventListener('click', async () => {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) {
                    if (reg.waiting) {
                        reg.waiting.postMessage('skipWaiting');
                        alert('SkipWaiting sent to waiting worker.');
                    } else {
                        reg.update();
                        alert('Update requested for Service Worker.');
                    }
                }
            }
        });

        document.getElementById('db-btn-clear-cache').addEventListener('click', async () => {
            if (window.StorageHealth) {
                await window.StorageHealth.clearCaches();
                alert('Caches cleared.');
            }
        });

        document.getElementById('db-btn-dump').addEventListener('click', () => {
            console.log('📦 [DUMP] App State:', window.app);
            console.log('🔧 [DUMP] Proxy Service:', window.ProxyService);
            console.log('📚 [DUMP] LocalStorage:', { ...localStorage });
            alert('Full state dumped to console. Check F12.');
        });

        document.getElementById('db-btn-reset').addEventListener('click', async () => {
            const confirmed = confirm('DANGER: This will clear ALL application data, reset themes, bookmarks, and reload. Proceed?');
            if (confirmed && window.StorageHealth) {
                await window.StorageHealth.performFullReset();
                localStorage.clear();
                window.location.reload();
            }
        });

        document.getElementById('db-btn-err-ui').addEventListener('click', () => {
            if (window.app && typeof window.app.showError === 'function') {
                window.app.showError('Debug Test Error', 'This is a test of the error modal triggered from the debug menu.');
            } else if (window.ErrorHandler) {
                window.ErrorHandler.show('Debug Test Error', 'Manual trigger.');
            }
        });

        document.getElementById('db-btn-spinner').addEventListener('click', () => {
            if (window.app && window.app.logo) {
                window.app.logo.classList.toggle('spin');
            }
        });

        document.getElementById('db-btn-tab-data').addEventListener('click', () => {
            if (window.app?.tabs) {
                console.table(window.app.tabs.map(t => ({ id: t.id, url: t.url, memory: t.memory, sleeping: t.sleeping })));
            }
        });

        document.getElementById('db-btn-banner').addEventListener('click', () => {
            const banner = document.getElementById('network-warning-banner');
            if (banner) banner.classList.toggle('hidden');
        });
    }

    function updateStats() {
        const wispStat = document.getElementById('stat-wisp');
        const swStat = document.getElementById('stat-sw');
        const idbStat = document.getElementById('stat-idb');
        const tabsStat = document.getElementById('stat-tabs');
        const memStat = document.getElementById('stat-mem');
        const uptimeStat = document.getElementById('stat-uptime');

        if (wispStat && window.WispHealthChecker) {
            const isHealthy = window.WispHealthChecker.isHealthy;
            wispStat.textContent = isHealthy === true ? 'Healthy' : (isHealthy === false ? 'Blocked/Down' : 'Unknown');
            wispStat.style.color = isHealthy === true ? '#22c55e' : (isHealthy === false ? '#ef4444' : 'var(--text-secondary)');
        }

        if (swStat && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                const active = regs.some(r => r.active);
                swStat.textContent = active ? 'Active' : 'Inactive';
                swStat.style.color = active ? '#22c55e' : '#ef4444';
            });
        }

        if (idbStat && window.StorageHealth) {
            window.StorageHealth.isIndexedDBAvailable().then(avail => {
                idbStat.textContent = avail ? 'Functional' : 'Error';
                idbStat.style.color = avail ? '#22c55e' : '#ef4444';
            });
        }

        if (window.app) {
            if (tabsStat && window.app.tabs) tabsStat.textContent = window.app.tabs.length;

            if (uptimeStat) {
                const uptimeMs = Date.now() - (window.app.startTime || Date.now());
                const totalSeconds = Math.floor(uptimeMs / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                uptimeStat.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        if (memStat && performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
            memStat.textContent = `${used} MB`;
        }
    }

    function showDebugMenu() {
        createDebugMenu();
        const menu = document.getElementById(DEBUG_MENU_ID);
        const overlay = document.getElementById('debug-overlay');

        menu.style.display = 'flex';
        overlay.classList.add('show');

        // Initial update and periodic refresh
        updateStats();
        const refreshInterval = setInterval(() => {
            if (menu.style.display === 'none') {
                clearInterval(refreshInterval);
                return;
            }
            updateStats();
        }, 1000);

        console.log('🔓 [DEV] Debug menu opened');
    }

    function hideDebugMenu() {
        const menu = document.getElementById(DEBUG_MENU_ID);
        const overlay = document.getElementById('debug-overlay');

        if (menu) menu.style.display = 'none';
        if (overlay) overlay.classList.remove('show');
    }

    // Expose to global scope
    window.showDebugMenu = showDebugMenu;

    console.log('🛠️ [DEV] showDebugMenu() available. Type it in the console to explore.');
})();
