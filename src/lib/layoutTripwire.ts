/**
 * Layout Tripwire Guard
 * 
 * Validates critical layout invariants at runtime to detect unauthorized
 * changes to hero section and lead form positioning.
 * 
 * ONLY RUNS IN DEVELOPMENT AND CI (never in production)
 */

interface TripwireViolation {
  check: string;
  expected: string;
  actual: string;
}

export function initLayoutTripwire() {
  // Never run in production
  if (import.meta.env.PROD) {
    return;
  }

  console.log('[Tripwire] Initializing layout guards...');

  // Wait for DOM to be ready and chat launcher to mount
  const initGuard = () => {
    setTimeout(() => {
      runTripwireChecks();
    }, 1000); // Give time for chat to mount
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGuard);
  } else {
    initGuard();
  }

  // Also run on resize (but debounced)
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(runTripwireChecks, 500);
  });
}

function runTripwireChecks() {
  const violations: TripwireViolation[] = [];
  
  // 1. Compute chat bubble safe gap
  const chatLauncher = document.querySelector('[data-qa="chat-launcher"]');
  if (chatLauncher) {
    const chatWidth = chatLauncher.getBoundingClientRect().width;
    const safeGap = Math.ceil(chatWidth + 24);
    document.documentElement.style.setProperty('--chat-bubble-safe-gap', `${safeGap}px`);
    console.log(`[Tripwire] Chat safe gap computed: ${safeGap}px`);
  } else {
    console.warn('[Tripwire] Chat launcher not found, using fallback');
  }

  // Only run checks on mobile/tablet
  if (window.innerWidth > 1024) {
    console.log('[Tripwire] Desktop viewport, skipping mobile checks');
    return;
  }

  // 2. Check hero section exists and has correct structure
  const hero = document.querySelector('[data-qa="hero"]');
  if (!hero) {
    violations.push({
      check: 'Hero section exists',
      expected: 'element with data-qa="hero"',
      actual: 'not found'
    });
  } else {
    // Check display type hasn't changed
    const heroDisplay = window.getComputedStyle(hero).display;
    if (heroDisplay === 'none' || heroDisplay === 'contents') {
      violations.push({
        check: 'Hero display type',
        expected: 'block or flex',
        actual: heroDisplay
      });
    }
  }

  // 3. Check lead form exists under hero
  const leadForm = document.querySelector('[data-qa="lead-form"]');
  if (!leadForm) {
    violations.push({
      check: 'Lead form exists',
      expected: 'element with data-qa="lead-form"',
      actual: 'not found'
    });
  } else {
    // Check it's not absolutely positioned (would break flow)
    const formPosition = window.getComputedStyle(leadForm).position;
    if (formPosition === 'absolute' || formPosition === 'fixed') {
      violations.push({
        check: 'Lead form positioning',
        expected: 'static, relative, or sticky',
        actual: formPosition
      });
    }

    // Check form is inside hero
    if (hero && !hero.contains(leadForm)) {
      violations.push({
        check: 'Lead form hierarchy',
        expected: 'inside [data-qa="hero"]',
        actual: 'moved outside hero'
      });
    }

    // 4. Check form width calculation
    const gutter = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--mobile-gutter') || '16'
    );
    const safeGap = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--chat-bubble-safe-gap') || '96'
    );
    
    const expectedWidth = window.innerWidth - (gutter * 2) - safeGap;
    const actualWidth = leadForm.getBoundingClientRect().width;
    const widthDiff = Math.abs(expectedWidth - actualWidth);
    
    console.log(`[Tripwire] Width check: expected=${expectedWidth.toFixed(0)}px, actual=${actualWidth.toFixed(0)}px, diff=${widthDiff.toFixed(0)}px`);
    
    if (widthDiff > 8) {
      violations.push({
        check: 'Lead form width',
        expected: `${expectedWidth.toFixed(0)}px (±8px)`,
        actual: `${actualWidth.toFixed(0)}px (diff: ${widthDiff.toFixed(0)}px)`
      });
    }
  }

  // 5. Check for overlap between chat and submit button
  if (chatLauncher && leadForm) {
    const submitButton = leadForm.querySelector('button[type="submit"]');
    if (submitButton) {
      const chatRect = chatLauncher.getBoundingClientRect();
      const submitRect = submitButton.getBoundingClientRect();
      
      const overlaps = !(
        chatRect.right < submitRect.left ||
        chatRect.left > submitRect.right ||
        chatRect.bottom < submitRect.top ||
        chatRect.top > submitRect.bottom
      );
      
      if (overlaps) {
        violations.push({
          check: 'Chat/submit button overlap',
          expected: 'no overlap',
          actual: 'overlapping detected'
        });
      }
    }
  }

  // Handle violations
  if (violations.length > 0) {
    handleTripwireViolations(violations);
  } else {
    console.log('[Tripwire] ✓ All layout checks passed');
    document.documentElement.removeAttribute('data-tl-tripwire');
  }
}

function handleTripwireViolations(violations: TripwireViolation[]) {
  console.error('[Tripwire] LAYOUT GUARD VIOLATED!');
  console.table(violations);

  // Set attribute for testing
  document.documentElement.setAttribute('data-tl-tripwire', 'violated');

  // Create visible warning banner (dev only)
  if (!document.getElementById('tripwire-banner')) {
    const banner = document.createElement('div');
    banner.id = 'tripwire-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      z-index: 999999;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
      ⚠️ TRIPWIRE VIOLATED: Unauthorized layout changes detected<br>
      <small style="font-weight: normal; font-size: 12px;">
        ${violations.length} check(s) failed - Check console for details
      </small>
    `;
    document.body.prepend(banner);
  }

  // Throw error in CI environment
  if (typeof process !== 'undefined' && process.env?.CI === 'true') {
    throw new Error(
      `Layout tripwire violated:\n${violations.map(v => 
        `  - ${v.check}: expected ${v.expected}, got ${v.actual}`
      ).join('\n')}`
    );
  }
}

// Export for testing
export function getTripwireStatus(): 'passed' | 'violated' | 'not-run' {
  const attr = document.documentElement.getAttribute('data-tl-tripwire');
  if (attr === 'violated') return 'violated';
  if (document.getElementById('tripwire-banner')) return 'violated';
  return 'not-run'; // Will be 'passed' after checks run
}
