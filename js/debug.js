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
                width: 520px;
                max-width: 95vw;
                max-height: 85vh;
                background: var(--window-bg);
                backdrop-filter: blur(24px);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                z-index: 1000000;
                color: var(--text-primary);
                font-family: 'Montserrat', sans-serif;
                padding: 24px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
                display: flex;
                flex-direction: column;
                animation: debugFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes debugFadeIn {
                from { opacity: 0; transform: translate(-50%, -46%) scale(0.98); }
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
                transition: transform 0.2s, color 0.2s;
            }

            .debug-close:hover {
                color: var(--text-primary);
                transform: rotate(90deg);
            }

            .debug-content {
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 24px;
                padding-right: 8px;
            }

            .debug-section {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .debug-section-title {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                color: var(--text-secondary);
                opacity: 0.6;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .debug-section-title::after {
                content: '';
                flex: 1;
                height: 1px;
                background: var(--border-color);
                opacity: 0.3;
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
                position: relative;
                overflow: hidden;
            }

            .debug-btn:hover {
                background: var(--tab-hover-bg);
                border-color: var(--accent-color);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .debug-btn:active { transform: translateY(0); }

            .debug-btn.danger { color: var(--danger-color); }
            .debug-btn.danger:hover { background: rgba(217, 48, 37, 0.08); border-color: var(--danger-color); }

            .debug-info-card {
                background: var(--bg-color);
                border-radius: var(--radius-md);
                padding: 14px;
                font-size: 12px;
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                border: 1px solid var(--border-color);
            }

            .debug-info-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
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
                background: rgba(0, 0, 0, 0.6);
                z-index: 999999;
                display: none;
                backdrop-filter: blur(6px);
            }

            .debug-overlay.show { display: block; }

            .debug-content::-webkit-scrollbar { width: 6px; }
            .debug-content::-webkit-scrollbar-track { background: transparent; }
            .debug-content::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 10px;
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    Navigator Debug
                </div>
                <button class="debug-close" id="debug-close-btn">✕</button>
            </div>
            <div class="debug-content">
                <div class="debug-section">
                    <div class="debug-section-title">Connectivity & Proxy</div>
                    <div class="debug-grid">
                        <button class="debug-btn" id="db-btn-diagnose">
                            🔬 Run Diagnostics
                        </button>
                        <button class="debug-btn" id="db-btn-recover">
                            🔄 Recover Connection
                        </button>
                        <button class="debug-btn" id="db-btn-signal">
                            📨 Re-Init Worker
                        </button>
                        <button class="debug-btn" id="db-btn-bypass">
                            🔓 Toggle Restrictions
                        </button>
                    </div>
                </div>

                <div class="debug-section">
                    <div class="debug-section-title">Persistence & Maintenance</div>
                    <div class="debug-grid">
                        <button class="debug-btn" id="db-btn-sw-update">
                            📦 Check SW Update
                        </button>
                        <button class="debug-btn" id="db-btn-sync">
                            ☁️ Sync Tabs Now
                        </button>
                        <button class="debug-btn" id="db-btn-clear-cache">
                            🗑️ Clear App Caches
                        </button>
                        <button class="debug-btn danger" id="db-btn-reset">
                            ☢️ Factory Reset
                        </button>
                    </div>
                </div>

                <div class="debug-section">
                    <div class="debug-section-title">State & Analysis</div>
                    <div class="debug-grid">
                        <button class="debug-btn" id="db-btn-tab-data">
                            📑 Log Tab Objects
                        </button>
                        <button class="debug-btn" id="db-btn-export">
                            📤 Export Config
                        </button>
                        <button class="debug-btn" id="db-btn-import">
                            📥 Import Config
                        </button>
                        <button class="debug-btn" id="db-btn-perf-toggle">
                            ⚡ Toggle High Perf
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
                                <span class="debug-info-label">Memory Heap:</span>
                                <span class="debug-info-value" id="stat-mem">N/A</span>
                            </div>
                            <div class="debug-info-item">
                                <span class="debug-info-label">Total Uptime:</span>
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

        // Section 1: Connectivity
        document.getElementById('db-btn-diagnose').addEventListener('click', async () => {
            const btn = document.getElementById('db-btn-diagnose');
            btn.disabled = true;
            btn.innerHTML = 'Running...';
            if (window.WispHealthChecker) {
                const wispUrl = window.ProxyService?.transportConfig?.wispUrl ||
                    (location.protocol === "https:" ? "wss" : "ws") + "://navigator.scholarnavigator.workers.dev/wisp/";
                const httpUrl = wispUrl.replace(/^wss?/, location.protocol.replace(':', '')).replace('/wisp/', '/api/health');
                const results = await window.WispHealthChecker.diagnose(wispUrl, httpUrl);
                alert(`Diagnosis: ${results.diagnosis}\n\nHealth Status: ${results.isHealthy ? 'GOOD' : 'POOR'}`);
            } else alert('WispHealthChecker not found.');
            btn.disabled = false;
            btn.innerHTML = '🔬 Run Diagnostics';
            updateStats();
        });

        document.getElementById('db-btn-recover').addEventListener('click', async () => {
            if (window.ProxyService?.verifyAndRecoverConnection) {
                const working = await window.ProxyService.verifyAndRecoverConnection();
                alert(working ? 'Connection restored successfully!' : 'Connection recovery failed.');
            }
        });

        document.getElementById('db-btn-signal').addEventListener('click', async () => {
            if (window.ProxyService?.sendInitSignal) {
                await window.ProxyService.sendInitSignal();
                alert('Worker init signal sent.');
            }
        });

        document.getElementById('db-btn-bypass').addEventListener('click', () => {
            if (window.app && window.app.securitySettings) {
                const newState = !window.app.securitySettings.disableRestrictions;
                window.app.securitySettings.disableRestrictions = newState;
                localStorage.setItem('sec_disableRestrictions', newState ? 'true' : 'false');
                alert(`Security Restrictions: ${newState ? 'BYPASSED' : 'ENFORCED'}`);
            } else alert('Browser instance not ready.');
        });

        // Section 2: Persistence
        document.getElementById('db-btn-sw-update').addEventListener('click', async () => {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                if (regs.length === 0) return alert('No Service Worker found.');
                for (let reg of regs) {
                    if (reg.waiting) {
                        reg.waiting.postMessage('skipWaiting');
                        alert('Found update! Refreshing...');
                    } else {
                        await reg.update();
                        alert('Check complete. If update exists, it will apply on next reload.');
                    }
                }
            }
        });

        document.getElementById('db-btn-sync').addEventListener('click', () => {
            if (window.app && typeof window.app.saveSession === 'function') {
                window.app.saveSession();
                alert('Tab session synchronized to localStorage.');
            } else alert('Sync function missing.');
        });

        document.getElementById('db-btn-clear-cache').addEventListener('click', async () => {
            if (window.StorageHealth) {
                await window.StorageHealth.clearCaches();
                alert('Web assets and proxy cache cleared.');
            }
        });

        document.getElementById('db-btn-reset').addEventListener('click', async () => {
            if (confirm('PERMANENT DATA LOSS: Reset all settings, bookmarks, and delete proxy database?')) {
                if (window.StorageHealth) await window.StorageHealth.performFullReset();
                localStorage.clear();
                window.location.reload();
            }
        });

        // Section 3: Analysis
        document.getElementById('db-btn-tab-data').addEventListener('click', () => {
            if (window.app?.tabs) {
                console.group('📂 Active Tab Registry');
                console.table(window.app.tabs.map(t => ({
                    ID: t.id,
                    Title: t.title,
                    URL: t.url,
                    Memory: (t.memory || 0) + ' MB',
                    Status: t.sleeping ? 'SLEEPING' : 'ACTIVE'
                })));
                console.groupEnd();
                alert('Tab Registry logged to F12 Console.');
            } else alert('No active tabs found or Browser not ready.');
        });

        document.getElementById('db-btn-export').addEventListener('click', () => {
            const data = JSON.stringify(localStorage, null, 4);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `navigator_config_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            alert('Configuration exported.');
        });

        document.getElementById('db-btn-import').addEventListener('click', () => {
            const json = prompt('Paste your exported Configuration JSON here:');
            if (json) {
                try {
                    const parsed = JSON.parse(json);
                    Object.keys(parsed).forEach(k => localStorage.setItem(k, parsed[k]));
                    alert('Configuration imported. Reloading...');
                    window.location.reload();
                } catch (e) {
                    alert('Invalid JSON format.');
                }
            }
        });

        document.getElementById('db-btn-perf-toggle').addEventListener('click', () => {
            const keys = ['perf_animations', 'perf_shadows', 'perf_blur'];
            const currentState = localStorage.getItem('perf_animations') === 'true';
            const newState = !currentState;
            keys.forEach(k => localStorage.setItem(k, newState ? 'true' : 'false'));
            if (window.app && typeof window.app.loadPerformanceSettings === 'function') {
                window.app.loadPerformanceSettings();
                if (typeof window.app.applyPerformanceSettings === 'function') {
                    window.app.applyPerformanceSettings();
                }
                alert(`Performance Mode: ${newState ? 'POWER SAVING' : 'HIGH QUALITY'}`);
            }
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
            wispStat.textContent = isHealthy === true ? 'Healthy' : (isHealthy === false ? 'Degraded' : 'Unknown');
            wispStat.style.color = isHealthy === true ? '#22c55e' : (isHealthy === false ? '#ef4444' : 'var(--text-secondary)');
        }

        if (swStat && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                const active = regs.some(r => r.active);
                swStat.textContent = active ? 'Operational' : 'Missing';
                swStat.style.color = active ? '#22c55e' : '#ef4444';
            });
        }

        if (idbStat && window.StorageHealth) {
            window.StorageHealth.isIndexedDBAvailable().then(avail => {
                idbStat.textContent = avail ? 'Connected' : 'Error';
                idbStat.style.color = avail ? '#22c55e' : '#ef4444';
            });
        }

        if (window.app) {
            if (tabsStat && window.app.tabs) tabsStat.textContent = window.app.tabs.length;
            if (uptimeStat) {
                const uptimeMs = Date.now() - (window.app.startTime || Date.now());
                const h = Math.floor(uptimeMs / 3600000);
                const m = Math.floor((uptimeMs % 3600000) / 60000);
                const s = Math.floor((uptimeMs % 60000) / 1000);
                uptimeStat.textContent = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
        updateStats();
        const refreshInterval = setInterval(() => {
            if (menu.style.display === 'none') {
                clearInterval(refreshInterval);
                return;
            }
            updateStats();
        }, 1000);
        console.log('🛠️ [DEV] Debug menu activated.');
    }

    function hideDebugMenu() {
        const menu = document.getElementById(DEBUG_MENU_ID);
        const overlay = document.getElementById('debug-overlay');
        if (menu) menu.style.display = 'none';
        if (overlay) overlay.classList.remove('show');
    }

    window.showDebugMenu = showDebugMenu;
    console.log('🛠️ [DEV] Use showDebugMenu() to access advanced tools.');
})();
