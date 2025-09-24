import { Zap, User, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
export const BenefitCards = () => {
  const benefits = [{
    icon: Zap,
    title: "Lightning Speed",
    description: "Respond to calls in under 2 rings. Never keep prospects waiting while you're busy or away.",
    color: "text-brand-orange"
  }, {
    icon: User,
    title: "Personal Touch",
    description: "Each caller gets personalized attention with custom scripts tailored to your business needs.",
    color: "text-primary"
  }, {
    icon: Target,
    title: "Cleaner Follow-through",
    description: "Qualified leads delivered instantly with complete call summaries and next-step recommendations.",
    color: "text-accent-foreground"
  }];
  return <section className="py-24 bg-gradient-orange-subtle relative overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-4xl md:text-5xl font-bold text-foreground">Why Choose</span>
            <Logo variant="text" size="xl" />
            <span className="text-4xl md:text-5xl font-bold text-foreground">?</span>
          </div>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-[#1e556b]">
            Transform every call into an opportunity with our intelligent reception system designed for modern businesses.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return <Card key={index} className="group border-border bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:scale-105">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                    <Icon className={`h-10 w-10 ${benefit.color} transition-transform group-hover:scale-110`} />
                  </div>
                  <CardTitle className="text-2xl text-card-foreground mb-3">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center leading-relaxed text-lg text-[#1e556b]">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>;
        })}
        </div>
      </div>
      
      {/* Subtle background elements */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl"></div>
    </section>;
};