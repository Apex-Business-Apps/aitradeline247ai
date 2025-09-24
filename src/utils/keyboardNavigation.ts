// Keyboard navigation utilities for accessibility compliance
export class KeyboardNavigationHelper {
  private static focusableElements = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input[type="text"]:not([disabled])',
    'input[type="radio"]:not([disabled])',
    'input[type="checkbox"]:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable]:not([disabled])'
  ].join(', ');

  static getAllFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableElements));
  }

  static addSkipToContentLink() {
    // Check if skip link already exists
    if (document.querySelector('.skip-to-content')) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--background);
      color: var(--foreground);
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
      font-weight: 600;
      border: 2px solid var(--border);
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  static ensureMainContentId() {
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
    }
  }

  static addFocusVisibleStyles() {
    // Check if styles already added
    if (document.querySelector('#focus-visible-styles')) return;

    const style = document.createElement('style');
    style.id = 'focus-visible-styles';
    style.textContent = `
      /* Enhanced focus visible styles */
      *:focus-visible {
        outline: 2px solid hsl(var(--primary)) !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }

      /* Button focus styles */
      button:focus-visible,
      [role="button"]:focus-visible {
        box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary)) !important;
      }

      /* Link focus styles */
      a:focus-visible {
        text-decoration: underline !important;
        text-decoration-thickness: 2px !important;
        text-underline-offset: 4px !important;
      }

      /* Input focus styles */
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 2px solid hsl(var(--primary)) !important;
        outline-offset: 2px !important;
      }

      /* Skip link styles */
      .skip-to-content:focus {
        top: 6px !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  static trapFocus(container: HTMLElement) {
    const focusableElements = this.getAllFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(announcement);
    
    // Small delay to ensure screen readers catch the announcement
    setTimeout(() => {
      announcement.textContent = message;
      
      // Clean up after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }, 100);
  }

  static init() {
    this.addSkipToContentLink();
    this.ensureMainContentId();
    this.addFocusVisibleStyles();
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KeyboardNavigationHelper.init());
  } else {
    KeyboardNavigationHelper.init();
  }
}