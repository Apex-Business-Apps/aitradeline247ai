import { VideoPlayer } from "@/components/ui/VideoPlayer";

export const BenefitCards = () => {
  return (
    <section className="py-24 bg-gradient-orange-subtle relative overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            See TradeLine 24/7 in Action
          </h2>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-[#1e556b]">
            Watch how we handle your calls with speed, personalization, and follow-through
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              poster="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop"
              title="TradeLine 24/7 Demo"
              className="w-full aspect-video"
            />
          </div>
        </div>
      </div>
      
      {/* Enhanced background elements with animation */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-secondary/15 rounded-full blur-xl animate-pulse delay-500"></div>
    </section>
  );
};