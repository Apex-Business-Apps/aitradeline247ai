/**
 * Preview Unblanker - Emergency Blank Screen Fix
 * 
 * Detects and fixes blank screen issues in preview environment
 * Runs early in the app lifecycle to prevent render blocking
 */

export interface UnblankerReport {
  triggered: boolean;
  fixes: string[];
  timestamp: string;
}

export function initPreviewUnblanker(): UnblankerReport {
  const report: UnblankerReport = {
    triggered: false,
    fixes: [],
    timestamp: new Date().toISOString()
  };

  if (typeof window === 'undefined') return report;

  const isPreview = window.location.hostname.includes('lovable');
  if (!isPreview) return report;

  console.log('🔍 Preview Unblanker: Checking for blank screen issues...');

  // Fix 1: Ensure root element is visible
  const root = document.getElementById('root');
  if (root) {
    const computedStyle = window.getComputedStyle(root);
    if (computedStyle.opacity === '0' || computedStyle.visibility === 'hidden') {
      root.style.opacity = '1';
      root.style.visibility = 'visible';
      report.triggered = true;
      report.fixes.push('root_visibility');
      console.log('✅ Fixed: root element visibility');
    }

    // CRITICAL FIX: Don't report empty root immediately - React needs time to mount
    // Only warn if root is STILL empty after a delay
    if (root.children.length === 0) {
      setTimeout(() => {
        if (root.children.length === 0) {
          console.error('❌ Root element is empty after 1s - React may have failed to mount');
          report.triggered = true;
          report.fixes.push('empty_root_delayed');
        } else {
          console.log('✅ Root element populated successfully');
        }
      }, 1000);
    } else {
      console.log('✅ Root element has content');
    }

    // Fix height issues
    const rootHeight = root.getBoundingClientRect().height;
    if (rootHeight < 100) {
      root.style.minHeight = '100vh';
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
      report.triggered = true;
      report.fixes.push('root_height');
      console.log('✅ Fixed: root element height');
    }
  }

  // Fix 2: Check for CSS loading failures
  const stylesheets = document.styleSheets;
  if (stylesheets.length === 0) {
    report.triggered = true;
    report.fixes.push('no_stylesheets');
    console.error('❌ No stylesheets loaded - CSS may have failed');
  }

  // Fix 3: Ensure body has proper styles
  if (document.body) {
    document.body.style.minHeight = '100vh';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
  }

  // Fix 4: Check for JavaScript errors that might have prevented render
  const hasErrors = (window as any).__RENDER_ERROR__;
  if (hasErrors) {
    report.triggered = true;
    report.fixes.push('render_error_detected');
    console.error('❌ Render error detected:', hasErrors);
  }

  // Fix 5: Force repaint if needed
  if (report.triggered) {
    setTimeout(() => {
      document.body.style.display = 'none';
      void document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
      console.log('🔄 Forced browser repaint');
    }, 50);
  }

  if (report.triggered) {
    console.log('🚨 Preview Unblanker Report:', report);
  } else {
    console.log('✅ Preview Unblanker: No issues detected');
  }

  return report;
}

/**
 * Monitor for blank screens after initial load
 */
export function monitorBlankScreen(): void {
  // Completely disabled - no monitoring
  return;
}

// Monitoring completely disabled - no auto-initialization
if (typeof window !== 'undefined' && window.location.hostname.includes('lovable')) {
  console.log('[PreviewUnblanker] Monitoring disabled');
}
