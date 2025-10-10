import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradeline247ai.app',
  appName: 'TradeLine 24/7',
  webDir: 'dist',
  server: {
    url: 'https://555a4971-4138-435e-a7ee-dfa3d713d1d3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFB347',
      showSpinner: false
    }
  }
};

export default config;
