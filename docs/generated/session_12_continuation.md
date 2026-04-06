# Session 12 Continuation

## Where We Stopped

Sprint 5 (credits system) is fully coded and deployed to pedalpath.app.
The system cannot activate until Rob completes 4 setup steps in browser (migrations + Stripe keys).

## Exact Resume Point

**First thing next session — ask Rob:**
"Did you complete the Stripe test steps from stripe-test-steps-2026-03-10.txt?"

If YES → verify end-to-end worked, then move to Priority Queue below.
If NO → remind Rob the steps are in _OUTPUT/stripe-test-steps-2026-03-10.txt and wait.

## Rob's Blocking Actions (must be done in browser, not by Claude)

1. **Supabase SQL editor** — run 008_credits_system.sql then 009_seed_user_credits.sql
   Files at: \\wsl.localhost\Ubuntu\home\rob\pedalpath-v2\supabase\migrations\

2. **Vercel env vars** (Settings → Environment Variables):
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_PRICE_COFFEE
   - STRIPE_PRICE_STARTER
   - STRIPE_PRICE_BUILDER
   - STRIPE_PRICE_STUDIO
   - VITE_APP_URL = https://pedalpath.app
   - SUPABASE_SERVICE_ROLE_KEY

3. **Stripe webhook** → https://pedalpath.app/api/stripe-webhook
   Events: checkout.session.completed, invoice.payment_succeeded,
           invoice.payment_failed, customer.subscription.deleted

4. **Test checkout**: pedalpath.app/pricing → Coffee → card 4242 4242 4242 4242
   Verify: Supabase user_credits.credits_remaining = 10, plan = 'coffee'
   Verify: Upload a schematic → credits_remaining drops to 9

## Priority Queue (after Stripe test passes)

1. Accuracy suite — `python3 tools/accuracy_test.py --force`
   Targets: Aeon Drive (~69%), BazzFuss (~63%), Stage 3 variants (~68%)
2. iOS Phase 8 — `_INBOX/pedalpath-ios-web-shell-gh/` design tokens + native-feel UI
3. Phase 4 CollisionAlert — `src/components/sidebar/CollisionAlert.tsx`
4. Dashboard async — link saved project cards to results page (issue #207)

## Production State

- 172/172 tests passing
- Live: pedalpath.app (commit dd48394)
- Git: clean
- DB: 51 circuits / 967 components
- Migrations 008+009: committed, NOT YET APPLIED
