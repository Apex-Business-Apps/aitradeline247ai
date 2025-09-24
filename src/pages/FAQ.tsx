import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";

const faqs = [
  {
    question: "Do you record calls?",
    answer: "Yes—only with notice and consent. You can opt out anytime."
  },
  {
    question: "How do transcripts work?",
    answer: "After each call, a short summary goes to your inbox with next steps."
  },
  {
    question: "Is this compliant in Canada?",
    answer: "Yes. Every message identifies us and includes an unsubscribe. We honour requests within 10 business days."
  },
  {
    question: "Can you handle complex customer inquiries?",
    answer: "Yes, we handle a wide range of inquiries from simple questions to complex requests. For situations requiring human help, we transfer to your team with full context."
  },
  {
    question: "What integrations are available?",
    answer: "We integrate with popular CRMs (Salesforce, HubSpot, Pipedrive), email platforms (Outlook, Gmail), messaging apps (WhatsApp, Slack, Teams), phone systems (Twilio, Vonage), and many other business tools through our API."
  },
  {
    question: "Is my customer data secure?",
    answer: "Yes. We're SOC 2 compliant with bank-level security. All data is encrypted and we follow strict GDPR and privacy rules. Your data is never shared with third parties."
  },
  {
    question: "How quickly can I get started?",
    answer: "Most businesses are up and running within 24 hours. Our team helps configure your service, set up integrations, and train the system with your business information."
  },
  {
    question: "Can I customize the responses?",
    answer: "Yes, you can fully customize your service's personality, responses, and workflows. Set custom greetings, FAQ responses, and business-specific information to match your brand voice."
  },
  {
    question: "What languages are supported?",
    answer: "We support over 50 languages with native-level fluency. The system can automatically detect the customer's language and respond appropriately."
  },
  {
    question: "Can I try before I buy?",
    answer: "Yes, we offer a 14-day free trial with full access to all features. No credit card required to start. Our team will help you set up and test the system."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="FAQ - TradeLine 24/7 AI Receptionist Questions"
        description="Get answers to common questions about TradeLine 24/7 AI receptionist service. Learn about setup, integrations, pricing, security and more."
        keywords="AI receptionist FAQ, customer service automation questions, business phone answering help"
        canonical="https://tradeline247.com/faq"
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Everything you need to know about TradeLine 24/7 AI receptionist service
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-20">
          <div className="container">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Common Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Still Have Questions?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team is here to help. Get in touch and we'll answer any questions about TradeLine 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="shadow-lg">
                Contact Sales
              </Button>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime Guarantee</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">&lt;24hrs</div>
                <div className="text-muted-foreground">Setup Time</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Languages Supported</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQ;