import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Sparkles, Clock, DollarSign } from "lucide-react";
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

interface LeadCaptureCardProps { compact?: boolean }
export const LeadCaptureCard = ({ compact = false }: LeadCaptureCardProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: ""
  });

  const { toast } = useToast();
  const { trackFormSubmission, trackConversion, trackButtonClick } = useAnalytics();
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
        description: "Thanks! Check your email. We'll follow up within 2 hours."
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
    return (
      <Card className="max-w-md mx-auto text-center shadow-2xl border-0 bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm animate-scale-in">
        <CardHeader>
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl animate-fade-in">Got it!</CardTitle>
          <CardDescription className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            Check your email. We'll get back to you within 2 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
            <p className="text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 inline mr-1" />
              We'll reach out within <strong>2 hours</strong> to get you set up.
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
    );
  }

  return (
    <div className={"text-center " + (compact ? "" : "mb-8") }>
      {!compact && (
        <>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tell us about your business
          </h2>
          <p className="text-lg mb-8 text-[#1e556b]">
            Start your free trial today.
          </p>
        </>
      )}

      <Card className="w-full bg-card/95 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg md:text-xl text-foreground mb-1">
            Start Your Free Trial
          </CardTitle>
          <p className="text-muted-foreground">
            Tell us about your business and we'll get you set up
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Left Column: Form Fields */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground mb-3">Your Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="lead-name" className="text-sm font-medium text-foreground">
                      Your name *
                    </Label>
                    <input 
                      id="lead-name" 
                      placeholder="Your name" 
                      value={formData.name} 
                      onChange={e => handleInputChange("name", e.target.value)} 
                      required 
                      className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lead-email" className="text-sm font-medium text-foreground">
                      Work email *
                    </Label>
                    <input 
                      id="lead-email" 
                      type="email" 
                      placeholder="Work email" 
                      value={formData.email} 
                      onChange={e => handleInputChange("email", e.target.value)} 
                      required 
                      className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lead-company" className="text-sm font-medium text-foreground">
                      Company name *
                    </Label>
                    <input 
                      id="lead-company" 
                      placeholder="Company name" 
                      value={formData.company} 
                      onChange={e => handleInputChange("company", e.target.value)} 
                      required 
                      className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lead-notes" className="text-sm font-medium text-foreground">
                      What do you want help with?
                    </Label>
                    <textarea 
                      id="lead-notes" 
                      placeholder="What do you want help with?" 
                      value={formData.notes} 
                      onChange={e => handleInputChange("notes", e.target.value)} 
                      className="w-full mt-1 px-2 py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="flex items-start space-x-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        required
                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>
                        I'm cool with emails about setup and updates. Unsubscribe anytime.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Next Steps */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground mb-3">Next Steps</h3>
                
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground text-xs">Response Time</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      2 hours
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Setup Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      Free
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Demo call</span>
                      <span className="font-medium text-foreground">15 mins</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Setup time</span>
                      <span className="font-medium text-foreground">10 minutes</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Trial period</span>
                      <span className="font-medium text-primary">14 days</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Contract length</span>
                      <span className="font-medium text-primary">Month-to-month</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Start Free Trial"
                      )}
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      type="button"
                      asChild
                    >
                      <a href="/contact">Schedule Demo Call</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
