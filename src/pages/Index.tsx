import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingHero } from "@/components/sections/PricingHero";
import { TrustBadgesSlim } from "@/components/sections/TrustBadgesSlim";
import { BenefitCards } from "@/components/sections/BenefitCards";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LeadCaptureForm } from "@/components/sections/LeadCaptureForm";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/seo/SEOHead";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";

const Index = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('home');
  }, [trackPageView]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'var(--bg-pattern-1)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content with translucency */}
      <div className="relative z-10">
        <SEOHead 
          title="TradeLine 24/7 — Your 24/7 AI Receptionist!"
          description="Transform your business with AI-powered customer service that never sleeps. Handle calls, messages, and inquiries 24/7 with human-like responses. Start growing now!"
          keywords="AI receptionist, 24/7 customer service, business automation, call handling, lead capture, CRM integration, grow business"
          canonical="https://tradeline247.com"
        />
        <OrganizationSchema />
        
        <div className="backdrop-blur-sm bg-background/80">
          <Header />
        </div>
        
        <main className="flex-1">
          <div className="backdrop-blur-sm bg-background/75">
            <PricingHero />
          </div>
          <div className="backdrop-blur-sm bg-background/75">
            <BenefitCards />
          </div>
          <div className="backdrop-blur-sm bg-background/70">
            <HowItWorks />
          </div>
          <div className="backdrop-blur-sm bg-background/75">
            <LeadCaptureForm />
          </div>
        </main>
        
        <div className="backdrop-blur-sm bg-background/70">
          <TrustBadgesSlim />
        </div>
        
        <div className="backdrop-blur-sm bg-background/80">
          <Footer />
        </div>
      </div>
      
      {/* TL247 MiniBot — left-side trial chat (3 prompts) */}
      <aside id="tl-mini-bot" aria-label="Try our AI receptionist" data-state="open">
        <div className="tl-bot-head">
          <div className="tl-bot-avatar" aria-hidden="true">
            {/* Cute inline SVG robot (no external deps) */}
            <svg viewBox="0 0 120 120" className="tl-robot">
              <defs>
                <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#9EEAF9"/>
                  <stop offset="1" stopColor="#35C2F2"/>
                </linearGradient>
              </defs>
              <rect x="20" y="30" rx="12" ry="12" width="80" height="60" fill="url(#g)" stroke="#1B9ED8" strokeWidth="3"/>
              <circle cx="45" cy="60" r="8" fill="#fff"/>
              <circle cx="45" cy="60" r="4" fill="#35C2F2"/>
              <circle cx="75" cy="60" r="8" fill="#fff"/>
              <circle cx="75" cy="60" r="4" fill="#35C2F2"/>
              <rect x="40" y="78" width="40" height="6" rx="3" fill="#1B9ED8" opacity="0.35"/>
              <rect x="56" y="18" rx="3" ry="3" width="8" height="12" fill="#1B9ED8"/>
              <circle cx="60" cy="16" r="5" fill="#35C2F2" stroke="#1B9ED8" strokeWidth="2"/>
            </svg>
          </div>
          <div className="tl-bot-title">
            <strong>Meet TrAdeleine</strong>
            <span className="tl-bot-sub">Ask up to <b>3</b> quick questions</span>
          </div>
          <button className="tl-bot-toggle" aria-label="Hide mini chat" title="Hide">–</button>
        </div>

        <div className="tl-bot-body">
          <div className="tl-bot-msgs" id="tlMsgs" role="log" aria-live="polite"></div>

          <form id="tlForm" className="tl-bot-form" autoComplete="off">
            <input 
              id="tlInput" 
              name="q" 
              type="text" 
              inputMode="text" 
              minLength={1}
              placeholder="Try: How do transcripts work?"
              aria-label="Type your question" 
              required 
            />
            <button className="tl-send" type="submit" aria-label="Send">↩︎</button>
          </form>

          <div className="tl-bot-limit" id="tlLimit">3 / 3 prompts left</div>
          <a className="tl-bot-cta" href="#signup">Start free trial</a>
        </div>
      </aside>

      <style>{`
        /* Layout: left sticky on desktop, docked on mobile */
        #tl-mini-bot{position:sticky;top:16px;left:0;max-width:320px;width:clamp(260px,27vw,320px);
          background:#fff;border:1px solid #e6e6e6;border-radius:16px;box-shadow:0 6px 22px rgba(0,0,0,.06);
          font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif;color:#1a1a1a;z-index:30}
        @media (max-width: 960px){
          #tl-mini-bot{position:fixed;bottom:12px;left:12px;right:12px;top:auto;width:auto;max-width:none}
        }
        .tl-bot-head{display:flex;gap:10px;align-items:center;padding:12px 12px 8px}
        .tl-bot-avatar{width:40px;height:40px}
        .tl-robot{width:40px;height:40px;animation:tlBlink 4s infinite ease-in-out}
        @keyframes tlBlink{0%,92%,100%{transform:translateY(0)}95%{transform:translateY(1px)}}
        .tl-bot-title{flex:1;display:flex;flex-direction:column}
        .tl-bot-title strong{font-weight:700}
        .tl-bot-sub{font-size:12px;color:#666}
        .tl-bot-toggle{border:none;background:transparent;font-size:18px;line-height:1;padding:6px;cursor:pointer;color:#999}
        .tl-bot-body{padding:8px 12px 12px;display:grid;gap:10px}
        .tl-bot-msgs{max-height:320px;overflow:auto;padding-right:4px;display:grid;gap:8px}
        .tl-msg{padding:8px 10px;border-radius:12px;max-width:90%}
        .tl-me{justify-self:end;background:#F0F7FF;border:1px solid #D4E7FF}
        .tl-bot{justify-self:start;background:#F9FAFB;border:1px solid #EEE}
        .tl-typing{font-style:italic;color:#888}
        .tl-bot-form{display:grid;grid-template-columns:1fr auto;gap:8px}
        #tlInput{height:42px;padding:10px 12px;border:1px solid #DDD;border-radius:12px}
        .tl-send{height:42px;padding:0 12px;border:none;border-radius:12px;background:#ff7a1a;color:#fff;cursor:pointer}
        .tl-bot-limit{font-size:12px;color:#666}
        .tl-bot-cta{display:inline-block;text-align:center;background:#1b9ed8;color:#fff;
          padding:10px 14px;border-radius:10px;text-decoration:none}
        /* collapsed */
        #tl-mini-bot[data-state="closed"] .tl-bot-body{display:none}
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
(() => {
  const el = document.getElementById('tl-mini-bot');
  const msgs = document.getElementById('tlMsgs');
  const form = document.getElementById('tlForm');
  const input = document.getElementById('tlInput');
  const limit = document.getElementById('tlLimit');
  const toggle = el.querySelector('.tl-bot-toggle');

  // 3-prompt session cap
  const CAP = 3;
  const key = 'tl-mini-prompts';
  const getCount = () => Number(sessionStorage.getItem(key) || 0);
  const setCount = (n) => sessionStorage.setItem(key, String(n));
  const left = () => Math.max(0, CAP - getCount());
  const updateLimit = () => { limit.textContent = \`\${left()} / \${CAP} prompts left\`; };

  function pushMsg(text, who='bot'){
    const div = document.createElement('div');
    div.className = 'tl-msg ' + (who==='me' ? 'tl-me' : 'tl-bot');
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function typing(on=true){
    let t = msgs.querySelector('.tl-typing');
    if(on && !t){ t = document.createElement('div'); t.className = 'tl-msg tl-bot tl-typing'; t.textContent = 'TrAdeleine is typing…'; msgs.appendChild(t); }
    if(!on && t){ t.remove(); }
    msgs.scrollTop = msgs.scrollHeight;
  }

  // greet once
  if(!sessionStorage.getItem('tl-mini-greet')){
    pushMsg("Hi! I'm TrAdeleine 🤖 — ask me up to 3 quick questions about TradeLine 24/7.");
    sessionStorage.setItem('tl-mini-greet','1');
  }
  updateLimit();

  toggle.addEventListener('click', () => {
    const s = el.getAttribute('data-state') === 'open' ? 'closed' : 'open';
    el.setAttribute('data-state', s);
    toggle.textContent = (s==='open') ? '–' : '+';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(left() === 0){
      pushMsg("You've reached the trial limit. Tap "Start free trial" to continue. 💙");
      return;
    }
    const q = input.value.trim();
    if(!q) return;
    input.value = '';
    pushMsg(q, 'me');
    typing(true);

    try{
      const res = await fetch('${window.location.origin}/functions/v1/chat-lite', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: q })
      });
      const data = await res.json();
      typing(false);
      if(!res.ok) throw new Error(data.error || 'Failed');
      pushMsg(data.reply || '…');
      setCount(getCount()+1);
      updateLimit();
      if(left()===0) pushMsg("That's 3! Want more? Click "Start free trial". 🚀");
    }catch(err){
      typing(false);
      pushMsg("Oops, I hit a snag. Please try again, or start a free trial for full chat. 🙏");
      console.error(err);
    }
  });
})();
        `
      }} />
    </div>
  );
};

export default Index;