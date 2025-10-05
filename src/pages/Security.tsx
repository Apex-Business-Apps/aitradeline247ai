import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, FileCheck, Globe, Server, Eye } from "lucide-react";

const Security = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "SOC 2 Compliance",
      description: "Enterprise-grade security controls and regular audits ensure your data is protected.",
      badge: "Certified"
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit and at rest using industry-standard AES-256 encryption.",
      badge: "AES-256"
    },
    {
      icon: FileCheck,
      title: "GDPR & Privacy Compliance",
      description: "Full compliance with GDPR, PIPEDA, and PIPA regulations for Canadian and international data protection.",
      badge: "Compliant"
    },
    {
      icon: Globe,
      title: "Canadian Data Residency",
      description: "Your data is hosted exclusively in Canadian data centers, ensuring compliance with local regulations.",
      badge: "Canada"
    },
    {
      icon: Server,
      title: "Regular Security Audits",
      description: "Continuous monitoring and regular third-party security assessments to maintain the highest standards.",
      badge: "Audited"
    },
    {
      icon: Eye,
      title: "Access Controls",
      description: "Role-based access controls and comprehensive audit logs track all data access.",
      badge: "RBAC"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Security & Compliance - TradeLine 24/7"
        description="TradeLine 24/7 provides SOC 2 compliant, GDPR ready AI receptionist services with bank-level security. Canadian-hosted with end-to-end encryption."
        keywords="AI receptionist security, SOC 2 compliance, GDPR compliance, data encryption, Canadian data hosting, business security"
        canonical="https://www.tradeline247ai.com/security"
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background to-secondary/20">
          <div className="container text-center">
            <div className="flex justify-center mb-6">
              <Shield className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Enterprise-Grade Security
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your customers' data deserves the highest level of protection. TradeLine 24/7 delivers bank-level security with full compliance.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Badge className="px-4 py-2 text-sm">SOC 2 Certified</Badge>
              <Badge className="px-4 py-2 text-sm">GDPR Compliant</Badge>
              <Badge className="px-4 py-2 text-sm">Canadian Hosted</Badge>
              <Badge className="px-4 py-2 text-sm">AES-256 Encrypted</Badge>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Protect Your Data</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Multi-layered security architecture designed to protect your business and customer information.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Details */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Compliance & Certifications</h2>
              
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>SOC 2 Type II Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      We maintain SOC 2 Type II certification, demonstrating our commitment to security, availability, processing integrity, confidentiality, and privacy. Annual audits by independent third parties ensure ongoing compliance.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>GDPR & Canadian Privacy Laws</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Full compliance with GDPR (General Data Protection Regulation), PIPEDA (Personal Information Protection and Electronic Documents Act), and PIPA (Personal Information Protection Act) ensures your data handling meets the highest international standards.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Residency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      All customer data is stored exclusively in Canadian data centers. This ensures compliance with Canadian data sovereignty requirements and provides you with full control over your data jurisdiction.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Security Practices */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Our Security Practices</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">Regular Security Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Automated security patches and updates ensure protection against emerging threats.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">24/7 Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time threat detection and incident response systems monitor all activity.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">Employee Training</h3>
                  <p className="text-sm text-muted-foreground">
                    Regular security awareness training for all team members handling customer data.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">Incident Response</h3>
                  <p className="text-sm text-muted-foreground">
                    Documented incident response procedures with 24/7 security team availability.
                  </p>
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

export default Security;
