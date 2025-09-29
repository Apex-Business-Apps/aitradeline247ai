import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";

const Terms = () => {
  useEffect(() => {
    setSEO({
      title: "Terms of Service — TradeLine 24/7",
      description: "Read our terms of service for TradeLine 24/7 AI receptionist platform. Clear, fair terms for our business customers.",
      path: "/terms",
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
                Terms of Service
              </h1>
              <p className="text-lg text-muted-foreground text-center mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Acceptance of Terms</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>By accessing or using TradeLine 24/7 services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Description of Service</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>TradeLine 24/7 provides AI-powered receptionist and customer communication services, including:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>24/7 call answering and management</li>
                    <li>Message taking and forwarding</li>
                    <li>Customer inquiry handling</li>
                    <li>Integration with business systems</li>
                    <li>Analytics and reporting</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. User Accounts and Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>You are responsible for:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Providing accurate and complete account information</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>All activity that occurs under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                    <li>Ensuring your use complies with applicable laws</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Acceptable Use Policy</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>You agree not to use our services to:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Violate any laws or regulations</li>
                    <li>Transmit harmful, offensive, or illegal content</li>
                    <li>Interfere with or disrupt our services</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated systems to access our services without permission</li>
                    <li>Spam or send unsolicited communications</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Payment Terms</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Fees are billed monthly in advance</li>
                    <li>Payment is due within 30 days of invoice date</li>
                    <li>Late payments may result in service suspension</li>
                    <li>Prices may change with 30 days notice</li>
                    <li>Refunds are provided according to our refund policy</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Call Recording and Consent</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>Our AI service may record calls for quality and training purposes. By using our service:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>You consent to call recording where legally permitted</li>
                    <li>You ensure your customers are properly notified</li>
                    <li>You comply with all applicable recording consent laws</li>
                    <li>You can opt out of recording at any time</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Data and Privacy</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>Your data remains your property. We:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Process data only as necessary to provide services</li>
                    <li>Implement appropriate security measures</li>
                    <li>Do not sell or rent your data to third parties</li>
                    <li>Comply with applicable privacy laws (GDPR, PIPEDA, etc.)</li>
                  </ul>
                  <p className="mt-4">See our Privacy Policy for detailed information.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Service Availability</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We may temporarily suspend service for:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Scheduled maintenance (with advance notice)</li>
                    <li>Emergency maintenance or security issues</li>
                    <li>Compliance with legal requirements</li>
                    <li>Technical difficulties beyond our control</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>To the maximum extent permitted by law, TradeLine 24/7 shall not be liable for any indirect, incidental, special, or consequential damages, including lost profits, data loss, or business interruption, even if we have been advised of the possibility of such damages.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Termination</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>Either party may terminate service with 30 days notice. We may immediately terminate or suspend your account for:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Violation of these terms</li>
                    <li>Non-payment of fees</li>
                    <li>Illegal or harmful use of services</li>
                    <li>Risk to our systems or other users</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Changes to Terms</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We may update these terms periodically. Significant changes will be communicated via email or our website at least 30 days before taking effect. Continued use of our services after changes constitutes acceptance of the new terms.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Governing Law</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>These terms are governed by the laws of Alberta, Canada. Any disputes shall be resolved in the courts of Calgary, Alberta. If any provision is found unenforceable, the remaining provisions shall remain in full effect.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>13. Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>For questions about these terms or our services, contact us:</p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Email:</strong> legal@tradeline247ai.com</p>
                    <p><strong>Phone:</strong> +1 (587) 742-8885</p>
                    <p><strong>Address:</strong> TradeLine 24/7, Calgary, AB, Canada</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;