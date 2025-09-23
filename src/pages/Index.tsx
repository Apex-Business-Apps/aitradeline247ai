import React from 'react';
import { Logo } from '@/components/ui/logo';

const Index = () => {
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Background pattern for visual interest */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--brand-orange-primary) / 0.1) 0%, transparent 50%), 
                          radial-gradient(circle at 75% 75%, hsl(var(--brand-orange-light) / 0.1) 0%, transparent 50%)`,
        backgroundSize: '400px 400px'
      }}></div>
      
      {/* Orange gradient overlay maintaining 60% background visibility */}
      <div className="absolute inset-0 bg-gradient-orange-subtle opacity-25"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Logo variant="full" size="xl" />
          </div>
          <div className="text-xl text-muted-foreground max-w-2xl mx-auto text-center">
            <p className="font-semibold text-2xl mb-2">Your 24/7 Ai Receptionist!</p>
            <p>Never miss a call. Works while you sleep.</p>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-orange-subtle opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="font-semibold">System Status</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">Online</p>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-orange-subtle opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-orange/20 dark:bg-brand-orange/30 rounded-lg flex items-center justify-center">
                  <span className="text-brand-orange font-bold">24</span>
                </div>
                <h3 className="font-semibold">Calls Today</h3>
              </div>
              <p className="text-2xl font-bold text-brand-orange">47</p>
              <p className="text-sm text-muted-foreground">+12% from yesterday</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-orange-subtle opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-orange-light/30 dark:bg-brand-orange-light/40 rounded-lg flex items-center justify-center">
                  <span className="text-brand-orange-dark font-bold">🌍</span>
                </div>
                <h3 className="font-semibold">Languages</h3>
              </div>
              <p className="text-2xl font-bold text-brand-orange-dark">4</p>
              <p className="text-sm text-muted-foreground">EN, FR, DE, ES</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* AI Receptionist Features */}
          <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-orange-medium opacity-15"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-brand-orange">🤖</span>
                AI Receptionist
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-orange/20 dark:bg-brand-orange/30 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Multi-Language Support</h4>
                    <p className="text-sm text-muted-foreground">Automatically detects and responds in English, French, German, or Spanish</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-orange-light/30 dark:bg-brand-orange-light/40 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-brand-orange-light rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Voice Transcription</h4>
                    <p className="text-sm text-muted-foreground">Powered by OpenAI for accurate message capture and analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-orange-dark/30 dark:bg-brand-orange-dark/40 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-brand-orange-dark rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Instant Notifications</h4>
                    <p className="text-sm text-muted-foreground">Email alerts with message summaries delivered immediately</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-orange-medium opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-brand-orange">📞</span>
                Recent Activity
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg">
                  <div className="w-3 h-3 bg-brand-orange rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">New voicemail from +1-555-0123</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg">
                  <div className="w-3 h-3 bg-brand-orange-light rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Call handled in French</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg">
                  <div className="w-3 h-3 bg-brand-orange-dark rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Email notification sent</p>
                    <p className="text-xs text-muted-foreground">32 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-orange-subtle opacity-25"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 bg-brand-orange/10 dark:bg-brand-orange/20 hover:bg-brand-orange/15 dark:hover:bg-brand-orange/30 rounded-lg border border-brand-orange/30 dark:border-brand-orange/40 transition-colors backdrop-blur-sm">
                <div className="text-brand-orange text-2xl mb-2">⚙️</div>
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground">Configure AI responses</p>
              </button>
              <button className="p-4 bg-brand-orange-light/15 dark:bg-brand-orange-light/25 hover:bg-brand-orange-light/20 dark:hover:bg-brand-orange-light/35 rounded-lg border border-brand-orange-light/40 dark:border-brand-orange-light/50 transition-colors backdrop-blur-sm">
                <div className="text-brand-orange-dark text-2xl mb-2">📊</div>
                <p className="font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">View call statistics</p>
              </button>
              <button className="p-4 bg-brand-orange-dark/15 dark:bg-brand-orange-dark/25 hover:bg-brand-orange-dark/20 dark:hover:bg-brand-orange-dark/35 rounded-lg border border-brand-orange-dark/40 dark:border-brand-orange-dark/50 transition-colors backdrop-blur-sm">
                <div className="text-brand-orange text-2xl mb-2">📝</div>
                <p className="font-medium">Messages</p>
                <p className="text-xs text-muted-foreground">Review voicemails</p>
              </button>
              <button className="p-4 bg-brand-orange/12 dark:bg-brand-orange/22 hover:bg-brand-orange/18 dark:hover:bg-brand-orange/32 rounded-lg border border-brand-orange/35 dark:border-brand-orange/45 transition-colors backdrop-blur-sm">
                <div className="text-brand-orange-dark text-2xl mb-2">🔗</div>
                <p className="font-medium">Integrations</p>
                <p className="text-xs text-muted-foreground">Manage connections</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;