# Session Log — 2026-03-02 (Session 4)

## What We Accomplished

### Track 1 — Accuracy (partial)
- Ground truth population + accuracy test pipeline was built in Session 3
- **Next session**: Run `python3 tools/populate_ground_truth.py` + `python3 tools/accuracy_test.py`

### Track 2 — First Sale / Stripe (complete)

**Stripe integration wired end-to-end:**
- `api/create-checkout-session.ts` — copied from _INBOX, customer create/find + checkout session creation
- `api/stripe-webhook.ts` — copied from _INBOX, handles checkout.session.completed, subscription.created/updated/deleted, invoice events
- `stripe` npm package installed
- Migration `supabase/migrations/003_add_subscriptions.sql` already existed (subscriptions, payment_transactions, usage_events tables, RLS, can_user_upload/increment_usage RPCs)
- `src/hooks/useSubscription.ts` + `src/types/subscription.types.ts` already existed (copied from _INBOX in prior session or pre-existing)
- `src/components/UpgradeModal.tsx` — new: simple "limit reached" CTA modal, calls /api/create-checkout-session, redirects to Stripe
- `src/pages/UploadPage.tsx` — updated: calls `checkUsage()` before upload, shows UpgradeModal if blocked, calls `incrementUsage()` after success

**Env vars needed in Vercel:**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`
- `VITE_STRIPE_PRO_PRICE_ID`, `VITE_STRIPE_ONETIME_PRICE_ID` (used in subscription.types.ts pricing plans)
- `VITE_APP_URL` (for checkout success/cancel redirects)

### Track 3 — Component Intelligence (complete)

**LEGO references removed (3 occurrences):**
- `LandingPage.tsx` — "like LEGO" → "step by step"
- `ResultsPage.tsx` — "LEGO-style instructions" → "Step-by-step instructions"
- `EnclosureGuide.tsx` — "LEGO-style assembly instructions" → "Step-by-step assembly instructions"

**Germanium transistor detection:**
- `api/analyze-schematic.ts` — prompt now instructs Claude to set `material:"Ge"` for known Ge parts (AC128, OC71, OC76, AC127, OC44, OC45, OC72, AC125, AC126, 2N1308, 2SB75, NKT275)
- `TransistorSVG.tsx` — added `material?: 'Si' | 'Ge'` prop; `material === 'Ge'` forces TO-18 Metal Can rendering

**Transistor pinout protection:**
- `bom-layout.ts` — added `pinout` field to `TransistorPlacement`, static `PINOUT_MAP` lookup (EBC/CBE/SGD/DSG) + `lookupPinout()` for 20+ common transistors
- `BreadboardGuide.tsx` — step 3 now shows "Transistor Orientation" panel with flat-face diagram for each unique transistor in the BOM

### Track 4 — High-Fidelity Rendering (complete)

**ComponentGallery (new component):**
- `src/components/bom/ComponentGallery.tsx` — collapsible dark-green header band + 2–4 column grid of component cards (SVG render, value, type badge, quantity badge, identification hint)
- `BOMTable.tsx` — ComponentGallery added between Confidence Score and Components by Type table

**SVG shadow/bevel filters:**
- `BreadboardBase.tsx` — added `<defs>` with `holeBevel` (inset bevel for holes) and `componentShadow` (drop shadow) filters; holeBevel applied to hole centers
- `BomBreadboardView.tsx` — added `componentShadow` filter defs to overlay SVG; applied to all component `<g>` wrappers

**Active grid labels:**
- `BreadboardBase.tsx` — added `activeCol?: number` and `activeRow?: string` props; active column/row labels render bold + larger
- `BomBreadboardView.tsx` — passes `activeCol`/`activeRow` through to BreadboardBase
- `BreadboardGuide.tsx` — computes active col/row from first focused placement of current step

**Step thumbnail enhancements:**
- `BreadboardGuide.tsx` `ComponentThumbnail` — increased to 120×64px; added inline `thumbShadow` filter defs + `<g filter>` wrappers; updated transistor, IC, pot y-coordinates for new height
- Card wrappers now show: quantity badge (top-right, gray-900 pill), identification hint (italic gray below reference designators)

## Build Status
- 172/172 tests passing
- `npm run build` — TypeScript clean, vite build clean

## What Is Next

1. **IMMEDIATE**: Rotate Anthropic API key (exposed in screenshot) — console.anthropic.com → API Keys
2. **IMMEDIATE**: Run `python3 tools/populate_ground_truth.py` — 7 BOMs waiting
3. **IMMEDIATE**: Run `python3 tools/accuracy_test.py` — baseline scores; review GitHub issues
4. **Fix prompt issues** in `analyze-schematic.ts` based on discrepancy data; target ≥85% all circuits
5. **Stripe**: Set Vercel env vars + test checkout flow in test mode
6. **iOS**: Phase 8 — ios-web-shell from _INBOX
