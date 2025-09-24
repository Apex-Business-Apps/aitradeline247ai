import { TrendingUp, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ImpactStrip = () => {
  const impacts = [{
    icon: TrendingUp,
    title: "More booked work",
    description: "Fewer voicemails means more conversations—and more wins.",
    color: "text-green-600"
  }, {
    icon: Clock,
    title: "Time back",
    description: "We cover nights and busy hours so you don't have to.",
    color: "text-blue-600"
  }, {
    icon: DollarSign,
    title: "Lower costs",
    description: "Coverage without hiring overhead.",
    color: "text-orange-600"
  }];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What changes when no call is missed
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {impacts.map((impact, index) => {
            const Icon = impact.icon;
            return (
              <Card key={index} className="text-center border-0 bg-background/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center mb-4">
                    <Icon className={`h-8 w-8 ${impact.color}`} />
                  </div>
                  <CardTitle className="text-xl">{impact.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {impact.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground font-medium">
            If you can't beat 'em, hire 'em!
          </p>
        </div>
      </div>
    </section>
  );
};