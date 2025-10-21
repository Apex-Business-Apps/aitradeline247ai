import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Phone, MessageCircle } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';

import { PUBLIC_HELPLINE_E164, PUBLIC_HELPLINE_DISPLAY, PUBLIC_EMAIL } from "@/config/public";

const ThankYou = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('thank-you');
  }, [trackPageView]);

  return (
    <>
      <SEOHead
        title="Thank You - TradeLine 24/7"
        description="Thanks for signing up! Please check your inbox to confirm your email address."
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-primary/20 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-3xl">Thank You for Signing Up!</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Your journey with TradeLine 24/7 starts now
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-accent/50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Check Your Inbox
                  </h3>
                  <p className="text-muted-foreground">
                    We've sent a confirmation email to your address. Please click the link in the email to verify your account and get started.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> The email should arrive within a few minutes. Don't forget to check your spam folder if you don't see it.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What Happens Next?</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Confirm your email address</li>
                    <li>Sign in to your account</li>
                    <li>Set up your AI receptionist</li>
                    <li>Start capturing leads 24/7</li>
                  </ol>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">Need Help?</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button variant="outline" asChild className="justify-start">
                      <a href={`tel:${PUBLIC_HELPLINE_E164}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {PUBLIC_HELPLINE_DISPLAY}
                      </a>
                    </Button>
                    <Button variant="outline" asChild className="justify-start">
                      <a href={`mailto:${PUBLIC_EMAIL}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Email Support
                      </a>
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/auth">
                      Go to Sign In
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ThankYou;

