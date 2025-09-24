import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Code, Palette, FileText, Settings } from 'lucide-react';

export default function Documentation() {
  return (
    <>
      <SEOHead
        title="Documentation - TradeLine 24/7"
        description="Learn how to customize and maintain your TradeLine 24/7 application"
        keywords="documentation, customization, colors, copy, maintenance"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Learn how to customize and maintain your TradeLine 24/7 application
            </p>
          </div>

          <div className="space-y-8">
            {/* Colors Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Changing Colors
                </CardTitle>
                <CardDescription>
                  Update your brand colors through the design system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Primary Colors</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Edit <code className="bg-muted px-2 py-1 rounded">src/index.css</code> to change your brand colors:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`:root {
  --primary: 262 83% 58%;     /* Main brand color */
  --primary-foreground: 210 20% 98%;
  --secondary: 220 14% 96%;
  --accent: 220 14% 96%;
  /* Update these HSL values for your brand */
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Dark Mode Colors</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Update dark mode in the <code className="bg-muted px-2 py-1 rounded">.dark</code> section:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`.dark {
  --primary: 262 80% 50%;
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  /* Adjust for dark theme */
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Copy Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Changing Copy & Content
                </CardTitle>
                <CardDescription>
                  Update text content throughout the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Hero Section</h4>
                  <p className="text-sm text-muted-foreground">
                    Edit <code className="bg-muted px-2 py-1 rounded">src/components/sections/HeroSection.tsx</code>
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Features & Benefits</h4>
                  <p className="text-sm text-muted-foreground">
                    Edit <code className="bg-muted px-2 py-1 rounded">src/components/sections/BenefitCards.tsx</code>
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Page Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Update individual pages in <code className="bg-muted px-2 py-1 rounded">src/pages/</code>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">SEO Metadata</h4>
                  <p className="text-sm text-muted-foreground">
                    Update titles and descriptions in each page's <code className="bg-muted px-2 py-1 rounded">SEOHead</code> component
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Environment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Environment Variables
                </CardTitle>
                <CardDescription>
                  Required environment variables for production
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="font-semibold">RESEND_API_KEY</code>
                      <p className="text-xs text-muted-foreground">For sending lead capture emails</p>
                    </div>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="font-semibold">FROM_EMAIL</code>
                      <p className="text-xs text-muted-foreground">Email address for sending notifications</p>
                    </div>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="font-semibold">NOTIFY_TO</code>
                      <p className="text-xs text-muted-foreground">Email address to receive lead notifications</p>
                    </div>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="font-semibold">ANALYTICS_WRITE_KEY</code>
                      <p className="text-xs text-muted-foreground">For analytics tracking (optional)</p>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Technical Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    • Images are optimized and lazy-loaded<br/>
                    • PWA enabled for offline functionality<br/>
                    • Target: ≥95 Lighthouse scores across all metrics
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Accessibility</h4>
                  <p className="text-sm text-muted-foreground">
                    • WCAG AA compliant<br/>
                    • Keyboard navigation support<br/>
                    • Focus indicators and semantic markup
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Security</h4>
                  <p className="text-sm text-muted-foreground">
                    • No secrets in code - all stored in environment variables<br/>
                    • Form validation and input sanitization<br/>
                    • Secure email handling via Resend API
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}