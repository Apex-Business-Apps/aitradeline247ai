import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { setSEO } from "@/lib/seo";
import { pricingJsonLd } from "@/lib/jsonld";
import { onPricingView } from "@/hooks/usePricingGa";

const plans = [
  {
    name: "Basic",
    price: "$149 / month",
    description: "Perfect for small businesses getting started",
    features: [
      "24/7 AI receptionist",
      "Call forwarding and screening", 
      "Basic transcription",
      "Email notifications",
      "Up to 100 calls/month"
    ],
    cta: "Get Started",
    popular: false,
    id: "basic",
    plan: "basic"
  },
  {
    name: "Pro",
    price: "$299 / month", 
    description: "Advanced features for growing businesses",
    features: [
      "Everything in Basic",
      "Advanced AI conversation",
      "CRM integration",
      "Custom greetings",
      "Up to 500 calls/month",
      "Priority support"
    ],
    cta: "Choose Pro",
    popular: true,
    id: "pro", 
    plan: "pro"
  },
  {
    name: "Enterprise",
    price: "$599 / month",
    description: "Full-featured solution for large organizations", 
    features: [
      "Everything in Pro",
      "Unlimited calls",
      "Multi-line support",
      "Advanced analytics",
      "Custom integrations",
      "Dedicated account manager"
    ],
    cta: "Contact Sales",
    popular: false,
    id: "enterprise",
    plan: "enterprise"
  }
];

const Pricing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setSEO({
      title: "Pricing — TradeLine 24/7",
      description: "Choose the perfect AI receptionist plan for your business. 24/7 coverage starting at $149/month.",
      path: "/pricing",
    });
    
    // Track pricing page view
    onPricingView();
  }, []);

  const handlePlanSelect = (plan: string) => {
    navigate(`/subscribe?plan=${plan}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={index} id={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : ''}`}>
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
                      <span className="text-4xl font-bold">{plan.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      onClick={() => handlePlanSelect(plan.plan)}
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
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: pricingJsonLd(window.location.origin)
        }}
      />
    </div>
  );
};

export default Pricing;