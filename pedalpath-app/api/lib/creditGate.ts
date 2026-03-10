// SERVER-SIDE ONLY — called from api/ routes.
// SUPABASE_SERVICE_ROLE_KEY must never reach the browser bundle.
import { createClient } from '@supabase/supabase-js';

type Plan = 'free' | 'coffee' | 'starter' | 'builder' | 'studio';

function adminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── checkAndConsumeCredit ────────────────────────────────────────────────────

export interface CheckResult {
  allowed: boolean;
  plan?: Plan;
  credits_remaining?: number | null;
  upgrade_url?: string;
}

export async function checkAndConsumeCredit(userId: string): Promise<CheckResult> {
  const supabase = adminClient();

  // Query the computed view for this user
  const { data, error } = await supabase
    .from('user_credit_status')
    .select('plan, credits_remaining, effective_credits, can_analyze')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // User predates the credit system — create a free-tier row and grant this pass
    await supabase.from('user_credits').upsert(
      { user_id: userId, plan: 'free', credits_remaining: 1, lifetime_used: false },
      { onConflict: 'user_id' }
    );
    // Let them through; next call will hit the normal flow with 0 credits
    return { allowed: true };
  }

  const plan = data.plan as Plan;

  if (!data.can_analyze) {
    return {
      allowed: false,
      plan,
      credits_remaining: data.effective_credits ?? 0,
      upgrade_url: '/pricing',
    };
  }

  // Studio: unlimited — no ledger mutation needed
  if (plan === 'studio') {
    return { allowed: true };
  }

  // Compute new balance and build the update payload
  const currentBalance: number = data.credits_remaining ?? 1;
  const newBalance = plan === 'free' ? 0 : currentBalance - 1;

  const updatePayload: Record<string, unknown> =
    plan === 'free'
      ? { lifetime_used: true, credits_remaining: 0, updated_at: new Date().toISOString() }
      : { credits_remaining: newBalance, updated_at: new Date().toISOString() };

  const { error: updateErr } = await supabase
    .from('user_credits')
    .update(updatePayload)
    .eq('user_id', userId);

  if (updateErr) throw updateErr;

  // Append usage row to ledger
  const { error: txErr } = await supabase.from('credit_transactions').insert({
    user_id:      userId,
    amount:       -1,
    tx_type:      'usage',
    balance_after: newBalance,
  });
  if (txErr) console.error('credit_transactions insert failed:', txErr);

  return { allowed: true };
}

// ─── redeemPromoCode ─────────────────────────────────────────────────────────

export interface RedeemResult {
  success: boolean;
  demoPass?: boolean;
  creditsGranted?: number;
  error?: string;
}

export async function redeemPromoCode(userId: string, code: string): Promise<RedeemResult> {
  const supabase = adminClient();
  const normalised = code.trim().toUpperCase();

  // Fetch and validate
  const { data: promo, error: promoErr } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', normalised)
    .eq('active', true)
    .single();

  if (promoErr || !promo) {
    return { success: false, error: 'Invalid or expired promo code.' };
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { success: false, error: 'This promo code has expired.' };
  }
  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
    return { success: false, error: 'This promo code has reached its usage limit.' };
  }

  // One use per user
  const { data: existing } = await supabase
    .from('promo_code_uses')
    .select('id')
    .eq('promo_code_id', promo.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'You have already used this promo code.' };
  }

  // Record the use and increment counter
  const useInsert = supabase
    .from('promo_code_uses')
    .insert({ promo_code_id: promo.id, user_id: userId });
  const counterUpdate = supabase
    .from('promo_codes')
    .update({ times_used: promo.times_used + 1 })
    .eq('id', promo.id);
  await Promise.all([useInsert, counterUpdate]);

  // Demo pass: no credit grant; caller sets session-level flag
  if (promo.is_demo_pass) {
    return { success: true, demoPass: true };
  }

  // Credit grant: fetch balance → update → log
  const { data: credits } = await supabase
    .from('user_credits')
    .select('credits_remaining')
    .eq('user_id', userId)
    .maybeSingle();

  const currentBalance = credits?.credits_remaining ?? 0;
  const newBalance = currentBalance + promo.credits_granted;

  const { error: updateErr } = await supabase
    .from('user_credits')
    .update({ credits_remaining: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updateErr) throw updateErr;

  await supabase.from('credit_transactions').insert({
    user_id:       userId,
    amount:        promo.credits_granted,
    tx_type:       'promo',
    balance_after: newBalance,
  });

  return { success: true, creditsGranted: promo.credits_granted };
}
