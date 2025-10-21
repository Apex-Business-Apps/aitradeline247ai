import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, CheckCircle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Demo = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Demo - TradeLine 24/7 AI Receptionist"
        description="See TradeLine 24/7 AI receptionist in action. Watch demo videos, schedule a live demo, and experience how our 24/7 AI handles customer calls."
        keywords="AI receptionist demo, TradeLine 24/7 demo, customer service automation demo, AI phone system demo"
        canonical="https://www.tradeline247ai.com/demo"
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              See TradeLine 24/7 in Action
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Experience how our AI receptionist handles calls, captures leads, and integrates with your business 24/7.
            </p>
          </div>
        </section>

        {/* Demo Options */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Video Demo */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Watch Demo Video</CardTitle>
                  <CardDescription>
                    See real examples of TradeLine 24/7 handling customer calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Live call demonstrations
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Dashboard walkthrough
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Integration examples
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline" asChild>
                    <a href="/#hero-section">Watch Demo</a>
                  </Button>
                </CardContent>
              </Card>

              {/* Live Demo */}
              <Card className="hover:shadow-lg transition-shadow border-primary/50">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Schedule Live Demo</CardTitle>
                  <CardDescription>
                    Book a personalized demo with our team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      30-minute one-on-one session
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Tailored to your business
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Q&A with our experts
                    </li>
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to="/contact">Book Your Demo</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Features Highlight */}
            <div className="mt-20 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">What You'll See</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Call Handling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Watch how our AI answers calls, understands customer needs, and routes inquiries intelligently.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Capture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      See how every conversation is captured, transcribed, and organized for easy follow-up.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CRM Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Experience seamless integration with your existing tools and workflows.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Customer Service?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses already using TradeLine 24/7 to never miss a customer call.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Demo;

