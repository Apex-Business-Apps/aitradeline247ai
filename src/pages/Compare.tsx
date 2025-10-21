import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

const Compare = () => {
  const comparisonData = [
    {
      feature: "Answering Model",
      tradeline: "AI-powered",
      smithAI: "Human agents",
      smithAIBot: "AI assistant",
      ruby: "Human agents",
      callrail: "AI assist",
      notes: "Type of service"
    },
    {
      feature: "Availability",
      tradeline: "24/7/365",
      smithAI: "24/7",
      smithAIBot: "24/7",
      ruby: "24/7",
      callrail: "Business hours+",
      notes: "Coverage hours"
    },
    {
      feature: "Pricing Style",
      tradeline: "Flat monthly",
      smithAI: "Per-call/minute",
      smithAIBot: "Per-call",
      ruby: "Per-call/minute",
      callrail: "Per-minute",
      notes: "Billing approach"
    },
    {
      feature: "Multilingual",
      tradeline: "Yes",
      smithAI: "Limited",
      smithAIBot: "Yes",
      ruby: "Spanish available",
      callrail: "Limited",
      notes: "Language support"
    },
    {
      feature: "Data Ownership",
      tradeline: "Customer-owned",
      smithAI: "Customer-owned",
      smithAIBot: "Customer-owned",
      ruby: "Customer-owned",
      callrail: "Customer-owned",
      notes: "Who owns call data"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Compare - TradeLine 24/7 vs Alternatives"
        description="Compare TradeLine 24/7 with Smith.ai, Ruby, and CallRail. See pricing models, availability, features, and multilingual support differences."
        keywords="AI receptionist comparison, Smith.ai vs TradeLine, Ruby receptionist comparison, CallRail comparison, answering service comparison"
        canonical="https://www.tradeline247ai.com/compare"
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TradeLine 24/7 vs Alternatives
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Compare features, pricing, and capabilities across leading answering service providers.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-5xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl md:text-3xl">Provider Comparison</CardTitle>
                  <CardDescription>
                    Key features across TradeLine 24/7, Smith.ai, Ruby, and CallRail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 min-w-[120px]">Feature</th>
                          <th className="text-center py-3 px-2 bg-primary/5 min-w-[100px]">
                            <Badge className="mb-1 text-xs">TradeLine 24/7</Badge>
                          </th>
                          <th className="text-center py-3 px-2 min-w-[100px]">Smith.ai (Human)</th>
                          <th className="text-center py-3 px-2 min-w-[100px]">Smith.ai (AI)</th>
                          <th className="text-center py-3 px-2 min-w-[100px]">Ruby</th>
                          <th className="text-center py-3 px-2 min-w-[100px]">CallRail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((row, index) => (
                          <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-2 font-medium">
                              {row.feature}
                              <div className="text-xs text-muted-foreground mt-0.5">{row.notes}</div>
                            </td>
                            <td className="text-center py-3 px-2 bg-primary/5">
                              <span className="font-semibold text-primary text-xs">{row.tradeline}</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="text-muted-foreground text-xs">{row.smithAI}</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="text-muted-foreground text-xs">{row.smithAIBot}</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="text-muted-foreground text-xs">{row.ruby}</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="text-muted-foreground text-xs">{row.callrail}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground italic text-center">
                    * Figures and features change; please confirm details on vendor websites before making purchasing decisions.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Why Choose TradeLine 24/7?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Flat monthly pricing with unlimited calls, no per-minute charges, and true 24/7 AI-powered coverage.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Predictable Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Flat monthly fee means no surprises—budget with confidence.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">True 24/7/365</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      AI never sleeps, never takes breaks—always available for your customers.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instant Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      10-minute setup—no training periods or onboarding delays.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Button size="lg" asChild>
                <Link to="/pricing">View Our Pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Customer Success */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Join Hundreds of Satisfied Businesses</h2>
              <p className="text-lg text-muted-foreground mb-12">
                Companies across industries trust TradeLine 24/7 to handle their customer communications professionally and efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/pricing">View Pricing</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/demo">Schedule Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Compare;

