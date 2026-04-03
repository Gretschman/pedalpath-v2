import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Strip whitespace/newlines — Vercel occasionally injects \n into secret values
const STRIPE_SECRET = (process.env.STRIPE_SECRET_KEY || '').replace(/\s+/g, '');

type Plan = 'coffee' | 'starter' | 'builder' | 'studio';

// Use APP_URL first, fall back to VITE_APP_URL, then production URL
const APP_URL = (
  process.env.APP_URL ||
  process.env.VITE_APP_URL ||
  'https://pedalpath-v2.vercel.app'
).replace(/\s+/g, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!STRIPE_SECRET) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2025-02-24.acacia' });

  const PRICE_IDS: Record<Plan, string> = {
    coffee:  (process.env.STRIPE_PRICE_COFFEE  || '').replace(/\s+/g, ''),
    starter: (process.env.STRIPE_PRICE_STARTER || '').replace(/\s+/g, ''),
    builder: (process.env.STRIPE_PRICE_BUILDER || '').replace(/\s+/g, ''),
    studio:  (process.env.STRIPE_PRICE_STUDIO  || '').replace(/\s+/g, ''),
  };

  try {
    const { plan, userId, userEmail } = req.body as {
      plan: Plan;
      userId: string;
      userEmail: string;
    };

    if (!plan || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields: plan, userId, userEmail' });
    }

    if (!PRICE_IDS[plan]) {
      return res.status(400).json({ error: `Unknown plan: ${plan}` });
    }

    const priceId = PRICE_IDS[plan];

    // Create or retrieve Stripe customer by email
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId }
      });
    }

    // Coffee = one-time payment; everything else = recurring subscription
    const isOneTime = plan === 'coffee';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      mode: isOneTime ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?upgraded=true&plan=${plan}`,
      cancel_url:  `${APP_URL}/pricing`,
      metadata: {
        supabase_user_id: userId,
        plan
      },
      allow_promotion_codes: true,
    };

    // Subscription plans get metadata on the subscription object for webhook access
    if (!isOneTime) {
      sessionParams.subscription_data = {
        metadata: { supabase_user_id: userId, plan }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}
