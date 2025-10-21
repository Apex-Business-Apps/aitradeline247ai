import { Shield, Clock, Globe } from "lucide-react";

export const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: "SOC 2 Compliant",
      description: "Enterprise security"
    },
    {
      icon: Globe,
      title: "PIPEDA/PIPA Ready",
      description: "Privacy compliant"
    },
    {
      icon: Clock,
      title: "24/7 Available",
      description: "Never miss a call"
    }
  ];

  return (
    <section className="py-20 bg-background/50 backdrop-blur-sm">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Trusted by Enterprise
          </h2>
          <p className="text-muted-foreground">Built with security and compliance at its core</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="group flex flex-col items-center text-center p-8 rounded-xl border bg-card/60 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">{badge.title}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
