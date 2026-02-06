class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.maxTabs = 15;
        this.tabDragState = null;
        this.suppressTabClick = false;
        this.tabDragThreshold = 6;

        // Blocked Sites List (Loaded from JSON)
        this.blockedSites = [];
        this.blockedKeywords = [];

        // DOM Elements
        this.tabsContainer = document.getElementById('tabs-container');
        this.viewportsContainer = document.getElementById('viewports-container');
        this.omnibox = document.getElementById('omnibox-input');
        this.newTabBtn = document.getElementById('new-tab-btn');
        this.proxyStatus = document.getElementById('proxy-status');
        this.logo = document.querySelector('.logo-container .app-logo-img');
        this.logoContainer = document.getElementById('browser-logo');
        this.bookmarkBtn = document.getElementById('bookmark-btn');
        this.bookmarksBar = document.getElementById('bookmarks-bar');
        this.sessionModal = document.getElementById('session-restore-modal');
        this.sessionRestoreBtn = document.getElementById('session-restore-btn');
        this.sessionDiscardBtn = document.getElementById('session-discard-btn');

        // Settings Elements
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsCloseBtn = document.getElementById('settings-close-btn');
        this.themeBtns = document.querySelectorAll('.theme-btn');





        // Disguise Elements
        this.disguiseSelect = document.getElementById('disguise-select');

        // Panic Button Elements
        this.panicEnabledToggle = document.getElementById('panic-enabled-toggle');
        this.panicKeyInput = document.getElementById('panic-key-input');
        this.panicUrlInput = document.getElementById('panic-url-input');

        // Performance Elements
        this.perfToggles = {
            animations: document.getElementById('perf-disable-animations'),
            shadows: document.getElementById('perf-disable-shadows'),
            blur: document.getElementById('perf-disable-blur'),
            showTabData: document.getElementById('perf-show-tab-data'),
            tabSleep: document.getElementById('perf-tab-sleep-toggle'),
            tabSleepTimer: document.getElementById('perf-tab-sleep-timer')
        };
        this.perfConfig = {
            tabSleepGroup: document.getElementById('tab-sleep-config'),
            tabSleepValue: document.getElementById('tab-sleep-value'),
            tabSleepTicks: document.querySelectorAll('.number-line-ticks .tick'),
            tabSleepDot: document.getElementById('tab-sleep-dot')
        };
        this.securitySettings = {
            disableRestrictions: false
        };
        this.sleepThresholds = [60, 300, 600, 1200, 1800]; // 1m, 5m, 10m, 20m, 30m
        this.sleepInterval = null;
        this.suppressUnloadPrompt = false;
        this.beforeUnloadHandler = null;



        // Monitor Elements
        this.monitorElements = {
            memoryBar: document.getElementById('monitor-memory-bar'),
            memoryValue: document.getElementById('monitor-memory-value'),
            tabsValue: document.getElementById('monitor-tabs-value'),
            uptimeValue: document.getElementById('monitor-uptime-value')
        };
        this.startTime = Date.now();
        this.monitorInterval = null;
        this.sessionKey = 'browser_tab_session';
        this.pendingSessionData = null;
        this.sessionSaveSuppressed = false;
        this.sessionPromptActive = false;

        // Tooltip Elements
        this.tooltip = {
            el: document.getElementById('tab-tooltip'),
            memory: document.getElementById('tt-memory'),
            sleep: document.getElementById('tt-sleep'),
            sleepContainer: document.getElementById('tt-sleep-container')
        };
        this.currentTooltipTabId = null;
        this.tooltipUpdateInterval = null;

        // Error Modal
        this.errorModal = document.getElementById('error-modal');
        this.errorMessage = document.getElementById('error-message');
        this.errorOkBtn = document.getElementById('error-ok-btn');

        // Initialize Disguise Presets
        if (!window.APP_BASE_URL) {
            window.APP_BASE_URL = new URL("./", window.location.href).href;
        }

        this.disguises = {
            'default': {
                title: 'Navigator',
                favicon: new URL('assets/logo.png', window.APP_BASE_URL).href
            },
            'google-classroom': {
                title: 'Home - Classroom',
                favicon: 'https://ssl.gstatic.com/classroom/favicon.png'
            },
            'google-drive': {
                title: 'Home - Google Drive',
                favicon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png'
            },
            'wikipedia': {
                title: 'Wikipedia',
                favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico'
            },
            'google-docs': {
                title: 'Google Docs',
                favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico'
            },
            'gmail': {
                title: 'Inbox (24)',
                favicon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico'
            }
        };

        // Category System for Home Page
        this.categories = {
            apps: {
                name: 'Apps',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>`,
                items: [
                    { name: 'GitHub', url: 'https://github.com', icon: 'GH' },
                    { name: 'FreeMediaHeckYeah', url: 'https://fmhy.net', icon: 'FM' }
                ]
            },
            games: {
                name: 'Games',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" y1="12" x2="10" y2="12"></line>
                    <line x1="8" y1="10" x2="8" y2="14"></line>
                    <line x1="15" y1="13" x2="15.01" y2="13"></line>
                    <line x1="18" y1="11" x2="18.01" y2="11"></line>
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                </svg>`,
                items: [
                    { name: 'Coolmath Games', url: 'https://coolmathgames.com', icon: 'CM' },
                    { name: 'GeForce NOW', url: 'https://geforcenow.com', icon: 'GF' }
                ]
            },
            streaming: {
                name: 'Streaming',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>`,
                items: [
                    { name: 'SpenFlix (Movies)', url: 'https://watch.spencerdevs.xyz', icon: 'SF' },
                    { name: 'SpenFlix (Alternate)', url: 'https://spenflix.ru', icon: 'SF' },
                ]
            }
        };

        this.navBtns = {

            back: document.getElementById('nav-back'),
            forward: document.getElementById('nav-forward'),
            refresh: document.getElementById('nav-refresh'),
            home: document.getElementById('nav-home'),
        };

        // Safety: Check if critical elements exist before proceeding
        if (!this.tabsContainer || !this.viewportsContainer || !this.omnibox || !this.settingsBtn) {
            console.error('[BROWSER] Critical DOM elements missing. Mismatched cache suspected.');
        }

        this.init().catch(err => {
            console.error('[BROWSER] Fatal initialization error:', err);
        });



        // Disguise Change Detection
        if (this.disguiseSelect) {
            this.disguiseSelect.addEventListener('change', () => {
                this.applyDisguise();
            });
        }

        // Panic Button Change Detection
        if (this.panicKeyInput) {
            // Capture key press for panic button
            this.panicKeyInput.addEventListener('click', () => {
                this.panicKeyInput.focus();
            });
            this.panicKeyInput.addEventListener('keydown', (e) => {
                e.preventDefault();
                const key = e.key;
                this.panicKeyInput.value = key;
                this.panicKeyInput.blur();
            });
        }

        // Global Panic Key Listener
        document.addEventListener('keydown', (e) => {
            this.handlePanicKey(e);
        });

        if (this.errorOkBtn) {
            this.errorOkBtn.addEventListener('click', () => this.hideError());
        }
        if (this.errorModal) {
            this.errorModal.addEventListener('click', (e) => {
                if (e.target === this.errorModal) this.hideError();
            });
        }
        if (this.sessionRestoreBtn) {
            this.sessionRestoreBtn.addEventListener('click', () => this.handleSessionRestore());
        }
        if (this.sessionDiscardBtn) {
            this.sessionDiscardBtn.addEventListener('click', () => this.handleSessionDiscard());
        }

        // Performance Event Bindings
        Object.keys(this.perfToggles).forEach(key => {
            const toggle = this.perfToggles[key];
            if (toggle) {
                const eventType = toggle.type === 'range' ? 'input' : 'change';
                toggle.addEventListener(eventType, () => {
                    this.applyPerformanceSettings();
                    localStorage.setItem(`perf_${key}`, toggle.checked !== undefined ? (toggle.checked ? 'true' : 'false') : toggle.value);
                });
            }
        });


        // Settings Sidebar Navigation
        this.settingsNavItems = document.querySelectorAll('.nav-item');
        this.settingsScrollArea = document.querySelector('.settings-scroll-area');

        if (this.settingsNavItems.length > 0) {
            this.settingsNavItems.forEach(item => {
                item.addEventListener('click', () => {
                    const targetId = item.getAttribute('data-target');
                    const targetSection = document.getElementById(targetId);
                    if (targetSection && this.settingsScrollArea) {
                        this.settingsScrollArea.scrollTo({
                            top: targetSection.offsetTop - 32,
                            behavior: 'smooth'
                        });
                        this.updateActiveNavItem(item);
                    }
                });
            });
        }

        if (this.settingsScrollArea) {
            this.settingsScrollArea.addEventListener('scroll', () => this.handleSettingsScroll());
        }
    }

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    configureIframePermissions(iframe) {
        if (!iframe) return;

        if (iframe.hasAttribute('sandbox')) {
            iframe.removeAttribute('sandbox');
        }
        if (iframe.hasAttribute('credentialless')) {
            iframe.removeAttribute('credentialless');
        }

        iframe.allow = "accelerometer autoplay camera clipboard-read clipboard-write display-capture encrypted-media fullscreen gamepad geolocation gyroscope microphone midi payment picture-in-picture publickey-credentials-get screen-wake-lock speaker-selection usb web-share xr-spatial-tracking";
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('webkitallowfullscreen', 'true');
        iframe.setAttribute('mozallowfullscreen', 'true');
    }

    guardIframeSandbox(tab) {
        if (!tab || !tab.iframe) return;
        this.configureIframePermissions(tab.iframe);

        if (tab.__sandboxObserver) return;

        const observer = new MutationObserver(() => {
            if (!tab.iframe) return;
            if (tab.iframe.hasAttribute('sandbox') || tab.iframe.hasAttribute('credentialless')) {
                this.configureIframePermissions(tab.iframe);
            }
        });

        observer.observe(tab.iframe, {
            attributes: true,
            attributeFilter: ['sandbox', 'credentialless', 'allow', 'allowfullscreen', 'webkitallowfullscreen', 'mozallowfullscreen']
        });

        tab.__sandboxObserver = observer;

        tab.iframe.addEventListener('load', () => {
            this.configureIframePermissions(tab.iframe);
        });
    }

    installContentIframeGuards(tab) {
        if (!tab || !tab.iframe) return;

        let iframeWindow;
        try {
            iframeWindow = tab.iframe.contentWindow;
        } catch (e) {
            return;
        }
        if (!iframeWindow || iframeWindow.__sandboxGuardInstalled) return;

        const removeSandboxAttrs = () => {
            try {
                const doc = iframeWindow.document;
                if (!doc) return;
                const frames = doc.querySelectorAll('iframe[sandbox], iframe[credentialless]');
                frames.forEach(frame => {
                    frame.removeAttribute('sandbox');
                    frame.removeAttribute('credentialless');
                });
            } catch (e) {
                // Cross-origin or early document access
            }
        };

        removeSandboxAttrs();

        try {
            const observer = new iframeWindow.MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes') {
                        const el = mutation.target;
                        if (el && el.tagName === 'IFRAME') {
                            el.removeAttribute('sandbox');
                            el.removeAttribute('credentialless');
                        }
                    } else if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node && node.tagName === 'IFRAME') {
                                node.removeAttribute('sandbox');
                                node.removeAttribute('credentialless');
                            }
                            if (node && node.querySelectorAll) {
                                node.querySelectorAll('iframe[sandbox], iframe[credentialless]').forEach(frame => {
                                    frame.removeAttribute('sandbox');
                                    frame.removeAttribute('credentialless');
                                });
                            }
                        });
                    }
                }
            });

            const doc = iframeWindow.document;
            // [PERFORMANCE] Optimized observer configuration - only watch what we need
            observer.observe(doc.documentElement || doc, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['sandbox', 'credentialless'] // Only watch these specific attributes
            });

            tab.__contentSandboxObserver = observer;
        } catch (e) {
            // MutationObserver or document access failed
        }

        try {
            const iframeProto = iframeWindow.HTMLIFrameElement && iframeWindow.HTMLIFrameElement.prototype;
            if (iframeProto && !iframeProto.__sandboxGuarded) {
                const originalSetAttribute = iframeProto.setAttribute;
                iframeProto.setAttribute = function (name, value) {
                    if (name && (name.toLowerCase() === 'sandbox' || name.toLowerCase() === 'credentialless')) {
                        this.removeAttribute(name);
                        return;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
                iframeProto.__sandboxGuarded = true;
            }
        } catch (e) {
            // Prototype patch failed
        }

        iframeWindow.__sandboxGuardInstalled = true;
    }

    async loadBlockedSites() {
        try {
            const response = await fetch('assets/blocked-sites.json');
            if (!response.ok) throw new Error('Failed to load blocked sites');
            const data = await response.json();
            if (data && Array.isArray(data.blocked_sites)) {
                // Sanitize: Strip protocol and trailing slashes for better matching
                this.blockedSites = data.blocked_sites.map(site =>
                    site.replace(/^https?:\/\//, '').replace(/\/$/, '')
                );
                console.log(`[BROWSER] Loaded ${this.blockedSites.length} blocked sites.`);
            }
        } catch (e) {
            console.warn('[BROWSER] Could not load blocked sites list:', e);
        }
    }

    async init() {
        if (window.self !== window.top) {
            let isAllowedFrame = false;

            try {
                const parentUrl = window.parent.location.href;
                // Check for about:blank OR the landing page origin
                if (parentUrl === 'about:blank' || parentUrl.includes('/github.io/a/') || parentUrl.includes('/a/page1.html')) {
                    isAllowedFrame = true;
                    console.log('[BROWSER] 🔐 Running in cloaked context');
                }
            } catch (e) {
                isAllowedFrame = true;
                console.log('[BROWSER] 🌐 Cross-origin iframe detected (likely Google Sites) - UI allowed');
            }

            if (!isAllowedFrame) {
                console.warn('[BROWSER] Inception detected (unauthorized iframe). Aborting UI initialization.');
                return;
            }
        }

        window.history.pushState({ anchor: true }, '');
        window.addEventListener('popstate', (e) => {
            console.log('[BROWSER] 🛡️ Popstate detected in shell! State:', e.state);
            if (e.state && e.state.anchor) return;
            window.history.pushState({ anchor: true }, '');
        });
        this.beforeUnloadHandler = (e) => {
            if (this.suppressUnloadPrompt) {
                return;
            }
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);

        this.bindEvents();
        this.loadTheme();
        this.loadDisguise();
        this.loadPerformanceSettings();
        this.loadSecuritySettings();
        await this.loadBlockedSites();
        this.loadBookmarks();
        this.updateProxyStatus('loading');


        const params = new URLSearchParams(window.location.search);
        const urlToOpen = params.get('url');
        const isDeepLink = urlToOpen && urlToOpen !== 'browser://home';
        let handledInitialTabs = false;

        if (!isDeepLink && this.maybePromptSessionRestore()) {
            handledInitialTabs = true;
        } else if (isDeepLink) {
            const decodedUrl = decodeURIComponent(urlToOpen);

            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            console.log('[BROWSER] Deep-linking to:', decodedUrl);
            this.createTab(decodedUrl);
            handledInitialTabs = true;
        }

        if (!handledInitialTabs) {
            this.createTab();
        }

        try {
            await window.ProxyService.ready;
            this.updateProxyStatus('connected');
        } catch (e) {
            console.error('[BROWSER] Proxy initialization error:', e);
            this.updateProxyStatus('error');
        }

        // Start Monitor
        this.startMonitor();
    }

    maybePromptSessionRestore() {
        const session = this.getStoredSessionData();
        if (!session || !Array.isArray(session.tabs) || session.tabs.length === 0) {
            return false;
        }

        // Don't show the prompt if the only tab is the home page
        if (session.tabs.length === 1 && session.tabs[0].url === 'browser://home') {
            return false;
        }

        this.pendingSessionData = session;
        this.showSessionPrompt();
        return true;
    }

    getStoredSessionData() {
        try {
            const raw = localStorage.getItem(this.sessionKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.tabs)) return null;
            return parsed;
        } catch (e) {
            console.warn('[SESSION] Failed to parse saved tabs:', e);
            this.clearStoredSession();
            return null;
        }
    }

    showSessionPrompt() {
        if (!this.sessionModal || this.sessionPromptActive) return;
        this.sessionModal.classList.remove('hidden');
        if (this.newTabBtn) this.newTabBtn.disabled = true;
        this.sessionPromptActive = true;
    }

    hideSessionPrompt() {
        if (!this.sessionModal || !this.sessionPromptActive) return;
        this.sessionModal.classList.add('hidden');
        if (this.newTabBtn) this.newTabBtn.disabled = false;
        this.sessionPromptActive = false;
    }

    handleSessionRestore() {
        this.hideSessionPrompt();
        if (!this.pendingSessionData) {
            this.createTab();
            return;
        }
        this.restoreSession(this.pendingSessionData);
        this.pendingSessionData = null;
    }

    handleSessionDiscard() {
        this.hideSessionPrompt();
        this.clearStoredSession();
        this.pendingSessionData = null;
        this.createTab();
    }

    restoreSession(sessionData) {
        if (!sessionData || !Array.isArray(sessionData.tabs)) {
            this.createTab();
            return;
        }

        this.sessionSaveSuppressed = true;
        this.clearAllTabs();

        for (const entry of sessionData.tabs) {
            if (this.tabs.length >= this.maxTabs) break;
            if (!entry || typeof entry.url !== 'string') continue;
            const url = entry.url;
            if (url !== 'browser://home' && this.isUrlBlocked(url)) continue;
            this.createTab(url);
        }

        this.sessionSaveSuppressed = false;

        if (this.tabs.length === 0) {
            this.createTab();
            return;
        }

        const desiredIndex = Math.min(Math.max(0, Number(sessionData.activeIndex) || 0), this.tabs.length - 1);
        const desiredTab = this.tabs[desiredIndex];
        if (desiredTab) {
            this.switchTab(desiredTab.id);
        }

        this.saveSession();
    }

    clearAllTabs() {
        while (this.tabs.length) {
            const tab = this.tabs.pop();
            this.cleanupTabResources(tab);
            if (tab.element) tab.element.remove();
            if (tab.iframe) tab.iframe.remove();
            if (tab.homeElement) tab.homeElement.remove();
        }
        this.activeTabId = null;
        this.nextTabId = 1;
    }

    cleanupTabResources(tab) {
        const intervals = [
            { key: '__syncInterval', label: 'sync interval' },
            { key: '__overrideInterval', label: 'override interval' }
        ];
        intervals.forEach(({ key, label }) => {
            if (tab[key]) {
                clearInterval(tab[key]);
                tab[key] = null;
                console.log(`[PERFORMANCE] Cleared ${label} for tab`, tab.id);
            }
        });

        if (tab.__sandboxObserver) {
            tab.__sandboxObserver.disconnect();
            tab.__sandboxObserver = null;
        }

        if (tab.__contentSandboxObserver) {
            tab.__contentSandboxObserver.disconnect();
            tab.__contentSandboxObserver = null;
        }
    }

    saveSession() {
        if (this.sessionSaveSuppressed) return;
        if (!Array.isArray(this.tabs) || this.tabs.length === 0) {
            return;
        }

        // [PERFORMANCE] Debounce session saves to reduce localStorage writes
        if (this._saveSessionTimeout) {
            clearTimeout(this._saveSessionTimeout);
        }

        this._saveSessionTimeout = setTimeout(() => {
            const snapshot = this.tabs.map(tab => ({
                url: tab.url,
                sleeping: !!tab.sleeping
            }));
            const activeIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
            const payload = {
                version: 1,
                tabs: snapshot,
                activeIndex: activeIndex >= 0 ? activeIndex : 0,
                timestamp: Date.now()
            };

            try {
                localStorage.setItem(this.sessionKey, JSON.stringify(payload));
            } catch (e) {
                console.warn('[SESSION] Unable to save layout:', e);
            }
        }, 1000); // Wait 1 second before saving
    }

    clearStoredSession() {
        localStorage.removeItem(this.sessionKey);
    }

    startMonitor() {
        if (this.monitorInterval) clearInterval(this.monitorInterval);
        this.updateMonitor();
        // [PERFORMANCE] Reduced from 1000ms to 2000ms for low-end devices
        this.monitorInterval = setInterval(() => this.updateMonitor(), 2000);
    }

    updateMonitor() {
        if (!this.monitorElements.memoryValue) return;

        // 1. Memory Usage
        let memUsed = 0;
        let memLimit = 1024; // Default limit 1GB for calculation

        if (window.performance && window.performance.memory) {
            memUsed = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
            memLimit = Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024));
        } else {
            // Fallback: Simulate realistic base browser usage based on tabs
            const baseUsage = 120; // Base MB
            const tabUsage = this.tabs.length * 45; // ~45MB per tab
            memUsed = baseUsage + tabUsage + Math.floor(Math.random() * 10);
        }

        const memPercent = Math.min(100, (memUsed / memLimit) * 100);
        this.monitorElements.memoryValue.textContent = `${memUsed} MB`;
        this.monitorElements.memoryBar.style.width = `${memPercent}%`;

        // Change color based on usage
        if (memPercent > 80) {
            this.monitorElements.memoryBar.style.background = 'var(--danger-color)';
        } else {
            this.monitorElements.memoryBar.style.background = 'var(--accent-color)';
        }

        // 2. Active Tabs
        this.monitorElements.tabsValue.textContent = this.tabs.length;

        // 3. Uptime
        const uptimeMs = Date.now() - this.startTime;
        const totalSeconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        this.monitorElements.uptimeValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // 4. [PERFORMANCE] Tab memory fluctuation - ONLY when tab data is visible
        const showTabData = this.perfToggles.showTabData && this.perfToggles.showTabData.checked;
        if (showTabData) {
            this.tabs.forEach(tab => {
                if (!tab.sleeping) {
                    const change = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);
                    tab.memory = Math.max(10, Math.min(500, tab.memory + change));
                }
            });
        }
    }

    bindEvents() {
        // Intercept new window requests from Scramjet or the Service Worker
        window.addEventListener('message', (e) => {
            if (!e.data) return;

            let url = null;
            if (e.data.type === 'proxy:open') {
                url = e.data.url;
            } else if (e.data.type === 'scramjet:open') {
                url = e.data.url;
            } else if (e.data.scramjet && e.data.scramjet.type === 'open') {
                url = e.data.url || e.data.scramjet.url;
            }

            if (url) {
                console.log('[BROWSER] Intercepted link/window request:', url);

                // If it's an encoded Scramjet URL, we might want to decode it for the tab bar UI, 
                // but navigate() handles strings fine.
                this.createTab(url);
            }
        });

        this.newTabBtn.addEventListener('click', () => this.createTab());

        window.addEventListener('pointerup', (e) => this.handleTabPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.handleTabPointerUp(e));

        if (this.bookmarkBtn) {
            this.bookmarkBtn.addEventListener('click', () => this.handleBookmarkClick());
        }

        this.omnibox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleOmniboxSubmit();
            }
        });

        this.navBtns.back.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const tab = this.getActiveTab();
            if (!tab || tab.url === 'browser://home') return;

            if (this.__backProcessing) return;
            this.__backProcessing = true;
            setTimeout(() => this.__backProcessing = false, 300);

            if (tab.iframe && tab.iframe.contentWindow) {
                try {
                    const oldUrl = tab.url;
                    console.log('[NAVIGATOR] 🔙 Back Request. URL:', oldUrl);

                    if (tab.scramjetWrapper && typeof tab.scramjetWrapper.back === 'function') {
                        tab.scramjetWrapper.back();
                    } else {
                        tab.iframe.contentWindow.history.back();
                    }

                    // Sync UI after a longer delay to ensure the back navigation has committed
                    setTimeout(() => {
                        this.syncTabWithIframe(tab);
                        if (tab.url === oldUrl) {
                            console.log('[NAVIGATOR] 🔙 History exhausted. Returning Home.');
                            this.navigate('browser://home');
                        }
                    }, 500);
                } catch (err) {
                    console.error('[NAVIGATOR] 🔙 Execution Error:', err);
                    this.navigate('browser://home');
                }
            } else {
                this.navigate('browser://home');
            }
        });

        this.navBtns.forward.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const tab = this.getActiveTab();
            if (!tab) return;

            // Restore from Home if possible
            if (tab.url === 'browser://home' && tab.iframe) {
                if (this.__forwardProcessing) return;
                this.__forwardProcessing = true;
                setTimeout(() => this.__forwardProcessing = false, 300);

                console.log('[NAVIGATOR] 🔜 Forward from Home - restoring site view.');
                tab.homeElement.classList.add('hidden');
                tab.iframe.classList.add('active');

                // Immediately update tab.url and omnibox
                this.syncTabWithIframe(tab);
                return;
            }

            if (tab.url === 'browser://home') return;

            if (this.__forwardProcessing) return;
            this.__forwardProcessing = true;
            setTimeout(() => this.__forwardProcessing = false, 300);

            if (tab.iframe && tab.iframe.contentWindow) {
                try {
                    console.log('[NAVIGATOR] 🔜 Forward Request.');
                    if (tab.scramjetWrapper && typeof tab.scramjetWrapper.forward === 'function') {
                        tab.scramjetWrapper.forward();
                    } else {
                        tab.iframe.contentWindow.history.forward();
                    }

                    setTimeout(() => {
                        this.syncTabWithIframe(tab);
                    }, 500);
                } catch (err) {
                    console.error('[NAVIGATOR] 🔜 Forward error:', err);
                }
            }
        });

        this.navBtns.refresh.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const tab = this.getActiveTab();
            if (tab) {
                if (tab.url === 'browser://home') {
                    this.renderHomePage(tab);
                } else if (tab.iframe) {
                    this.setLoading(true);
                    if (tab.scramjetWrapper && typeof tab.scramjetWrapper.reload === 'function') {
                        tab.scramjetWrapper.reload();
                    } else {
                        tab.iframe.contentWindow.location.reload();
                    }
                    tab.iframe.onload = () => this.setLoading(false);
                }
            }
        });

        this.navBtns.home.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigate('browser://home');
        });

        if (this.logoContainer) {
            this.logoContainer.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.navigate('browser://home');
            });
        }

        // Settings Modal Events
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        if (this.settingsCloseBtn) {
            this.settingsCloseBtn.addEventListener('click', () => this.closeSettings());
        }
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) this.closeSettings();
            });
        }

        if (this.themeBtns) {
            this.themeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.getAttribute('data-theme');
                    this.setTheme(theme);
                });
            });
        }

        // Network Warning Close
        const warningClose = document.getElementById('warning-close-btn');
        if (warningClose) {
            warningClose.addEventListener('click', () => {
                document.getElementById('network-warning-banner').classList.add('hidden');
            });
        }


    }

    // Settings & Themes
    openSettings() {
        if (this.cloakToggle) {
            this.cloakToggle.checked = localStorage.getItem('ab') === 'true';
        }
        if (this.disguiseSelect) {
            const savedDisguise = localStorage.getItem('tab_disguise') || 'default';
            this.disguiseSelect.value = savedDisguise;
        }
        // Load panic button settings
        this.loadPanicSettings();

        this.settingsModal.classList.remove('hidden');
        this.updateThemeActiveState();

        // Reset to first section
        if (this.settingsScrollArea) {
            this.settingsScrollArea.scrollTop = 0;
            this.updateActiveNavItem(this.settingsNavItems[0]);
        }

        // Sync performance settings in UI
        Object.keys(this.perfToggles).forEach(key => {
            const toggle = this.perfToggles[key];
            if (toggle) {
                const val = localStorage.getItem(`perf_${key}`);
                if (toggle.type === 'checkbox') {
                    toggle.checked = val === 'true';
                } else if (toggle.type === 'range' && val !== null) {
                    toggle.value = val;
                }
            }
        });
    }

    loadPerformanceSettings() {
        Object.keys(this.perfToggles).forEach(key => {
            const toggle = this.perfToggles[key];
            if (!toggle) return;
            const saved = localStorage.getItem(`perf_${key}`);
            if (saved !== null) {
                if (toggle.type === 'checkbox') {
                    toggle.checked = saved === 'true';
                } else {
                    toggle.value = saved;
                }
            }
        });
        this.applyPerformanceSettings();
    }

    loadSecuritySettings() {
        Object.keys(this.securitySettings).forEach(key => {
            const saved = localStorage.getItem(`sec_${key}`);
            if (saved !== null) {
                this.securitySettings[key] = saved === 'true';
            }
        });
    }

    applyPerformanceSettings() {
        const doc = document.documentElement;

        if (this.perfToggles.animations && this.perfToggles.animations.checked) {
            doc.classList.add('perf-no-animations');
        } else {
            doc.classList.remove('perf-no-animations');
        }

        if (this.perfToggles.shadows && this.perfToggles.shadows.checked) {
            doc.classList.add('perf-no-shadows');
        } else {
            doc.classList.remove('perf-no-shadows');
        }

        if (this.perfToggles.blur && this.perfToggles.blur.checked) {
            doc.classList.add('perf-no-blur');
        } else {
            doc.classList.remove('perf-no-blur');
        }

        // Tab Sleep UI Sync
        const sleepEnabled = this.perfToggles.tabSleep && this.perfToggles.tabSleep.checked;
        if (this.perfConfig.tabSleepGroup) {
            this.perfConfig.tabSleepGroup.classList.toggle('disabled-gray', !sleepEnabled);
        }

        if (this.perfToggles.tabSleepTimer && this.perfConfig.tabSleepValue) {
            const val = parseInt(this.perfToggles.tabSleepTimer.value);
            const labels = ["1 Minute", "5 Minutes", "10 Minutes", "20 Minutes", "30 Minutes"];
            this.perfConfig.tabSleepValue.textContent = labels[val] || "5 Minutes";

            // Update Number Line Ticks
            if (this.perfConfig.tabSleepTicks) {
                this.perfConfig.tabSleepTicks.forEach((tick, idx) => {
                    tick.classList.toggle('active', idx === val);
                });
            }

            // Update Phantom Dot Position (The Jump Animation)
            if (this.perfConfig.tabSleepDot) {
                // val is 0-4. Calculate position from center of first tick (11px) to center of last tick (100% - 11px)
                const ratio = val / 4;
                this.perfConfig.tabSleepDot.style.left = `calc(11px + ${ratio} * (100% - 22px))`;
            }
        }

        // Start or Stop the interval based on the setting
        if (sleepEnabled) {
            if (!this.sleepInterval) {
                this.sleepInterval = setInterval(() => this.checkTabInactivity(), 5000);
            }
        } else {
            if (this.sleepInterval) {
                clearInterval(this.sleepInterval);
                this.sleepInterval = null;
            }
            // Wake up all sleeping tabs if feature is disabled
            this.tabs.forEach(tab => {
                if (tab.sleeping) this.wakeUpTab(tab);
            });
        }
    }

    updateActiveNavItem(activeItem) {
        if (!activeItem) return;
        this.settingsNavItems.forEach(item => item.classList.remove('active'));
        activeItem.classList.add('active');
    }

    checkTabInactivity() {
        const sleepEnabled = this.perfToggles.tabSleep && this.perfToggles.tabSleep.checked;
        // [PERFORMANCE] Early return if sleeping is disabled
        if (!sleepEnabled) return;

        const val = parseInt(this.perfToggles.tabSleepTimer.value);
        const threshold = this.sleepThresholds[val] * 1000;

        this.tabs.forEach(tab => {
            if (tab.id === this.activeTabId || tab.url === 'browser://home' || tab.sleeping) return;
            const elapsed = Date.now() - tab.lastActive;
            if (elapsed > threshold) {
                this.putTabToSleep(tab);
            }
        });
    }

    putTabToSleep(tab) {
        if (tab.sleeping) return;
        console.log(`[BROWSER] 😴 Putting tab ${tab.id} to sleep (${tab.title})`);
        tab.sleeping = true;
        tab.element.classList.add('sleeping');

        if (tab.iframe) {
            tab.iframe.src = 'about:blank';
        }
    }

    wakeUpTab(tab) {
        if (!tab.sleeping) return;
        console.log(`[BROWSER] ☀️ Waking up tab ${tab.id} (${tab.title})`);
        tab.sleeping = false;
        tab.element.classList.remove('sleeping');
        tab.lastActive = Date.now();

        if (tab.iframe) {
            tab.iframe.src = tab.url;
        }
    }

    handleSettingsScroll() {
        if (!this.settingsScrollArea) return;

        const sections = document.querySelectorAll('.settings-content-section');
        let currentSectionId = '';

        // Focus point is 25% down the visible scroll area
        const triggerOffset = this.settingsScrollArea.clientHeight * 0.25;
        const scrollPosition = this.settingsScrollArea.scrollTop;

        // Check if we've reached the very bottom of the scroll area
        const isAtBottom = scrollPosition + this.settingsScrollArea.clientHeight >= this.settingsScrollArea.scrollHeight - 50;

        if (isAtBottom && sections.length > 0) {
            currentSectionId = sections[sections.length - 1].getAttribute('id');
        } else {
            sections.forEach(section => {
                const sectionTop = section.offsetTop - this.settingsScrollArea.offsetTop;
                // If the section's top has passed the 25% focus line
                if (scrollPosition >= sectionTop - triggerOffset) {
                    currentSectionId = section.getAttribute('id');
                }
            });
        }

        if (currentSectionId) {
            const activeNav = Array.from(this.settingsNavItems).find(item => item.getAttribute('data-target') === currentSectionId);
            if (activeNav) this.updateActiveNavItem(activeNav);
        }
    }

    closeSettings() {
        this.savePanicSettings();
        this.settingsModal.classList.add('hidden');
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('browser_theme', theme);
        this.updateThemeActiveState();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('browser_theme') || 'cloud';
        this.setTheme(savedTheme);
    }



    updateThemeActiveState() {
        const currentTheme = localStorage.getItem('browser_theme') || 'cloud';
        this.themeBtns.forEach(btn => {
            if (btn.getAttribute('data-theme') === currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateProxyStatus(status) {
        this.proxyStatus.className = `status-indicator ${status}`;
        this.proxyStatus.title = `Proxy Status: ${status}`;

        if (status === 'loading') {
            this.setLoading(true);
        } else {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (this.logo) {
            if (isLoading) {
                this.logo.classList.add('spin');
            } else {
                this.logo.classList.remove('spin');
            }
        }
    }

    isUrlBlocked(url) {
        // Check if restrictions are globally disabled
        if (this.securitySettings && this.securitySettings.disableRestrictions) {
            return false;
        }

        if (!url || url === 'browser://home') return false;

        try {
            const urlObj = new URL(url);
            const fullString = urlObj.toString().toLowerCase();

            // Check against basic keywords
            for (const keywordB64 of this.blockedKeywords) {
                const keyword = atob(keywordB64);
                if (fullString.includes(keyword)) {
                    return true;
                }
            }

            // Check against blocked sites list
            if (this.blockedSites && this.blockedSites.length > 0) {
                for (const site of this.blockedSites) {
                    if (fullString.includes(site)) {
                        return true;
                    }
                }
            }

            return false;
        } catch (e) {
            // If invalid URL, allow logic elsewhere to handle or block if it looks suspicious? 
            // For now, assume valid URLs passed here.
            return false;
        }
    }

    attachTabDragHandlers(tab) {
        if (!tab || !tab.element) return;

        const tabEl = tab.element;

        tabEl.addEventListener('pointerdown', (e) => this.handleTabPointerDown(e, tab));
        tabEl.addEventListener('pointermove', (e) => this.handleTabPointerMove(e));
        tabEl.addEventListener('pointerup', (e) => this.handleTabPointerUp(e));
        tabEl.addEventListener('pointercancel', (e) => this.handleTabPointerUp(e));
    }

    handleTabPointerDown(e, tab) {
        if (!tab || !tab.element) return;
        if (e.button !== 0 && e.pointerType !== 'touch') return;
        if (e.target.closest('.tab-close')) return;

        this.suppressTabClick = false;
        this.tabDragState = {
            tabId: tab.id,
            element: tab.element,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            dragging: false
        };

        try {
            tab.element.setPointerCapture(e.pointerId);
        } catch (err) {
            // Pointer capture may be unsupported in some contexts
        }
    }

    handleTabPointerMove(e) {
        const state = this.tabDragState;
        if (!state || state.pointerId !== e.pointerId) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const distance = Math.hypot(dx, dy);

        if (!state.dragging) {
            if (distance < this.tabDragThreshold) return;
            state.dragging = true;
            this.suppressTabClick = true;
            state.element.classList.add('dragging');
            if (this.tabsContainer) this.tabsContainer.classList.add('dragging');
            this.hideTabTooltip();
        }

        if (state.dragging) {
            e.preventDefault();
            this.reorderTabByPointer(e.clientX, state.element);
            this.autoScrollTabsContainer(e.clientX);
        }
    }

    handleTabPointerUp(e) {
        const state = this.tabDragState;
        if (!state || state.pointerId !== e.pointerId) return;

        try {
            state.element.releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignore if pointer capture wasn't active
        }

        if (state.dragging) {
            state.element.classList.remove('dragging');
            if (this.tabsContainer) this.tabsContainer.classList.remove('dragging');
            this.updateTabOrderFromDOM();
            this.suppressTabClick = true;
            setTimeout(() => {
                this.suppressTabClick = false;
            }, 0);
        }

        this.tabDragState = null;
    }

    reorderTabByPointer(clientX, draggingEl) {
        if (!this.tabsContainer || !draggingEl) return;

        const insertBeforeEl = this.getTabInsertBefore(clientX, draggingEl);
        if (insertBeforeEl) {
            this.tabsContainer.insertBefore(draggingEl, insertBeforeEl);
        } else if (this.newTabBtn) {
            this.tabsContainer.insertBefore(draggingEl, this.newTabBtn);
        }
    }

    getTabInsertBefore(clientX, draggingEl) {
        const tabs = Array.from(this.tabsContainer.querySelectorAll('.tab'));
        let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

        tabs.forEach(tab => {
            if (tab === draggingEl) return;
            const rect = tab.getBoundingClientRect();
            const offset = clientX - (rect.left + rect.width / 2);
            if (offset < 0 && offset > closest.offset) {
                closest = { offset, element: tab };
            }
        });

        return closest.element;
    }

    updateTabOrderFromDOM() {
        if (!this.tabsContainer) return;

        const orderedIds = Array.from(this.tabsContainer.querySelectorAll('.tab'))
            .map(el => Number(el.dataset.id))
            .filter(id => !Number.isNaN(id));

        if (orderedIds.length === 0) return;

        const currentIds = this.tabs.map(tab => tab.id);
        const sameOrder = orderedIds.length === currentIds.length &&
            orderedIds.every((id, idx) => id === currentIds[idx]);

        if (sameOrder) return;

        const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
        this.tabs.sort((a, b) => {
            const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
            const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
            return aIndex - bIndex;
        });
        this.saveSession();
    }

    autoScrollTabsContainer(clientX) {
        if (!this.tabsContainer) return;
        const rect = this.tabsContainer.getBoundingClientRect();
        const scrollZone = 24;
        const scrollAmount = 12;

        if (clientX < rect.left + scrollZone) {
            this.tabsContainer.scrollLeft -= scrollAmount;
        } else if (clientX > rect.right - scrollZone) {
            this.tabsContainer.scrollLeft += scrollAmount;
        }
    }

    createTab(url = 'browser://home') {
        if (this.tabs.length >= this.maxTabs) return;

        const id = this.nextTabId++;
        const tab = {
            id,
            url,
            title: 'New Tab',
            favicon: '',
            iframe: null,
            scramjetWrapper: null,
            homeElement: null,
            element: null,
            lastActive: Date.now(),
            sleeping: false,
            memory: Math.floor(25 + Math.random() * 40) // Heuristic: Base 25MB + random
        };

        // Create Tab UI
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.dataset.id = id;
        tabEl.innerHTML = `
            <div class="tab-sleep-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            </div>
            <img class="tab-favicon" src="" style="display:none;"> 
            <div class="tab-title">New Tab</div>
            <div class="tab-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>
        `;

        tabEl.addEventListener('click', (e) => {
            if (this.suppressTabClick) return;
            if (!e.target.closest('.tab-close')) {
                this.switchTab(id);
            }
        });

        // Hover Tooltip Events
        tabEl.addEventListener('mouseenter', () => this.showTabTooltip(tab));
        tabEl.addEventListener('mouseleave', () => this.hideTabTooltip());
        tabEl.addEventListener('mousemove', (e) => this.positionTabTooltip(e));

        tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(id);
        });

        tab.element = tabEl;
        this.attachTabDragHandlers(tab);
        this.tabsContainer.insertBefore(tabEl, this.newTabBtn);

        this.createViewport(tab);
        this.tabs.push(tab);
        this.switchTab(id);

        if (url !== 'browser://home') {
            this.navigate(url);
        }
    }

    createViewport(tab) {
        const homeEl = document.createElement('div');
        homeEl.className = 'home-page hidden';
        this.viewportsContainer.appendChild(homeEl);
        tab.homeElement = homeEl;

        this.renderHomePage(tab);
    }

    renderHomePage(tab) {
        if (!tab.homeElement) return;

        // Render category buttons instead of pinned apps
        let homeHtml = `
        <div class="home-branding">
            <h1 class="brand-title">Navigator</h1>
            <p class="brand-subtitle">by the scholar squad</p>
        </div>
        <div class="home-grid">
    `;

        // Render category buttons
        Object.keys(this.categories).forEach(categoryKey => {
            const category = this.categories[categoryKey];
            homeHtml += `
                <div class="category-button" data-category="${categoryKey}">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-title">${category.name}</div>
                </div>
            `;
        });

        homeHtml += `</div>`;

        // [PERFORMANCE] Single DOM update
        tab.homeElement.innerHTML = homeHtml;

        // Attach Event Listeners for Category Buttons
        tab.homeElement.querySelectorAll('.category-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryKey = btn.getAttribute('data-category');
                this.openCategoryMenu(categoryKey);
            });
        });
    }

    openCategoryMenu(categoryKey) {
        const category = this.categories[categoryKey];
        if (!category) return;

        // Create modal overlay if it doesn't exist
        let overlay = document.getElementById('category-menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'category-menu-overlay';
            overlay.className = 'category-menu-overlay';
            document.body.appendChild(overlay);
        }

        // Build menu HTML with search bar and items
        let menuHtml = `
            <div class="category-menu">
                <div class="category-menu-header">
                    <h2>${category.name}</h2>
                    <button class="category-menu-close" title="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="category-menu-search">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" class="category-search-input" placeholder="Search ${category.name.toLowerCase()}..." />
                </div>
                <div class="category-menu-grid">
        `;

        // Render all items
        category.items.forEach((item, index) => {
            menuHtml += `
                <div class="category-menu-item" data-url="${item.url}" data-name="${item.name.toLowerCase()}">
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-title">${item.name}</div>
                </div>
            `;
        });

        menuHtml += `
                </div>
            </div>
        `;

        overlay.innerHTML = menuHtml;
        overlay.classList.remove('hidden');

        // Attach Event Listeners
        const closeBtn = overlay.querySelector('.category-menu-close');
        closeBtn.addEventListener('click', () => this.closeCategoryMenu());

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeCategoryMenu();
        });

        // Search functionality
        const searchInput = overlay.querySelector('.category-search-input');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const items = overlay.querySelectorAll('.category-menu-item');
            items.forEach(item => {
                const itemName = item.getAttribute('data-name');
                if (itemName.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        // Item click handlers
        overlay.querySelectorAll('.category-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.getAttribute('data-url');
                this.createTab(url);
                this.closeCategoryMenu();
            });
        });

        // Focus search input
        searchInput.focus();
    }

    closeCategoryMenu() {
        const overlay = document.getElementById('category-menu-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    switchTab(id) {
        if (this.activeTabId === id) return;

        // Deactivate old
        const oldTab = this.tabs.find(t => t.id === this.activeTabId);
        if (oldTab) {
            oldTab.element.classList.remove('active');
            if (oldTab.iframe) oldTab.iframe.classList.remove('active');
            if (oldTab.homeElement) oldTab.homeElement.classList.add('hidden');
        }

        // Activate new
        const newTab = this.tabs.find(t => t.id === id);
        if (newTab) {
            newTab.element.classList.add('active');
            newTab.lastActive = Date.now();
            if (newTab.sleeping) {
                this.wakeUpTab(newTab);
            }
            this.activeTabId = id;

            if (newTab.url === 'browser://home') {
                newTab.homeElement.classList.remove('hidden');
                if (newTab.iframe) newTab.iframe.classList.remove('active');
                this.omnibox.value = '';
                this.omnibox.placeholder = 'Search or enter address';
                this.setLoading(false); // Home is static
            } else {
                if (newTab.homeElement) newTab.homeElement.classList.add('hidden');
                if (newTab.iframe) newTab.iframe.classList.add('active');
                this.omnibox.value = newTab.url;
            }
            this.updateBookmarkButtonState();
            this.saveSession();
        }
    }

    closeTab(id) {
        if (this.tabs.length <= 1) {
            this.showError('You must have at least one tab open.');
            return;
        }

        const tabIndex = this.tabs.findIndex(t => t.id === id);
        if (tabIndex === -1) return;

        const tab = this.tabs[tabIndex];

        // [PERFORMANCE] Clean up intervals to prevent memory leaks
        this.cleanupTabResources(tab);

        // Remove Elements
        tab.element.remove();
        if (tab.iframe) tab.iframe.remove();
        if (tab.homeElement) tab.homeElement.remove();

        this.tabs.splice(tabIndex, 1);

        if (this.activeTabId === id) {
            if (this.tabs.length > 0) {
                const nextTab = this.tabs[tabIndex] || this.tabs[tabIndex - 1];
                this.switchTab(nextTab.id);
            } else {
                this.createTab();
            }
        }
        this.saveSession();
    }



    showError(message) {
        if (!this.errorModal || !this.errorMessage) return;
        this.errorMessage.textContent = message;
        this.errorModal.classList.remove('hidden');
    }

    hideError() {
        if (!this.errorModal) return;
        this.errorModal.classList.add('hidden');
    }

    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    // Tab Tooltip UI
    showTabTooltip(tab) {
        if (!this.tooltip.el) return;

        // Check the "Show Tab Data" setting
        const dataEnabled = this.perfToggles.showTabData && this.perfToggles.showTabData.checked;
        if (!dataEnabled) return;

        this.currentTooltipTabId = tab.id;
        this.updateTabTooltip();
        this.tooltip.el.classList.add('visible');

        if (this.tooltipUpdateInterval) clearInterval(this.tooltipUpdateInterval);
        this.tooltipUpdateInterval = setInterval(() => this.updateTabTooltip(), 1000);
    }

    hideTabTooltip() {
        if (!this.tooltip.el) return;
        this.currentTooltipTabId = null;
        this.tooltip.el.classList.remove('visible');
        if (this.tooltipUpdateInterval) {
            clearInterval(this.tooltipUpdateInterval);
            this.tooltipUpdateInterval = null;
        }
    }

    positionTabTooltip(e) {
        if (!this.tooltip.el) return;
        const x = e.clientX;
        // Y position is now locked via CSS 'top: 48px'

        // Keep tooltip inside window horizontally
        const rect = this.tooltip.el.getBoundingClientRect();
        let finalX = x - rect.width / 2;
        if (finalX < 10) finalX = 10;
        if (finalX + rect.width > window.innerWidth - 10) finalX = window.innerWidth - rect.width - 10;

        this.tooltip.el.style.left = `${finalX}px`;
    }

    updateTabTooltip() {
        if (this.currentTooltipTabId === null) return;
        const tab = this.tabs.find(t => t.id === this.currentTooltipTabId);
        if (!tab) return;

        // 1. Update Memory
        this.tooltip.memory.textContent = `${tab.memory} MB`;

        // 2. Update Sleep Timer
        const sleepEnabled = this.perfToggles.tabSleep && this.perfToggles.tabSleep.checked;
        const isNotActive = tab.id !== this.activeTabId;
        const isNotHome = tab.url !== 'browser://home';

        if (sleepEnabled && isNotActive && isNotHome && !tab.sleeping) {
            this.tooltip.sleepContainer.style.display = 'block';

            const val = parseInt(this.perfToggles.tabSleepTimer.value);
            const threshold = this.sleepThresholds[val] * 1000;
            const elapsed = Date.now() - tab.lastActive;
            const remainingMs = Math.max(0, threshold - elapsed);

            const remainingSec = Math.floor(remainingMs / 1000);
            const mins = Math.floor(remainingSec / 60);
            const secs = remainingSec % 60;
            this.tooltip.sleep.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            this.tooltip.sleepContainer.style.display = 'none';
        }
    }

    handleOmniboxSubmit() {
        const input = this.omnibox.value.trim();
        if (!input) return;
        this.navigate(input);
    }

    async ensureProxyReady() {
        if (window.ProxyService?.initialized && window.scramjet) {
            return true;
        }

        if (window.ProxyService?.ready) {
            try {
                await Promise.race([
                    window.ProxyService.ready,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Proxy initialization timeout')), 5000)
                    )
                ]);
            } catch (err) {
                console.error('[BROWSER] Proxy initialization failed:', err);
                alert('Proxy failed to initialize. Check the console for details.');
                return false;
            }
        }

        if (!window.ProxyService?.initialized || !window.scramjet) {
            console.error('[BROWSER] Proxy not ready after initialization attempt.');
            alert('Proxy is still loading or unavailable. Please refresh and try again.');
            return false;
        }

        return true;
    }

    async navigate(input) {
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab) tab.lastActive = Date.now();

        if (!window.ProxyService.initialized) {
            alert('Proxy is still loading...');
            return;
        }

        // Proactive connection recovery for proxied navigation
        if (input !== 'browser://home') {
            // CRITICAL: Re-initialize SW before navigation (it may have been terminated during idle)
            if (window.ProxyService.sendInitSignal) {
                try {
                    await window.ProxyService.sendInitSignal();
                } catch (e) {
                    console.warn('[BROWSER] SW init signal failed:', e);
                }
            }

            // Also verify/recover WebSocket connection
            if (window.ProxyService.ensureConnection) {
                try {
                    await window.ProxyService.ensureConnection();
                } catch (e) {
                    console.warn('[BROWSER] Connection recovery attempt failed:', e);
                    // Continue anyway - the navigation might still work
                }
            }
        }

        let url = input;
        if (url === 'browser://home') {
            // Already home
        } else if (!url.startsWith('http') && !url.includes('://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
            }
        }

        // DECODE BING TRACKING (if any)
        if (url.includes('/ck/a?') || url.includes('&u=')) {
            try {
                const u = new URL(url).searchParams.get('u');
                if (u && u.length > 2) {
                    const decoded = atob(u.substring(2).replace(/_/g, '/').replace(/-/g, '+'));
                    if (decoded.includes('http') || decoded.startsWith('/')) {
                        url = decoded.startsWith('http') ? decoded : 'https://' + decoded;
                    }
                }
            } catch (err) { }
        }

        // BLOCKING CHECK
        if (this.isUrlBlocked(url)) {
            // Cancel and redirect home
            this.navigate('browser://home');
            return;
        }

        if (!tab) return;

        tab.url = url;

        // UI Updates
        this.updateBookmarkButtonState();

        if (url === 'browser://home') {
            tab.title = 'New Tab';
            this.omnibox.value = '';
            this.omnibox.placeholder = 'Search or enter address';
        } else {
            try {
                tab.title = new URL(url).hostname || 'Browse';
            } catch (e) {
                tab.title = 'Browse';
            }
            this.omnibox.value = url;
            this.omnibox.placeholder = 'Search or enter address';
        }

        const tabTitleEl = tab.element.querySelector('.tab-title');
        if (tabTitleEl) tabTitleEl.textContent = tab.title;

        // Update Favicon
        this.fetchFavicon(tab, url);

        if (url === 'browser://home') {
            if (tab.iframe) tab.iframe.classList.remove('active');
            tab.homeElement.classList.remove('hidden');
            this.setLoading(false);
        } else {
            tab.homeElement.classList.add('hidden');
            this.setLoading(true);

            if (!tab.scramjetWrapper || !tab.iframe) {
                if (window.scramjet) {
                    tab.scramjetWrapper = window.scramjet.createFrame();

                    // [SECURITY] Intercept frame navigation
                    const originalGo = tab.scramjetWrapper.go.bind(tab.scramjetWrapper);
                    tab.scramjetWrapper.go = async (url) => {
                        if (this.isUrlBlocked(url)) {
                            console.warn('[BROWSER] 🛑 Blocked navigation prevented in wrapper:', url);
                            this.navigate('browser://home');
                            return;
                        }
                        return originalGo(url);
                    };
                    tab.iframe = tab.scramjetWrapper.frame;
                    tab.iframe.classList.add('browser-viewport');
                    tab.iframe.classList.add('active');
                    tab.iframe.style.border = 'none';
                    tab.iframe.width = '100%';
                    tab.iframe.style.position = 'absolute';

                    // FIX: "Sandbox Detected" & Permission Issues
                    this.guardIframeSandbox(tab);

                    this.viewportsContainer.appendChild(tab.iframe);

                    // Helper function to override window.open
                    const attachWindowOpenOverride = () => {
                        try {
                            const iframeWindow = tab.iframe.contentWindow;
                            if (!iframeWindow) return;

                            this.installContentIframeGuards(tab);

                            // SYNC URL BAR (Periodic poll)
                            if (!tab.__locationPollStarted) {
                                tab.__locationPollStarted = true;
                                // [PERFORMANCE] Changed from 1000ms to 3000ms - reduces CPU overhead
                                tab.__syncInterval = setInterval(() => this.syncTabWithIframe(tab), 3000);
                            }

                            if (!iframeWindow.__proxyTabsOverridden) {
                                // NAVIGATION INTERCEPTION
                                iframeWindow.document.addEventListener('click', (e) => {
                                    const link = e.target.closest('a');
                                    if (!link) return;

                                    let url = link.getAttribute('data-scramjet-url') || link.href;
                                    const target = link.getAttribute('target');

                                    // FIX TRUNCATED URLS (Bing Tracking Decoder)
                                    if (url.includes('/ck/a?') || url.includes('&u=')) {
                                        try {
                                            const urlObj = new URL(url);
                                            let u = urlObj.searchParams.get('u');
                                            if (u && u.length > 2) {
                                                // Bing prefix is usually 2 chars (like 'a1'). Strip BEFORE decoding.
                                                const base64 = u.substring(2).replace(/_/g, '/').replace(/-/g, '+');
                                                const decoded = atob(base64);

                                                // Basic sanity check: does it look like a URL or path?
                                                if (decoded.includes('http') || decoded.startsWith('/')) {
                                                    url = decoded.startsWith('http') ? decoded : 'https://' + decoded;
                                                    console.log('[BROWSER] 🎯 Decoded Bing result:', url);
                                                }
                                            }
                                        } catch (err) {
                                            console.warn('[BROWSER] Bing decode failed:', err);
                                        }
                                    }

                                    // [SECURITY] Pre-emptive block on click
                                    if (this.isUrlBlocked(url)) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.warn('[BROWSER] 🛑 Blocked link click intercepted:', url);
                                        this.navigate('browser://home');
                                        return false;
                                    }

                                    // PREVENT ESCAPES
                                    const isNewTab = target === '_blank' || target === '_top' || target === '_parent';
                                    const isSpecialClick = e.ctrlKey || e.metaKey || e.button === 1;

                                    if (isNewTab || isSpecialClick) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.createTab(url);
                                        return false;
                                    }
                                }, { capture: true });

                                // window.open override
                                iframeWindow.__originalOpen = iframeWindow.open;
                                iframeWindow.open = (url, target) => {
                                    this.createTab(url);
                                    return { focus: () => { }, blur: () => { }, close: () => { }, closed: false, location: { href: url } };
                                };

                                iframeWindow.__proxyTabsOverridden = true;
                                console.log('[BROWSER] ✅ Navigation overrides active');
                            }
                        } catch (e) {
                            // Cross-origin or security errors
                        }
                    };

                    // Attach overrides on load and periodically
                    tab.iframe.addEventListener('load', () => {
                        if (this.activeTabId === tab.id) this.setLoading(false);
                        tab.iframe.style.opacity = '1';
                        this.installContentIframeGuards(tab);
                        attachWindowOpenOverride();
                    });
                    // [PERFORMANCE] Reduced from 1000ms to 5000ms - less frequent checks
                    tab.__overrideInterval = setInterval(attachWindowOpenOverride, 5000);

                } else {
                    console.error('Scramjet unavailable');
                    this.setLoading(false);
                    return;
                }
            }

            tab.iframe.classList.add('active');

            // [UX] Hide content immediately to prevent flash of old page
            tab.iframe.style.opacity = '0';

            if (tab.scramjetWrapper) {
                try {
                    await tab.scramjetWrapper.go(url);
                    // [PERFORMANCE] Defer favicon fetch to not block navigation
                    setTimeout(() => this.fetchFavicon(tab, url), 100);
                } catch (e) {
                    console.error("Navigation failed", e);
                    this.setLoading(false);
                    tab.iframe.style.opacity = '1';
                }
            }
        }
        this.saveSession();
    }

    getFaviconUrl(url) {
        if (!url || url === 'browser://home') return '';
        try {
            const hostname = new URL(url).hostname;
            if (hostname) {
                return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
            }
        } catch (e) {
            if (url.includes('.') && !url.includes(' ')) {
                return `https://www.google.com/s2/favicons?domain=${url}&sz=32`;
            }
        }
        return '';
    }

    updateFavicon(tab, src) {
        tab.favicon = src;
        const iconEl = tab.element.querySelector('.tab-favicon');
        if (!iconEl) return;

        if (!src || src === '' || tab.url === 'browser://home') {
            iconEl.style.display = 'none';
            return;
        }

        if (!src || src === '' || tab.url === 'browser://home') {
            iconEl.style.display = 'none';
            return;
        }

        const fallback = new URL('assets/logo.png', window.APP_BASE_URL).href;
        iconEl.style.display = 'block';
        iconEl.src = src;
        iconEl.classList.remove('use-filter');
        iconEl.onerror = () => {
            iconEl.src = fallback;
            iconEl.classList.add('use-filter');
        };
    }

    async fetchFavicon(tab, url) {
        const faviconUrl = this.getFaviconUrl(url);
        this.updateFavicon(tab, faviconUrl);
    }

    syncTabWithIframe(tab) {
        if (!tab || !tab.iframe || !tab.iframe.contentWindow) return;
        try {
            if (this.activeTabId !== tab.id) return;

            // If we are on the home page and not currently transitioning out of it, skip sync
            if (tab.url === 'browser://home' && tab.homeElement && !tab.homeElement.classList.contains('hidden')) return;

            const iframeWindow = tab.iframe.contentWindow;
            const rawUrl = iframeWindow.location.href;

            // Scramjet URLs look like domain.com/service/https://target.com
            if (rawUrl.includes('/service/')) {
                const realUrl = decodeURIComponent(rawUrl.split('/service/')[1]);
                if (realUrl && realUrl !== tab.url && !realUrl.endsWith('...')) {

                    // [SECURITY] Check if redirected to blocked site
                    if (this.isUrlBlocked(realUrl)) {
                        console.warn('[BROWSER] 🛡️ Blocked site detected in iframe:', realUrl);
                        this.navigate('browser://home');
                        return;
                    }

                    console.log('[BROWSER] 🔄 Syncing UI to iframe location:', realUrl);
                    tab.url = realUrl;
                    this.omnibox.value = realUrl;
                    this.updateBookmarkButtonState();
                    this.fetchFavicon(tab, realUrl);

                    // Update tab title
                    try {
                        const hostname = new URL(realUrl).hostname;
                        tab.title = hostname || 'Browse';
                        if (tab.element) {
                            tab.element.querySelector('.tab-title').textContent = tab.title;
                        }
                    } catch (e) { }
                }
            }
        } catch (err) {
            // Usually cross-origin safety errors, can ignore
        }
    }

    // Disguise Methods
    applyDisguise() {
        const selected = this.disguiseSelect.value;
        const disguise = this.disguises[selected];

        if (disguise) {
            this.setDisguise(disguise.title, disguise.favicon);
            localStorage.setItem('tab_disguise', selected);
            console.log('[BROWSER] Applied disguise:', selected);
        }
    }

    resetDisguise() {
        const defaultDisguise = this.disguises['default'];
        this.setDisguise(defaultDisguise.title, defaultDisguise.favicon);
        localStorage.setItem('tab_disguise', 'default');
        if (this.disguiseSelect) this.disguiseSelect.value = 'default';
        console.log('[BROWSER] Reset to default disguise');
    }

    loadDisguise() {
        const saved = localStorage.getItem('tab_disguise') || 'default';
        const disguise = this.disguises[saved];

        if (disguise) {
            this.setDisguise(disguise.title, disguise.favicon);
        }
    }

    setDisguise(title, favicon) {
        document.title = title;
        this.updateFaviconLink(favicon);

        // Sync with parent for about:blank cloak
        if (window.self !== window.top) {
            try {
                window.top.document.title = title;
                let topLink = window.top.document.querySelector("link[rel~='icon']");
                if (!topLink) {
                    topLink = window.top.document.createElement('link');
                    topLink.rel = 'icon';
                    window.top.document.head.appendChild(topLink);
                }
                topLink.href = favicon;
            } catch (e) {
                // Cross-origin restriction, ignore
            }
        }
    }

    updateFaviconLink(href) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = href;
    }

    // Panic Button Methods
    savePanicSettings() {
        if (!this.panicEnabledToggle || !this.panicEnabledToggle.checked) {
            localStorage.setItem('panic_enabled', 'false');
            console.log('[PANIC] Panic button disabled');
            return;
        }

        const key = this.panicKeyInput.value.trim();
        let url = this.panicUrlInput.value.trim();

        if (!key) {
            alert('Panic button is enabled but no key is set. Page will not redirect unless a key is assigned.');
            return;
        }

        if (!url) {
            alert('Panic button is enabled but no redirect URL is set.');
            return;
        }

        // Add https protocol if missing
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            this.panicUrlInput.value = url;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            alert('Please enter a valid URL for the panic redirect.');
            return;
        }

        localStorage.setItem('panic_enabled', 'true');
        localStorage.setItem('panic_key', key);
        localStorage.setItem('panic_url', url);
        console.log(`[PANIC] Saved panic button: Key="${key}", URL="${url}"`);
    }

    loadPanicSettings() {
        const enabled = localStorage.getItem('panic_enabled') === 'true';
        const key = localStorage.getItem('panic_key') || '';
        const url = localStorage.getItem('panic_url') || '';

        if (this.panicEnabledToggle) this.panicEnabledToggle.checked = enabled;
        if (this.panicKeyInput) this.panicKeyInput.value = key;
        if (this.panicUrlInput) this.panicUrlInput.value = url;
    }

    handlePanicKey(e) {
        const isEnabled = localStorage.getItem('panic_enabled') === 'true';
        if (!isEnabled) return;

        const panicKey = localStorage.getItem('panic_key');
        const panicUrl = localStorage.getItem('panic_url');

        if (e.key === panicKey && panicUrl) {
            e.preventDefault();
            console.log('[PANIC] 🚨 Panic button triggered! Redirect to:', panicUrl);
            this.suppressUnloadPrompt = true;
            if (this.beforeUnloadHandler) {
                window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            }
            window.top.location.replace(panicUrl);
        }
    }

    // Bookmarks logic
    loadBookmarks() {
        try {
            this.bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            this.renderBookmarks();
        } catch (e) {
            console.error('[BROWSER] Failed to load bookmarks:', e);
            this.bookmarks = [];
        }
    }

    handleBookmarkClick() {
        const tab = this.getActiveTab();
        if (!tab) return;

        if (tab.url === 'browser://home') {
            this.showError('You must be on a site to bookmark.');
            return;
        }

        const isBookmarked = this.bookmarks.some(b => b.url === tab.url);
        if (isBookmarked) {
            this.removeBookmark(tab.url);
        } else {
            this.addBookmark(tab.url, tab.title);
        }
    }

    addBookmark(url, title) {
        if (this.bookmarks.some(b => b.url === url)) return;

        this.bookmarks.push({ url, title });
        this.saveBookmarks();
        this.renderBookmarks();
        this.updateBookmarkButtonState();
    }

    removeBookmark(url) {
        this.bookmarks = this.bookmarks.filter(b => b.url !== url);
        this.saveBookmarks();
        this.renderBookmarks();
        this.updateBookmarkButtonState();
    }

    saveBookmarks() {
        localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
    }

    renderBookmarks() {
        if (!this.bookmarksBar) return;

        // Toggle visibility: hide if no bookmarks
        this.bookmarksBar.classList.toggle('hidden', this.bookmarks.length === 0);

        this.bookmarksBar.innerHTML = '';
        this.bookmarks.forEach(bookmark => {
            const el = document.createElement('div');
            el.className = 'bookmark-item';

            const faviconUrl = this.getFaviconUrl(bookmark.url);
            const fallback = new URL('assets/logo.png', window.APP_BASE_URL).href;

            el.innerHTML = `
                <img src="${faviconUrl || fallback}" class="bookmark-icon ${!faviconUrl ? 'use-filter' : ''}" onerror="this.src='${fallback}';this.classList.add('use-filter')">
                <span class="bookmark-title">${this.sanitizeHTML(bookmark.title)}</span>
                <div class="remove-btn" title="Remove Bookmark">✕</div>
            `;

            el.addEventListener('click', (e) => {
                if (e.target.closest('.remove-btn')) {
                    e.stopPropagation();
                    this.removeBookmark(bookmark.url);
                } else {
                    this.navigate(bookmark.url);
                }
            });

            this.bookmarksBar.appendChild(el);
        });
    }

    updateBookmarkButtonState() {
        if (!this.bookmarkBtn) return;
        const tab = this.getActiveTab();
        if (!tab || tab.url === 'browser://home') {
            this.bookmarkBtn.classList.remove('active');
            const svg = this.bookmarkBtn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'none');
            return;
        }

        const isBookmarked = this.bookmarks.some(b => b.url === tab.url);
        if (isBookmarked) {
            this.bookmarkBtn.classList.add('active');
            const svg = this.bookmarkBtn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'currentColor');
        } else {
            this.bookmarkBtn.classList.remove('active');
            const svg = this.bookmarkBtn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'none');
        }
    }
}

// Start
window.app = new Browser();
