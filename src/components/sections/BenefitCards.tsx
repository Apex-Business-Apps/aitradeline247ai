import { Zap, User, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const BenefitCards = () => {
  const benefits = [
    {
      icon: Zap,
      title: "Lightning Speed",
      description: "Respond to calls in under 2 rings. Never keep prospects waiting while you're busy or away.",
      color: "text-brand-orange"
    },
    {
      icon: User,
      title: "Personal Touch",
      description: "Each caller gets personalized attention with custom scripts tailored to your business needs.",
      color: "text-primary"
    },
    {
      icon: Target,
      title: "Cleaner Follow-through", 
      description: "Qualified leads delivered instantly with complete call summaries and next-step recommendations.",
      color: "text-accent-foreground"
    }
  ];

  return (
    <section className="py-20 bg-gradient-orange-subtle">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Why Choose TradeLine 24/7?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform every call into an opportunity with our intelligent reception system.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="border-border bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon className={`h-8 w-8 ${benefit.color}`} />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground leading-relaxed">
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