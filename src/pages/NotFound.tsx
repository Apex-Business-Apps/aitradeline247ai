import React from 'react';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, AlertTriangle, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="404 - Page Not Found | TradeLine 24/7"
        description="The page you're looking for doesn't exist. Return to TradeLine 24/7 for 24/7 AI receptionist services and business automation solutions."
        canonical="https://www.tradeline247ai.com/404"
        noIndex={true}
      />
      
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container text-center">
          <Card 
            className="max-w-lg mx-auto border-0"
            style={{ 
              boxShadow: 'var(--premium-shadow-medium)',
              background: 'linear-gradient(135deg, hsl(var(--card) / 0.98) 0%, hsl(var(--card) / 0.95) 100%)'
            }}
          >
            <CardHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-brand-orange-primary/10 to-brand-orange-light/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-orange-primary/20">
                <Bot className="w-10 h-10 text-brand-orange-primary" />
              </div>
              <CardTitle className="text-5xl mb-4 bg-gradient-to-r from-brand-orange-primary to-brand-orange-light bg-clip-text text-transparent">
                404
              </CardTitle>
              <CardDescription className="text-xl font-medium">
                Oops! This page wandered off
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <p className="text-muted-foreground text-base leading-relaxed">
                  The page you're looking for doesn't exist or has been moved. 
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Don't worry! Our AI receptionist is still here 24/7 to help your business grow.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              </div>
              
              <div className="pt-6 border-t border-border/50">
                <h3 className="font-semibold mb-4 text-foreground/90">Popular pages</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/features')}
                    className="h-10 justify-start hover:bg-primary/5"
                  >
                    Features
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/pricing')}
                    className="h-10 justify-start hover:bg-primary/5"
                  >
                    Pricing
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/faq')}
                    className="h-10 justify-start hover:bg-primary/5"
                  >
                    FAQ
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/contact')}
                    className="h-10 justify-start hover:bg-primary/5"
                  >
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;