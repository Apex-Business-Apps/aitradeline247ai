import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How does TradeLine 24/7 AI work?",
    answer: "Our AI receptionist uses advanced natural language processing to understand and respond to customer inquiries. It can handle calls, messages, emails, and chat across multiple channels, learning from each interaction to improve over time."
  },
  {
    question: "Can the AI handle complex customer inquiries?",
    answer: "Yes, our AI is trained to handle a wide range of inquiries from simple questions to complex requests. For situations requiring human intervention, it seamlessly transfers to your team with full context and conversation history."
  },
  {
    question: "What integrations are available?",
    answer: "We integrate with popular CRMs (Salesforce, HubSpot, Pipedrive), email platforms (Outlook, Gmail), messaging apps (WhatsApp, Slack, Teams), phone systems (Twilio, Vonage), and many other business tools through our API."
  },
  {
    question: "Is my customer data secure?",
    answer: "Absolutely. We're SOC 2 compliant with bank-level security measures. All data is encrypted in transit and at rest, and we follow strict GDPR and privacy regulations. Your data is never shared with third parties."
  },
  {
    question: "How quickly can I get started?",
    answer: "Most businesses are up and running within 24 hours. Our onboarding team helps configure your AI, set up integrations, and train the system with your specific business information and preferences."
  },
  {
    question: "Can I customize the AI's responses?",
    answer: "Yes, you can fully customize your AI's personality, responses, and workflows. Set custom greetings, FAQ responses, escalation rules, and business-specific information to match your brand voice."
  },
  {
    question: "What languages does the AI support?",
    answer: "Our AI supports over 50 languages with native-level fluency. It can automatically detect the customer's language and respond appropriately, making it perfect for global businesses."
  },
  {
    question: "How accurate is the call transcription?",
    answer: "Our transcription accuracy is over 95% for clear audio in supported languages. The system continuously improves by learning industry-specific terminology and your business context."
  },
  {
    question: "Can I try before I buy?",
    answer: "Yes, we offer a 14-day free trial with full access to all features. No credit card required to start. Our team will help you set up and test the system with your actual business scenarios."
  },
  {
    question: "What kind of support do you provide?",
    answer: "We provide 24/7 technical support via chat, email, and phone. Enterprise customers get dedicated account managers and priority support with guaranteed response times."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
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