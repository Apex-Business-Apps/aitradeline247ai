// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TradeLine 24/7 AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your intelligent receptionist that never sleeps. Handle calls, capture messages, and deliver insights 24/7.
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="font-semibold">System Status</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">Online</p>
            <p className="text-sm text-muted-foreground">All systems operational</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">24</span>
              </div>
              <h3 className="font-semibold">Calls Today</h3>
            </div>
            <p className="text-2xl font-bold">47</p>
            <p className="text-sm text-muted-foreground">+12% from yesterday</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">🌍</span>
              </div>
              <h3 className="font-semibold">Languages</h3>
            </div>
            <p className="text-2xl font-bold">4</p>
            <p className="text-sm text-muted-foreground">EN, FR, DE, ES</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* AI Receptionist Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-600">🤖</span>
              AI Receptionist
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium">Multi-Language Support</h4>
                  <p className="text-sm text-muted-foreground">Automatically detects and responds in English, French, German, or Spanish</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium">Voice Transcription</h4>
                  <p className="text-sm text-muted-foreground">Powered by OpenAI for accurate message capture and analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium">Instant Notifications</h4>
                  <p className="text-sm text-muted-foreground">Email alerts with message summaries delivered immediately</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-border">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-green-600">📞</span>
              Recent Activity
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">New voicemail from +1-555-0123</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Call handled in French</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Email notification sent</p>
                  <p className="text-xs text-muted-foreground">32 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-border">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
              <div className="text-blue-600 text-2xl mb-2">⚙️</div>
              <p className="font-medium">Settings</p>
              <p className="text-xs text-muted-foreground">Configure AI responses</p>
            </button>
            <button className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-colors">
              <div className="text-green-600 text-2xl mb-2">📊</div>
              <p className="font-medium">Analytics</p>
              <p className="text-xs text-muted-foreground">View call statistics</p>
            </button>
            <button className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors">
              <div className="text-purple-600 text-2xl mb-2">📝</div>
              <p className="font-medium">Messages</p>
              <p className="text-xs text-muted-foreground">Review voicemails</p>
            </button>
            <button className="p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors">
              <div className="text-orange-600 text-2xl mb-2">🔗</div>
              <p className="font-medium">Integrations</p>
              <p className="text-xs text-muted-foreground">Manage connections</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
