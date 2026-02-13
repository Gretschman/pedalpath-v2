// Subscription and payment types

export type SubscriptionPlan = 'free' | 'pro' | 'one-time';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  schematics_used_this_month: number;
  schematics_limit: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageCheck {
  allowed: boolean;
  reason: string;
  schematics_remaining: number;
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
  payment_type: 'subscription' | 'one-time';
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'one-time';
  features: string[];
  recommended?: boolean;
  stripePriceId: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try it out',
    price: 0,
    interval: 'month',
    features: [
      '1 schematic per month',
      'Basic BOM generation',
      'View build guides',
      'Community support'
    ],
    stripePriceId: '' // No Stripe ID for free
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious builders',
    price: 19,
    interval: 'month',
    features: [
      'Unlimited schematics',
      'Full BOM with editing',
      'PDF exports (no watermark)',
      'Save unlimited projects',
      'Priority support',
      'Early access to new features'
    ],
    recommended: true,
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_xxx' // Set in env
  },
  {
    id: 'one-time',
    name: 'Pay As You Go',
    description: 'No commitment',
    price: 9,
    interval: 'one-time',
    features: [
      'Single schematic analysis',
      'Full BOM generation',
      'All build guides',
      '30-day access'
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_ONETIME_PRICE_ID || 'price_yyy' // Set in env
  }
];
