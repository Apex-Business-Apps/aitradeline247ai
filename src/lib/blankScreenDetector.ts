/**
 * Blank Screen Detector & Auto-Recovery
 * Monitors app rendering and attempts automatic recovery
 */

export interface BlankScreenReport {
  isBlank: boolean;
  issues: string[];
  recovery: string[];
  timestamp: string;
}

export function detectBlankScreen(): BlankScreenReport {
  const report: BlankScreenReport = {
    isBlank: false,
    issues: [],
    recovery: [],
    timestamp: new Date().toISOString()
  };

  if (typeof window === 'undefined') return report;

  // Check 1: Root element exists and has content
  const root = document.getElementById('root');
  if (!root) {
    report.isBlank = true;
    report.issues.push('root_missing');
    return report;
  }

  if (root.children.length === 0) {
    report.isBlank = true;
    report.issues.push('root_empty');
  }

  // Check 2: Main content exists
  const main = document.getElementById('main');
  if (!main) {
    report.isBlank = true;
    report.issues.push('main_missing');
  }

  // Check 3: Visible height
  const rootHeight = root.getBoundingClientRect().height;
  if (rootHeight < 100) {
    report.isBlank = true;
    report.issues.push('root_zero_height');
  }

  // Check 4: CSS loaded
  const computedStyle = window.getComputedStyle(document.body);
  if (!computedStyle.fontFamily || computedStyle.fontFamily === '') {
    report.isBlank = true;
    report.issues.push('css_not_loaded');
  }

  // Check 5: React rendered
  const reactRoot = root.querySelector('[data-reactroot], [data-reactid]');
  const anyContent = root.textContent && root.textContent.trim().length > 10;
  if (!reactRoot && !anyContent) {
    report.isBlank = true;
    report.issues.push('react_not_rendered');
  }

  return report;
}

export function attemptRecovery(report: BlankScreenReport): void {
  if (!report.isBlank) return;

  console.error('🚨 BLANK SCREEN DETECTED:', report.issues);

  // Recovery 1: Fix root visibility
  const root = document.getElementById('root');
  if (root) {
    root.style.opacity = '1';
    root.style.visibility = 'visible';
    root.style.minHeight = '100vh';
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    report.recovery.push('root_styles_fixed');
  }

  // Recovery 2: Reload if CSS failed
  if (report.issues.includes('css_not_loaded')) {
    console.error('CSS failed to load, attempting reload...');
    setTimeout(() => window.location.reload(), 1000);
    report.recovery.push('reload_attempted');
    return;
  }

  // Recovery 3: Force re-render
  if (report.issues.includes('react_not_rendered')) {
    report.recovery.push('react_remount_needed');
    console.error('React failed to mount. Check console for errors.');
  }

  // Log recovery attempt
  console.log('🔧 Recovery attempted:', report.recovery);

  // Send telemetry if in preview
  if (window.location.hostname.includes('lovable')) {
    fetch('/api/telemetry/blank-screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).catch(() => {}); // Silent fail
  }
}

/**
 * Initialize monitoring with automatic recovery
 */
export function initBlankScreenMonitor(): void {
  if (typeof window === 'undefined') return;

  // Check immediately after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCheck);
  } else {
    runCheck();
  }

  // Check again after window load
  window.addEventListener('load', () => {
    setTimeout(runCheck, 500);
  });

  function runCheck() {
    const report = detectBlankScreen();
    if (report.isBlank) {
      attemptRecovery(report);
    }
  }
}
