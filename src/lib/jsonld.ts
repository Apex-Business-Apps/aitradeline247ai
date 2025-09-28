/**
 * Generate JSON-LD structured data for pricing page
 */

export interface PricingPlan {
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
  description: string;
  features: string[];
}

const PLANS: PricingPlan[] = [
  {
    name: 'Basic',
    price: 149,
    currency: 'CAD',
    billingPeriod: 'MONTH',
    description: 'Perfect for small businesses getting started with AI reception',
    features: [
      '24/7 AI receptionist',
      'Call forwarding and screening',
      'Basic transcription',
      'Email notifications'
    ]
  },
  {
    name: 'Pro',
    price: 299,
    currency: 'CAD',
    billingPeriod: 'MONTH',
    description: 'Advanced features for growing businesses',
    features: [
      'Everything in Basic',
      'Advanced AI conversation',
      'CRM integration',
      'Custom greetings',
      'Priority support'
    ]
  },
  {
    name: 'Enterprise',
    price: 599,
    currency: 'CAD',
    billingPeriod: 'MONTH',
    description: 'Full-featured solution for large organizations',
    features: [
      'Everything in Pro',
      'Multi-line support',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager'
    ]
  }
];

export function pricingJsonLd(baseUrl: string): string {
  const offers = PLANS.map(plan => ({
    '@type': 'Offer',
    'name': `TradeLine 24/7 ${plan.name} Plan`,
    'description': plan.description,
    'price': plan.price.toString(),
    'priceCurrency': plan.currency,
    'priceSpecification': {
      '@type': 'RecurringCharge',
      'price': plan.price.toString(),
      'priceCurrency': plan.currency,
      'billingIncrement': 1,
      'billingPeriod': plan.billingPeriod
    },
    'url': `${baseUrl}/subscribe?plan=${plan.name.toLowerCase()}`,
    'seller': {
      '@type': 'Organization',
      'name': 'TradeLine 24/7'
    }
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': 'TradeLine 24/7 AI Receptionist Service',
    'description': 'Professional AI-powered receptionist service for businesses. Never miss a call with our 24/7 AI assistant.',
    'brand': {
      '@type': 'Brand',
      'name': 'TradeLine 24/7'
    },
    'offers': offers,
    'category': 'Business Software',
    'audience': {
      '@type': 'BusinessAudience',
      'audienceType': 'Small and Medium Businesses'
    }
  };

  return JSON.stringify(structuredData, null, 2);
}