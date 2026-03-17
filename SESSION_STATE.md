# SESSION STATE — PedalPath v2

_Auto-updated by `tools/update_session_state.py` at session end._
_Read automatically by `start_session.sh` on startup._

---

## Last Sprint Completed

**Session 12 / 2026-03-10** — Stripe + Credits system full integration

### What landed (Sprints 1–4 + credits)

| Sprint | Commits | Summary |
|--------|---------|---------|
| 1 | `2924812` | Accuracy fixes — breadboard accuracy improvements |
| 2 | `968d85f` | Sprite library, ComponentVisualEngine, decorators |
| 3 | `c2a8e57` | Breadboard rendering — symbol/use, bus split, mirror, resistor width, ValidationPipeline |
| 4 | `fb15551` | `package` field plumbed + Supabase Realtime async upload flow |
| Credits | uncommitted | Full 5-tier credit/billing system — see below |

### Credits system (uncommitted — applied to working tree)

- `pedalpath-app/api/lib/creditGate.ts` — server-side gate: `checkAndConsumeCredit()`, `redeemPromoCode()`
- `pedalpath-app/src/lib/creditGate.ts` — client-side: `getCreditStatus()`, `generatePromoCode()`
- `pedalpath-app/src/hooks/useCreditStatus.ts` — React hook
- `pedalpath-app/src/pages/PricingPage.tsx` — 5-tier pricing page (Free/Coffee/Starter/Builder/Studio)
- `pedalpath-app/api/create-checkout-session.ts` — updated: 4-plan PRICE_IDS map, Coffee = one-time payment
- `pedalpath-app/api/stripe-webhook.ts` — updated: credit grant on checkout; rollover on renewal; downgrade on cancel
- `pedalpath-app/src/types/subscription.types.ts` — updated: 5-tier PRICING_PLANS array, Coffee as one-time
- `supabase/migrations/008_credits_system.sql` — schema: user_credits, credit_transactions, promo_codes, promo_code_uses, user_credit_status view, bootstrap trigger
- `supabase/migrations/009_seed_user_credits.sql` — seeds free-tier rows for pre-existing users

---

## Production State

- **Tests**: 172/172 passing
- **TypeScript**: clean
- **Deploy**: https://pedalpath.app (live)
- **Git branch**: main
- **Last commit**: dd48394 Sprint 5: 5-tier credit system + session continuity automation
- **DB migrations applied**: 001–007 confirmed; **008+009 PENDING**
- **DB**: 51 circuits / 967 components

---

## Pending Items (ordered)

- [ ] Apply migration 008 (`008_credits_system.sql`) to Supabase via SQL editor
- [ ] Apply migration 009 (`009_seed_user_credits.sql`) to seed existing users
- [ ] Set Stripe env vars in Vercel dashboard:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_COFFEE` (one-time price ID)
  - `STRIPE_PRICE_STARTER`
  - `STRIPE_PRICE_BUILDER`
  - `STRIPE_PRICE_STUDIO`
  - `VITE_APP_URL=https://pedalpath.app`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Register Stripe webhook: `https://pedalpath.app/api/stripe-webhook`
  Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
- [x] Wire `checkAndConsumeCredit` into `UploadPage.tsx` — done via `/api/consume-credit` endpoint
- [ ] Run Stripe test checkout — card `4242 4242 4242 4242` — verify credit deduction end-to-end
- [ ] Run accuracy suite: `python3 tools/accuracy_test.py --force`

---

## Last Accuracy Score

**Session 10 (2026-03-05)**: 27/34 circuits passing (79%)

Key failures: Aeon Drive 69.6%, BazzFuss 63.6%, Stage 3 variants ~68%, Ratticus Turbo ~76%

Cache invalidated by session 10 prompt changes — next run needs `--force`.

---

## Next Session Priority Queue

1. Apply migrations 008+009 (pre-requisite for everything else)
2. Set Stripe env vars in Vercel + register webhook
3. Wire credit gate into UploadPage
4. Deploy + run Stripe test checkout end-to-end
5. Accuracy suite rerun (`--force`)
6. iOS Phase 8 — `_INBOX/pedalpath-ios-web-shell-gh/`

---

## Rob Action Items (outstanding)

- **Rotate Anthropic API key** (exposed in screenshot) — console.anthropic.com → API Keys
- **Set Stripe env vars** in Vercel Dashboard (see Pending Items above)
- **Register Stripe webhook** endpoint (see above)
- **Re-enable quota gate** at launch: uncomment credit check in `src/pages/UploadPage.tsx`
