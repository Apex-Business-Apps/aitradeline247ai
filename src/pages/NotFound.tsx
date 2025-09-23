import React from 'react';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container text-center">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-4xl mb-2">404</CardTitle>
              <CardDescription className="text-xl">
                Oops! Page Not Found
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved. 
                Don't worry, our AI receptionist is still here to help!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Looking for something specific?</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/features')}>
                    Features
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>
                    Pricing
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/faq')}>
                    FAQ
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/contact')}>
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