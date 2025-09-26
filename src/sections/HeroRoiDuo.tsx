// LOVABLE-GUARD: Only import existing components; do not alter their internals.
import React from "react";
import "../styles/hero-roi.css";

// Adjust these import paths/names to match the repo. Keep the IDs as given.
import { PricingHero } from "../components/sections/PricingHero";
import RoiCalculator from "../components/RoiCalculator";

export default function HeroRoiDuo() {
  return (
    <section
      className="hero-roi__container"
      data-lovable-lock="true"
      aria-label="Start Trial and ROI"
    >
      <div className="hero-roi__grid" data-lovable-lock="true">
        <div id="start-trial-hero" className="hero-roi__card" data-lovable-lock="true">
          <PricingHero />
        </div>
        <div id="roi-calculator" className="hero-roi__card" data-lovable-lock="true">
          <RoiCalculator />
        </div>
      </div>
    </section>
  );
}
