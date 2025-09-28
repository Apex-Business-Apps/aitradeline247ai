import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms of Service — TradeLine 24/7';
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
              <p className="text-lg text-muted-foreground">
                Last updated: January 28, 2025
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
                    By using TradeLine 24/7 services provided by Apex Business Systems, you agree to these terms. Our services are governed by Canadian law.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Service Description</h2>
                  <p className="text-muted-foreground">
                    TradeLine 24/7 provides AI-powered receptionist services including call handling, message processing, and appointment scheduling for Canadian businesses.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    Our liability is limited under Canadian law. We are not liable for indirect damages arising from service use.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                  <p className="text-muted-foreground">
                    Apex Business Systems
                    <br />
                    Email: info@tradeline247ai.com
                    <br />
                    Edmonton, AB, Canada
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