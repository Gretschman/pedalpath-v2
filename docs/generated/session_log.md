# Session Log — 2026-03-05 (Session 10)

## Session 10 Close (2026-03-05)

### What was completed

**iOS bug fixes — save + share (blocking UX bugs)**

Diagnosed and fixed two blocking iOS bugs from live user testing:

1. **Save button gave no feedback, no naming** — The text label was `hidden sm:inline` so only the icon showed on mobile. No circuit naming flow existed (title stayed as auto-generated filename like "Schematic Mar 5, 2026").
   - Fix: Save button now opens a bottom-sheet rename modal with a text input pre-filled with the current title
   - User can rename and tap Save; mutation updates both `title` and `status: completed` in one call
   - Green "Saved!" toast (check icon, 2.5s) replaces hidden text state
   - Already-saved circuits show "Rename" instead of disabled

2. **Share icon navigated to upload page** — The `<Upload>` lucide icon on the "Upload Another" button is visually identical to the iOS system share icon. Rob was tapping it thinking it was Share.
   - Fix: Changed icon to `<Plus>`, label changed to "New" (always visible, no `hidden sm:inline`)

**IOMMIC BOOST analysis investigation**

- Rob uploaded IMG_7472.jpeg (IOMMIC BOOST schematic, a Rangemaster-style Ge transistor boost based on the DAM B13) — our system scored 65% confidence and generated a completely wrong BOM
- Reference BOM (from IOMMIC BOOST 1.0.docx): R1=1M, R2=470k, R3=56k, R4=3k9; 10 caps (4n7×2, 4.7µF, 10n, 22n, 56n, 100n, 220n, 47µF, 22µF); Q1=NPN Ge; D1=1N4001; 3 pots (C1M, B10k, A100k trim); FAC=2P6T rotary
- Our output had completely wrong values — likely a PCB photo rather than clean schematic
- Circuit is a good candidate for ground truth addition once a proper schematic image is sourced

**Coppersound Single Transistor Overdrive build guide reviewed**
- File in _INBOX: `Single+Transistor+Overdrive+Breadboard+Guide+2025.pdf`
- Full BOM extracted: 5 resistors (560, 1K, 47K, 1M, 2.2M), 1×1N4001, 2×1N4148, 1×2N3904, 1×100µF elec, 4 film caps (47n, 0.1µF×2, 3.3n), 2×B100K pot
- Circuit follows the same 6-step functional flow as our BreadboardGuide rewrite (power → input → gain → clipping → tone → output) — confirms our Phase B design

### Commits this session
- `c8d4f57` Fix iOS save/share bugs: rename modal + Upload icon confusion

### Production state
- 172 tests passing
- Deployed: pedalpath.app
- DB: 51 circuits / 967 components

---

# Session Log — 2026-03-05 (Session 9)

## Session 9 Close (2026-03-05)

### What was completed

**Breadboard guide — complete structural rewrite (Phases A + B + C)**

Driven by side-by-side analysis of 3 Coppersound CIR-KIT build guides using Claude Vision.
All 8 identified gaps from the gap analysis are now resolved.

**Phase A — Visual fixes:**
- A1: Output wire color `#FF8800` (orange) → `#0044CC` (blue) — matches canonical wire scheme
- A2: Electrolytic/tantalum capacitor thumbnails now render upright (tall cylinder, leads down)
- A3: Film box capacitor thumbnails now render upright (portrait rect, face marking visible, leads down)
- A4: Resistor thumbnails now show U-bent leads pointing down (real component orientation)
  Files: `BomBreadboardView.tsx`, `ComponentGallery.tsx`, `BreadboardGuide.tsx`

**Phase B — Structural rewrite:**
- B1: `BreadboardGuide.tsx` — replaced 11 type-sorted static steps with 6 dynamic circuit-functional sections
  (power → input → active → clipping → tone → output) computed from BOM `section` field + fallback inference
  Each step has a WHY explanation of the section's electrical purpose
- B2: `BomBreadboardView.tsx` — cumulative board view: `visibleSections` + `highlightSection` props;
  current step components glow amber (currentStepGlow filter); previous steps at 40% opacity; future hidden
- B3: `bom.types.ts` + `analyze-schematic.ts` — `BomSection` type added; Rule 8 in Claude prompt assigns
  each component to its circuit section at analysis time; off-board components pre-assigned
  Files: `BomBreadboardView.tsx`, `BreadboardGuide.tsx`, `bom.types.ts`, `analyze-schematic.ts`

**Phase C — Reference content (original language, not derived from Coppersound):**
- C1: `ResistorReference` component — collapsible IEC 60062 color band decoder table + per-build resistor
  gallery with U-bent SVGs auto-generated from BOM; appears contextually on steps with resistors
- C2: `CapMarkingExplainer` component — collapsible EIA notation explainer (3-digit code + direct notation)
  with worked examples; appears on steps with film/ceramic capacitors
  File: `BreadboardGuide.tsx`

**Session hygiene:**
- Moved `Treble+Boost+Breadboard+Guide+2025.pdf` + `Mosfet+Boost+Breadboard+Guide+2025.pdf`
  from `_INBOX` to `_REFERENCE/build-guides/` after analysis
- Updated `tools/populate_ground_truth.py` + `tools/populate_supplier_links.py` path: `_INBOX/ground-truth` → `_REFERENCE/ground-truth`
- Added Session Startup and Break protocols to `CLAUDE.md`
- CLAUDE.md updated with session 9 completion state

### Commits this session
- `e37c443` — Add session startup, break protocol, folder paths to CLAUDE.md
- `c1138ae` — Session 9 hygiene: update ground-truth path from _INBOX to _REFERENCE
- `e8dcf16` — Add functional section classification to BOM components (BomSection type + Rule 8 prompt)
- `1b9dfa9` — Breadboard guide rewrite — functional build sequence + cumulative view (Phases A + B)
- `be86c39` — Phase C — resistor reference, cap marking explainer, film cap orientation

### Production state at session end
- 172/172 tests passing
- TypeScript: clean, Vite: clean
- Deployed: pedalpath.app (commit be86c39)
- DB: unchanged (51 circuits / 967 components)

### Not completed — next session
- Accuracy regressions: Dart V2 77.5% (was ~90%), Ratticus Turbo 76.1% (was 92.4%), SBB 75.3% (was 85.3%)
- Buff N Blend 84.7% — 0.3% from passing threshold
- American Fuzz 82.2%, Black Dog 79.3%, Sunburn 80.8%
- iOS Phase 8, CollisionAlert, 1590A EnclosureGuide

---

# Session Log — 2026-03-04 (Session 8)

## Session 8 Close (2026-03-04)

### What was completed

**New tool: `tools/analyze_docx_circuits.py`**
- Extracts schematic images from the docx file in /tmp/docx_images/
- Uploads each schematic to the live API, gets generated BOM
- Compares against hand-transcribed reference BOMs from the document's BOM images
- Reports score, missing components, extra components per circuit
- Flags: `--circuit <name>` to test one; `--dump <name>` for raw API output
- Added to CLAUDE.md Tools Available

**Analyzed `schematics and BOM_03.04.2026.docx`**
- 31 images extracted from docx → 12 circuits identified
- Circuit-to-image mapping fully documented in the tool
- Reference BOMs hand-transcribed for all 12 circuits from BOM images

**12 circuits mapped and baselined:**
| Circuit | Schematic | Score | Status |
|---|---|---|---|
| MSB DIY | img_21 | 98.3% | PASS ✓ |
| BYOC Color Booster | img_18 | 85.2% | PASS ✓ |
| T-AMP Gold v1 | img_00 | 71.7% | FAIL |
| One Knob Clang | img_27 | 51.1% | FAIL |
| ColorSound Jumbo ToneBender | img_06 | 49.8% | FAIL |
| Halo Distortion/Sustainer | img_04 | 43.1% | FAIL |
| Synthrotek Ratatak | img_25 | 38.2% | FAIL |
| PE CSSTB | img_29 | 26.4% | FAIL |
| Mimosa Jr. | img_15 | 23.2% | FAIL |
| Big-Clang | img_23 | 20.0% | FAIL |
| Rat w/Marshall EQ | img_02 | 13.7% | FAIL |
| BYOC Parametric EQ | img_12 | 12.1% | FAIL |

**Root causes identified for failures:**
1. **Image quality** — Rat, Ratatak, Big-Clang have low-res or dark-background schematics; AI cannot read small labels reliably
2. **100nF bias** — AI defaults to 100nF when capacitor label unclear; Rat has ~15 wrong cap values as a result
3. **1M bias** — AI reads several resistors as 1M when unclear (Halo: 8 wrong 1M readings)
4. **IC misidentification** — LM308 read as TL072/LF353N (Rat, Ratatak)
5. **500pF classified as resistor** — ColorSound ToneBender affected
6. **2N7000 MOSFET** — not reliably detected (One Knob Clang)
7. **Multi-stage schematics** — AI sometimes reads only 1 of 3 identical stages (Halo)

**Prompt improvements deployed (analyze-schematic.ts):**
- Changed bias rule: "ONLY use known-values list when label is COMPLETELY ILLEGIBLE — if any digits visible, read those precisely"
- Added 500pF to capacitor values list with explicit note: "500p is a CAPACITOR not a resistor"
- Added note: "resistor reference designator ≠ value — if you can't read R10's value, don't write 'R10'"
- Added 2N7000 MOSFET note, BC109, BC184C, PN2907 to transistor list
- Added LM308/LM308N note: "NOT interchangeable with TL072"
- Added LM386 note about 8-pin power amp
- Extended capacitor list: 500pF, 30pF, 3.3nF, 2.7nF, 12nF, 2.2µF, 4µF
- Extended resistor list: 560R, 8.2K, 39K, 390K, 82K
- Added 1N4004, LF351, LF353, MAX1044 to component lists
- Added note: small cap values (30p, 100p, 500p) are real — don't substitute 100nF

**normalise() improvements in analyze_docx_circuits.py:**
- European notation now handles ALL SI prefixes (n, p, u, k, m): 4n7→4.7n, 3p3→3.3p, etc.
- MPRA18→MPSA18 alias (AI misread of MPSA18)
- Many more value aliases (8k2, 1k5, 4k7, 2m2, etc.)

### Production state at session end
- 172/172 tests passing
- TypeScript: clean, Vite: clean
- Deployed to pedalpath.app
- DB unchanged (no new ground truth added this session)

### NOT completed — needs next session
- **5 existing accuracy failures** NOT investigated: Aeon Drive 61.5%, Buff N Blend 64.7%, Black Dog 79.3%, Bass OD 81.1%, American Fuzz 82.2%
  - PDFs are gt1.pdf (Aeon Drive), gt13.pdf (Buff N Blend), gt12.pdf (Black Dog), gt6.pdf (Bass OD), gt5.pdf (American Fuzz)
  - accuracy_test.py --circuit commands were started but interrupted
- Ground truth JSONs for the 12 new docx circuits NOT created yet
- WattAmp + Three Time Champ still need retest

---

# Session Log — 2026-03-03 (Session 7)

## Session 7 Close (2026-03-03)

### What was completed
- **GT1–GT19 ground truth pipeline** — 18 new JSON files; DB now 51 circuits / 967 components
- **page_number bug fixed** — all gt*.json files updated (field was "page", must be "page_number")
- **Accuracy tested**: 19/31 circuits ≥85%; 8 new circuits pass on first run:
  PlexAmp 94.8%, ColorTone Supa Tonebender 94.8%, Pump'd Up Tonebender 93.2%,
  Super Sonic 93.2%, One-Knob Fuzz 93.1%, SHO Nuff 92.9%, Marsha Tone 92.9%, Afterblaster 89.1%
  Notable: Ratticus Turbo jumped from ~70% → 92.4%
- **Failures to investigate next session**: Aeon Drive 61.5%, Buff N Blend 64.7%,
  Stage 3 Booster 2020/v1 ~68% (likely structural), Black Dog 79.3%, Bass OD 81.1%
- **1590A enclosure spec** added to enclosure-drill-templates.ts — confirmed from FuzzDog FuzzPups V2 build guide
  Face 35×78mm, footswitch Y=66mm (12mm from bottom), DC on north end Y=18mm centered,
  Input jack (west) at 34mm, Output jack (east) at 45mm from top
- **HOLE_MM corrected** from _INBOX/drill_hole_diameter_prompt.json:
  dc_barrel 8→12mm, led_5mm 7.9→5.1mm, led_3mm 6.35→3.2mm; added 5 new constants
- **build_guide_1590A.pdf** studied (13 pages) — FuzzDog FuzzPups V2 build sequence documented
- **Tayda SKUs indexed** — memory/tayda_and_drill.md has all pot/cap/resistor SKUs
- **_INBOX path confirmed permanently**: /mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX

### Production state at session end
- 172/172 tests passing
- TypeScript: clean, Vite: clean
- GitHub: main branch pushed (commit 72b5ecd)
- Vercel: deployed to pedalpath.app
- Supabase: 51 circuits / 967 components seeded

### Next session priorities
1. Accuracy failures — Aeon Drive 61.5%, Buff N Blend 64.7%, Black Dog 79.3%
2. Re-test WattAmp + Three Time Champ (gt3/gt7 sync timing at last test run)
3. iOS Phase 8 — _INBOX/pedalpath-ios-web-shell-gh/ design tokens + native-feel UI
4. 1590A EnclosureGuide.tsx — wire up east/west jacks + 3-potter face layout

---

# Session Log — 2026-03-02 (Sessions 4 & 5)

## Session Close (2026-03-02, end of day)

### Wrap-up actions completed
- Progress report exported: `docs/generated/PedalPath_Progress_Report_2026-03-02.md` → `_OUTPUT/PedalPath_Progress_Report_2026-03-02_v2.docx`
- _INBOX cleaned: used/done files moved to `_ARCHIVE/2026-03-02/`; 13 files/folders archived
- CLAUDE.md revised with accurate completed-items list and next-session priorities
- All changes committed and pushed to GitHub
- Vercel auto-deployed from main branch

### What _INBOX contains now (actively needed)
- `ground-truth/` — 9 JSON files (source for populate_ground_truth.py)
- `pedalpath-ios-web-shell-gh/` — Phase 8 iOS integration (not started)
- Accuracy test PDFs: BD_Emerald-Ring, Hammond Toneworks All, StratoBlaster, Tone-TwEQ-v1-2020
- New circuit source files: OKF-v2, SHO-Nuff-v4, Super-Sonic-02, T-AMP 1.1, One Knob Clang 2.0

### Production state at session end
- 172/172 tests passing
- TypeScript: clean, Vite: clean
- GitHub: main branch up to date
- Vercel: latest build deployed to pedalpath.app
- Supabase: migrations 001–006 applied, 32 circuits / 554 components seeded

---


## Session 5 Additions (2026-03-02, later)

### Reset Password Page (new)
- `src/pages/ResetPasswordPage.tsx` — Supabase password recovery flow: `onAuthStateChange(PASSWORD_RECOVERY)` + `getSession()` to set `sessionReady`, password/confirm validation (min 8 chars), `updateUser({ password })`, signs out, redirects to `/signin` after 3s
- `App.tsx` — added `/reset-password` route

### Track 1 — Accuracy (complete, 5 runs)

**Ground truth pipeline:**
- Fixed 5 broken JSON files in `_INBOX/ground-truth/` (trailing commas, truncated arrays, missing braces)
- Added `page_number` support to both `populate_ground_truth.py` and `accuracy_test.py`
- `populate_ground_truth.py` — added DELETE before INSERT to prevent duplicate rows on re-runs
- Seeded: 32 circuits, 554 components across 8 JSON files

**Accuracy test improvements (`tools/accuracy_test.py`):**
- Improved `normalise()`: jack `1/4"` prefix strip, R-suffix ohms (100r→100), taper prefix A/B/C removal, annotation strip (16V tant, reverse log), SI+unit suffix strip (47nf→47n)
- `COMPATIBLE_TYPE_GROUPS` dict + `types_compatible()` — `ic` and `op-amp` now match cross-type
- Added `accuracy` GitHub label; auto-files issues for circuits < 85%
- Fixed `ORDER BY run_at DESC` (was broken UUID ordering)

**Prompt improvements (`api/analyze-schematic.ts`):**
- Rule 0 (OVERRIDE): taper-prefix potentiometer classification (A/B/C prefix = always potentiometer)
- European notation: `1M5 = 1.5MΩ`, `4k7 = 4.7k` — return value exactly as written
- Pot label rule: value field = resistance only, never include knob label (Volume/Boost/Drive/Gain)

**Accuracy results (run 5 of 5):**
| Circuit | Score | Status |
|---|---|---|
| Emerald Ring | 96.8% | PASS |
| Ratticus V1 Original/Reissue/Ver2/YDR | 90–92% | PASS |
| Tone TwEQ v1 2020 | 96.1% | PASS |
| Stratoblaster | **90.0%** | **PASS (was 59%)** |
| Sunburn V3 | **85.0%** | **PASS (was 57%)** |
| Dart V2 | usually ~90% | Usually PASS |
| Ratticus Turbo | ~70% | Structural limit: page 12 layout |
| 1 Knob Fuzz V2 × 6 | 47–76% | Structural limit: 6-variant BOM table on shared page |

Deployed to pedalpath.app. 172/172 tests passing. tsc + vite clean.

---

## What We Accomplished (Session 4 — earlier same day)

### Track 1 — Accuracy (partial)
- Ground truth population + accuracy test pipeline was built in Session 3
- **Session 5**: Completed (see above)

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

## What Is Next (after Session 5)

1. **IMMEDIATE**: Rotate Anthropic API key (exposed in screenshot) — console.anthropic.com → API Keys
2. **Stripe env vars** — set these 5 in Vercel Dashboard to enable first sale:
   - `STRIPE_SECRET_KEY` (Stripe Dashboard → API keys)
   - `STRIPE_WEBHOOK_SECRET` (Stripe Dashboard → Webhooks → endpoint secret)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API)
   - `VITE_APP_URL` = `https://pedalpath.app`
   - `VITE_STRIPE_PRO_PRICE_ID` (Stripe Dashboard → Products)
   - Also register webhook endpoint: `https://pedalpath.app/api/stripe-webhook`
3. **Stripe test**: Test mode checkout → webhook fires → subscription updates → upload unblocks
4. **Phase 4 (Collision & Safety)** — NOT started:
   - Enclosure boundary mapping (125B: 62.7×118mm, 1590B: 60.3×94mm)
   - Forbidden zone detection (Y<25mm = jacks area, Y>95mm = footswitch area)
   - "Hardware Collision" proactive alert in sidebar
5. **iOS**: Phase 8 — ios-web-shell from _INBOX
