import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, FileCheck, Globe, Server, Eye } from "lucide-react";

const Security = () => {
  const platformOverview = [
    {
      icon: Shield,
      title: "Platform Infrastructure",
      description: "Supabase is SOC 2 Type 2 certified. However, compliance does not transfer to our application layer.",
      badge: "SOC 2 Type 2"
    },
    {
      icon: FileCheck,
      title: "Canadian Recording Consent",
      description: "All call recordings comply with Canadian consent requirements and are provided to customers.",
      badge: "Compliant"
    },
    {
      icon: Lock,
      title: "Transcript Delivery",
      description: "Email-only transcripts are in production. Dashboard transcript viewing is currently in beta.",
      badge: "Production"
    },
    {
      icon: Globe,
      title: "Data Hosting",
      description: "Infrastructure is hosted on enterprise-grade cloud platforms with Canadian data residency options.",
      badge: "Canada"
    },
    {
      icon: Server,
      title: "Security Monitoring",
      description: "Continuous monitoring and logging of all system activities with real-time threat detection.",
      badge: "24/7"
    },
    {
      icon: Eye,
      title: "Access & Privacy",
      description: "Strict access controls and privacy measures protect your business and customer data.",
      badge: "Protected"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Security & Platform - TradeLine 24/7"
        description="TradeLine 24/7 platform overview: Supabase SOC 2 Type 2 infrastructure, Canadian consent compliance, and secure transcript delivery."
        keywords="AI receptionist security, platform infrastructure, Canadian compliance, call recording consent, secure transcripts"
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
              Security & Platform
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Built on enterprise infrastructure with Canadian compliance and secure data handling practices.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Badge className="px-4 py-2 text-sm">Supabase SOC 2 Type 2</Badge>
              <Badge className="px-4 py-2 text-sm">Canadian Consent</Badge>
              <Badge className="px-4 py-2 text-sm">Secure Transcripts</Badge>
              <Badge className="px-4 py-2 text-sm">24/7 Monitoring</Badge>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Overview</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Transparent infrastructure and compliance information for our AI receptionist platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {platformOverview.map((feature, index) => (
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

        {/* Platform Details */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Platform & Compliance Details</h2>
              
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Infrastructure Security</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Our platform is built on Supabase, which holds SOC 2 Type 2 certification. This certification applies to the underlying infrastructure layer.
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      Important: SOC 2 compliance does not automatically transfer to our application layer. We implement additional security controls at the application level to protect your data.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Canadian Recording Consent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      All call recordings comply with Canadian consent requirements. Callers are informed of recording, and consent is obtained before recording begins. All recordings and transcripts are provided to customers.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transcript Delivery Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      <strong>Production:</strong> Email-only transcript delivery is fully operational and production-ready.
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Beta:</strong> Dashboard transcript viewing is currently in beta testing. Features and availability may change.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Operational Practices */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Operational Security</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">Data Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    All data is encrypted in transit (TLS 1.3) and at rest using industry-standard encryption.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">Access Controls</h3>
                  <p className="text-sm text-muted-foreground">
                    Role-based access controls ensure team members only access data necessary for their role.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">Activity Logging</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive audit logs track all system access and data modifications.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3">Regular Backups</h3>
                  <p className="text-sm text-muted-foreground">
                    Automated daily backups ensure data recovery capabilities in case of incidents.
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

