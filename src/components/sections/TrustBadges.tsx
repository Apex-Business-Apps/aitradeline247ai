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
    <section className="py-16 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="flex items-center justify-center gap-4 p-6 rounded-lg border bg-card">
                <Icon className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-card-foreground">{badge.title}</h3>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};