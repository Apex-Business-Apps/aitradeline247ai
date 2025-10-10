import { useState, useEffect, useRef, useCallback } from 'react';

interface NavItem {
  name: string;
  href: string;
}

export const usePriorityNav = (items: NavItem[], pinnedCount: number = 1) => {
  const [visibleItems, setVisibleItems] = useState<NavItem[]>(items);
  const [overflowItems, setOverflowItems] = useState<NavItem[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const calculateVisibleItems = useCallback(() => {
    if (!navRef.current) return;

    const nav = navRef.current;
    const navWidth = nav.offsetWidth;
    const moreButtonWidth = moreButtonRef.current?.offsetWidth || 80;
    const itemElements = nav.querySelectorAll('[data-nav-item]');
    
    let totalWidth = 0;
    let visibleCount = pinnedCount; // Always keep pinned items visible

    // Calculate widths from right to left, excluding pinned items
    for (let i = pinnedCount; i < itemElements.length; i++) {
      const itemWidth = (itemElements[i] as HTMLElement).offsetWidth;
      if (totalWidth + itemWidth + moreButtonWidth < navWidth) {
        totalWidth += itemWidth;
        visibleCount++;
      } else {
        break;
      }
    }

    if (visibleCount < items.length) {
      setVisibleItems(items.slice(0, visibleCount));
      setOverflowItems(items.slice(visibleCount));
    } else {
      setVisibleItems(items);
      setOverflowItems([]);
    }
  }, [items, pinnedCount]);

  useEffect(() => {
    const debounceTimer = setTimeout(calculateVisibleItems, 150);

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(debounceTimer);
      setTimeout(calculateVisibleItems, 150);
    });

    if (navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    return () => {
      clearTimeout(debounceTimer);
      resizeObserver.disconnect();
    };
  }, [calculateVisibleItems]);

  return { visibleItems, overflowItems, navRef, moreButtonRef };
};
