-- ============================================================================
-- SUBSCRIPTIONS & PAYMENT SYSTEM
-- Migration 003: Add subscription management for revenue
-- ============================================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Subscription details
  plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'one-time'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'expired'

  -- Usage tracking for free tier
  schematics_used_this_month INT DEFAULT 0,
  schematics_limit INT DEFAULT 1, -- free tier: 1 per month

  -- Billing cycle
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast user lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- PAYMENT TRANSACTIONS TABLE (for audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe details
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,

  -- Transaction details
  amount_cents INT NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed', 'refunded'
  payment_type TEXT NOT NULL, -- 'subscription', 'one-time'
  description TEXT,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transactions"
ON payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- USAGE EVENTS TABLE (track schematic uploads for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  schematic_id UUID REFERENCES schematics(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL, -- 'schematic_upload', 'bom_generated', 'pdf_exported', etc.

  -- Context
  subscription_plan TEXT, -- plan at time of event
  was_allowed BOOLEAN DEFAULT TRUE,
  blocked_reason TEXT, -- if was_allowed = false

  -- Metadata
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at);

-- Enable RLS
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage events"
ON usage_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage events"
ON usage_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to reset monthly usage counters (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE subscriptions
  SET
    schematics_used_this_month = 0,
    updated_at = NOW()
  WHERE plan = 'free'
    AND current_period_end < NOW();
END;
$$;

-- Function to check if user can upload (called before upload)
CREATE OR REPLACE FUNCTION can_user_upload(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, schematics_remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  -- No subscription? Create free tier
  IF v_subscription IS NULL THEN
    INSERT INTO subscriptions (user_id, plan, status, schematics_limit, current_period_end)
    VALUES (p_user_id, 'free', 'active', 1, NOW() + INTERVAL '30 days')
    RETURNING * INTO v_subscription;
  END IF;

  -- Check plan type
  IF v_subscription.plan = 'pro' THEN
    -- Pro users have unlimited uploads
    RETURN QUERY SELECT TRUE, 'pro_unlimited'::TEXT, 999999;
  ELSIF v_subscription.plan = 'free' THEN
    -- Free users have monthly limit
    IF v_subscription.schematics_used_this_month < v_subscription.schematics_limit THEN
      RETURN QUERY SELECT
        TRUE,
        'free_tier'::TEXT,
        v_subscription.schematics_limit - v_subscription.schematics_used_this_month;
    ELSE
      RETURN QUERY SELECT FALSE, 'limit_reached'::TEXT, 0;
    END IF;
  ELSE
    -- Expired or unknown status
    RETURN QUERY SELECT FALSE, 'subscription_inactive'::TEXT, 0;
  END IF;
END;
$$;

-- Function to increment usage after successful upload
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID, p_schematic_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment usage counter for free tier
  UPDATE subscriptions
  SET
    schematics_used_this_month = schematics_used_this_month + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND plan = 'free';

  -- Log usage event
  INSERT INTO usage_events (user_id, schematic_id, event_type, subscription_plan, metadata)
  SELECT
    p_user_id,
    p_schematic_id,
    'schematic_upload',
    s.plan,
    jsonb_build_object(
      'schematics_used', s.schematics_used_this_month,
      'schematics_limit', s.schematics_limit
    )
  FROM subscriptions s
  WHERE s.user_id = p_user_id;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create free tier subscriptions for existing users
INSERT INTO subscriptions (user_id, plan, status, schematics_limit, current_period_end)
SELECT
  id,
  'free',
  'active',
  1,
  NOW() + INTERVAL '30 days'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subscriptions IS 'User subscription and plan management';
COMMENT ON TABLE payment_transactions IS 'Audit trail of all payment transactions';
COMMENT ON TABLE usage_events IS 'Analytics and usage tracking events';
COMMENT ON FUNCTION can_user_upload IS 'Check if user has remaining uploads in their plan';
COMMENT ON FUNCTION increment_usage IS 'Track usage after successful upload';
COMMENT ON FUNCTION reset_monthly_usage IS 'Reset monthly counters (run via cron)';
