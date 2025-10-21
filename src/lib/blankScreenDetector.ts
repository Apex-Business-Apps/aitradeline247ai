/**
 * BLANK SCREEN DETECTOR - ENHANCED WITH DATA PERSISTENCE
 * 
 * Monitors for blank screens and stores detection history
 * for trend analysis and reliability improvements.
 */

interface DetectionEvent {
  timestamp: string;
  hasContent: boolean;
  elementCount: number;
  textLength: number;
  interactiveElements: number;
  url: string;
  userAgent: string;
}

const STORAGE_KEY = 'tl247_blank_screen_history';
const MAX_HISTORY_SIZE = 50;

/**
 * Store detection event in localStorage for persistence
 */
function storeDetectionEvent(event: DetectionEvent): void {
  try {
    const history = getDetectionHistory();
    history.push(event);
    
    // Keep only last MAX_HISTORY_SIZE events
    const trimmed = history.slice(-MAX_HISTORY_SIZE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[BlankScreenDetector] Failed to store detection event:', e);
  }
}

/**
 * Get detection history from localStorage
 */
function getDetectionHistory(): DetectionEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Analyze detection history for patterns
 */
export function analyzeBlankScreenTrend(): {
  totalChecks: number;
  blankScreens: number;
  successRate: number;
  recentTrend: string;
} {
  const history = getDetectionHistory();
  
  if (history.length === 0) {
    return {
      totalChecks: 0,
      blankScreens: 0,
      successRate: 100,
      recentTrend: 'No data'
    };
  }
  
  const blankScreens = history.filter(e => !e.hasContent).length;
  const successRate = ((history.length - blankScreens) / history.length) * 100;
  
  // Analyze last 10 checks
  const recent = history.slice(-10);
  const recentBlanks = recent.filter(e => !e.hasContent).length;
  const recentTrend = recentBlanks === 0 ? 'Stable' : 
                      recentBlanks > 3 ? 'Degrading' : 'Minor issues';
  
  return {
    totalChecks: history.length,
    blankScreens,
    successRate: Math.round(successRate * 100) / 100,
    recentTrend
  };
}

/**
 * Check for meaningful content with enhanced detection
 */
export function checkForMeaningfulContent(): boolean {
  // Check if root exists and has content
  const root = document.getElementById('root');
  if (!root) return false;
  
  // Count various indicators of real content
  const hasChildren = root.children.length > 0;
  const hasText = (root.textContent?.trim().length ?? 0) > 50;
  const hasInteractive = document.querySelectorAll('button, a, input, textarea').length > 0;
  const hasImages = document.querySelectorAll('img, svg').length > 0;
  const hasHeadings = document.querySelectorAll('h1, h2, h3').length > 0;
  
  const contentScore = [hasChildren, hasText, hasInteractive, hasImages, hasHeadings]
    .filter(Boolean).length;
  
  // Store detection event
  storeDetectionEvent({
    timestamp: new Date().toISOString(),
    hasContent: contentScore >= 2, // Require at least 2 indicators
    elementCount: root.children.length,
    textLength: root.textContent?.trim().length ?? 0,
    interactiveElements: document.querySelectorAll('button, a, input, textarea').length,
    url: window.location.href,
    userAgent: navigator.userAgent
  });
  
  // Require at least 2 out of 5 indicators
  return contentScore >= 2;
}

/**
 * Export detection history (for debugging)
 */
export function exportDetectionHistory(): DetectionEvent[] {
  return getDetectionHistory();
}

/**
 * Clear detection history
 */
export function clearDetectionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[BlankScreenDetector] History cleared');
  } catch (e) {
    console.warn('[BlankScreenDetector] Failed to clear history:', e);
  }
}

