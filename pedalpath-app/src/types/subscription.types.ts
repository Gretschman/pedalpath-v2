// Subscription and payment types — 5-tier credit model

export type Plan = 'free' | 'coffee' | 'starter' | 'builder' | 'studio';

// Legacy alias
export type SubscriptionPlan = Plan;

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: Plan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_type: 'subscription' | 'one_time';
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PricingPlan {
  id: Plan;
  name: string;
  tagline: string;
  price: number;
  interval: 'month' | 'one-time';
  credits: string;       // human-readable e.g. "15 credits/month"
  features: string[];
  recommended?: boolean;
  isCoffee?: boolean;    // Coffee tier: distinct one-time CTA style
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try it out',
    price: 0,
    interval: 'month',
    credits: '1 lifetime upload',
    features: [
      '1 lifetime schematic analysis',
      'Full BOM generation',
      'Step-by-step build guide',
      'Breadboard layout',
    ],
  },
  {
    id: 'coffee',
    name: 'Coffee',
    tagline: 'Buy me a coffee',
    price: 5,
    interval: 'one-time',
    credits: '10 credits · 90 days',
    isCoffee: true,
    features: [
      '10 schematic analyses',
      'Valid for 90 days',
      'Full BOM + build guides',
      'No subscription needed',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Regular builders',
    price: 9,
    interval: 'month',
    credits: '15 credits/month',
    features: [
      '15 analyses per month',
      'Up to 15 credits roll over',
      'Full BOM + build guides',
      'Save unlimited projects',
    ],
  },
  {
    id: 'builder',
    name: 'Builder',
    tagline: 'Serious hobbyists',
    price: 19,
    interval: 'month',
    credits: '40 credits/month',
    recommended: true,
    features: [
      '40 analyses per month',
      'Up to 40 credits roll over',
      'Full BOM + build guides',
      'Save unlimited projects',
      'Priority processing',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Designers & shops',
    price: 39,
    interval: 'month',
    credits: 'Unlimited',
    features: [
      'Unlimited analyses',
      'Shareable result links',
      'Generate demo passwords',
      'Priority processing',
      'Early access to new features',
    ],
  },
];
