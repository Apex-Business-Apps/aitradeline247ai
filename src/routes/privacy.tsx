import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy — TradeLine 24/7';
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
                Last updated: January 28, 2025
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
                    TradeLine 24/7 collects information to provide our AI receptionist services in compliance with PIPEDA and applicable Canadian privacy laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">CASL Compliance</h2>
                  <p className="text-muted-foreground">
                    We comply with Canada's Anti-Spam Legislation (CASL). All marketing communications require express consent, and you can withdraw consent at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                  <p className="text-muted-foreground">
                    We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, disclosure, or destruction.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                  <p className="text-muted-foreground">
                    For privacy-related questions or to exercise your rights under PIPEDA:
                    <br />
                    Email: info@tradeline247ai.com
                    <br />
                    Apex Business Systems, Edmonton, AB, Canada
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