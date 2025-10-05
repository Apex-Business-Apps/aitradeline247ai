import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  Shield, Clock, Globe, Zap, TrendingUp, Users, 
  Lock, CheckCircle, DollarSign, Phone, MessageSquare, Calendar 
} from "lucide-react";

const PlatformStats = () => {
  const securityFeatures = [
    { icon: Shield, label: "Bank-Level Security", value: "A+ Rating", detail: "Your customer data is safer than most banks" },
    { icon: Lock, label: "Privacy Protected", value: "100%", detail: "All customer info is encrypted and masked" },
    { icon: CheckCircle, label: "Compliance", value: "5 Standards", detail: "Meets Canadian & US privacy laws" },
  ];

  const performanceStats = [
    { icon: Clock, label: "Always Available", value: "24/7/365", detail: "Never miss a call, even at 3 AM" },
    { icon: Zap, label: "Response Time", value: "<1 Second", detail: "Answers faster than any human" },
    { icon: Globe, label: "Uptime Guarantee", value: "99.9%", detail: "More reliable than traditional phones" },
  ];

  const businessImpact = [
    { icon: Phone, label: "Calls Handled", value: "Unlimited", detail: "No busy signals, ever", color: "text-blue-600" },
    { icon: MessageSquare, label: "Customer Reach", value: "3 Channels", detail: "Phone, SMS, and WhatsApp", color: "text-green-600" },
    { icon: Calendar, label: "Auto Booking", value: "Instant", detail: "Schedules appointments while you sleep", color: "text-purple-600" },
    { icon: TrendingUp, label: "Lead Capture", value: "100%", detail: "Never lose another potential customer", color: "text-orange-600" },
    { icon: Users, label: "Team Size Needed", value: "0", detail: "No receptionist salary required", color: "text-pink-600" },
    { icon: DollarSign, label: "Cost vs Hiring", value: "90% Less", detail: "Save $30,000+ per year", color: "text-emerald-600" },
  ];

  const technicalSpecs = [
    { category: "Core Capabilities", items: [
      "Answers calls in under 1 second",
      "Speaks English and French",
      "Handles unlimited simultaneous calls",
      "Books appointments automatically",
      "Sends confirmation messages",
      "Routes urgent calls to you"
    ]},
    { category: "Your Business Benefits", items: [
      "Never pay overtime or benefits",
      "No sick days or vacation coverage",
      "Works holidays and weekends",
      "Scales with your business growth",
      "Learns your business preferences",
      "Improves customer satisfaction"
    ]},
    { category: "Safety & Compliance", items: [
      "Meets all Canadian privacy laws (PIPEDA)",
      "Complies with US regulations (CCPA)",
      "Automatic data backup every day",
      "Customer info never shared or sold",
      "Secure phone number masking",
      "Complete call history tracking"
    ]},
    { category: "Integration & Setup", items: [
      "Works with your existing phone number",
      "Connects to Google Calendar",
      "Syncs with popular CRM systems",
      "Sends alerts to Slack or Teams",
      "No technical knowledge required",
      "Up and running in under 1 hour"
    ]},
  ];

  const savings = [
    { label: "vs. Full-Time Receptionist", amount: "$32,000", period: "per year" },
    { label: "vs. Answering Service", amount: "$18,000", period: "per year" },
    { label: "vs. Missed Calls (Lost Revenue)", amount: "$50,000+", period: "per year" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Platform Overview</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Why TradeLine 24/7 Works Better
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Simple numbers that show how we help your business grow
          </p>
        </div>

        {/* Security Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Your Customer Data is Safe</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {securityFeatures.map((feature) => (
              <Card key={feature.label} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <feature.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-lg">{feature.label}</CardTitle>
                  </div>
                  <CardDescription className="text-3xl font-bold text-foreground">
                    {feature.value}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Performance Stats */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Always On, Always Fast</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {performanceStats.map((stat) => (
              <Card key={stat.label} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-lg">{stat.label}</CardTitle>
                  </div>
                  <CardDescription className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{stat.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Business Impact */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">What This Means for Your Business</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {businessImpact.map((impact) => (
              <Card key={impact.label} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <impact.icon className={`h-8 w-8 ${impact.color}`} />
                    <CardTitle className="text-lg">{impact.label}</CardTitle>
                  </div>
                  <CardDescription className="text-3xl font-bold text-foreground">
                    {impact.value}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{impact.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cost Savings */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Real Money Saved</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {savings.map((saving) => (
              <Card key={saving.label} className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardHeader>
                  <CardTitle className="text-lg text-muted-foreground">{saving.label}</CardTitle>
                  <CardDescription className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {saving.amount}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{saving.period}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-xl font-semibold text-muted-foreground">
              That's like getting a full-time employee for less than minimum wage
            </p>
          </div>
        </section>

        {/* Technical Specs in Plain English */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">What You Get (In Plain English)</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {technicalSpecs.map((spec) => (
              <Card key={spec.category}>
                <CardHeader>
                  <CardTitle className="text-xl">{spec.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {spec.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center bg-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Stop Missing Calls?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join businesses that never miss an opportunity. No contracts, cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/#grow-now" 
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
            </a>
            <a 
              href="/pricing" 
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              See Pricing
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PlatformStats;
