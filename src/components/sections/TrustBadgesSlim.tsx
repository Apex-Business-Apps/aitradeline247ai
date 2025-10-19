import { Shield, Clock, Globe } from "lucide-react";

export const TrustBadgesSlim = () => {
  const badges = [
    { icon: Shield, title: "SOC 2 Compliant" },
    { icon: Globe, title: "PIPEDA/PIPA Ready" },
    { icon: Clock, title: "24/7 Available" }
  ];

  return (
    <section className="py-8 bg-muted/20 border-t">
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          <span className="text-sm font-medium text-muted-foreground">Trusted by Enterprise:</span>
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{badge.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
