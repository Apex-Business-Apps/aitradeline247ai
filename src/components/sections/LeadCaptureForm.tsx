import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useABTest } from "@/hooks/useABTest";
interface LeadFormData {
  name: string;
  email: string;
  company: string;
  notes: string;
}
export const LeadCaptureForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    company: "",
    notes: ""
  });
  const {
    toast
  } = useToast();
  const {
    trackFormSubmission,
    trackConversion,
    trackButtonClick
  } = useAnalytics();
  const {
    variant,
    variantData,
    convert
  } = useABTest('hero_cta_test');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name, email, and company name.",
        variant: "destructive"
      });
      trackFormSubmission('lead_capture', false, {
        error: 'missing_required_fields',
        variant: variant
      });
      return;
    }
    setIsSubmitting(true);
    trackButtonClick('lead_form_submit', 'lead_capture_form');
    try {
      console.log("Submitting lead:", formData);

      // Submit lead via email function
      const {
        data: emailData,
        error: emailError
      } = await supabase.functions.invoke('send-lead-email', {
        body: formData
      });
      if (emailError) {
        console.error("Email function error:", emailError);
        throw emailError;
      }

      // Store lead in database with automatic scoring
      const {
        data: leadData,
        error: leadError
      } = await supabase.from('leads').insert([{
        name: formData.name,
        email: formData.email,
        company: formData.company,
        notes: formData.notes,
        source: 'website_lead_form'
      }]).select().single();
      if (leadError) {
        console.error("Lead storage error:", leadError);
        // Don't throw here - email was sent successfully
      }
      console.log("Lead submission successful:", {
        emailData,
        leadData
      });

      // Track successful form submission
      trackFormSubmission('lead_capture', true, {
        lead_score: leadData?.lead_score || 0,
        email_domain: formData.email.split('@')[1],
        variant: variant
      });

      // Track conversion for A/B test
      await convert(leadData?.lead_score || 50);

      // Track business conversion
      trackConversion('lead_generated', leadData?.lead_score || 50, {
        source: 'website_form',
        variant: variant
      });
      setIsSuccess(true);
      toast({
        title: "🚀 Welcome to TradeLine 24/7!",
        description: "We've sent you an email with next steps. Our team will contact you within 2 hours."
      });

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          company: "",
          notes: ""
        });
        setIsSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error("Lead submission error:", error);
      trackFormSubmission('lead_capture', false, {
        error: error.message || 'unknown_error',
        variant: variant
      });
      toast({
        title: "Oops! Something went wrong",
        description: error.message || "Please try again or contact us directly at info@tradeline247ai.com",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get button text and color from A/B test
  const ctaText = variantData.text || "Grow Now";
  const ctaVariant = variantData.color === "secondary" ? "secondary" : "default";
  if (isSuccess) {
    return <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">🎉 Welcome Aboard!</CardTitle>
              <CardDescription>
                Your AI receptionist setup is starting! Check your email for next steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Our team will contact you within <strong>2 hours</strong> to get you started.
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsSuccess(false)} className="w-full">
                Submit Another Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>;
  }
  return <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-[#1e556b]">
            Join thousands of businesses already using TradeLine 24/7. Get started with your AI receptionist today.
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Start Your Free Trial
            </CardTitle>
            <CardDescription className="text-center">
              Tell us about your business and we'll set up your AI receptionist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="lead-name">Full Name *</Label>
                <Input id="lead-name" placeholder="Enter your full name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="lead-email">Work Email *</Label>
                <Input id="lead-email" type="email" placeholder="name@company.com" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="lead-company">Company Name *</Label>
                <Input id="lead-company" placeholder="Your Company Inc." value={formData.company} onChange={e => handleInputChange("company", e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="lead-notes">Tell us about your needs</Label>
                <Textarea id="lead-notes" placeholder="How many calls do you get per day? What's your biggest customer service challenge?" value={formData.notes} onChange={e => handleInputChange("notes", e.target.value)} className="min-h-[100px]" />
              </div>

              <Button type="submit" size="lg" variant={ctaVariant} className="w-full shadow-lg" disabled={isSubmitting}>
                {isSubmitting ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting Up Your AI...
                  </> : <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {ctaText}
                  </>}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. 
                <br />
                No spam, unsubscribe anytime.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>;
};