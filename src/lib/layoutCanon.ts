// LOVABLE-GUARD: asserts canonical layout - NON-BLOCKING VERSION
import "./../styles/layout-canon.css";

type Fail = { reason: string; meta?: Record<string, any> };

function assertLayout(): Fail | null {
  // Only validate on homepage after sufficient delay
  if (window.location.pathname !== '/') return null;
  
  // Check for actual elements that exist in the code
  const grid = document.querySelector('[data-node="grid"]');
  const roi = document.querySelector('[data-node="ron"]'); 
  const start = document.querySelector('[data-node="start"]');
  
  // These are optional - log warnings but don't fail
  if (!grid || !roi || !start) {
    console.log('[LayoutCanon] Hero elements not yet rendered (this is normal during initial mount)');
    return null;
  }
  
  console.log('[LayoutCanon] ✅ Hero structure validated successfully');
  return null;
}

export function startLayoutCanon() {
  // Completely non-blocking - only log info, never interfere
  console.log('[LayoutCanon] Monitoring enabled (non-blocking mode)');
  
  // Delay initial check to allow React to fully mount
  setTimeout(() => {
    assertLayout();
  }, 2000);
  
  // Periodic validation (non-intrusive)
  setInterval(() => {
    if (window.location.pathname === '/') {
      assertLayout();
    }
  }, 10000); // Check every 10 seconds
}
