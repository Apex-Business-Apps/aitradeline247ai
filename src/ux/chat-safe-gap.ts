// Computes the chat bubble width to reserve a safe gap on the right.
// No-op if not found; falls back to 96px.
export function applyChatSafeGap() {
  const root = document.documentElement;
  const fallback = 96; // px
  let w = fallback;

  const chat =
    document.querySelector('[data-qa="chat-launcher"]') ||
    document.querySelector('[data-testid="chat-launcher"]') ||
    document.querySelector('.chat-launcher') ||
    null;

  if (chat) {
    const rect = (chat as HTMLElement).getBoundingClientRect();
    // Add breathing room.
    w = Math.ceil(rect.width + 24);
  }

  root.style.setProperty('--chat-bubble-safe-gap', `${w}px`);
}

export function initChatSafeGap() {
  applyChatSafeGap();
  window.addEventListener('resize', applyChatSafeGap, { passive: true });
  // In case chat mounts late:
  const obs = new MutationObserver(() => applyChatSafeGap());
  obs.observe(document.body, { childList: true, subtree: true });
}
