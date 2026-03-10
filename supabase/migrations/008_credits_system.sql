-- ─────────────────────────────────────────────
-- Migration 008: Credit System
-- Replaces schematics_used_this_month/schematics_limit with
-- a proper credit ledger supporting all 5 pricing tiers.
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- user_credits
-- One row per user. The authoritative credit balance.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_credits (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Current plan
    plan                    TEXT NOT NULL DEFAULT 'free'
                            CHECK (plan IN ('free','coffee','starter','builder','studio')),

    -- Credit balance (NULL = unlimited, used for Studio)
    credits_remaining       INTEGER,

    -- Coffee plan: hard expiry date for the 10-credit block
    credits_expiry          TIMESTAMP WITH TIME ZONE,

    -- Stripe identifiers (denormalized for fast quota checks — no join needed)
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,

    -- Free tier: tracks whether the 1 lifetime upload has been used
    lifetime_used           BOOLEAN NOT NULL DEFAULT false,

    -- Monthly rollover cap (NULL = no cap, i.e. Studio unlimited)
    -- Starter = 15 (1 month rollover), Builder = 40 (1 month rollover)
    monthly_allocation      INTEGER,
    rollover_cap            INTEGER, -- max credits that can roll from one month to the next

    created_at              TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_user_credits_user_id ON public.user_credits (user_id);
CREATE INDEX idx_user_credits_plan    ON public.user_credits (plan);

-- RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own credits"
    ON public.user_credits FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Service role bypasses RLS for webhook / server-side writes


-- ─────────────────────────────────────────────
-- credit_transactions
-- Append-only ledger. Every debit/credit is recorded here.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Signed amount: positive = added, negative = consumed
    amount          INTEGER NOT NULL,

    -- Type of transaction
    tx_type         TEXT NOT NULL
                    CHECK (tx_type IN (
                        'initial_grant',   -- first row created on signup (Free: 1 credit)
                        'purchase',        -- Coffee one-time purchase
                        'subscription',    -- monthly renewal grant
                        'rollover',        -- credits carried forward at month boundary
                        'usage',           -- one analysis consumed (amount = -1)
                        'expiry',          -- Coffee block expired (amount = negative remainder)
                        'promo',           -- promo code grant
                        'admin'            -- manual admin adjustment
                    )),

    -- Optional reference to the schematic that consumed the credit
    schematic_id    UUID REFERENCES public.schematics(id) ON DELETE SET NULL,

    -- Optional reference to the Stripe invoice / payment intent
    stripe_reference TEXT,

    -- Snapshot of balance after this transaction (for auditing without recalculating)
    balance_after   INTEGER,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_credit_tx_user_id    ON public.credit_transactions (user_id);
CREATE INDEX idx_credit_tx_type       ON public.credit_transactions (tx_type);
CREATE INDEX idx_credit_tx_created_at ON public.credit_transactions (created_at DESC);

-- RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own transactions"
    ON public.credit_transactions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- promo_codes
-- Codes that grant credits or bypass the credit gate for a single use.
-- Studio users can generate these to share demo access.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code            TEXT NOT NULL UNIQUE,

    -- Who owns/created this code (Studio users, or admin for NULL)
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- What the code does when redeemed
    credits_granted INTEGER NOT NULL DEFAULT 1,

    -- Optional: restrict to a specific plan requirement (NULL = any plan)
    min_plan        TEXT CHECK (min_plan IN ('free','coffee','starter','builder','studio')),

    -- Usage limits
    max_uses        INTEGER,           -- NULL = unlimited
    times_used      INTEGER NOT NULL DEFAULT 0,

    -- Time window
    expires_at      TIMESTAMP WITH TIME ZONE,

    -- Whether this code bypasses the credit gate entirely for one session
    -- (used for demo passwords — grants a temporary free pass, not credits)
    is_demo_pass    BOOLEAN NOT NULL DEFAULT false,

    active          BOOLEAN NOT NULL DEFAULT true,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_promo_codes_code       ON public.promo_codes (code);
CREATE INDEX idx_promo_codes_created_by ON public.promo_codes (created_by);

-- RLS: only authenticated users can read active codes (to validate at upload time)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active codes"
    ON public.promo_codes FOR SELECT TO authenticated
    USING (active = true);

CREATE POLICY "Code owners can read all their codes"
    ON public.promo_codes FOR SELECT TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Studio users can insert codes"
    ON public.promo_codes FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM public.user_credits
            WHERE user_id = auth.uid() AND plan = 'studio'
        )
    );


-- ─────────────────────────────────────────────
-- promo_code_uses
-- Audit log of every code redemption.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_code_uses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id   UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schematic_id    UUID REFERENCES public.schematics(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Prevent double-dipping on single-use codes per user
    UNIQUE (promo_code_id, user_id)
);

CREATE INDEX idx_promo_uses_code    ON public.promo_code_uses (promo_code_id);
CREATE INDEX idx_promo_uses_user_id ON public.promo_code_uses (user_id);

-- RLS
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own promo uses"
    ON public.promo_code_uses FOR SELECT TO authenticated
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- Bootstrap: create user_credits row on new user signup
-- Mirrors the existing trigger pattern for subscriptions.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_credits (
        user_id,
        plan,
        credits_remaining,
        monthly_allocation,
        rollover_cap,
        lifetime_used
    ) VALUES (
        NEW.id,
        'free',
        1,       -- 1 lifetime credit
        NULL,    -- no monthly cycle
        NULL,    -- no rollover
        false
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Seed the ledger
    INSERT INTO public.credit_transactions (
        user_id, amount, tx_type, balance_after
    ) VALUES (
        NEW.id, 1, 'initial_grant', 1
    );

    RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created_credits'
    ) THEN
        CREATE TRIGGER on_auth_user_created_credits
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();
    END IF;
END;
$$;


-- ─────────────────────────────────────────────
-- Helper view: current credit status per user
-- Used by the frontend nav bar and quota gate.
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.user_credit_status AS
SELECT
    uc.user_id,
    uc.plan,
    uc.credits_remaining,
    uc.credits_expiry,
    uc.lifetime_used,
    uc.monthly_allocation,
    uc.rollover_cap,
    -- Effective available credits (NULL = unlimited for Studio)
    CASE
        WHEN uc.plan = 'studio'                            THEN NULL  -- unlimited
        WHEN uc.plan = 'free' AND uc.lifetime_used = true  THEN 0
        WHEN uc.plan = 'coffee'
             AND uc.credits_expiry IS NOT NULL
             AND uc.credits_expiry < now()                 THEN 0     -- expired
        ELSE uc.credits_remaining
    END AS effective_credits,
    -- Whether the user can currently run an analysis
    CASE
        WHEN uc.plan = 'studio'                            THEN true
        WHEN uc.plan = 'free' AND uc.lifetime_used = false THEN true
        WHEN uc.plan = 'coffee'
             AND uc.credits_remaining > 0
             AND (uc.credits_expiry IS NULL OR uc.credits_expiry > now()) THEN true
        WHEN uc.plan IN ('starter','builder')
             AND uc.credits_remaining > 0                  THEN true
        ELSE false
    END AS can_analyze
FROM public.user_credits uc;

-- Grant read access to authenticated users (filtered by RLS on underlying table)
GRANT SELECT ON public.user_credit_status TO authenticated;
