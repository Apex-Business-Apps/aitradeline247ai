/**
 * 🔒 HERO SECTION COMPONENT - PROTECTED BY PERMANENT SAFEGUARDS 🔒
 * 
 * CRITICAL: READ HERO_GUARDRAILS.md BEFORE MODIFYING
 * 
 * This component is actively monitored by:
 * - heroGuardian.ts (performance + structure validation)
 * - layoutCanon.ts (layout validation)
 * - layoutGuard.ts (self-healing)
 * 
 * Protected Elements:
 * - Brand title: "Your 24/7 Ai Receptionist" (DO NOT CHANGE)
 * - data-node attributes (REQUIRED for validation)
 * - Safe area insets (REQUIRED for mobile/PWA)
 * - Logo optimization (eager loading + aspectRatio)
 * - Fluid typography (clamp() only, NO fixed units)
 * 
 * Performance Targets (ENFORCED):
 * - LCP ≤ 2.5s
 * - CLS ≤ 0.05
 * 
 * Any violations will trigger console errors and may block deployment.
 */

// LOVABLE-GUARD: Only import existing components; do not alter their internals.
import React from "react";
import "../styles/hero-roi.css";
import { LeadCaptureCard } from "../components/sections/LeadCaptureCard";
import RoiCalculator from "../components/RoiCalculator";
import officialLogo from '@/assets/official-logo.svg';
export default function HeroRoiDuo() {
  return <section className="bg-gradient-orange-subtle section-heavy" style={{
    paddingTop: 'max(env(safe-area-inset-top, 0), 5rem)',
    paddingBottom: 'max(env(safe-area-inset-bottom, 0), 5rem)',
    paddingLeft: 'env(safe-area-inset-left, 0)',
    paddingRight: 'env(safe-area-inset-right, 0)'
  }} data-lovable-lock="permanent">
      <div className="container" data-lovable-lock="permanent">
        {/* Hero Content */}
        <div className="text-center mb-16" data-lovable-lock="permanent">
          
          {/* Logo above hero text - LOCKED */}
          <div className="flex justify-center mb-8 min-h-[13.3125rem] md:min-h-[17.15625rem] items-center" data-lovable-lock="permanent">
            <img 
              src={officialLogo} 
              alt="TradeLine 24/7 Logo" 
              className="h-[10.6875rem] md:h-[13.7375rem] w-auto opacity-80" 
              style={{ 
                transform: 'translateY(-0.5cm) scale(1.767) scaleY(1.61085) scaleX(1.61085)',
                aspectRatio: '1',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}
              loading="eager"
              fetchPriority="high"
              data-lovable-lock="permanent"
            />
          </div>
          
          <h1 id="hero-h1" className="mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent font-extrabold" style={{ fontSize: 'clamp(2rem, 5vw + 1rem, 4.5rem)', lineHeight: '1.1' }} data-lovable-lock="permanent">
            Your 24/7 A<span className="text-primary">i</span> Receptionist
          </h1>
          <p className="mb-8 max-w-3xl mx-auto font-semibold text-[#1e556b]" style={{ fontSize: 'clamp(1rem, 2vw + 0.5rem, 2.5rem)', lineHeight: '1.5' }} data-lovable-lock="permanent">
            Never miss a call. Work while you sleep.
          </p>
          
          <h2 className="text-[#1e556b] mb-12 mt-16 text-center py-0 font-semibold mx-auto" style={{ fontSize: 'clamp(1.5rem, 3vw + 0.5rem, 2.5rem)' }} data-lovable-lock="permanent">Help us help you.</h2>
          
          {/* Custom grid layout for side-by-side components */}
          <div className="hero-roi__container mx-auto" data-lovable-lock="permanent" aria-label="Start Trial and ROI">
            <div className="hero-roi__grid" data-node="grid" data-lovable-lock="permanent">
              <div id="roi-calculator" data-node="ron" data-lovable-lock="permanent">
                <RoiCalculator />
              </div>
              <div id="start-trial-hero" data-node="start" data-lovable-lock="permanent">
                <LeadCaptureCard compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}