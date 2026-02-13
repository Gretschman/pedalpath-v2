import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
);

export const config = {
  api: {
    bodyParser: false // Stripe requires raw body for signature verification
  }
};

// Helper to read raw body
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No user ID in session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  const planType = session.metadata?.plan_type || 'subscription';

  // Update subscription in database
  if (planType === 'subscription' && subscriptionId) {
    // Fetch full subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await supabase
      .from('subscriptions')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: subscription.items.data[0].price.id,
        plan: 'pro',
        status: 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else {
    // One-time payment - grant access for 30 days
    await supabase
      .from('subscriptions')
      .update({
        stripe_customer_id: customerId,
        plan: 'one-time',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        schematics_limit: 999, // Essentially unlimited for the period
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  // Log payment transaction
  await supabase.from('payment_transactions').insert({
    user_id: userId,
    stripe_payment_intent_id: session.payment_intent as string,
    amount_cents: session.amount_total || 0,
    currency: session.currency || 'usd',
    status: 'succeeded',
    payment_type: planType,
    description: planType === 'subscription' ? 'Pro Monthly Subscription' : 'One-time Upload'
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  const status = subscription.status === 'active' || subscription.status === 'trialing'
    ? 'active'
    : subscription.status === 'canceled'
    ? 'canceled'
    : subscription.status === 'past_due'
    ? 'past_due'
    : 'expired';

  await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan: 'free', // Revert to free plan
      schematics_limit: 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_metadata?.supabase_user_id;
  if (!userId) return;

  await supabase.from('payment_transactions').insert({
    user_id: userId,
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    payment_type: 'subscription',
    description: 'Subscription renewal'
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_metadata?.supabase_user_id;
  if (!userId) return;

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Log failed payment
  await supabase.from('payment_transactions').insert({
    user_id: userId,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    payment_type: 'subscription',
    description: 'Payment failed'
  });
}
