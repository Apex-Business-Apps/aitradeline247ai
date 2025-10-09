import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock, MessageCircle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FormErrorFallback } from "@/components/errors/FormErrorFallback";
import { z } from "zod";
import { PUBLIC_HELPLINE_E164, PUBLIC_HELPLINE_DISPLAY, PUBLIC_EMAIL } from "@/config/public";
import builtCanadianBadge from "@/assets/badges/built-canadian.svg";

const contactFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").max(255),
  company: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000)
});

const contactMethods = [
  {
    icon: Phone,
    title: "Call",
    description: "Talk to our team",
    contact: PUBLIC_HELPLINE_DISPLAY,
    action: `tel:${PUBLIC_HELPLINE_E164}`
  },
  {
    icon: Mail,
    title: "Email",
    description: "Send us a message",
    contact: PUBLIC_EMAIL,
    action: `mailto:${PUBLIC_EMAIL}`
  },
  {
    icon: MessageCircle,
    title: "Chat",
    description: "Leave a message",
    contact: "Quick response",
    action: "chat"
  }
];

const Contact = () => {
  const [contactFormData, setContactFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleContactAction = (action: string) => {
    if (action === 'chat') {
      setShowChatModal(true);
    } else {
      // Use direct assignment for tel: and mailto: links (browser handles these)
      window.location.href = action;
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const leadData = {
        name: `${contactFormData.firstName} ${contactFormData.lastName}`.trim(),
        email: contactFormData.email,
        company: contactFormData.company || 'N/A',
        notes: contactFormData.message,
        source: 'contact-chat'
      };

      const { error } = await supabase.from('leads').insert(leadData);

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 2 hours.",
      });

      setContactFormData({ firstName: "", lastName: "", email: "", company: "", phone: "", subject: "", message: "" });
      setShowChatModal(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const validationResult = contactFormSchema.safeParse(contactFormData);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Please check your input";
      toast({
        title: "Invalid Information",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Combine first and last name for lead submission
      const leadData = {
        name: `${contactFormData.firstName} ${contactFormData.lastName}`.trim(),
        email: contactFormData.email,
        company: contactFormData.company,
        notes: `Subject: ${contactFormData.subject}\n\nMessage: ${contactFormData.message}\n\nPhone: ${contactFormData.phone || 'Not provided'}`
      };

      const { error } = await supabase.functions.invoke('send-lead-email', {
        body: leadData
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setContactFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        phone: "",
        subject: "",
        message: ""
      });

      toast({
        title: "Message Sent!",
        description: "Thanks for contacting us. We'll get back to you within 24 hours.",
      });

    } catch (error: any) {
      console.error("Contact form error:", error);
      
      // Set error for FormErrorFallback
      setSubmitError('Unable to send message at this time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Contact Us - TradeLine 24/7 AI Receptionist"
        description="Get in touch with TradeLine 24/7 for AI receptionist services. Contact sales, support, or request a demo of our 24/7 customer service automation."
        keywords="contact TradeLine 24/7, AI receptionist support, business automation contact, customer service demo"
        canonical="https://www.tradeline247ai.com/contact"
      />
      <LocalBusinessSchema />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Ready to grow your business with AI? Let's talk about how TradeLine 24/7 can help you.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <Card 
                  key={index} 
                  className="text-center hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleContactAction(method.action)}
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <method.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-primary font-medium">
                      {method.contact}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
                <p className="text-muted-foreground mb-8">
                  Fill out the form below and our team will get back to you within 24 hours. 
                  For urgent matters, please call us directly.
                </p>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Form</CardTitle>
                    <CardDescription>
                      Tell us about your business needs and we'll help you get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submitError && (
                      <FormErrorFallback 
                        error={submitError} 
                        onRetry={() => {
                          setSubmitError(null);
                          handleSubmit(new Event('submit') as any);
                        }} 
                      />
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            placeholder="John" 
                            value={contactFormData.firstName}
                            onChange={(e) => setContactFormData(prev => ({...prev, firstName: e.target.value}))}
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Smith" 
                            value={contactFormData.lastName}
                            onChange={(e) => setContactFormData(prev => ({...prev, lastName: e.target.value}))}
                            required 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Work Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@company.com" 
                          value={contactFormData.email}
                          onChange={(e) => setContactFormData(prev => ({...prev, email: e.target.value}))}
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="company">Company Name</Label>
                        <Input 
                          id="company" 
                          placeholder="Your Company Inc." 
                          value={contactFormData.company}
                          onChange={(e) => setContactFormData(prev => ({...prev, company: e.target.value}))}
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="+1 (555) 123-4567" 
                          value={contactFormData.phone}
                          onChange={(e) => setContactFormData(prev => ({...prev, phone: e.target.value}))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject" 
                          placeholder="How can we help?" 
                          value={contactFormData.subject}
                          onChange={(e) => setContactFormData(prev => ({...prev, subject: e.target.value}))}
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Tell us about your business and how you'd like to use TradeLine 24/7..."
                          className="min-h-[120px]"
                          value={contactFormData.message}
                          onChange={(e) => setContactFormData(prev => ({...prev, message: e.target.value}))}
                          required 
                        />
                      </div>
                      
                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-6">Why Choose TradeLine 24/7?</h2>
                
                <div className="space-y-8">
                  <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-primary" />
                        <CardTitle className="text-xl">24/7 Support</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Our team and AI are available around the clock to ensure your business never misses an opportunity.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-accent/5 to-primary/5">
                    <CardHeader>
                      <CardTitle className="text-xl">Quick Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Set up in 10 minutes with our guided onboarding and integration support.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-secondary/20 to-accent/10">
                    <CardHeader>
                      <CardTitle className="text-xl">Proven Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Join thousands of businesses that have increased their lead conversion by 40% with our AI.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8 p-6 bg-muted/30 rounded-lg">
                  <div data-guard="canada-badge" className="flex items-start gap-3">
                    <img
                      src={builtCanadianBadge}
                      width="32"
                      height="32"
                      alt="Built in Canada"
                      loading="lazy"
                    />
                    <div>
                      <h3 className="font-semibold">Built in Canada</h3>
                      <p className="opacity-80">Canadian-hosted. Privacy-by-design.</p>
                      <p className="opacity-80">Made here. Trusted here.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowChatModal(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Leave a Message</CardTitle>
              <CardDescription>We'll get back to you within 2 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChatSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="chat-name">Full Name</Label>
                  <Input
                    id="chat-name"
                    value={`${contactFormData.firstName} ${contactFormData.lastName}`.trim()}
                    onChange={(e) => {
                      const parts = e.target.value.split(' ');
                      setContactFormData(prev => ({
                        ...prev,
                        firstName: parts[0] || '',
                        lastName: parts.slice(1).join(' ') || ''
                      }));
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="chat-email">Email</Label>
                  <Input
                    id="chat-email"
                    type="email"
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="chat-message">Message</Label>
                  <Textarea
                    id="chat-message"
                    value={contactFormData.message}
                    onChange={(e) => setContactFormData(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowChatModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Contact;