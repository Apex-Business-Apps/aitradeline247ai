import RoiCalculator from "@/components/RoiCalculator";
export const PricingHero = () => {
  return (
    <section className="py-20 bg-gradient-orange-subtle section-heavy">
      <div className="container">
        {/* Hero Content */}
        <div className="text-center mb-16">
          <h1 id="hero-h1" className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Your 24/7 A<span className="text-primary">i</span> Receptionist
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto font-semibold text-[#1e556b] md:text-xl">
            Never miss a call. Work while you sleep.
          </p>
          
          {/* ROI Calculator */}
          <RoiCalculator />
        </div>
      </div>
    </section>
  );
};