export interface DemoStep {
  target: string;
  zoom?: number;
  wait: number;
  description?: string;
}

export const demoSteps: DemoStep[] = [
  {
    target: '[data-demo="dashboard-header"]',
    zoom: 1.1,
    wait: 1500,
    description: "Welcome to your TradeLine 24/7 dashboard"
  },
  {
    target: '[data-demo="missed-calls"]',
    zoom: 1.15,
    wait: 1200,
    description: "View missed calls and transcripts"
  },
  {
    target: '[data-demo="callbacks"]', 
    zoom: 1.15,
    wait: 1200,
    description: "Instant callback actions"
  },
  {
    target: '[data-demo="analytics"]',
    zoom: 1.1,
    wait: 1000,
    description: "Call analytics and insights"
  },
  {
    target: '[data-demo="settings"]',
    zoom: 1.15,
    wait: 1500,
    description: "Configure your phone number and recipients"
  },
  {
    target: '[data-demo="test-call"]',
    zoom: 1.2,
    wait: 1800,
    description: "Test your setup with a live call"
  },
  {
    target: '[data-demo="integrations"]',
    zoom: 1.1,
    wait: 1000,
    description: "Connect with your favorite tools"
  }
];

export interface DemoState {
  currentStep: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  loop: boolean;
}

export const initialDemoState: DemoState = {
  currentStep: 0,
  isPlaying: false,
  isPaused: false,
  speed: 1.0,
  loop: false
};