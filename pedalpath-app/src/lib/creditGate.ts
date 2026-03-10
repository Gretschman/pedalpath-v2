// CLIENT-SIDE credit helpers.
// Server-side gate (checkAndConsumeCredit, redeemPromoCode) lives in api/lib/creditGate.ts.
import { supabase } from '../services/supabase';

export type Plan = 'free' | 'coffee' | 'starter' | 'builder' | 'studio';

export interface CreditStatus {
  plan: Plan;
  credits_remaining: number | null; // null = unlimited (Studio)
  effective_credits: number | null;
  can_analyze: boolean;
  credits_expiry: string | null;
}

// Read the user_credit_status view (authenticated, RLS-filtered)
export async function getCreditStatus(userId: string): Promise<CreditStatus | null> {
  const { data, error } = await supabase
    .from('user_credit_status')
    .select('plan, credits_remaining, effective_credits, can_analyze, credits_expiry')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as CreditStatus;
}

// Studio users: generate a shareable promo code (RLS enforces Studio plan requirement)
export interface GeneratePromoOptions {
  credits_granted?: number;
  max_uses?: number | null;
  expires_at?: string | null;
  is_demo_pass?: boolean;
}

export async function generatePromoCode(
  userId: string,
  opts: GeneratePromoOptions = {}
): Promise<{ code: string } | { error: string }> {
  const code = generateRandomCode();

  const { error } = await supabase.from('promo_codes').insert({
    code,
    created_by:      userId,
    credits_granted: opts.credits_granted ?? 1,
    max_uses:        opts.max_uses ?? null,
    expires_at:      opts.expires_at ?? null,
    is_demo_pass:    opts.is_demo_pass ?? false,
    active:          true,
  });

  if (error) {
    return { error: error.message };
  }
  return { code };
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0, I/1 ambiguity
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
