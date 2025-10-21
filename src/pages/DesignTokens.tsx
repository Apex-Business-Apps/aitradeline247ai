import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";

const DesignTokens = () => {
  const colorTokens = [
    { name: "Primary", var: "--primary", class: "bg-primary" },
    { name: "Secondary", var: "--secondary", class: "bg-secondary" },
    { name: "Accent", var: "--accent", class: "bg-accent" },
    { name: "Muted", var: "--muted", class: "bg-muted" },
    { name: "Destructive", var: "--destructive", class: "bg-destructive" },
  ];

  const spacingTokens = [
    { name: "xs", value: "0.5rem", class: "p-2" },
    { name: "sm", value: "1rem", class: "p-4" },
    { name: "md", value: "1.5rem", class: "p-6" },
    { name: "lg", value: "2rem", class: "p-8" },
    { name: "xl", value: "3rem", class: "p-12" },
  ];

  const radiusTokens = [
    { name: "sm", value: "calc(var(--radius) - 4px)", class: "rounded-sm" },
    { name: "md", value: "var(--radius)", class: "rounded-md" },
    { name: "lg", value: "calc(var(--radius) + 4px)", class: "rounded-lg" },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Logo variant="text" size="xl" />
            <span className="text-4xl font-bold text-foreground">Design System</span>
          </div>
          <p className="text-xl text-muted-foreground">Enterprise-grade design tokens and components</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>HSL-based semantic color tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {colorTokens.map((token) => (
                <div key={token.name} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-md border ${token.class}`} />
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <code className="text-sm text-muted-foreground">{token.var}</code>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Semantic text styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">Heading 1</h1>
                <h2 className="text-3xl font-semibold">Heading 2</h2>
                <h3 className="text-2xl font-medium">Heading 3</h3>
                <p className="text-base">Body text</p>
                <p className="text-sm text-muted-foreground">Muted text</p>
              </div>
            </CardContent>
          </Card>

          {/* Spacing */}
          <Card>
            <CardHeader>
              <CardTitle>Spacing</CardTitle>
              <CardDescription>Consistent spacing tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {spacingTokens.map((token) => (
                <div key={token.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{token.name}</Badge>
                    <code className="text-sm">{token.value}</code>
                  </div>
                  <div className={`bg-primary/20 ${token.class}`}>
                    <div className="bg-primary w-4 h-4 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Border Radius */}
          <Card>
            <CardHeader>
              <CardTitle>Border Radius</CardTitle>
              <CardDescription>Consistent corner radius</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {radiusTokens.map((token) => (
                <div key={token.name} className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-primary ${token.class}`} />
                  <div>
                    <p className="font-medium">{token.name}</p>
                    <code className="text-sm text-muted-foreground">{token.value}</code>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shadows */}
          <Card>
            <CardHeader>
              <CardTitle>Shadows</CardTitle>
              <CardDescription>Elevation system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-card rounded-md shadow-sm border">
                  <p className="text-sm font-medium">Small shadow</p>
                </div>
                <div className="p-4 bg-card rounded-md shadow-md border">
                  <p className="text-sm font-medium">Medium shadow</p>
                </div>
                <div className="p-4 bg-card rounded-md shadow-lg border">
                  <p className="text-sm font-medium">Large shadow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Toggle Example */}
          <Card>
            <CardHeader>
              <CardTitle>Dark Mode Support</CardTitle>
              <CardDescription>Automatic theme adaptation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-background border rounded-md">
                  <p className="text-foreground">Background adapts to theme</p>
                  <p className="text-muted-foreground text-sm">Muted text maintains contrast</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesignTokens;
