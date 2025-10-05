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
      feature: "24/7 Availability",
      tradeline: true,
      traditional: false,
      notes: "Always on, even holidays"
    },
    {
      feature: "Setup Time",
      tradeline: "< 24 hours",
      traditional: "2-4 weeks",
      notes: "Quick deployment"
    },
    {
      feature: "Monthly Cost",
      tradeline: "$249",
      traditional: "$3,000+",
      notes: "Per receptionist"
    },
    {
      feature: "Call Volume",
      tradeline: "Unlimited",
      traditional: "Limited",
      notes: "Scale instantly"
    },
    {
      feature: "CRM Integration",
      tradeline: true,
      traditional: "Manual",
      notes: "Automatic sync"
    },
    {
      feature: "Call Transcription",
      tradeline: true,
      traditional: false,
      notes: "Every call documented"
    },
    {
      feature: "Multilingual",
      tradeline: true,
      traditional: "Extra cost",
      notes: "Built-in support"
    },
    {
      feature: "Training Required",
      tradeline: false,
      traditional: true,
      notes: "AI learns continuously"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Compare - TradeLine 24/7 vs Traditional Receptionists"
        description="Compare TradeLine 24/7 AI receptionist with traditional answering services. See cost savings, faster setup, 24/7 availability, and unlimited scalability."
        keywords="AI receptionist comparison, answering service comparison, TradeLine 24/7 vs traditional receptionist, AI vs human receptionist"
        canonical="https://www.tradeline247ai.com/compare"
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TradeLine 24/7 vs Traditional Services
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              See why businesses are switching from traditional answering services to AI-powered customer engagement.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-5xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl md:text-3xl">Feature Comparison</CardTitle>
                  <CardDescription>
                    A detailed look at how TradeLine 24/7 compares to traditional receptionist services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-4 px-4">Feature</th>
                          <th className="text-center py-4 px-4 bg-primary/5">
                            <Badge className="mb-2">TradeLine 24/7</Badge>
                          </th>
                          <th className="text-center py-4 px-4">Traditional Service</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.map((row, index) => (
                          <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4 font-medium">
                              {row.feature}
                              <div className="text-xs text-muted-foreground mt-1">{row.notes}</div>
                            </td>
                            <td className="text-center py-4 px-4 bg-primary/5">
                              {typeof row.tradeline === 'boolean' ? (
                                row.tradeline ? (
                                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="font-semibold text-primary">{row.tradeline}</span>
                              )}
                            </td>
                            <td className="text-center py-4 px-4">
                              {typeof row.traditional === 'boolean' ? (
                                row.traditional ? (
                                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-6 h-6 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-muted-foreground">{row.traditional}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Cost Comparison</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-primary/50 shadow-lg">
                  <CardHeader>
                    <Badge className="w-fit mb-2">TradeLine 24/7</Badge>
                    <CardTitle>$249/month</CardTitle>
                    <CardDescription>Complete AI receptionist service</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Unlimited calls & messages</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">24/7 availability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Full CRM integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">No setup fees</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">Traditional Service</Badge>
                    <CardTitle>$3,000+/month</CardTitle>
                    <CardDescription>Per full-time receptionist</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Limited to business hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Manual data entry</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Training & onboarding costs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Additional costs for coverage</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 text-center p-8 bg-background rounded-lg border">
                <h3 className="text-2xl font-bold mb-2">Save Over $33,000 Annually</h3>
                <p className="text-muted-foreground mb-6">
                  Switch to TradeLine 24/7 and invest those savings back into growing your business.
                </p>
                <Button size="lg" asChild>
                  <Link to="/auth">Start Saving Today</Link>
                </Button>
              </div>
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
