/**
 * Storage Health Check and Recovery
 * Validates IndexedDB schema BEFORE initialization to prevent deadlocks
 */

window.StorageHealth = {
    /**
     * Check if IndexedDB is accessible and functional
     */
    async isIndexedDBAvailable() {
        try {
            if (!window.indexedDB) return false;

            const testDB = indexedDB.open('__test__', 1);
            return await new Promise((resolve) => {
                testDB.onsuccess = () => {
                    testDB.result.close();
                    indexedDB.deleteDatabase('__test__');
                    resolve(true);
                };
                testDB.onerror = () => resolve(false);
                testDB.onblocked = () => resolve(false);
                setTimeout(() => resolve(false), 1000);
            });
        } catch (e) {
            return false;
        }
    },

    /**
     * Validate Scramjet database schema
     * Returns: { valid: boolean, missing: string[], exists: boolean }
     */
    async validateScramjetDB() {
        const requiredStores = ['config', 'cookies', 'publicSuffixList', 'redirectTrackers', 'referrerPolicies'];

        // [PROACTIVE] Check if database even exists before opening it to avoid creating an empty one
        if (typeof indexedDB.databases === 'function') {
            try {
                const dbs = await indexedDB.databases();
                const exists = dbs.some(db => db.name === '$scramjet');
                if (!exists) {
                    return { valid: true, exists: false, missing: [], stores: 0 };
                }
            } catch (e) {
                console.warn('⚠️ [STORAGE] Databases check failed, falling back to open check');
            }
        }

        return new Promise((resolve) => {
            try {
                const openReq = indexedDB.open('$scramjet');

                openReq.onsuccess = (event) => {
                    const db = event.target.result;
                    const existingStores = Array.from(db.objectStoreNames);
                    const missingStores = requiredStores.filter(store => !existingStores.includes(store));

                    db.close();

                    // It's valid if all stores exist, OR if it's completely empty (new/cleared)
                    const isValid = missingStores.length === 0 || existingStores.length === 0;

                    resolve({
                        valid: isValid,
                        missing: missingStores,
                        exists: true,
                        stores: existingStores.length
                    });
                };

                openReq.onupgradeneeded = (event) => {
                    // Database was missing - DO NOT just close it (it leaves an empty file)
                    // We must delete it immediately so Scramjet can create its own version
                    const db = event.target.result;
                    db.close();
                    indexedDB.deleteDatabase('$scramjet');

                    resolve({
                        valid: true,
                        missing: [],
                        exists: false,
                        stores: 0
                    });
                };

                openReq.onerror = () => {
                    resolve({
                        valid: false,
                        missing: requiredStores,
                        exists: false,
                        error: 'Failed to open database'
                    });
                };

                openReq.onblocked = () => {
                    resolve({
                        valid: false,
                        missing: requiredStores,
                        exists: true,
                        blocked: true
                    });
                };

                // Timeout protection
                setTimeout(() => {
                    resolve({
                        valid: false,
                        missing: requiredStores,
                        exists: false,
                        timeout: true
                    });
                }, 2000);

            } catch (e) {
                resolve({
                    valid: false,
                    missing: requiredStores,
                    exists: false,
                    error: e.message
                });
            }
        });
    },

    /**
     * Delete Scramjet database with forced cleanup
     */
    async deleteScramjetDB() {
        console.log('🗑️ [STORAGE] Preparing for database deletion...');

        // Signal SW to close DB handles
        await this.invalidateServiceWorkerConfig();

        // CRITICAL: Unregister SWs first, as they often hold the DB connection open
        await this.unregisterServiceWorkers();

        console.log('🗑️ [STORAGE] Deleting $scramjet database...');

        return new Promise((resolve) => {
            try {
                const deleteReq = indexedDB.deleteDatabase('$scramjet');

                deleteReq.onsuccess = () => {
                    console.log('✅ [STORAGE] Database deleted successfully');
                    resolve(true);
                };

                deleteReq.onerror = (event) => {
                    console.error('❌ [STORAGE] Delete failed:', event);
                    resolve(false);
                };

                deleteReq.onblocked = () => {
                    console.warn('⚠️ [STORAGE] Delete blocked - connections still open in other tabs');
                    // We already tried unregistering SW, so this is likely another tab
                    resolve(false);
                };

                // Timeout
                setTimeout(() => {
                    console.warn('⚠️ [STORAGE] Delete timeout');
                    resolve(false);
                }, 4000);

            } catch (e) {
                console.error('❌ [STORAGE] Delete exception:', e);
                resolve(false);
            }
        });
    },

    /**
     * Clear all Service Worker caches
     */
    async clearCaches() {
        if (!('caches' in window)) return;

        try {
            const cacheNames = await caches.keys();
            console.log(`🗑️ [STORAGE] Clearing ${cacheNames.length} caches...`);

            await Promise.all(
                cacheNames.map(name => caches.delete(name))
            );

            console.log('✅ [STORAGE] Caches cleared');
        } catch (e) {
            console.warn('⚠️ [STORAGE] Cache clear failed:', e);
        }
    },

    /**
     * Unregister all Service Workers
     */
    async unregisterServiceWorkers() {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`🗑️ [STORAGE] Unregistering ${registrations.length} service workers...`);

            await Promise.all(
                registrations.map(reg => reg.unregister())
            );

            console.log('✅ [STORAGE] Service workers unregistered');

            await new Promise(r => setTimeout(r, 300));
        } catch (e) {
            console.warn('⚠️ [STORAGE] SW unregister failed:', e);
        }
    },

    /**
     * Signal Service Worker to invalidate config and close DB handles
     */
    async invalidateServiceWorkerConfig() {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

        try {
            navigator.serviceWorker.controller.postMessage({ type: 'invalidate_config' });
            // Give it a moment to process
            await new Promise(r => setTimeout(r, 100));
        } catch (e) {
            console.warn('⚠️ [STORAGE] SW invalidate failed:', e);
        }
    },

    async performFullReset() {
        console.log('🔄 [STORAGE] Starting full storage reset...');

        await this.clearCaches();
        await this.unregisterServiceWorkers();
        await this.deleteScramjetDB();

        try {
            sessionStorage.removeItem('coi_reloaded');
            localStorage.removeItem('proxy_init_failed');
        } catch (e) { }

        console.log('✅ [STORAGE] Full reset complete');
    },

    async performHealthCheck() {
        console.log('🔍 [STORAGE] Running pre-flight health check...');

        const issues = [];
        let autoFixed = false;
        let needsReload = false;

        const idbAvailable = await this.isIndexedDBAvailable();
        if (!idbAvailable) {
            issues.push('IndexedDB not available or blocked');
            return { healthy: false, issues, autoFixed: false, needsReload: false };
        }

        const dbStatus = await this.validateScramjetDB();

        if (!dbStatus.valid) {
            if (dbStatus.blocked) {
                issues.push('Database blocked - connections still open');
                console.warn('⚠️ [STORAGE] Database is blocked, attempting cleanup...');
                await this.deleteScramjetDB();
                autoFixed = true;
                needsReload = true;
            } else if (dbStatus.missing.length > 0) {
                issues.push(`Missing object stores: ${dbStatus.missing.join(', ')}`);
                console.warn('⚠️ [STORAGE] Invalid schema, deleting corrupt database...');
                await this.deleteScramjetDB();
                autoFixed = true;
                needsReload = true;
            } else if (dbStatus.timeout) {
                issues.push('Database check timeout');
                await this.deleteScramjetDB();
                autoFixed = true;
                needsReload = true;
            }
        }

        const healthy = issues.length === 0 || autoFixed;

        if (healthy && autoFixed) {
            console.log('✅ [STORAGE] Issues auto-fixed');
        } else if (healthy) {
            console.log('✅ [STORAGE] Health check passed');
        } else {
            console.error('❌ [STORAGE] Health check failed:', issues);
        }

        return { healthy, issues, autoFixed, needsReload };
    }
};

console.log('✅ [STORAGE] Storage health module loaded');
