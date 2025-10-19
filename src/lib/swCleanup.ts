/**
 * Service Worker Cleanup Hotfix
 * 
 * One-time cleanup to clear stale service workers and caches.
 * Auto-disables after 7 days from deployment.
 * 
 * Controlled via VITE_SW_HOTFIX_ENABLED (default: true)
 * Deployment date: 2025-10-13
 */

const HOTFIX_DEPLOYMENT_DATE = new Date('2025-10-13T00:00:00Z');
const HOTFIX_TTL_DAYS = 7;

export async function runSwCleanup(): Promise<void> {
  // Skip in dev mode
  if (import.meta.env.DEV) {
    return;
  }

  // Check if hotfix is enabled (default: true)
  const hotfixEnabled = import.meta.env.VITE_SW_HOTFIX_ENABLED !== 'false';
  
  if (!hotfixEnabled) {
    return;
  }

  // Auto-disable after 7 days
  const now = new Date();
  const daysSinceDeployment = (now.getTime() - HOTFIX_DEPLOYMENT_DATE.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceDeployment > HOTFIX_TTL_DAYS) {
    console.log('[SW Cleanup] Hotfix expired, skipping cleanup');
    return;
  }

  // Check if cleanup already ran (stored in localStorage)
  const cleanupKey = 'sw_cleanup_2025-10-13';
  if (localStorage.getItem(cleanupKey) === 'done') {
    return;
  }

  console.log('[SW Cleanup] Running one-time service worker cleanup...');

  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log(`[SW Cleanup] Unregistered ${registrations.length} service worker(s)`);
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`[SW Cleanup] Cleared ${cacheNames.length} cache(s)`);
    }

    // Mark cleanup as done
    localStorage.setItem(cleanupKey, 'done');
    console.log('[SW Cleanup] Cleanup complete, page will reload');

    // Reload to get fresh assets
    window.location.reload();
  } catch (error) {
    console.warn('[SW Cleanup] Cleanup failed (non-critical):', error);
    // Mark as done anyway to prevent retry loops
    localStorage.setItem(cleanupKey, 'done');
  }
}

