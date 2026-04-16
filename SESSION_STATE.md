# SESSION STATE — PedalPath v2

_Auto-updated by `tools/update_session_state.py` at session end._
_Read automatically by `start_session.sh` on startup._

---

## Last Sprint Completed

**Session 15 / 2026-04-15** — package_type deploy + taxonomy migration (authored, blocked on DB auth)

### What landed

| Item | Detail |
|------|--------|
| Build guide pattern analysis | Read and internalized 25-guide competitive analysis (OUTBOX_Dx/pedalpath_build_guide_patterns_v01_041426.md). 6 competitive moat items confirmed. Dual build-order (shortest-to-tallest) vs signal-flow (stage-by-stage) modes identified as key differentiator. |
| Tests | 189/189 passing (up from 172 — new difficulty-scorer tests from Session 14). All green. |
| Vercel deploy | Commit 9fed204 (package_type visual taxonomy in AI prompt + BOMComponent interface) deployed to production. Deployment ID: `dpl_8snKBHwQqj4KDit26MpYuH6ZbCAy`, readyState: READY. |
| Migration 010 authored | `supabase/migrations/010_package_type_taxonomy.sql` — creates `package_type_taxonomy` table (18 rows), adds `package_type` FK column to `component_reference`, backfills all 160 existing rows from subcategory data. |
| SUPABASE_SERVICE_ROLE_KEY missing | Confirmed NOT set in Vercel env vars. Needs adding for server-side Supabase operations. |

### What's blocked

| Item | Blocker |
|------|---------|
| Migration 010 apply | **Supabase DB password rejected** — the password in `/home/rob/.pedalpath_env` (`SUPABASE_DB_URL`) fails authentication via both psql and Python psycopg2. Password was likely rotated. Must reset via Supabase Dashboard or apply SQL via the Dashboard SQL Editor. |

### Previous session (Session 13 / 2026-04-06)

| Item | Detail |
|------|--------|
| Webhook \n fix | Commit `6c5ed08`. Deployed. |
| Governance overhaul | compliance_gate.md, CLAUDE.md cleanup, Pattern 004 logged. |

---

## ⚠️ WEBHOOK NOT YET VERIFIED — THIS IS THE FIRST ACTION NEXT SESSION

The fix is deployed but the end-to-end test was not completed because it requires Rob to be at the Stripe dashboard.

**Exact steps to verify (do this first, before anything else):**

1. Open a browser. Go to `https://dashboard.stripe.com`. Sign in.
2. In the left sidebar, click **Developers**.
3. In the Developers sub-menu, click **Webhooks**.
4. Find the webhook named **charismatic-bliss** and click it.
5. Click the **Event deliveries** tab.
6. Find the row where the event type column says **checkout.session.completed**. Read the status badge color and HTTP code in that row.
   - If the status shows **500** or **400**: click the **Resend** button on that row. That replays the exact event to the now-fixed endpoint.
   - If the status shows **200** and it happened AFTER today's deploy (within the last 30–60 min): the webhook already worked. Skip to step 7.
7. After resending: go to `https://supabase.com/dashboard`, sign in, open the PedalPath project, click **Table Editor** in the left sidebar, click **user_credits**. Find your row. Confirm `plan`, `credits_remaining`, and `stripe_customer_id` are all populated (not free/1/NULL).

---

## Production State

- **Tests**: 189/189 passing (confirmed Session 15, 2026-04-15)
- **TypeScript**: clean
- **Deploy**: https://pedalpath.app (live, package_type deployed)
- **Git branch**: main
- **Last commit**: `9b315b7` — feat: add build guide foundation layer
- **DB migrations applied**: 001–007 confirmed; **008+009 PENDING; 010 AUTHORED but NOT APPLIED (DB auth blocked)**
- **DB**: 51 circuits / 967 components

---

## Pending Items (ordered)

- [ ] **[FIRST] Reset Supabase DB password** — Dashboard > Project Settings > Database > Reset password. Update `/home/rob/.pedalpath_env` with new password. Then re-test: `python3 -c "from dotenv import load_dotenv; import os,psycopg2; load_dotenv('/home/rob/.pedalpath_env'); psycopg2.connect(os.environ['SUPABASE_DB_URL']); print('OK')"`
- [ ] **Apply migration 010** (`supabase/migrations/010_package_type_taxonomy.sql`) — either via psql after password reset, or paste into Supabase Dashboard SQL Editor
- [ ] **Add SUPABASE_SERVICE_ROLE_KEY to Vercel** — `npx vercel env add SUPABASE_SERVICE_ROLE_KEY production` (get value from Supabase Dashboard > Project Settings > API > service_role key)
- [ ] Apply migration 008 (`008_credits_system.sql`) to Supabase
- [ ] Apply migration 009 (`009_seed_user_credits.sql`) to seed existing users
- [ ] Verify Stripe webhook end-to-end (Resend checkout.session.completed from Stripe dashboard)
- [ ] Run Stripe test checkout — card `4242 4242 4242 4242` — verify credit deduction
- [ ] Run accuracy suite: `python3 tools/accuracy_test.py --force`
- [ ] **Start Parts Inventory UI** — Phase 1 of build guide visual system (depends on migration 010 being applied)

---

## Last Accuracy Score

**Session 10 (2026-03-05)**: 27/34 circuits passing (79%)

Key failures: Aeon Drive 69.6%, BazzFuss 63.6%, Stage 3 variants ~68%, Ratticus Turbo ~76%

Cache invalidated by session 10 prompt changes — next run needs `--force`.

---

## Next Session Priority Queue

1. **Reset Supabase DB password** (blocker for everything DB-related)
2. Apply migration 010 (package_type_taxonomy) — file is ready, just needs DB access
3. Add SUPABASE_SERVICE_ROLE_KEY to Vercel
4. Apply migrations 008+009 (credits system)
5. Stripe webhook verify + test checkout
6. Parts Inventory UI spike (Phase 1 of build guide visual system)
7. Accuracy suite rerun (`--force`)

---

## Rob Action Items (outstanding)

- **Stripe webhook verify**: Resend `checkout.session.completed` from Stripe dashboard → confirm Supabase user_credits updated
- **Gmail OAuth**: run `! cd "/mnt/c/Users/Rob/Dropbox/!Claude/SYSTEM" && python3 setup_google_auth.py` in Claude Code chat
- **Rotate Anthropic API key** (exposed in screenshot) — console.anthropic.com → API Keys
