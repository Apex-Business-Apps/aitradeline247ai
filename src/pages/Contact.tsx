import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, MessageCircle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Get in touch via email",
    contact: "info@tradeline247ai.com",
    action: "mailto:info@tradeline247ai.com"
  },
  {
    icon: Phone, 
    title: "Call Us",
    description: "Speak with our team",
    contact: "+1 (555) 247-0247",
    action: "tel:+15552470247"
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with support",
    contact: "Available 24/7",
    action: "#"
  },
  {
    icon: MapPin,
    title: "Visit Us", 
    description: "Our headquarters",
    contact: "Toronto, ON, Canada",
    action: "#"
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
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      toast({
        title: "Error",
        description: "Something went wrong. Please try again or call us directly.",
        variant: "destructive"
      });
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
        canonical="https://tradeline247.com/contact"
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Ready to transform your business with AI? Let's talk about how TradeLine 24/7 can help you grow.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <method.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href={method.action}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      {method.contact}
                    </a>
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
                        Get started in under 24 hours with our guided onboarding and integration support.
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
                  <h3 className="font-semibold mb-3">Office Hours</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span>9:00 AM - 6:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span>10:00 AM - 4:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span>Closed (AI Support Only)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;