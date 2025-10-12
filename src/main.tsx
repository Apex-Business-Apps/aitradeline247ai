// ===================================================================
// EMERGENCY MOUNTING SYSTEM - Ensures React ALWAYS mounts
// ===================================================================
(async function emergencyMount() {
  console.log('🚨 EMERGENCY MOUNT: Starting main.tsx execution...');

  // Wrap ALL imports in try-catch to prevent silent failures
  let App: any;
  let SafeErrorBoundary: any;
  let isSafeMode = false;
  let React: any;
  let createRoot: any;

  try {
    // CRITICAL: Import React and ReactDOM first
    React = await import("react");
    const ReactDOM = await import("react-dom/client");
    createRoot = ReactDOM.createRoot;
    console.log('✅ React DOM loaded');
    
    // Import App - this is the only critical import
    const AppModule = await import("./App.tsx");
    App = AppModule.default;
    console.log('✅ App component loaded');
    
    // Try to import error boundary, but fallback if it fails
    try {
      const SafeModule = await import("./components/errors/SafeErrorBoundary");
      SafeErrorBoundary = SafeModule.default;
      console.log('✅ SafeErrorBoundary loaded');
    } catch (e) {
      console.warn('⚠️ SafeErrorBoundary failed, using fallback');
      // Fallback: simple error boundary
      SafeErrorBoundary = ({ children }: any) => children;
    }
    
    // Import safe mode check
    try {
      const safeModeModule = await import("./safe-mode");
      isSafeMode = safeModeModule.isSafeMode;
    } catch (e) {
      console.warn('⚠️ Safe mode check failed');
    }
    
    // Import critical styles (non-blocking)
    try {
      await import("./index.css");
      console.log('✅ Styles loaded');
    } catch (e) {
      console.warn('⚠️ CSS import failed:', e);
    }
    
    // Import additional styles (non-blocking, can fail)
    Promise.all([
      import("./styles/roi-table.css").catch(() => console.warn('⚠️ roi-table.css failed')),
      import("./styles/header-align.css").catch(() => console.warn('⚠️ header-align.css failed')),
      import("./i18n/config").catch(() => console.warn('⚠️ i18n config failed'))
    ]);
    
    // CRITICAL: Mount React immediately - don't wait for anything else
    console.log('🚀 MOUNTING REACT NOW...');
    const root = document.getElementById("root");
    if (!root) {
      throw new Error('Root element not found!');
    }
    
    createRoot(root).render(
      React.createElement(SafeErrorBoundary, null,
        React.createElement(App)
      )
    );
    
    console.log('✅ REACT MOUNTED SUCCESSFULLY');
    
    // Load monitoring scripts AFTER React mounts (non-blocking)
    setTimeout(() => {
      if (!isSafeMode) {
        Promise.all([
          import("./lib/roiTableFix").then(m => m.watchRoiTableCanon()).catch(e => console.warn('⚠️ ROI watcher failed:', e)),
          import("./lib/pwaInstall").then(m => m.initPWAInstall()).catch(e => console.warn('⚠️ PWA install failed:', e)),
          import("./lib/heroGuardian").then(m => {
            window.addEventListener('load', () => {
              setTimeout(() => m.initHeroGuardian(), 1500);
            });
          }).catch(e => console.warn('⚠️ Hero guardian failed:', e))
        ]);
      }
    }, 100);
    
  } catch (error) {
    // CATASTROPHIC FAILURE: React couldn't mount
    console.error('🚨 CRITICAL ERROR: React failed to mount:', error);
    
    // Emergency fallback UI
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: system-ui, sans-serif;">
          <div style="max-width: 600px; text-align: center;">
            <h1 style="color: #dc2626; font-size: 2rem; margin-bottom: 1rem;">
              ⚠️ Loading Error
            </h1>
            <p style="color: #4b5563; margin-bottom: 2rem;">
              The application failed to start. This is usually a temporary issue.
            </p>
            <button onclick="window.location.reload()" style="background: #ff6b35; color: white; padding: 0.75rem 2rem; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer;">
              Reload Page
            </button>
            <details style="margin-top: 2rem; text-align: left; background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">
              <summary style="cursor: pointer; font-weight: 600; color: #374151;">Technical Details</summary>
              <pre style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280; white-space: pre-wrap; word-break: break-word;">${error}</pre>
            </details>
          </div>
        </div>
      `;
    }
  }
})();
