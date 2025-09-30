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
import { useSecureABTest } from "@/hooks/useSecureABTest";
import { useSecureFormSubmission } from "@/hooks/useSecureFormSubmission";
import { z } from "zod";
// Client-side validation schema matching server-side
const leadFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name contains invalid characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  company: z.string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Company name must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, "Company name contains invalid characters"),
  notes: z.string()
    .trim()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .default("")
});

interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  company: string;
  notes: string;
}
export const LeadCaptureForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
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
  const { variant, variantData, convert } = useSecureABTest('hero_cta_test');
  const { secureSubmit, getRemainingAttempts } = useSecureFormSubmission({
    rateLimitKey: 'lead_form_submit',
    maxAttemptsPerHour: 3
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation with Zod
    const validationResult = leadFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Please check your input";
      toast({
        title: "Invalid Information",
        description: errorMessage,
        variant: "destructive"
      });
      trackFormSubmission('lead_capture', false, {
        error: 'validation_failed',
        variant: variant
      });
      return;
    }

    // Check rate limiting
    if (getRemainingAttempts() <= 0) {
      toast({
        title: "Too Many Attempts",
        description: "Please wait before submitting another lead form.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    trackButtonClick('lead_form_submit', 'lead_capture_form');
    try {

      // Submit using secure submission hook
      const response = await secureSubmit<{success: boolean; leadId: string; leadScore: number; remainingAttempts: number}>('secure-lead-submission', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        notes: formData.notes,
        source: 'website_lead_form'
      });

      // Track successful form submission
      trackFormSubmission('lead_capture', true, {
        lead_score: response.leadScore || 0,
        email_domain: formData.email.split('@')[1],
        variant: variant
      });

      // Track conversion for A/B test
      await convert(response.leadScore || 50);

      // Track business conversion
      trackConversion('lead_generated', response.leadScore || 50, {
        source: 'website_form',
        variant: variant
      });
      setIsSuccess(true);
      toast({
        title: "🚀 Welcome to TradeLine 24/7!",
        description: "Thanks—check your email. We'll follow up within 2 hours."
      });

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
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
        description: "Something went wrong. Please try again.",
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
          <Card className="max-w-md mx-auto text-center shadow-2xl border-0 bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm animate-scale-in">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl animate-fade-in">🎉 Welcome Aboard!</CardTitle>
              <CardDescription className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                Thanks—check your email. We'll follow up within 2 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Our team will contact you within <strong>2 hours</strong> to get you started.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsSuccess(false)} 
                className="w-full hover-scale transition-all duration-300 animate-fade-in" 
                style={{ animationDelay: '600ms' }}
              >
                Submit Another Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>;
  }
  return <section className="py-20 pb-32 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tell us a bit about you
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-[#1e556b]">
            Get started with your free trial today.
          </p>
        </div>

        <Card className="max-w-lg mx-auto shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="animate-fade-in">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                Start Your Free Trial
              </CardTitle>
              <CardDescription className="text-center mt-2">
                Tell us about your business and we'll set up your service
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="-mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <Label htmlFor="lead-name">Your name *</Label>
                <Input 
                  id="lead-name" 
                  placeholder="Your name" 
                  value={formData.name} 
                  onChange={e => handleInputChange("name", e.target.value)} 
                  required 
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <Label htmlFor="lead-email">Work email *</Label>
                <Input 
                  id="lead-email" 
                  type="email" 
                  placeholder="Work email" 
                  value={formData.email} 
                  onChange={e => handleInputChange("email", e.target.value)} 
                  required 
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                <Label htmlFor="lead-phone">Best number</Label>
                <Input 
                  id="lead-phone" 
                  type="tel" 
                  placeholder="Best number" 
                  value={formData.phone || ""} 
                  onChange={e => handleInputChange("phone" as keyof LeadFormData, e.target.value)} 
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                <Label htmlFor="lead-company">Company name *</Label>
                <Input 
                  id="lead-company" 
                  placeholder="Company name" 
                  value={formData.company} 
                  onChange={e => handleInputChange("company", e.target.value)} 
                  required 
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
                <Label htmlFor="lead-notes">What do you want help with?</Label>
                <Textarea 
                  id="lead-notes" 
                  placeholder="What do you want help with?" 
                  value={formData.notes} 
                  onChange={e => handleInputChange("notes", e.target.value)} 
                  className="min-h-[100px] transition-all duration-300 focus:scale-105" 
                />
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                <label className="flex items-start space-x-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary transition-all duration-200"
                  />
                  <span>
                I agree to get emails about setup and updates. Unsubscribe anytime.
                  </span>
                </label>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '700ms' }}>
                <Button 
                  type="submit" 
                  size="lg" 
                  variant={ctaVariant} 
                  className="w-full shadow-lg hover:shadow-xl transition-all duration-300 hover-scale" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </> : <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Grow now
                    </>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>;
};