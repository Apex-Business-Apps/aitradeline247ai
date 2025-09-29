import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";

const Privacy = () => {
  useEffect(() => {
    setSEO({
      title: "Privacy Policy — TradeLine 24/7",
      description: "Learn how TradeLine 24/7 protects your privacy and handles your data. GDPR compliant, SOC 2 certified.",
      path: "/privacy",
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
                Privacy Policy
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
                  <CardTitle>1. Information We Collect</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We collect information you provide directly to us, including:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Contact information (name, email, phone number)</li>
                    <li>Company information and business details</li>
                    <li>Call recordings and transcripts (with consent)</li>
                    <li>Usage data and analytics</li>
                    <li>Technical information about your device and connection</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. How We Use Your Information</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Provide and improve our AI receptionist services</li>
                    <li>Process and respond to your inquiries</li>
                    <li>Send service updates and marketing communications (with consent)</li>
                    <li>Analyze usage patterns to enhance our platform</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Information Sharing</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We do not sell, trade, or rent your personal information. We may share your information only in these limited circumstances:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>With service providers who assist in our operations</li>
                    <li>When required by law or to protect our rights</li>
                    <li>In connection with a business transfer or merger</li>
                    <li>With your explicit consent</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Data Security</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We implement industry-standard security measures including:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Access controls and authentication</li>
                    <li>SOC 2 Type II compliance</li>
                    <li>GDPR compliance for EU residents</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Your Rights</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Access and review your personal information</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Opt out of marketing communications</li>
                    <li>Port your data to another service</li>
                  </ul>
                  <p className="mt-4">To exercise these rights, contact us at privacy@tradeline247ai.com</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Cookies and Tracking</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 mt-4">
                    <li>Remember your preferences and settings</li>
                    <li>Analyze website traffic and usage patterns</li>
                    <li>Provide personalized content and advertisements</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                  <p className="mt-4">You can control cookie settings through your browser preferences.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. International Transfers</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>TradeLine 24/7 is hosted in Canada. When you use our services, your information may be transferred to, stored, and processed in Canada. We ensure appropriate safeguards are in place for international data transfers.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Children's Privacy</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Changes to This Policy</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>We may update this privacy policy periodically. We will notify you of significant changes by email or through our website. Your continued use of our services after such changes constitutes acceptance of the updated policy.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Contact Us</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p>If you have questions about this privacy policy or our data practices, please contact us:</p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Email:</strong> privacy@tradeline247ai.com</p>
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

export default Privacy;