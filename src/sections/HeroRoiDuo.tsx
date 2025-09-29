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
  }}>
      <div className="container">
        {/* Hero Content */}
        <div className="text-center mb-16">
          {/* Logo above hero text */}
          <div className="flex justify-center mb-8 items-center" style={{ aspectRatio: '16/9', maxHeight: 'clamp(8rem, 15vw, 14rem)' }}>
            <img 
              src={officialLogo} 
              alt="TradeLine 24/7 Logo" 
              className="w-full max-w-[200px] md:max-w-[280px] h-auto opacity-80" 
              style={{
                transform: 'translateY(clamp(-0.5rem, -2vw, -1rem)) scale(clamp(1.2, 1.45, 1.5))',
                aspectRatio: '1/1'
              }}
              loading="eager"
            />
          </div>
          
          <h1 id="hero-h1" className="mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent font-extrabold" style={{ fontSize: 'clamp(2rem, 5vw + 1rem, 4.5rem)', lineHeight: '1.1' }}>
            Your 24/7 A<span className="text-primary">i</span> Receptionist
          </h1>
          <p className="mb-8 max-w-3xl mx-auto font-semibold text-[#1e556b]" style={{ fontSize: 'clamp(1rem, 2vw + 0.5rem, 2.5rem)', lineHeight: '1.5' }}>
            Never miss a call. Work while you sleep.
          </p>
          
          <h2 className="text-[#1e556b] mb-[50px] mt-[63px] text-center py-0 font-semibold" style={{ fontSize: 'clamp(1.5rem, 3vw + 0.5rem, 2.5rem)' }}>Help us help you.</h2>
          
          {/* Custom grid layout for side-by-side components */}
          <div className="hero-roi__container" data-lovable-lock="true" aria-label="Start Trial and ROI">
            <div className="hero-roi__grid" data-lovable-lock="true">
              <div id="roi-calculator" className="hero-roi__card" data-lovable-lock="true">
                <RoiCalculator />
              </div>
              <div id="start-trial-hero" className="hero-roi__card" data-lovable-lock="true">
                <LeadCaptureCard compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}