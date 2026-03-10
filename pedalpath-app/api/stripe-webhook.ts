import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover'
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: { bodyParser: false }
};

// ─── Credit constants per plan ───────────────────────────────────────────────

type Plan = 'coffee' | 'starter' | 'builder' | 'studio';

const PLAN_CONFIG: Record<Plan, {
  monthlyAllocation: number | null;
  rolloverCap: number | null;
  initialCredits: number | null; // null = unlimited (Studio)
  creditExpireDays: number | null;
}> = {
  coffee:  { monthlyAllocation: null, rolloverCap: null, initialCredits: 10, creditExpireDays: 90 },
  starter: { monthlyAllocation: 15,   rolloverCap: 15,   initialCredits: 15, creditExpireDays: null },
  builder: { monthlyAllocation: 40,   rolloverCap: 40,   initialCredits: 40, creditExpireDays: null },
  studio:  { monthlyAllocation: null, rolloverCap: null,  initialCredits: null, creditExpireDays: null },
};

// ─── Raw body helper ─────────────────────────────────────────────────────────

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// ─── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
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

// ─── checkout.session.completed ──────────────────────────────────────────────
// Fired once after any successful payment (one-time or first subscription payment).
// Allocates the initial credit grant.

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId  = session.metadata?.supabase_user_id;
  const plan    = session.metadata?.plan as Plan | undefined;

  if (!userId || !plan || !PLAN_CONFIG[plan]) {
    console.error('checkout.session.completed: missing userId or unrecognised plan', session.metadata);
    return;
  }

  const cfg = PLAN_CONFIG[plan];
  const customerId = session.customer as string;

  // Subscription ID is only present for recurring plans
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : (session.subscription as Stripe.Subscription | null)?.id ?? null;

  const creditsExpiry = cfg.creditExpireDays
    ? new Date(Date.now() + cfg.creditExpireDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Update user_credits
  const { error: upsertErr } = await supabase
    .from('user_credits')
    .upsert({
      user_id:                userId,
      plan,
      credits_remaining:      cfg.initialCredits,
      credits_expiry:         creditsExpiry,
      monthly_allocation:     cfg.monthlyAllocation,
      rollover_cap:           cfg.rolloverCap,
      stripe_customer_id:     customerId,
      stripe_subscription_id: subscriptionId,
      updated_at:             new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (upsertErr) {
    console.error('user_credits upsert failed:', upsertErr);
    throw upsertErr;
  }

  // Log the initial credit grant
  await insertCreditTransaction({
    userId,
    amount:      cfg.initialCredits ?? 0,
    txType:      'purchase',
    balanceAfter: cfg.initialCredits,
    stripeReference: session.payment_intent as string | null,
  });

  // Log payment transaction for accounting
  await supabase.from('payment_transactions').insert({
    user_id:                  userId,
    stripe_payment_intent_id: session.payment_intent as string | null,
    amount_cents:             session.amount_total ?? 0,
    currency:                 session.currency ?? 'usd',
    status:                   'succeeded',
    payment_type:             plan === 'coffee' ? 'one_time' : 'subscription',
    description:              `${plan} plan — initial checkout`,
  });
}

// ─── invoice.payment_succeeded ───────────────────────────────────────────────
// Fired on every successful subscription renewal.
// Implements the rollover + reset logic for Starter/Builder.
// Skipped for Coffee (no subscription).

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Skip the first invoice — covered by checkout.session.completed
  if (invoice.billing_reason === 'subscription_create') return;

  const userId = invoice.subscription_details?.metadata?.supabase_user_id;
  const plan   = invoice.subscription_details?.metadata?.plan as Plan | undefined;

  if (!userId || !plan || !PLAN_CONFIG[plan]) return;

  const cfg = PLAN_CONFIG[plan];

  // Studio: unlimited — no credit accounting needed, just log the payment
  if (plan === 'studio') {
    await logPaymentTransaction(invoice, plan);
    return;
  }

  // Fetch current balance for rollover calculation
  const { data: current, error: fetchErr } = await supabase
    .from('user_credits')
    .select('credits_remaining, rollover_cap, monthly_allocation')
    .eq('user_id', userId)
    .single();

  if (fetchErr || !current) {
    console.error('Failed to fetch user_credits for rollover:', fetchErr);
    throw fetchErr ?? new Error('user_credits row not found');
  }

  const currentRemaining  = current.credits_remaining ?? 0;
  const rolloverCap       = current.rollover_cap ?? cfg.rolloverCap ?? 0;
  const monthlyAllocation = current.monthly_allocation ?? cfg.monthlyAllocation ?? 0;

  // Rollover: carry forward min(unused, rollover_cap), then add new month
  const rollover   = Math.min(currentRemaining, rolloverCap);
  const newBalance = rollover + monthlyAllocation;

  const { error: updateErr } = await supabase
    .from('user_credits')
    .update({
      credits_remaining: newBalance,
      updated_at:        new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateErr) throw updateErr;

  // Log rollover transaction (amount = rollover carried forward)
  if (rollover > 0) {
    await insertCreditTransaction({
      userId,
      amount:       rollover,
      txType:       'rollover',
      balanceAfter: rollover,
      stripeReference: invoice.id,
    });
  }

  // Log the monthly grant
  await insertCreditTransaction({
    userId,
    amount:       monthlyAllocation,
    txType:       'subscription',
    balanceAfter: newBalance,
    stripeReference: invoice.id,
  });

  await logPaymentTransaction(invoice, plan);
}

// ─── customer.subscription.deleted ───────────────────────────────────────────
// Downgrade to free tier. Preserve lifetime_used so they can't re-claim the
// free credit if they've already used it. Zero out remaining credits.

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  // Read current state so we preserve lifetime_used
  const { data: current } = await supabase
    .from('user_credits')
    .select('lifetime_used, credits_remaining')
    .eq('user_id', userId)
    .single();

  const lifetimeUsed       = current?.lifetime_used ?? false;
  const creditsBeforeWipe  = current?.credits_remaining ?? 0;

  await supabase
    .from('user_credits')
    .update({
      plan:                   'free',
      credits_remaining:      lifetimeUsed ? 0 : 1,
      credits_expiry:         null,
      monthly_allocation:     null,
      rollover_cap:           null,
      stripe_subscription_id: null,
      updated_at:             new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Log the wipe as a negative expiry transaction
  if (creditsBeforeWipe > 0) {
    await insertCreditTransaction({
      userId,
      amount:       -creditsBeforeWipe,
      txType:       'expiry',
      balanceAfter: lifetimeUsed ? 0 : 1,
      stripeReference: subscription.id,
    });
  }
}

// ─── invoice.payment_failed ───────────────────────────────────────────────────

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_details?.metadata?.supabase_user_id;
  if (!userId) return;

  // Don't cut off access immediately — Stripe will retry and eventually cancel.
  // Just log the failed payment for accounting.
  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id ?? null;

  await supabase.from('payment_transactions').insert({
    user_id:                  userId,
    stripe_payment_intent_id: paymentIntentId,
    stripe_invoice_id:        invoice.id,
    amount_cents:             invoice.amount_due,
    currency:                 invoice.currency,
    status:                   'failed',
    payment_type:             'subscription',
    description:              'Payment failed — will retry',
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface CreditTxParams {
  userId:          string;
  amount:          number;
  txType:          string;
  balanceAfter:    number | null;
  stripeReference?: string | null;
  schematicId?:    string | null;
}

async function insertCreditTransaction(params: CreditTxParams) {
  const { error } = await supabase.from('credit_transactions').insert({
    user_id:          params.userId,
    amount:           params.amount,
    tx_type:          params.txType,
    balance_after:    params.balanceAfter,
    stripe_reference: params.stripeReference ?? null,
    schematic_id:     params.schematicId ?? null,
  });
  if (error) console.error('credit_transactions insert failed:', error);
}

async function logPaymentTransaction(invoice: Stripe.Invoice, plan: Plan) {
  const userId = invoice.subscription_details?.metadata?.supabase_user_id;
  if (!userId) return;

  const paymentIntentId = typeof invoice.payment_intent === 'string'
    ? invoice.payment_intent
    : invoice.payment_intent?.id ?? null;

  await supabase.from('payment_transactions').insert({
    user_id:                  userId,
    stripe_payment_intent_id: paymentIntentId,
    stripe_invoice_id:        invoice.id,
    amount_cents:             invoice.amount_paid,
    currency:                 invoice.currency,
    status:                   'succeeded',
    payment_type:             'subscription',
    description:              `${plan} plan renewal`,
  });
}
