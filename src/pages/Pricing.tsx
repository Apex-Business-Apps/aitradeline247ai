import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for small businesses getting started",
    features: [
      "Up to 100 calls/month",
      "Basic AI responses",
      "Email integration",
      "Standard support",
      "Call transcription",
      "Basic analytics"
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
      "Priority support",
      "Advanced analytics", 
      "Custom workflows",
      "WhatsApp integration",
      "Multi-language support"
    ],
    cta: "Grow Now",
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
      "Dedicated support",
      "Advanced security",
      "Custom integrations",
      "White-label options", 
      "SLA guarantees"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Pricing - TradeLine 24/7 AI Receptionist Plans"
        description="Simple, transparent pricing for 24/7 AI receptionist services. Starting at $49/month with 14-day free trial. Starter, Growth & Enterprise plans available."
        keywords="AI receptionist pricing, business automation cost, 24/7 customer service plans, AI phone answering pricing"
        canonical="https://tradeline247.com/pricing"
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Choose the perfect plan for your business. All plans include our core AI receptionist features with 14-day free trial.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <div className="text-center mt-16 p-8 bg-muted/30 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">All Plans Include</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Security & Compliance</h4>
                  <p className="text-muted-foreground">SOC 2 compliant, GDPR ready, bank-level security</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">24/7 AI Coverage</h4>
                  <p className="text-muted-foreground">Never miss a call or message, even on weekends</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Easy Setup</h4>
                  <p className="text-muted-foreground">Get started in minutes with our guided onboarding</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              <div>
                <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-muted-foreground text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-muted-foreground text-sm">No setup fees. All plans include free onboarding and training to get you started quickly.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
                <p className="text-muted-foreground text-sm">We'll notify you before limits are reached and help you upgrade to a plan that fits your needs.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-muted-foreground text-sm">Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;