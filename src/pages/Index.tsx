const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-8">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              TradeLine 24/7 — Your 24/7 AI Receptionist!
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade foundation established. Design system ready.
            </p>
          </header>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/design-tokens" 
              className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-lg shadow-lg"
            >
              View Design System
            </a>
            <button className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors font-medium text-lg shadow-lg">
              Grow now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card rounded-lg p-6 shadow-md border">
              <h3 className="text-lg font-semibold mb-2">Foundation Ready</h3>
              <p className="text-muted-foreground">Design tokens implemented with semantic color system</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md border">
              <h3 className="text-lg font-semibold mb-2">Enterprise Grade</h3>
              <p className="text-muted-foreground">Idempotent, performance-optimized architecture</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md border">
              <h3 className="text-lg font-semibold mb-2">Sprint Ready</h3>
              <p className="text-muted-foreground">KANBAN workflow activated for rapid deployment</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;