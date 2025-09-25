import RoiCalculator from "@/components/RoiCalculator";
import { LeadCaptureCard } from "@/components/sections/LeadCaptureCard";
export const PricingHero = () => {
  return <section className="py-20 bg-gradient-orange-subtle section-heavy">
      <div className="container">
        {/* Hero Content */}
        <div className="text-center mb-16">
          {/* Logo above hero text */}
          <div className="flex justify-center mb-8">
            <img src="/src/assets/official-logo.svg" alt="TradeLine 24/7 Logo" className="h-28 md:h-36 w-auto opacity-80" style={{
            transform: 'scaleX(0.96) scale(1.15)'
          }} />
          </div>
          
          <h1 id="hero-h1" className="text-4xl md:text-6xl mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent font-extrabold lg:text-7xl">
            Your 24/7 A<span className="text-primary">i</span> Receptionist
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto font-semibold text-[#1e556b] md:text-4xl">
            Never miss a call. Work while you sleep.
          </p>
          
          <h2 className="text-2xl font-semibold text-[#1e556b] mb-2 mt-[120px] text-center my-0 py-0 md:text-4xl">
            Help us help you
          </h2>
          
          {/* Two-column layout for calculator and questionnaire */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 items-stretch max-w-7xl mx-auto mt-[120px]">
            <div className="flex justify-center">
              <RoiCalculator />
            </div>
            <div className="flex justify-center">
              <LeadCaptureCard compact />
            </div>
          </div>
        </div>
      </div>
    </section>;
};