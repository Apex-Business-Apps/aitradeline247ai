import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Terms of Service - TradeLine 24/7"
        description="Terms and conditions for using TradeLine 24/7 AI receptionist services. Service description, user responsibilities, and legal information."
        keywords="terms of service, legal terms, AI receptionist terms, service agreement"
        canonical="https://tradeline247.com/terms"
      />
      
      <Header />
      
      <main className="flex-1 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
              <p className="text-lg text-muted-foreground">
                Last updated: January 23, 2025
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none dark:prose-invert space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By accessing and using TradeLine 24/7 services, you accept and agree to be bound by these Terms of Service. 
                    If you do not agree to abide by these terms, please do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Service Description</h2>
                  <p className="text-muted-foreground">
                    TradeLine 24/7 provides AI-powered receptionist services including call handling, message processing, 
                    appointment scheduling, and customer inquiry management. Service availability and features may vary by plan.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Provide accurate account and business information</li>
                    <li>Use the service only for lawful business purposes</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Comply with applicable laws and regulations</li>
                    <li>Not attempt to disrupt or compromise service security</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Payment Terms</h2>
                  <p className="text-muted-foreground">
                    Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except 
                    as required by law or as specifically stated in our refund policy. We reserve the right to change pricing 
                    with 30 days notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
                  <p className="text-muted-foreground">
                    We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. We are not liable for 
                    temporary unavailability due to maintenance, updates, or circumstances beyond our control.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    Our liability is limited to the amount paid for services in the preceding 12 months. We are not liable 
                    for indirect, incidental, or consequential damages arising from use of our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                  <p className="text-muted-foreground">
                    For questions about these Terms of Service, please contact us at:
                    <br />
                    Email: legal@tradeline247ai.com
                    <br />
                    Address: Toronto, ON, Canada
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;