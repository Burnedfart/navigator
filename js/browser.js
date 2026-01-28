/**
 * Browser Controller
 * Manages tabs, UI state, and navigation.
 */

class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.maxTabs = 10;

        // DOM Elements
        this.tabsContainer = document.getElementById('tabs-container');
        this.viewportsContainer = document.getElementById('viewports-container');
        this.omnibox = document.getElementById('omnibox-input');
        this.newTabBtn = document.getElementById('new-tab-btn');
        this.proxyStatus = document.getElementById('proxy-status');

        this.navBtns = {
            back: document.getElementById('nav-back'),
            forward: document.getElementById('nav-forward'),
            refresh: document.getElementById('nav-refresh'),
            home: document.getElementById('nav-home'),
        };

        this.init();
    }

    async init() {
        this.bindEvents();
        this.updateProxyStatus('loading');

        // Create initial tab (Home)
        this.createTab();

        try {
            await window.ProxyService.ready;
            this.updateProxyStatus('connected');
        } catch (e) {
            this.updateProxyStatus('error');
            alert('Proxy initialization failed. Please reload.');
        }
    }

    bindEvents() {
        this.newTabBtn.addEventListener('click', () => this.createTab());

        this.omnibox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleOmniboxSubmit();
            }
        });

        this.navBtns.back.addEventListener('click', () => {
            const tab = this.getActiveTab();
            if (tab && tab.iframe && tab.iframe.contentWindow) {
                tab.iframe.contentWindow.history.back();
            }
        });

        this.navBtns.forward.addEventListener('click', () => {
            const tab = this.getActiveTab();
            if (tab && tab.iframe && tab.iframe.contentWindow) {
                tab.iframe.contentWindow.history.forward();
            }
        });

        this.navBtns.refresh.addEventListener('click', () => {
            const tab = this.getActiveTab();
            if (tab) {
                if (tab.url === 'browser://home') {
                    // Re-render home
                } else if (tab.iframe) {
                    tab.iframe.contentWindow.location.reload();
                }
            }
        });

        this.navBtns.home.addEventListener('click', () => {
            this.navigate('browser://home');
        });
    }

    updateProxyStatus(status) {
        this.proxyStatus.className = `status-indicator ${status}`;
        this.proxyStatus.title = `Proxy Status: ${status}`;
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
            scramjetWrapper: null, // Scramjet frame controller
            homeElement: null
        };

        // Create Tab UI
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.dataset.id = id;
        tabEl.innerHTML = `
            <div class="tab-favicon"></div>
            <div class="tab-title">New Tab</div>
            <div class="tab-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>
        `;

        tabEl.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close')) {
                this.switchTab(id);
            }
        });

        tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(id);
        });

        // Insert before the new tab button which is now inside the container
        this.tabsContainer.insertBefore(tabEl, this.newTabBtn);
        tab.element = tabEl;

        // Create initial viewport containers
        // We defer scramjet frame creation until navigation to a real URL
        this.createViewport(tab);

        this.tabs.push(tab);
        this.switchTab(id);

        if (url !== 'browser://home') {
            this.navigate(url);
        }
    }

    createViewport(tab) {
        // Home Page Element
        const homeEl = document.createElement('div');
        homeEl.className = 'home-page hidden';
        homeEl.innerHTML = `
            <div class="home-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
            </div>
            <div class="home-grid">
                <div class="grid-item" onclick="app.navigate('https://google.com')">
                    <div class="item-icon">G</div>
                    <div class="item-title">Google</div>
                </div>
                <div class="grid-item" onclick="app.navigate('https://discord.com')">
                    <div class="item-icon">D</div>
                    <div class="item-title">Discord</div>
                </div>
                <div class="grid-item" onclick="app.navigate('https://youtube.com')">
                    <div class="item-icon">Y</div>
                    <div class="item-title">YouTube</div>
                </div>
                <div class="grid-item" onclick="app.navigate('https://github.com')">
                    <div class="item-icon">gh</div>
                    <div class="item-title">GitHub</div>
                </div>
            </div>
        `;
        this.viewportsContainer.appendChild(homeEl);
        tab.homeElement = homeEl;
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
            this.activeTabId = id;

            if (newTab.url === 'browser://home') {
                newTab.homeElement.classList.remove('hidden');
                if (newTab.iframe) newTab.iframe.classList.remove('active');
                this.omnibox.value = '';
                this.omnibox.placeholder = 'Search or enter address';
            } else {
                if (newTab.homeElement) newTab.homeElement.classList.add('hidden');
                if (newTab.iframe) newTab.iframe.classList.add('active');
                this.omnibox.value = newTab.url;
            }
        }
    }

    closeTab(id) {
        const tabIndex = this.tabs.findIndex(t => t.id === id);
        if (tabIndex === -1) return;

        const tab = this.tabs[tabIndex];

        // Remove Elements
        tab.element.remove();
        if (tab.iframe) tab.iframe.remove();
        if (tab.homeElement) tab.homeElement.remove();

        this.tabs.splice(tabIndex, 1);

        // Switch to neighbor if active
        if (this.activeTabId === id) {
            if (this.tabs.length > 0) {
                // Try right, then left
                const nextTab = this.tabs[tabIndex] || this.tabs[tabIndex - 1];
                this.switchTab(nextTab.id);
            } else {
                // Create new generic tab if all closed
                this.createTab();
            }
        }
    }

    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    handleOmniboxSubmit() {
        const input = this.omnibox.value.trim();
        if (!input) return;
        this.navigate(input);
    }

    navigate(input) {
        if (!window.ProxyService.initialized) {
            alert('Proxy is still loading...');
            return;
        }

        let url = input;
        if (input === 'browser://home') {
            url = input;
        } else if (!input.startsWith('http')) {
            if (input.includes('.') && !input.includes(' ')) {
                url = 'https://' + input;
            } else {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(input);
            }
        }

        const tab = this.getActiveTab();
        if (!tab) return;

        tab.url = url;

        // UI Updates
        tab.title = new URL(url).hostname || 'Browse';
        tab.element.querySelector('.tab-title').textContent = tab.title;
        this.omnibox.value = url;

        if (url === 'browser://home') {
            if (tab.iframe) tab.iframe.classList.remove('active');
            tab.homeElement.classList.remove('hidden');
        } else {
            tab.homeElement.classList.add('hidden');

            // Create Scramjet Frame if not exists
            if (!tab.scramjetWrapper || !tab.iframe) {
                if (window.scramjet) {
                    console.log('Creates scramjet frame for tab', tab.id);
                    tab.scramjetWrapper = window.scramjet.createFrame();
                    tab.iframe = tab.scramjetWrapper.frame;
                    tab.iframe.classList.add('browser-viewport');
                    tab.iframe.classList.add('active'); // Since we are navigating

                    // Style connection
                    tab.iframe.style.border = 'none';
                    tab.iframe.width = '100%';
                    tab.iframe.style.position = 'absolute';

                    this.viewportsContainer.appendChild(tab.iframe);
                } else {
                    console.error('Scramjet unavailable');
                    return;
                }
            }

            tab.iframe.classList.add('active');

            // Perform Navigation via Scramjet Wrapper
            if (tab.scramjetWrapper) {
                tab.scramjetWrapper.go(url);
            }
        }
    }
}

// Start
window.app = new Browser();
