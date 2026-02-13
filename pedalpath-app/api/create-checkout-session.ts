import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, userEmail, planType } = req.body;

    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create or retrieve Stripe customer
    let customer: Stripe.Customer;

    // Try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId
        }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: planType === 'one-time' ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/pricing`,
      metadata: {
        supabase_user_id: userId,
        plan_type: planType
      },
      subscription_data: planType === 'subscription' ? {
        metadata: {
          supabase_user_id: userId
        },
        trial_period_days: 7 // 7-day free trial
      } : undefined,
      allow_promotion_codes: true
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session'
    });
  }
}
