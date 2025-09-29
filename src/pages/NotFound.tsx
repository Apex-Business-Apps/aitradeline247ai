import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Search, Phone } from "lucide-react";
import { setSEO } from "@/lib/seo";

const NotFound = () => {
  useEffect(() => {
    setSEO({
      title: "Page Not Found — TradeLine 24/7",
      description: "The page you're looking for doesn't exist. Return to our homepage to find what you need.",
      path: "/404",
    });
  }, []);

  const popularPages = [
    { name: "Features", path: "/features", description: "Explore our AI receptionist features" },
    { name: "Pricing", path: "/pricing", description: "View our transparent pricing plans" },
    { name: "FAQ", path: "/faq", description: "Get answers to common questions" },
    { name: "Contact", path: "/contact", description: "Get in touch with our team" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Page Not Found
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button asChild size="lg" className="shadow-lg">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Popular Pages</h2>
              <p className="text-muted-foreground">Here are some pages you might find helpful</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {popularPages.map((page, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {page.name}
                    </CardTitle>
                    <CardDescription>{page.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={page.path}>
                        Visit Page
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container text-center">
            <div className="max-w-2xl mx-auto">
              <Search className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Still can't find what you're looking for?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our team is here to help. Get in touch and we'll point you in the right direction.
              </p>
              <Button asChild size="lg" className="shadow-lg">
                <Link to="/contact">
                  Contact Our Team
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;