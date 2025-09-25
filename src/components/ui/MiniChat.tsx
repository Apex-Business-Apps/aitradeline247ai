import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

export const MiniChat: React.FC = () => {
  useEffect(() => {
    // Idempotent behavior setup - only run if not already bound
    const setupMiniChat = () => {
      const btn = document.querySelector('[data-chat-launcher]');
      const dlg = document.getElementById('mini-chat-dialog');
      const closeBtn = dlg?.querySelector('[data-chat-close]');
      
      if (!btn || !dlg || (btn as HTMLElement).dataset.bound) return;
      (btn as HTMLElement).dataset.bound = '1';

      const open = () => {
        (dlg as HTMLElement).hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        const first = dlg.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
        (first || closeBtn as HTMLElement || dlg as HTMLElement).focus();
        document.addEventListener('keydown', onEsc);
      };
      
      const close = () => {
        (dlg as HTMLElement).hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        (btn as HTMLElement).focus();
        document.removeEventListener('keydown', onEsc);
      };
      
      const onEsc = (e: KeyboardEvent) => (e.key === 'Escape') && close();

      btn.addEventListener('click', () => (dlg as HTMLElement).hidden ? open() : close());
      closeBtn?.addEventListener('click', close);
    };

    // Run setup after component mounts
    setupMiniChat();
  }, []);

  return (
    <>
      {/* Chat Launcher Button */}
      <button
        data-chat-launcher
        aria-expanded="false"
        aria-controls="mini-chat-dialog"
        className="fixed right-4 bottom-4 z-[60] rounded-full shadow-lg p-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
      >
        <span className="sr-only">Open chat</span>
        <MessageCircle width={22} height={22} aria-hidden="true" />
      </button>

      {/* Chat Dialog */}
      <div
        id="mini-chat-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-chat-title"
        hidden
        className="fixed right-4 bottom-20 z-[60] w-[360px] max-w-[90vw] rounded-2xl shadow-xl bg-background border"
      >
        <div className="p-4">
          <h2 id="mini-chat-title" className="text-base font-semibold text-foreground">
            Chat
          </h2>
          <div data-mini-chat-mount className="mt-2">
            <div className="text-sm text-muted-foreground">
              Chat interface will be mounted here
            </div>
          </div>
          <button
            data-chat-close
            className="mt-3 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};