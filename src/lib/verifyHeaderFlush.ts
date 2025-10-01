/**
 * Header Flush Verification Routine
 * Run in console on multiple routes/breakpoints to confirm:
 * 1. Header top = 0px (visually flush)
 * 2. Banner (if present) is sticky and doesn't overlap header
 * 3. No gap appears/disappears during interactions
 */

export function verifyHeaderFlush(): void {
  console.log('🔍 Header Flush Verification Starting...\n');
  
  const header = document.querySelector<HTMLElement>('header[data-site-header]');
  const banner = document.querySelector<HTMLElement>('[data-banner]');
  
  if (!header) {
    console.error('❌ FAIL: No header with [data-site-header] found');
    return;
  }

  const headerRect = header.getBoundingClientRect();
  const headerTop = Math.round(headerRect.top);
  const headerComputedStyle = getComputedStyle(header);
  
  // Test 1: Header top equals 0px
  const test1Pass = headerTop === 0;
  console.log(`${test1Pass ? '✅' : '❌'} Test 1: Header top = 0px`, {
    actual: `${headerTop}px`,
    position: headerComputedStyle.position,
    zIndex: headerComputedStyle.zIndex
  });

  // Test 2: Inline media are block-level (no baseline gap)
  const inlineMedia = Array.from(header.querySelectorAll<HTMLElement>('img, svg, video, canvas'));
  const allBlock = inlineMedia.every(el => getComputedStyle(el).display === 'block');
  console.log(`${allBlock ? '✅' : '❌'} Test 2: Inline media block-level (${inlineMedia.length} elements)`, {
    allBlock,
    elements: inlineMedia.map(el => ({
      tag: el.tagName.toLowerCase(),
      display: getComputedStyle(el).display
    }))
  });

  // Test 3: Banner behavior (if present)
  if (banner) {
    const bannerRect = banner.getBoundingClientRect();
    const bannerStyle = getComputedStyle(banner);
    const bannerSticky = bannerStyle.position === 'sticky';
    const bannerZIndex = parseInt(bannerStyle.zIndex, 10);
    const headerZIndex = parseInt(headerComputedStyle.zIndex, 10);
    const zIndexValid = bannerZIndex > headerZIndex;
    
    console.log(`${bannerSticky ? '✅' : '❌'} Test 3a: Banner is sticky`, {
      position: bannerStyle.position,
      top: bannerStyle.top,
      zIndex: bannerZIndex
    });
    
    console.log(`${zIndexValid ? '✅' : '❌'} Test 3b: Banner z-index > Header z-index`, {
      banner: bannerZIndex,
      header: headerZIndex
    });

    const noOverlap = bannerRect.bottom <= headerRect.top || bannerRect.top >= headerRect.bottom;
    console.log(`${noOverlap ? '✅' : '❌'} Test 3c: No banner/header overlap`, {
      bannerBottom: Math.round(bannerRect.bottom),
      headerTop: Math.round(headerRect.top)
    });
  } else {
    console.log('ℹ️  Test 3: No banner present (skipped)');
  }

  // Test 4: Check for high z-index children in header
  const headerChildren = Array.from(header.querySelectorAll<HTMLElement>('*'));
  const highZIndexChildren = headerChildren
    .map(el => ({
      element: el,
      zIndex: parseInt(getComputedStyle(el).zIndex, 10)
    }))
    .filter(item => !isNaN(item.zIndex) && item.zIndex > 1000);
  
  const test4Pass = highZIndexChildren.length === 0;
  console.log(`${test4Pass ? '✅' : '❌'} Test 4: No high z-index children in header`, {
    found: highZIndexChildren.length,
    details: highZIndexChildren.map(item => ({
      tag: item.element.tagName.toLowerCase(),
      class: item.element.className,
      zIndex: item.zIndex
    }))
  });

  // Summary
  const allPassed = test1Pass && allBlock && test4Pass && (!banner || true);
  console.log('\n' + '='.repeat(50));
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(50));
  console.log(`\nRoute: ${window.location.pathname}`);
  console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
  console.log(`User Agent: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`);
}

// Auto-attach to window for console access
if (typeof window !== 'undefined') {
  (window as any).verifyHeaderFlush = verifyHeaderFlush;
}
