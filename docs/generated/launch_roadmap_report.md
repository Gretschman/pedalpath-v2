# PedalPath v2 — Launch Roadmap & Critical Issues Report

**Exhaustion-Mode Reference Guide — Print Before Acting**

Date: March 24, 2026 | Version: v1.0 | Completion estimate: ~12% to first revenue

---

## PART 0: HOW TO READ THIS DOCUMENT

**You are exhausted. Here is the minimum you need to know in 60 seconds.**

**Fact 1:** The app is approximately 12% done relative to first revenue. BOM extraction works at 79% accuracy. Everything else is in progress.

**Fact 2:** The visual layer is architecturally broken. Component images are generated on-the-fly from text — they are theater, not a real product feature.

**Fact 3:** BOM-first is the correct path. Fix the visual layer → enable Stripe → collect revenue → then build layouts.

**Decision map:**

- If you just woke up and need to do something → go to **PART 8** (Rob's Action List).
- If you want to understand why we're here → read **Parts 1–3**.
- If you want to see the full plan → read **Parts 4–6**.
- If you want to work smarter, not harder → read **Parts 9–10**.

**Color legend used in this document:**

- **[ROB ACTION]** — you must do this; Claude cannot do it for you
- **[CLAUDE ACTION]** — Claude writes/runs this; you just confirm
- **[BLOCKER]** — nothing moves forward until this is resolved
- **[DEFERRED]** — real but not now; skip for now

---

## PART 1: THE DIAGNOSIS — 6 ROOT CAUSE FAILURES

### Failure 1: Text Pipeline — AI Outputs Strings, Nothing Maps to Images

**What it means right now:** Claude Vision returns component names like "100nF ceramic capacitor" as text strings. There is no mechanism to turn that string into a real photograph or illustration of the component.

**What a user sees:** Improvised geometric shapes drawn at runtime, not photos. Sometimes they look vaguely right. Often they look wrong or blank.

**What the fix is:** Build a lookup table (component_taxonomy) that maps component categories to pre-stored images. Resolution function matches AI output → image URL.

**Status: BROKEN** | Estimated fix effort: 4 hours (Steps 1–3 + 5)

---

### Failure 2: Wrong Schema — Value ≠ Appearance

**What it means right now:** The AI outputs a single field like `value: "100nF"` and the code tries to render a visual from that. But "100nF" is a specification, not a physical description. A 100nF ceramic disc cap looks nothing like a 100nF film cap.

**What a user sees:** Wrong component shape displayed. A film cap appears where a ceramic disc should be.

**What the fix is:** Add a `taxonomy_class` field to the AI extraction output. Claude classifies each component into one of ~30 physical appearance categories at extraction time.

**Status: FIXABLE** | Estimated fix effort: 2 hours (Step 4)

---

### Failure 3: On-the-Fly SVG Rendering — Fragile, Slow, Inconsistent

**What it means right now:** ComponentVisualEngine generates SVG markup at runtime based on component properties. This produces inconsistent results across different value combinations and breaks with edge cases.

**What a user sees:** Missing components, wrong colors, garbled shapes, slow page loads.

**What the fix is:** Delete ComponentVisualEngine entirely. Replace with static image lookup: `<img src={taxonomy.image_url}>`. Images come from Supabase Storage — fast, consistent, never blank.

**Status: BROKEN — delete it** | Estimated fix effort: 3 hours (Steps 7)

---

### Failure 4: No Canonical Taxonomy — ~30 Physical Appearance Classes Needed

**What it means right now:** There is no authoritative list of what physical component types exist in through-hole guitar pedal builds. Code makes ad-hoc decisions about appearance.

**What a user sees:** Inconsistent rendering. Some components look right, others wrong or missing.

**What the fix is:** Define exactly 30 taxonomy classes (see Part 5, Step 3). One image per class. Every component resolves to exactly one class.

**Status: FIXABLE** | Estimated fix effort: 1 hour to define + image time (Step 3)

---

### Failure 5: Value vs. Appearance Conflation — Spec and Package Are Separate Dimensions

**What it means right now:** The system treats "value" (the spec: 10K, 100nF, BC547) and "package" (the physical form: axial resistor, TO-92 transistor) as the same thing. They are not.

**What a user sees:** Correct value, wrong image. Or correct image, wrong value text overlay.

**What the fix is:** Separate concerns in the data model. `taxonomy_class` = physical appearance. `value` = specification. Both stored separately, rendered separately.

**Status: FIXABLE** | Estimated fix effort: Addressed by correct schema (Steps 1–4)

---

### Failure 6: No Fallback Hierarchy — Blank Instead of Graceful Degradation

**What it means right now:** When the visual engine can't render a component, it returns nothing. The cell is blank. Users see gaps.

**What a user sees:** Empty cells in the visual BOM. No indication of why. Looks broken.

**What the fix is:** 4-step resolution with guaranteed non-blank result: exact match → fuzzy match → category silhouette → flagged unknown (orange "?" badge). Never blank.

**Status: FIXABLE** | Estimated fix effort: Part of Resolution Edge Function (Step 5)

---

## PART 2: WHAT THE DIAGNOSIS CHANGES — 3 IMPACTS

### Impact A: Product Audit

The audit is complete. PedalPath Helper performed a systematic review of the codebase and identified all six failures above.

Key conclusions from the audit:

- No manual breadboard testing required — the audit found the architectural root causes directly.
- Both the BOM display layer AND the visual layout are architecturally broken.
- The BOM extraction text pipeline works. 79% accuracy is real and usable.
- The visual layer is theater. It looks like progress but produces no user value.
- Stripe backend code is complete. The blocker is environment setup, not code.

### Impact B: PRD and Architecture Scope

A near-complete architecture rewrite of the visual layer is required. Here is what changes:

**THROWN OUT (delete these):**

- ComponentVisualEngine — runtime SVG generator, fragile by design
- On-the-fly SVG generation from component properties
- Per-value BOM schema (value as sole rendering input)
- BreadboardGuide auto-generation from AI text output

**KEPT (these are solid):**

- `analyze-schematic.ts` extraction pipeline — core IP, keep and extend
- 154 decoder tests — do not touch
- Stripe backend (`create-checkout-session.ts`, `stripe-webhook.ts`) — code complete
- `components-svg/` sprite assets — repurpose as taxonomy image source (rasterize to PNG)
- `BOMTable.tsx` shell — reimplemented with new image approach, not rewritten from scratch

**NEW PILLARS (build these):**

- `component_taxonomy` table — 30 rows, one per physical appearance class
- `component_catalog` table — ~200 rows, canonical component values + aliases
- `api/resolve-component.ts` — 4-step resolution Edge Function
- `src/services/bomAssembly.ts` — data-only BOM assembly service
- Visual BOM React component (image-based, not SVG-based)
- PDF export serverless function

### Impact C: Layout Library Rights

The curated layout library (Phase 3) is deferred. Do not work on it this session or next.

- vero-p2p licensing question: deferred until Phase 3 is actively planned
- GBOF layouts: copyright GuitarPCB.com — internal use only; never user-facing without written permission
- AI layout generation (Phase 4): long-term R&D, not on current roadmap

---

## PART 3: YOUR NEW RESOURCES — GBOF + CLASSIC CIRCUITS

### GBOF — Great Balls of Fuzz (BD_GBOF-Build-Document.pdf)

**What it contains:**

17 verified circuits with complete BOMs:
- Rangemaster, Bazz Fuss, Fuzz Face NPN (with/without bias), Fuzz Face PNP (with/without bias)
- Meaty Version, Roger Mayer Classic Fuzz, EH Screaming Bird, One Knob Fuzz
- JD's Easy Drive, Big Muff Pi Tonestack (1K version), Big Muff Pi Tonestack (2K version)
- Trotsky Drive, Hog's Foot/Mole Bass Booster, Neckbeard, Hornby Skewes Treble Boost

Also contains:
- Transistor substitution chart (universal — maps common Ge/Si transistors to modern equivalents)
- Complete wiring diagram for IN jack, OUT jack, 3PDT footswitch, 9V power
- 2 full schematics (Neckbeard, Hornby Skewes Treble Boost)

**How it fits the new plan:**

- Transistor substitution chart → seed `component_catalog.aliases[]` field
- 17 BOMs → ground truth JSON files for Step 9 QA (target: 90%+ accuracy)
- 2 schematics → additional test cases for `accuracy_test.py`

**Copyright constraint:** © GuitarPCB.com — for internal use only. Never display their layouts or text as user-facing content without written permission from GuitarPCB.

### Classic Circuits_1.txt

**What it links to:**

- **geofex.com** — R.G. Keen's authoritative circuit analysis; use as taxonomy reference
- **vero-p2p.blogspot.com** — community-verified layouts by circuit family; Component Values Table = potential `component_catalog` seed data
- **fuzzboxes.org, freestompboxes.org, pedalpcb.com forum** — community circuit verification sources

**How it fits:**

- **Phase 1:** vero-p2p Component Values Table → `component_catalog` seed data
- **Phase 3:** vero-p2p circuit-family layouts → curated layout library source

**[ROB ACTION]** Move `Classic Circuits_1.txt` from `_INBOX` to `_REFERENCE/circuit-library/`. See Part 8, Action 1.

---

## PART 4: THE REVISED ARCHITECTURE

### Before (Broken)

Upload → Claude Vision → **text strings** → ComponentVisualEngine → **runtime SVG generation** → Broken Visual Guide → **THEATER**

This pipeline produces the appearance of a product but not the substance. Each component in the BOM is rendered by drawing geometric shapes at runtime based on text properties. This cannot produce consistent, accurate, or maintainable visuals at scale.

### After (Correct)

Upload → Claude/Gemini extract → **structured JSON array** → Resolution Edge Function (4-step) → component_taxonomy lookup → BOM Assembly Service → Visual BOM Component → **Supabase Storage images** → **REAL PRODUCT**

In this pipeline, component images are real photographs or illustrations stored in Supabase Storage. The AI output is matched to a known taxonomy entry. The visual component renders `<img src={url}>` — never generating anything at runtime.

### New DB Schema

**component_taxonomy** (~30 rows)

| Field | Type | Purpose |
|-------|------|---------|
| id | uuid | Primary key |
| category | text | Human-readable name (e.g., "Axial Resistor") |
| package_class | text | Machine-readable slug (e.g., "axial_resistor") |
| image_url | text | Full-size image in Supabase Storage |
| silhouette_url | text | Fallback outline image |
| aliases | text[] | Alternative names that map to this class |
| value_unit | text | Unit for value display (Ω, F, V, etc.) |
| sort_order | int | Display order in BOM table |

**component_catalog** (~200 rows)

| Field | Type | Purpose |
|-------|------|---------|
| id | uuid | Primary key |
| canonical_name | text | Authoritative name (e.g., "1N4148") |
| value | text | Nominal value |
| unit | text | Unit |
| tolerance | text | Tolerance spec |
| rating | text | Voltage/wattage rating |
| aliases | text[] | All known synonyms (MA150, etc.) |
| part_numbers | text[] | Manufacturer part numbers |
| taxonomy_fk | uuid | Foreign key → component_taxonomy |
| tayda_url | text | Tayda product URL |
| mouser_url | text | Mouser product URL |

### Resolution Edge Function — 4-Step Logic

**Step 1:** Exact alias match — look up raw AI output in `component_catalog.aliases[]`

**Step 2:** Fuzzy canonical match — Levenshtein distance ≤ 2 against `canonical_name`

**Step 3:** Category fallback — use taxonomy silhouette for the `taxonomy_class` field

**Step 4:** Unknown flag — return `{ confidence: 0, flagged: true }`. Render orange "?" badge. Never blank.

**[DIAGRAM A — Phase Roadmap — inserted here in DOCX]**

**[DIAGRAM B — Architecture Before/After — inserted here in DOCX]**

---

## PART 5: PHASE 1 — VISUAL BOM ENGINE (THE PREREQUISITE TO EVERYTHING)

Phase 1 gates Stripe. It consists of 9 steps across approximately 3–4 focused sessions.

---

### Step 1: DB Migration — component_taxonomy Table

**What it is:** A new Supabase table defining the 30 physical component appearance classes. The foundation for the entire visual layer.

**Who does it:** [CLAUDE ACTION] writes SQL. [ROB ACTION] applies in Supabase SQL Editor.

**Inputs required:** None — schema is defined in this document.

**Checklist:**

- [ ] Claude generates migration file: `supabase/migrations/010_component_taxonomy.sql`
- [ ] Rob opens Supabase dashboard → SQL Editor
- [ ] Rob pastes migration SQL (Claude provides the full text)
- [ ] Rob clicks Run
- [ ] Rob confirms: no errors in output panel
- [ ] Rob tells Claude: "010 applied"

**Done when:** `SELECT COUNT(*) FROM component_taxonomy` returns 0 (empty table, ready to seed).

---

### Step 2: DB Migration — component_catalog Table

**What it is:** A second Supabase table storing the ~200 known components with their aliases, part numbers, and taxonomy references.

**Who does it:** [CLAUDE ACTION] writes SQL. [ROB ACTION] applies.

**Inputs required:** Step 1 complete.

**Checklist:**

- [ ] Claude generates migration file: `supabase/migrations/011_component_catalog.sql`
- [ ] Rob applies in Supabase SQL Editor (same process as Step 1)
- [ ] Rob confirms: no errors
- [ ] Rob tells Claude: "011 applied"

**Done when:** Both tables exist, foreign key from component_catalog to component_taxonomy validates.

---

### Step 3: 30 Taxonomy Images

**What it is:** One 200×200px PNG per physical component appearance class. These images become the visual foundation for the entire BOM display.

**[ROB ACTION] — This step cannot be automated. You must choose an approach.**

**The 30 physical appearance classes:**

1. Axial resistor (standard carbon film body, two leads)
2. Metal film resistor (blue body, tight tolerance)
3. Ceramic disc capacitor (small, flat, round disc)
4. Monolithic ceramic capacitor (small rectangular brick)
5. Film capacitor — box type (rectangular box, two leads)
6. Electrolytic capacitor — radial (tall cylinder, two bottom leads)
7. Electrolytic capacitor — axial (cylinder, one lead each end)
8. Tantalum capacitor (teardrop/raindrop shape, polarity stripe)
9. TO-92 transistor (D-shaped flat face, three leads in line)
10. TO-18 metal can transistor (round metal hat, three leads)
11. TO-220 transistor (large, heatsink tab, three legs)
12. 1N4148 glass signal diode (small glass tube, orange body)
13. 1N4001 rectifier diode (larger glass tube, grey body)
14. Germanium diode (glass tube, dark band)
15. Zener diode (glass tube, distinct striped band)
16. LED 5mm round (standard dome LED)
17. LED 3mm round (small dome LED)
18. DIP-8 IC (8-pin dual inline package)
19. DIP-14 IC (14-pin dual inline package)
20. DIP-16 IC (16-pin dual inline package)
21. Potentiometer — 16mm vertical shaft
22. Potentiometer — 9mm vertical shaft (trimmer/trim pot)
23. Switch — SPST toggle
24. Switch — DPDT toggle
25. 3PDT footswitch (9-lug stomp switch)
26. DC barrel jack (2.1mm power connector)
27. 1/4" mono jack (TS, guitar input/output)
28. 1/4" stereo jack (TRS)
29. Electret microphone capsule
30. Crystal oscillator (HC-49 package)

**Image source options (choose one):**

**Option A:** Photograph your own components. Highest quality, 100% original. Requires 30 clean shots at 200×200px with transparent or white background.

**Option B:** Use existing `components-svg/` sprite SVGs. Already done. Claude writes a rasterization script to convert SVG → 200×200 PNG automatically. Fastest path.

**Option C:** Ask Gemini to generate reference images. Fast, may need quality review.

**RECOMMENDATION: Use Option B.** The SVG sprites already exist in the codebase. Claude can audit which of the 30 classes already have SVGs and generate the missing ones. Your only action: confirm which option you want.

**Checklist:**

- [ ] Rob confirms: "use existing SVGs" (Option B) — or states alternative
- [ ] Claude audits `components-svg/` against the 30 taxonomy classes
- [ ] Claude identifies gaps (which classes have no SVG yet)
- [ ] Claude writes rasterization script: `tools/rasterize_taxonomy_images.py`
- [ ] Rob runs: `python3 tools/rasterize_taxonomy_images.py`
- [ ] Rob confirms: 30 PNGs generated in `docs/generated/taxonomy_images/`
- [ ] Claude uploads all 30 to Supabase Storage bucket: `pedalpath-components`
- [ ] Rob verifies in Supabase Storage: 30 files visible

**Done when:** All 30 `image_url` values are live URLs in Supabase Storage.

---

### Step 4: Rewrite Claude Extraction Prompt

**What it is:** Update `analyze-schematic.ts` so that Claude classifies each extracted component into a taxonomy class at extraction time. This adds a `taxonomy_class` field to every BOM row.

**[CLAUDE ACTION]**

**Inputs required:** component_taxonomy table seeded, 30 images uploaded.

**Important notes:**

- The 154 decoder tests are NOT affected. They test value parsing, not output format.
- Prompt rewrite invalidates the accuracy cache. Run `accuracy_test.py --force` after.

**Checklist:**

- [ ] Claude rewrites the output format section of `analyze-schematic.ts`
- [ ] Claude updates `AnalyzedComponent` interface to include `taxonomy_class` field
- [ ] Rob runs: `npm test -- --run` (confirm 154 still pass)
- [ ] Rob runs: `python3 tools/accuracy_test.py --force` (benchmark new prompt)
- [ ] Target: maintain or improve current 79% accuracy

**Done when:** All 154 decoder tests pass. Accuracy ≥ 79%.

---

### Step 5: Resolution Edge Function

**What it is:** A new Vercel serverless function that takes raw AI component output and returns taxonomy + catalog data. The 4-step resolution logic lives here.

**[CLAUDE ACTION]**

**Inputs required:** component_taxonomy seeded, component_catalog seeded (at least partially).

**Function signature:**

- Receives: `{ raw_output: string, taxonomy_class: string }`
- Returns: `{ taxonomy_id, catalog_id?, image_url, silhouette_url, display_name, confidence, flagged? }`

**Checklist:**

- [ ] Claude creates `api/resolve-component.ts`
- [ ] Claude writes unit tests for all 4 resolution paths (exact, fuzzy, fallback, unknown)
- [ ] Rob runs: `npm test -- --run` (confirm new tests pass)

**Done when:** All 4 resolution paths return valid response objects. Function never returns blank/null for image_url.

---

### Step 6: BOM Assembly Service

**What it is:** A new module `src/services/bomAssembly.ts` that takes raw AI output and calls the resolution function for each component. Returns a clean `AssembledBOM` data structure. No rendering logic — pure data.

**[CLAUDE ACTION]**

**Checklist:**

- [ ] Claude creates `src/services/bomAssembly.ts`
- [ ] Claude writes unit tests (mock resolution function)
- [ ] Rob runs: `npm test -- --run`

**Done when:** Service returns a valid `AssembledBOM` for all test inputs including edge cases (unknown components, duplicates, empty input).

---

### Step 7: Visual BOM React Component

**What it is:** Rewrite `BOMTable.tsx` to consume `AssembledBOM` data. Images rendered as `<img src={url}>`. Values shown as text adjacent to image. Fallback: silhouette + orange "?" badge.

**[CLAUDE ACTION]**

**Visual style: LEGO manual.** Large component image. Ref designator bold. Value text. Quantity badge. Clean grid layout.

**Checklist:**

- [ ] Claude rewrites `BOMTable.tsx` (or creates `VisualBOMTable.tsx` as replacement)
- [ ] Remove all imports of `ComponentVisualEngine`
- [ ] Rob runs: `npm run build` (TypeScript clean, zero errors)
- [ ] Rob runs: `npm run dev` → uploads a test schematic → confirms visual BOM renders
- [ ] Verify: no blank cells, value overlay visible, fallback badge working

**Done when:** Visual BOM renders with real images for all components. No blank cells.

---

### Step 8: PDF Export

**What it is:** A new Vercel serverless function that headlessly renders the Visual BOM page to PDF using Puppeteer. Gated behind credit consumption (paid tier).

**[CLAUDE ACTION]** (Puppeteer dependency may need Rob's approval)

**Checklist:**

- [ ] Claude creates `api/export-bom-pdf.ts`
- [ ] Claude adds Puppeteer to `package.json`
- [ ] Rob runs: `npm install`
- [ ] Rob runs: `npm run build` (confirm clean build)
- [ ] Rob tests: upload schematic → click Export PDF → PDF downloads successfully
- [ ] Verify: PDF contains correct BOM content, readable formatting

**Done when:** PDF download works end-to-end. Credit deducted correctly.

---

### Step 9: QA — 10 Known Schematics at 90%+ Accuracy

**What it is:** Run the full accuracy pipeline against the new prompt + resolution function. Use GBOF circuits as additional ground truth. Target: 90%+ pass rate (up from 79%).

**[BOTH]**

**Checklist:**

- [ ] Rob runs: `python3 tools/accuracy_test.py --force`
- [ ] Rob sends Claude the full output
- [ ] Claude fixes any regressions in extraction prompt or resolution function
- [ ] Rob re-runs until 90%+ achieved
- [ ] Claude adds 5+ GBOF circuits as new ground truth JSON files
- [ ] Rob runs `python3 tools/populate_ground_truth.py` to seed them
- [ ] Final run confirms ≥ 90% pass rate

**Done when:** `accuracy_test.py --force` reports 90%+ circuits passing.

---

## PART 6: PHASE 2 — STRIPE (BLOCKED ON PHASE 1)

### The Table Mismatch Bug

There is a silent bug in the current Stripe integration that prevents the credit gate from functioning correctly:

- `useSubscription` hook reads credit state from the `subscriptions` table
- `stripe-webhook.ts` writes credit events to the `user_credits` table
- These are **two different sources of truth**
- Result: even after a successful Stripe checkout, the credit gate does not update

**[CLAUDE ACTION] Fix required (independent of Phase 1 timing):**

- [ ] Claude audits `useSubscription.ts` — what fields does it read and from which table?
- [ ] Claude audits `stripe-webhook.ts` — what fields does it write and to which table?
- [ ] Claude reconciles: either webhook writes to `subscriptions`, or hook reads `user_credits`
- [ ] Claude writes a test: mock webhook event → verify hook state updates correctly

### Other Stripe Blockers — All [ROB ACTION]

- [ ] Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase → Settings → API → service_role key → set on Vercel
- [ ] Register webhook at https://dashboard.stripe.com/webhooks
  - URL: `https://pedalpath.app/api/stripe-webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Copy webhook signing secret → set `STRIPE_WEBHOOK_SECRET` on Vercel
- [ ] Redeploy both Vercel deployments after env var changes

### Phase 2 Done When

Test card `4242 4242 4242 4242` → Stripe checkout completes → credit deducts from correct table → upload unblocks → working end-to-end.

---

## PART 7: PHASE 3 — CURATED LAYOUT LIBRARY (AFTER STRIPE)

**[DEFERRED] — Do not work on this until Stripe revenue is live.**

Placeholder notes for when you return to this:

- Primary layout source: vero-p2p.blogspot.com (verify licensing before using any content)
- Circuit identification: AI matches uploaded schematic to a known circuit name ("this is a Fuzz Face")
- On match: serve verified layout from library
- On no match: BOM only — honest, no theater, still useful
- Phase 4 (AI layout generation) is long-term R&D; not on current roadmap

---

## PART 8: ROB'S EXHAUSTION-MODE ACTION LIST

Everything you need to do, in exact order, assuming you have limited energy. Nothing assumed.

---

### Action 1: Move Classic Circuits_1.txt to _REFERENCE (5 minutes)

**a.** In Windows Explorer or Dropbox:

Navigate to: `Dropbox/!PedalPath/_INBOX`

**b.** Find: `Classic Circuits_1.txt`

**c.** Move to: `Dropbox/!PedalPath/_REFERENCE/circuit-library/`

**d.** Tell Claude: "Classic Circuits moved"

---

### Action 2: Confirm Taxonomy Image Strategy (5 minutes)

**a.** Read Step 3 in Part 5 above.

**b.** Say one of:

- "use existing SVGs" → Claude handles everything automatically
- "I'll photograph my components" → you'll need 30 component photos at 200×200px
- "use Gemini" → Claude sets up Gemini image generation pipeline

**c.** No other action needed until Claude reports back.

---

### Action 3: Apply DB Migrations When Claude Provides Them (10 minutes per migration)

**a.** Open browser → supabase.com → your project

**b.** Click: SQL Editor (left sidebar)

**c.** Paste migration SQL that Claude provides (Claude will give you the exact text)

**d.** Click: Run

**e.** Check output panel — it should say something like "Success. 0 rows affected."

**f.** Tell Claude: "Migration 010 applied, no errors" (or paste any error message in full)

**g.** Repeat for migration 011.

---

### Action 4: Get SUPABASE_SERVICE_ROLE_KEY (10 minutes)

**a.** Open: supabase.com → your PedalPath project

**b.** Click: Settings (bottom left gear icon)

**c.** Click: API

**d.** Find section: "Project API keys"

**e.** Find row: service_role (NOT anon — the service_role key has full DB access)

**f.** Click: Reveal

**g.** Copy the value (starts with `eyJ...`)

**h.** Open: vercel.com → pedalpath-app project → Settings → Environment Variables

**i.** Click: Add New

**j.** Name: `SUPABASE_SERVICE_ROLE_KEY` | Value: [paste] | All Environments: checked

**k.** Save → trigger a redeploy

---

### Action 5: Register Stripe Webhook (15 minutes)

**a.** Open: dashboard.stripe.com → Developers (top right) → Webhooks

**b.** Click: Add endpoint

**c.** Endpoint URL: `https://pedalpath.app/api/stripe-webhook`

**d.** Click: Select events to listen to

**e.** Add all five:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**f.** Click: Add endpoint

**g.** On the next screen, find: Signing secret

**h.** Click: Reveal

**i.** Copy the value (starts with `whsec_...`)

**j.** Open: Vercel → Environment Variables

**k.** Update `STRIPE_WEBHOOK_SECRET` with this new value (replace the placeholder)

**l.** Redeploy

---

### Action 6: Run Tests When Claude Says "Run Tests"

Open WSL terminal:

```
cd /home/rob/pedalpath-v2/pedalpath-app
[paste the command Claude gives you]
```

Copy the full output. Paste it to Claude. Do not summarize.

---

### Action 7: Rotate Anthropic API Key (When You Have 15 Minutes and Energy)

The existing API key was exposed in a screenshot. It should be rotated when convenient.

**a.** Open: console.anthropic.com

**b.** Click: API Keys (left sidebar)

**c.** Find the currently active key → click the three-dot menu → Disable

**d.** Click: Create New Key

**e.** Copy the new key

**f.** Update in Vercel: Environment Variables → `ANTHROPIC_API_KEY` = new value

**g.** Update in local `.env.local` (WSL path: `/home/rob/pedalpath-v2/pedalpath-app/.env.local`)

**h.** Redeploy

---

## PART 9: AI COST OPTIMIZATION — WHERE TO USE WHICH MODEL

**Decision principle:** Use the cheapest model that can do the job reliably. Escalate to Claude Sonnet only when accuracy or complex reasoning is genuinely required.

### Token Cost Comparison (approximate, 2026)

| Model | Input $/1M | Output $/1M | Best For |
|-------|-----------|------------|---------|
| Claude Sonnet 4.6 | $3.00 | $15.00 | Complex reasoning, code, authoritative BOM extraction |
| Claude Haiku 4.5 | $0.25 | $1.25 | Simple transforms, validation, short classification tasks |
| Gemini 2.0 Flash | $0.075 | $0.30 | Image analysis, first-pass extraction, bulk processing |
| GPT-4o mini | $0.15 | $0.60 | Data normalization, alias matching, seeding tasks |
| GPT-4o | $2.50 | $10.00 | Cross-check reasoning, second opinion on complex circuits |

### Where Each Model Fits in PedalPath

**Claude Sonnet — Use for:**

- Schematic analysis when Gemini returns confidence < 85%
- Complex code generation (Edge Functions, React components, Supabase Edge Functions)
- Architectural decisions and prompt engineering
- Any task requiring full conversation context
- Accuracy-critical BOM extraction (Tier 3 in the pipeline)

**Gemini 2.0 Flash — Use for:**

- Tier 2 in the schematic analysis pipeline (already in architecture spec)
- If Gemini returns ≥ 85% confidence → skip Claude Sonnet entirely (saves ~90% of token cost per upload)
- Bulk image processing (rasterizing taxonomy images, processing large PDFs)
- First-pass component identification from component photos
- Batch ground truth comparison

**Gemini Pro — Use for:**

- Long document analysis (GBOF-style PDFs — future analysis runs should use Gemini Pro, not Claude Sonnet)
- Drafting long documentation sections (Claude edits/reviews)
- Initial seed generation for `component_catalog` rows (bulk, repetitive work)

**ChatGPT / GPT-4o mini — Use for:**

- Seeding `component_catalog.aliases[]` from GBOF transistor substitution chart
- Paste the substitution chart into GPT-4o mini → ask for JSON output → review and import
- Value normalization cross-checks
- Generating test fixture data at scale

**GPT-4o — Use for:**

- Second-opinion check on complex circuit identification
- Generating component descriptions for taxonomy entries

### The Biggest Single Cost Saving

Route all uploads through Gemini 2.0 Flash first. Only escalate to Claude Sonnet if Gemini confidence < 85%. Estimated: 60–70% of uploads handled by Gemini alone = approximately 10× cost reduction per upload at scale.

### Where NOT to Use Cheaper Models

- Writing production code (Haiku and GPT-4o-mini produce subtle bugs in complex code)
- Long prompt + context-dependent tasks (smaller context windows lose thread)
- Resolution Edge Function logic (correctness is critical — wrong resolution = wrong image)
- Accuracy test runs on known circuits (need authoritative results)

---

## PART 10: EFFICIENCY ADVICE — GETTING THIS DONE

### Recommended Session Structure

**Session 15 (today) — Strategy only. No code.**

- Confirm this document's plan. Ask questions.
- Decide taxonomy image approach (Option A/B/C from Step 3)
- Move Classic Circuits_1.txt to _REFERENCE
- Claude updates PRD + Architecture docs

**Session 16 — Infrastructure sprint (2–3 hours)**

- Apply migrations 010 + 011 (taxonomy + catalog tables)
- Taxonomy image rasterization script
- Upload 30 images to Supabase Storage
- Seed `component_catalog` with GBOF transistor sub data + top 50 known components
- Fix subscriptions/user_credits table mismatch (Stripe bug)

**Session 17 — Core services sprint (2–3 hours)**

- Rewrite extraction prompt with taxonomy_class field (Step 4)
- Resolution Edge Function (Step 5)
- BOM Assembly Service (Step 6)
- Run accuracy test → fix any regressions

**Session 18 — Visual layer sprint (2–3 hours)**

- Visual BOM React component (Step 7)
- PDF export serverless function (Step 8)
- End-to-end manual test: upload → visual BOM renders → export PDF → downloads

**Session 19 — QA + Stripe finish line**

- QA: 10 schematics at 90%+ accuracy (Step 9)
- Stripe table mismatch fix confirmed working
- Rob applies SUPABASE_SERVICE_ROLE_KEY
- Rob registers Stripe webhook
- Test card end-to-end: 4242 4242 4242 4242 → checkout → credit deducts
- **Go live**

### Communication Pattern with Claude

- Start every session with: `resume pedalpath` (you already do this — good)
- After completing a Rob action: tell Claude exactly what you did ("010 applied, no errors")
- When confused: say "explain this like I'm at 25% capacity"
- When something breaks: paste the **full error output**, nothing summarized, nothing paraphrased
- Don't apologize for being tired — just state your current capacity and Claude will adapt

### The 80/20 Rule for This Project

**80% of the value comes from:**

- Correct BOM extraction (already at 79%, target 90%)
- Visual BOM display (Phase 1, Steps 1–7)
- PDF export (Phase 1, Step 8)

**20% is everything else:**

- Circuit layout library
- iOS optimization
- Accuracy refinements beyond 90%
- Advanced circuit identification

Everything in Phase 1 is in the 80%. Don't let Phase 3 urgency bleed into Phase 1 sessions.

### Red Flags — Stop and Ask Claude

**Stop if:**

- A migration runs without errors but the table doesn't appear in Supabase — screenshot the SQL Editor output and ask Claude.
- Accuracy drops below 75% after the prompt rewrite — don't push, don't deploy, ask Claude to review the diff.
- Stripe webhook shows "failed" status in the dashboard — don't retry, paste the full error log to Claude.
- `npm run build` shows TypeScript errors after Claude's code changes — paste the full error output.

### Progress Tracker

Use this to track where you are across sessions:

**Phase 1 — Visual BOM Engine**

- [ ] Step 1: component_taxonomy migration (Rob applies)
- [ ] Step 2: component_catalog migration (Rob applies)
- [ ] Step 3: 30 taxonomy images (Rob confirms approach)
- [ ] Step 4: prompt rewrite with taxonomy_class (Claude)
- [ ] Step 5: resolution Edge Function (Claude)
- [ ] Step 6: BOM Assembly Service (Claude)
- [ ] Step 7: Visual BOM Component (Claude)
- [ ] Step 8: PDF export (Claude)
- [ ] Step 9: QA at 90%+ (Both)

**Phase 2 — Stripe**

- [ ] Fix subscriptions/user_credits mismatch (Claude)
- [ ] SUPABASE_SERVICE_ROLE_KEY set on Vercel (Rob)
- [ ] Webhook registered at Stripe dashboard (Rob)
- [ ] End-to-end test card passes (Both)
- [ ] **GO LIVE**

---

*Document generated: March 24, 2026*
*Next review: After Session 16 (update steps completed)*
