import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";

const Privacy = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.replace('#', '');
    if (!targetId) {
      return;
    }

    const scrollToSection = () => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    };

    let loadHandler: (() => void) | null = null;

    if (document.readyState === 'complete') {
      scrollToSection();
    } else {
      loadHandler = () => {
        scrollToSection();
        if (loadHandler) {
          window.removeEventListener('load', loadHandler);
        }
      };
      window.addEventListener('load', loadHandler);
    }

    const frame = requestAnimationFrame(scrollToSection);
    return () => {
      cancelAnimationFrame(frame);
      if (loadHandler) {
        window.removeEventListener('load', loadHandler);
      }
    };
  }, [location.hash]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Privacy Policy - TradeLine 24/7"
        description="Learn how TradeLine 24/7 protects your privacy and data. SOC 2 compliant, GDPR ready with bank-level security for AI receptionist services."
        keywords="privacy policy, data protection, GDPR compliance, AI receptionist security"
        canonical="https://www.tradeline247ai.com/privacy"
      />
      
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

                <section id="call-recording">
                  <h2 className="text-2xl font-semibold mb-4">Call Recording Policy</h2>
                  <p className="text-muted-foreground mb-4">
                    TradeLine 24/7 may record phone calls in compliance with Canadian privacy laws (PIPEDA/PIPA).
                  </p>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Purpose</h3>
                      <p>Calls are recorded to improve service quality and keep accurate records of customer interactions.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Disclosure</h3>
                      <p>At the start of each call, you will hear a clear notice that the call may be recorded.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Opt-Out</h3>
                      <p>You may opt out of call recording by saying "opt out" when prompted. The call will continue without recording.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Retention</h3>
                      <p>Call recordings are retained for 30 days, after which they are automatically purged from our systems.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Access & Deletion</h3>
                      <p>You may request access to or deletion of your call recordings at any time by contacting privacy@tradeline247ai.com.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Mobile App Privacy</h2>
                  <p className="text-muted-foreground mb-4">
                    For detailed information about data collection and usage in our mobile applications:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                      <a 
                        href="https://github.com/yourusername/tradeline247ai/blob/main/ops/policy-kit/apple_privacy.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Apple App Store Privacy Details
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://github.com/yourusername/tradeline247ai/blob/main/ops/policy-kit/play_data_safety.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Play Data Safety Information
                      </a>
                    </li>
                  </ul>
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
