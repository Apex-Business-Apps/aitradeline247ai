import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";

const Privacy = () => {
  useEffect(() => {
    setSEO({
      title: "Privacy Policy — TradeLine 24/7",
      description: "Learn how TradeLine 24/7 protects your privacy and data. SOC 2 compliant, GDPR ready with bank-level security for AI receptionist services.",
      path: "/privacy",
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-lg text-muted-foreground">
                Last updated: January 23, 2025
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Privacy Matters</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none dark:prose-invert space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                  <p className="text-muted-foreground">
                    TradeLine 24/7 collects information to provide and improve our AI receptionist services. 
                    This includes account information, communication data processed through our AI, and usage analytics 
                    to enhance service quality.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Provide AI receptionist services</li>
                    <li>Process and respond to customer inquiries</li>
                    <li>Improve our AI algorithms and service quality</li>
                    <li>Send important service updates and notifications</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Data Security & Compliance</h2>
                  <p className="text-muted-foreground">
                    We maintain SOC 2 compliance and implement bank-level security measures. All data is encrypted 
                    in transit and at rest. We comply with GDPR, PIPEDA, and other applicable privacy regulations.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                  <p className="text-muted-foreground">
                    You have the right to access, update, or delete your personal information. 
                    Contact us at privacy@tradeline247ai.com to exercise these rights.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions about this Privacy Policy, please contact us at:
                    <br />
                    Email: privacy@tradeline247ai.com
                    <br />
                    Address: Edmonton, AB, Canada
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

export default Privacy;