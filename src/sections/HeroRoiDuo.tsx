// LOVABLE-GUARD: Only import existing components; do not alter their internals.
import React from "react";
import "../styles/hero-roi.css";
import { LeadCaptureCard } from "../components/sections/LeadCaptureCard";
import RoiCalculator from "../components/RoiCalculator";
import officialLogo from '@/assets/official-logo.svg';
export default function HeroRoiDuo() {
  return <section className="py-20 bg-gradient-orange-subtle section-heavy">
      <div className="container">
        {/* Hero Content */}
        <div className="text-center mb-16">
          {/* Logo above hero text */}
          <div className="flex justify-center mb-8 min-h-[10.9375rem] md:min-h-[14.0625rem] items-center">
            <img src={officialLogo} alt="TradeLine 24/7 Logo" className="h-[8.75rem] md:h-[11.25rem] w-auto opacity-80" style={{
            transform: 'translateY(-0.5cm) scale(1.45) scaleY(1.3225) scaleX(1.3225)'
          }} />
          </div>
          
          <h1 id="hero-h1" className="text-4xl md:text-6xl mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent font-extrabold lg:text-7xl">
            Your 24/7 A<span className="text-primary">i</span> Receptionist
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto font-semibold text-[#1e556b] md:text-4xl">
            Never miss a call. Work while you sleep.
          </p>
          
          <h2 className="text-2xl text-[#1e556b] mb-2 mt-[120px] text-center py-0 md:text-4xl font-semibold my-[50px]">Help us help you.</h2>
          
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