-- Migration 009: Seed user_credits for existing auth.users who don't have a row yet.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

INSERT INTO public.user_credits (
    user_id,
    plan,
    credits_remaining,
    monthly_allocation,
    rollover_cap,
    lifetime_used,
    created_at,
    updated_at
)
SELECT
    u.id,
    'free',
    1,
    NULL,
    NULL,
    false,
    now(),
    now()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_credits uc WHERE uc.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Seed the ledger for any newly-created rows (avoids duplicating existing entries)
INSERT INTO public.credit_transactions (
    user_id,
    amount,
    tx_type,
    balance_after,
    created_at
)
SELECT
    uc.user_id,
    1,
    'initial_grant',
    1,
    now()
FROM public.user_credits uc
WHERE NOT EXISTS (
    SELECT 1 FROM public.credit_transactions ct
    WHERE ct.user_id = uc.user_id AND ct.tx_type = 'initial_grant'
)
AND uc.plan = 'free';
