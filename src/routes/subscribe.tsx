import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { createCheckout } from "@/lib/api";
import { validatePhone, normalize } from "@/lib/phone";
import { onCheckoutStart } from "@/hooks/usePricingGa";
import { setSEO } from "@/lib/seo";

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'basic';
  
  const [formData, setFormData] = useState({
    name: '',
    email_to: '',
    target_e164: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSEO({
      title: `Subscribe to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — TradeLine 24/7`,
      description: `Start your AI receptionist service with our ${plan} plan. Quick setup, no contracts.`,
      path: `/subscribe?plan=${plan}`,
    });
  }, [plan]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'target_e164' ? normalize(value) : value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Business name is required');
      }
      
      if (!formData.email_to.trim()) {
        throw new Error('Email is required');
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_to)) {
        throw new Error('Please enter a valid email address');
      }

      const phoneValidation = validatePhone(formData.target_e164);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error);
      }

      // Track checkout start
      onCheckoutStart(plan);

      // Create checkout session
      const response = await createCheckout({
        name: formData.name.trim(),
        email_to: formData.email_to.trim().toLowerCase(),
        target_e164: normalize(formData.target_e164),
        plan: plan as 'basic' | 'pro' | 'enterprise'
      });

      // Redirect to Stripe Checkout
      window.location.href = response.url;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const planDetails = {
    basic: { name: 'Basic', price: '$149/month', description: 'Perfect for small businesses' },
    pro: { name: 'Pro', price: '$299/month', description: 'Advanced features for growing businesses' },
    enterprise: { name: 'Enterprise', price: '$599/month', description: 'Full-featured solution' }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails] || planDetails.basic;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-20">
        <div className="container max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Subscribe to {currentPlan.name}</CardTitle>
              <CardDescription>
                {currentPlan.description} • {currentPlan.price}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your Business Name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email_to}
                    onChange={(e) => handleInputChange('email_to', e.target.value)}
                    placeholder="contact@yourbusiness.com"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll send call notifications and receipts to this email
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Business Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.target_e164}
                    onChange={(e) => handleInputChange('target_e164', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    US/Canada numbers only. This is where we'll forward important calls.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating checkout...
                    </>
                  ) : (
                    `Continue to Payment • ${currentPlan.price}`
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>Secure payment powered by Stripe</p>
                <p>Cancel anytime • No setup fees</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subscribe;