import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";

const plans = [
  {
    name: "Zero-Monthly Plan (Pilot)",
    price: "$149 CAD setup fee",
    description: "One-time setup, then pay only for results",
    features: [
      "$149 CAD one-time setup fee",
      "No monthly fees - pay per qualified appointment",
      "Prepaid wallet: $200 minimum (auto-recharge)",
      "Qualified = unique caller • >60s talk time • in service area • not duplicate (30d) • real intent",
      "Transcript emailed every time"
    ],
    cta: "Start Zero-Monthly",
    popular: false,
    id: "no-monthly",
    link: "/auth?plan=commission"
  },
  {
    name: "Predictable Plan",
    price: "$69 CAD setup + $249 CAD/month", 
    description: "Fixed monthly pricing with one-time setup",
    features: [
      "$69 CAD one-time setup fee",
      "$249 CAD per month",
      "Includes AI minutes & routed calls",
      "Simple overage pricing",  
      "Add-ons: bilingual, human fallback, CRM push"
    ],
    cta: "Choose Predictable",
    popular: true,
    id: "monthly-core",
    link: "/auth?plan=core"
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Pricing - TradeLine 24/7 AI Receptionist Plans"
        description="Simple, transparent pricing for 24/7 AI receptionist services. Commission-only or $249/month plans. No setup fees. Edmonton, AB business."
        keywords="AI receptionist pricing, business automation cost, 24/7 customer service plans, AI phone answering pricing, Edmonton business"
        canonical="https://www.tradeline247ai.com/pricing"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "TradeLine 24/7 AI Receptionist Service",
          "description": "24/7 AI receptionist and customer service automation for businesses",
          "brand": {
            "@type": "Organization",
            "name": "Apex Business Systems"
          },
          "offers": [
            {
              "@type": "Offer",
              "name": "Zero-Monthly Plan (Pilot)",
              "price": "149",
              "priceCurrency": "CAD",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "149",
                "priceCurrency": "CAD",
                "unitText": "one-time setup fee"
              },
              "description": "One-time setup, then pay only for results",
              "url": "https://www.tradeline247ai.com/auth?plan=commission"
            },
            {
              "@type": "Offer", 
              "name": "Predictable Plan",
              "price": "318",
              "priceCurrency": "CAD",
              "priceSpecification": {
                "@type": "AggregateOffer",
                "lowPrice": "69",
                "highPrice": "249",
                "priceCurrency": "CAD",
                "offers": [
                  {
                    "@type": "Offer",
                    "price": "69",
                    "priceCurrency": "CAD",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "69",
                      "priceCurrency": "CAD",
                      "unitText": "one-time setup fee"
                    }
                  },
                  {
                    "@type": "Offer",
                    "price": "249",
                    "priceCurrency": "CAD",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": "249",
                      "priceCurrency": "CAD",
                      "unitText": "per month"
                    }
                  }
                ]
              },
              "description": "Fixed monthly pricing with one-time setup",
              "url": "https://www.tradeline247ai.com/auth?plan=core"
            }
          ]
        }}
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-background to-secondary/20" style={{
          paddingTop: 'max(env(safe-area-inset-top, 0), 5rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0), 5rem)',
          paddingLeft: 'env(safe-area-inset-left, 0)',
          paddingRight: 'env(safe-area-inset-right, 0)'
        }}>
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mt-0 mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                      asChild
                    >
                      <a href={plan.link}>{plan.cta}</a>
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
                  <h4 className="font-semibold mb-2">
                    <a href="/security" className="text-primary hover:underline">Security & Compliance</a>
                  </h4>
                  <p className="text-muted-foreground">SOC 2 compliant, GDPR ready, bank-level security</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">24/7 AI Coverage</h4>
                  <p className="text-muted-foreground">Never miss a call or message, even on weekends</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    <a href="/compare" className="text-primary hover:underline">Why Choose Us?</a>
                  </h4>
                  <p className="text-muted-foreground">See how we compare to traditional services</p>
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
                <h3 className="font-semibold mb-2">What are the setup fees?</h3>
                <p className="text-muted-foreground text-sm">Zero-Monthly Plan: $149 CAD one-time setup. Predictable Plan: $69 CAD one-time setup. All plans include onboarding and training.</p>
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
