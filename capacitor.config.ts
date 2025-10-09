import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradeline247ai.app',
  appName: 'TradeLine 24/7',
  webDir: 'dist',
  server: {
    url: 'https://tradeline247ai.com',
    cleartext: false
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
