import { Zap, User, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const BenefitsGrid = () => {
  const benefits = [{
    icon: Zap,
    title: "Lightning Speed",
    description: "Answer in 2–3 rings so people stay.",
    color: "text-brand-orange",
    gradient: "from-orange-500/20 to-orange-600/10"
  }, {
    icon: User,
    title: "Personal Touch", 
    description: "A friendly, on-brand script that sounds like your team.",
    color: "text-primary",
    gradient: "from-blue-500/20 to-blue-600/10"
  }, {
    icon: Target,
    title: "Cleaner Follow-through",
    description: "A short summary lands in your inbox—next steps included.",
    color: "text-accent-foreground", 
    gradient: "from-green-500/20 to-green-600/10"
  }];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The TradeLine 24/7 Difference
          </h2>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-[#1e556b]">
            Three ways we keep your business moving
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index} 
                className={`group border-border bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover-scale cursor-pointer animate-fade-in`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader className="text-center pb-6">
                  <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-current/20 transition-all duration-300 hover-scale`}>
                    <Icon className={`h-10 w-10 ${benefit.color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`} />
                  </div>
                  <CardTitle className="text-2xl text-card-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center leading-relaxed text-lg text-[#1e556b] group-hover:text-foreground transition-colors duration-300">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};