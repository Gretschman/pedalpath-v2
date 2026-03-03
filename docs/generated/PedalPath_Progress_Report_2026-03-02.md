# PedalPath — Project Progress Report
## March 2, 2026 (Sessions 4 & 5)

---

# 1. Project Overview

**PedalPath** is a web application that lets guitar pedal builders upload a schematic image and receive a complete, visual build package: a Bill of Materials (BOM), a breadboard layout, step-by-step build guides, and enclosure recommendations. The core intelligence is Claude Vision (Anthropic) analyzing the schematic image and returning structured component data.

**Live URL:** https://pedalpath.app
**Tech stack:** React + TypeScript (Vite), Vercel serverless API, Supabase (PostgreSQL + Auth + Storage), Stripe (payments — wired but not yet enforced)

---

# 2. What Was Built Today

## Session 4 (Morning)

### Stripe Integration — Code Complete
All payment infrastructure is wired end-to-end and deployed. The quota gate is **disabled for beta** — all uploads are free until launch.

- `api/create-checkout-session.ts` — Stripe customer create/find, hosted checkout session (subscription or one-time payment), 7-day trial
- `api/stripe-webhook.ts` — handles checkout completion, subscription lifecycle, invoice events; updates DB
- `src/components/UpgradeModal.tsx` — modal shown when free limit is reached; redirects to Stripe checkout
- `src/pages/UploadPage.tsx` — quota check before upload, usage increment after success (both commented out for beta)
- DB schema (migration 003): `subscriptions`, `payment_transactions`, `usage_events` tables + `can_user_upload()` + `increment_usage()` RPCs — confirmed live in production

### Component Intelligence — Complete
- Removed all "LEGO" references from codebase (3 locations)
- **Germanium transistor detection:** Claude prompt now extracts `material: "Ge"` for AC128, OC71, OC76, AC127, OC44/45/72, AC125/126, 2N1308, 2SB75, NKT275; `TransistorSVG.tsx` routes Ge parts to TO-18 Metal Can rendering instead of TO-92
- **Transistor pinout protection:** `PINOUT_MAP` in `bom-layout.ts` covers 20+ common transistors (EBC/CBE/SGD/DSG); `BreadboardGuide.tsx` step 3 shows a flat-face orientation diagram for every transistor in the BOM

### High-Fidelity Rendering — Complete
- **ComponentGallery** (new component): collapsible dark-green header + 2–4 column grid of component cards with SVG renders, value, type badge, quantity badge, and identification hint from the decoder library
- **SVG depth filters:** `holeBevel` (inset bevel on breadboard holes) and `componentShadow` (drop shadow on placed components) give the breadboard a physical, 3D appearance
- **Active grid labels:** current build step's column and row letters render bold in the breadboard, showing the builder exactly where to look
- **ComponentThumbnail** enlarged to 120×64px with shadow, quantity badge, and identification hint (e.g. "Flat face → right, E is pin 1")

---

## Session 5 (Afternoon/Evening)

### Reset Password Page (new)
- Supabase `PASSWORD_RECOVERY` auth event handling, password/confirm validation (min 8 chars), `updateUser()` call, auto sign-out and redirect to sign-in after 3 seconds
- `/reset-password` route added — previously showed a blank white page

### Accuracy Pipeline — Complete

**Ground truth setup:**
- Fixed all 5 corrupted JSON files in `_INBOX/ground-truth/` (syntax errors from file transfer)
- Added page number support — multi-page PDFs now extract the correct page for each circuit
- DB seed: **32 reference circuits, 554 reference components** across 8 JSON source files

**Accuracy test engine improvements:**
- Value normalizer handles: jack `1/4"` prefix, R-suffix ohms notation (`100R → 100`), taper prefix removal (`A100K → 100k`), annotation strip (`10µF 16V tant → 10u`), unit suffix strip (`47nF → 47n`)
- `ic` and `op-amp` now match cross-type (LM386 classified as either type will score correctly)
- GitHub issues auto-filed with `accuracy` label for any circuit below 85%

**Prompt improvements:**
- **Rule 0 (OVERRIDE):** any value with A/B/C taper prefix (A100K, B50K) is always a potentiometer — never misclassified as resistor
- **European notation:** `1M5 = 1.5MΩ`, `4k7 = 4.7k` — return value exactly as written
- **Pot label rule:** value = resistance only (e.g. `50k`), never include knob label (Volume, Boost, Drive, Gain)

**Accuracy results — final run of the day:**

| Circuit | Score | Status |
|---|---|---|
| Emerald Ring | 96.8% | PASS |
| Tone TwEQ v1 2020 | 96.1% | PASS |
| Ratticus V1 — Original | 92.0% | PASS |
| Ratticus V1 — Reissue | 92.0% | PASS |
| Ratticus V1 — Ver 2 | 90.6% | PASS |
| Ratticus V1 — YDR | 90.3% | PASS |
| Dart V2 | ~90% (varies) | Usually PASS |
| **Stratoblaster** | **90.0%** | **PASS — was 59% at start of day** |
| **Sunburn V3** | **85.0%** | **PASS — was 57% at start of day** |
| Ratticus Turbo | ~70% | Structural limit — see note |
| 1 Knob Fuzz V2 × 6 | 47–99% (high variance) | Structural limit — see note |

**Structural limitations (not fixable via prompt):**
The 6 "1 Knob Fuzz V2" circuits all share page 56 of the Hammond Toneworks PDF — a single image showing all 6 variant BOMs in a side-by-side table. Every test run submits the same image; the AI reads whatever column it finds most prominent, which changes each run. This is a test design constraint, not a product bug — real users would only ever submit a single circuit.

Ratticus Turbo (page 12) has a BOM table where the AI consistently reads capacitor values one row off. The other 4 Ratticus variants (pages 9–11, 13) pass at 90%+ consistently.

---

# 3. Current Production Status

**https://pedalpath.app — fully operational**

| Feature | Status |
|---|---|
| Upload schematic (image or PDF) | Working |
| Claude Vision BOM extraction | Working |
| Results: BOM table + ComponentGallery | Working |
| Results: Breadboard diagram with depth/shadows | Working |
| Results: Step-by-step guide with pinout diagrams | Working |
| Results: Enclosure + power recommendations | Working |
| Authentication (sign up / sign in / reset password) | Working |
| Projects dashboard (view + delete) | Working |
| Upload quota enforcement | **Disabled for beta** |
| Stripe checkout | Code deployed, env vars pending |

---

# 4. PRD Phase Status

| Phase | Name | Status |
|---|---|---|
| Phase 1 | Physics Kernel | Complete |
| Phase 2 | Component Intelligence | Complete |
| Phase 3 | High-Fidelity Rendering | Complete |
| Phase 4 | Collision & Safety | **Not started** |
| Phase 5 | Zero-Drift Audit | Partial |

**Phase 4 summary (next major engineering track):**
Enclosure boundary mapping + forbidden zone detection + proactive "Hardware Collision" alerts. When a component lands in the jack area or footswitch area of the chosen enclosure, the sidebar flags it before the builder starts drilling. Key files to create: `src/utils/enclosure-boundaries.ts` and `src/components/sidebar/CollisionAlert.tsx`.

---

# 5. Action Items

## For Rob

**Critical — ask your engineer:**
The `ANTHROPIC_API_KEY` in Vercel was accidentally visible in a development screenshot. Ask your engineer to generate a new key at console.anthropic.com and replace the `ANTHROPIC_API_KEY` environment variable in the Vercel pedalpath-app project.

**When ready to start charging (Stripe):**
Set these 5 env vars in Vercel Dashboard, then register the webhook:

| Env Var | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks (after creating endpoint) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `VITE_APP_URL` | Set to `https://pedalpath.app` |
| `VITE_STRIPE_PRO_PRICE_ID` | Stripe Dashboard → Product catalog |

Webhook endpoint to register: `https://pedalpath.app/api/stripe-webhook`

To re-enable quota at launch: uncomment 2 clearly marked lines in `src/pages/UploadPage.tsx`

---

# 6. Next Session Priorities

1. **Phase 4 — Collision & Safety** — enclosure boundaries, forbidden zones, proactive alerts
2. **iOS Phase 8** — integrate `_INBOX/pedalpath-ios-web-shell-gh/` design tokens and native-feel UI components
3. **New circuits** — add ground truth BOMs + test for: OKF-v2, SHO-Nuff-v4, Super-Sonic-02, T-AMP 1.1, One Knob Clang 2.0

---

# 7. Technical Scorecard

- **172 / 172 unit tests passing**
- TypeScript: clean (tsc -b zero errors)
- Vite build: clean
- GitHub: all changes pushed to main
- Vercel: latest build deployed
- Supabase: all migrations 001–006 applied, reference data seeded

---

*PedalPath v2 — generated 2026-03-02*
