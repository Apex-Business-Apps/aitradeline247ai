import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Phone, MessageSquare, Brain, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Reception",
    description: "Smart AI that handles calls, messages, and inquiries 24/7 with human-like responses",
    benefits: ["Natural conversation flow", "Multi-language support", "Learning capabilities", "Context awareness"]
  },
  {
    icon: Phone,
    title: "Intelligent Call Management", 
    description: "Advanced call routing, screening, and handling with real-time transcription",
    benefits: ["Smart call routing", "Voicemail transcription", "Call analytics", "Priority handling"]
  },
  {
    icon: MessageSquare,
    title: "Omnichannel Messaging",
    description: "Unified messaging across SMS, WhatsApp, email, and social platforms",
    benefits: ["Unified inbox", "Auto-responses", "Message templates", "Rich media support"]
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description: "Seamless integration with CRMs, calendars, and business tools",
    benefits: ["CRM integration", "Calendar sync", "Task automation", "Custom workflows"]
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with SOC 2 compliance and data protection",
    benefits: ["SOC 2 compliant", "End-to-end encryption", "GDPR ready", "Access controls"]
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a lead with round-the-clock AI receptionist coverage",
    benefits: ["Always available", "No breaks needed", "Consistent service", "Global coverage"]
  }
];

const Features = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Powerful Features
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Everything you need to transform customer interactions with AI-powered automation
              </p>
              <Button size="lg" className="shadow-lg">
                Start Free Trial
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using TradeLine 24/7 to grow their customer relationships
            </p>
            <Button size="lg" className="shadow-lg">
              Grow Now
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;