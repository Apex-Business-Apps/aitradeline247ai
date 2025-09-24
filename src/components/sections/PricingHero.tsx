import { CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import officialLogo from '@/assets/official-logo.svg';

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for small businesses getting started",
    features: [
      "Up to 100 calls/month",
      "Basic AI responses",
      "Email integration",
      "Call transcription"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Growth", 
    price: 149,
    description: "Ideal for growing businesses with higher volume",
    features: [
      "Up to 1,000 calls/month",
      "Advanced AI capabilities",
      "CRM integration",
      "Advanced analytics"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: 499,
    description: "Custom solutions for large organizations",
    features: [
      "Unlimited calls",
      "Custom AI training",
      "Full API access",
      "Advanced security"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export const PricingHero = () => {
  return (
    <section className="py-20 bg-gradient-orange-subtle">
      <div className="container">
        {/* Hero Content */}
        <div className="text-center mb-16">
          {/* Hero Logo */}
          <div className="mb-2">
            <img 
              src={officialLogo} 
              alt="TradeLine AI - 24/7 AI Receptionist" 
              className="h-44 md:h-[16.5rem] lg:h-[19.8rem] w-auto mx-auto drop-shadow-2xl -mt-8"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-brand-orange">
            Your 24/7 A<span className="text-primary">i</span> Receptionist
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Never miss a call. Your Ai Receptionist answers all calls, books jobs and schedules your appointments. Work while you sleep
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 rounded-full shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105 mb-2">
            Start Free Trial
          </Button>
          <p className="text-sm text-muted-foreground">14-day free trial • No credit card required</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  size="default"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};