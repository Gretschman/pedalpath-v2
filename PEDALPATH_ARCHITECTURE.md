# PedalPath v2 — Architecture Document

**Version**: 2.1 (March 2026 strategic review)
**This document describes the TARGET architecture. Anything in the codebase that contradicts this document is a bug, not a feature.**

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS — desktop-first (1280px min) |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime) |
| AI Vision | Anthropic Claude Sonnet (primary) + Gemini 2.0 Flash (cost tier) |
| Hosting | Vercel (frontend) + Modal (Python microservice) |
| Payments | Stripe (pending launch) |

---

## Schematic Processing Pipeline (Four-Tier)

```
React → Supabase Storage (direct upload — bypasses Vercel 4.5MB limit)
      → Supabase Edge Function (orchestration)
      → Tier 0: pHash cache lookup
      → Tier 1: Modal Python microservice (OpenCV + PaddleOCR)
      → Tier 2: Gemini 2.0 Flash (standard schematics)
      → Tier 3: Claude Sonnet (hard cases)
      → Supabase DB write-back
      → Supabase Realtime → React frontend update
```

**Latency**: Up to 45 seconds acceptable. Use async processing with Supabase Realtime — not synchronous HTTP.

### Tier 0 — pHash Cache (<100ms, $0)

Perceptual hash lookup in Supabase. Guitar pedal schematics cluster around ~30 popular circuits (Tube Screamer, Klon, DS-1, Big Muff, etc.) — 50–65% of uploads are duplicates at steady state.

- Library: `imagehash`, `hash_size=16`
- Cache hit: Hamming distance ≤ 6
- On hit: return cached `AnalyzedComponent[]` immediately

### Tier 1 — Python CV Pipeline (2–10s, ~$0.001)

Deployed on Modal. Handles clean, high-res, EDA-generated schematics.

- OpenCV preprocessing (deskew, contrast normalization, threshold)
- PaddleOCR for component value extraction (preferred over Tesseract for rotated text)
- Confidence scoring router:
  - Score > 90% → return result (no LLM call)
  - Score 70–90% → pass to Tier 2
  - Score < 70% → pass to Tier 3

### Tier 2 — Gemini 2.0 Flash (1–3s, ~$0.0005)

36× cheaper than Claude Sonnet. Handles standard schematics that pass Tier 1 but need LLM verification.

- Batch API available at 50% off for non-time-sensitive analysis
- Must return `AnalyzedComponent[]` conforming to the AI output contract in `PEDALPATH_PRD.md`

### Tier 3 — Claude Sonnet (3–8s, ~$0.018)

Hand-drawn schematics, degraded images, unusual layouts. Result always cached after processing.

- Cache result in Supabase after every Tier 3 call
- Use claude-sonnet-4-6 model string

### Phased Rollout

- **Phase 1 (0–10K users)**: 100% Claude Sonnet + pHash cache only. No new infrastructure.
- **Phase 2 (10–30K users)**: Add Gemini Tier 2 + confidence router.
- **Phase 3 (30K+ users)**: Full Python layer on Modal.

---

## Component Visualization Architecture (Sprite-Library + Decorator)

**This replaces the former parameterized-template approach. Do not revert to parameterized templates.**

### Why the old approach was wrong

The parameterized-template approach used one SVG template per broad component category, modifying fill colors and labels by value. It cannot produce accurate visuals because component *type* and component *package* are different dimensions. A 0.0047uF ceramic disc and a 470uF electrolytic are both "capacitors" — they are physically unrecognizable as the same family.

### Tier 1 — Static Sprite Library

Location: `src/components/visualizations/components-svg/`

One SVG file per distinct physical appearance. These never change unless a new package type is added.

| Sprite ID | Description |
|---|---|
| `resistor-axial` | Beige/tan body, axial leads, 4 named band slots (band1–band4) |
| `capacitor-electrolytic` | Dark cylindrical body, white polarity stripe, radial leads |
| `capacitor-ceramic-disc` | Small orange disc, two radial leads |
| `capacitor-film` | Yellow/orange rectangular brick, radial leads |
| `capacitor-tantalum` | Teardrop yellow body, polarity marked |
| `diode-signal` | Glass body (1N914 style), cathode stripe |
| `diode-zener` | Same body, different cathode marking |
| `transistor-to92` | D-shaped black epoxy, 3 leads labeled E/B/C |
| `transistor-to18` | Round metal can, 3 leads |
| `ic-dip8` | Black DIP, 8 pins, notch at pin 1 |
| `ic-dip14` | Black DIP, 14 pins, notch at pin 1 |
| `ic-dip16` | Black DIP, 16 pins, notch at pin 1 |
| `jack-mono-ts` | 6.35mm TS side profile |
| `jack-barrel` | 5.5/2.1mm barrel, center polarity marked |
| `pot-alpha-round` | Round knurled shaft, 3 lug bottom view |
| `switch-dpdt-stomp` | Top-down stomp switch footprint |
| `led-3mm` | Round lens, 2 leads, flat side = cathode, named lens fill ID |
| `led-5mm` | Same, larger |

### Tier 2 — Dynamic Decorator Engine

Location: `src/components/visualizations/`

| Decorator | Input | Output |
|---|---|---|
| `ResistorBandDecorator` | Value string ("3k9", "33R", "1M") | 4 hex colors for band slots 1–4 |
| `CapacitorBodySelector` | { type, value, package } | Sprite ID from static library |
| `LEDColorDecorator` | Color string ("red", "green", "blue") | Hex fill for lens area |
| `ICPinCountSelector` | Pin count integer | Correct DIP sprite variant |

**Critical**: `ResistorBandDecorator` must wire to the existing resistor decoder in `src/utils/decoders/` — do not rewrite it. 154 tests pass. The decoder already computes IEC 60062 color bands from value strings.

### Orchestrator

`src/components/visualizations/ComponentVisualEngine.ts`

```typescript
function getComponentVisual(component: AnalyzedComponent): SVGElement {
  const spriteId = selectSprite(component);
  const decorations = applyDecorators(component);
  return renderSprite(spriteId, decorations);
}
```

---

## Breadboard Layout Architecture

### Physical Specifications

**BB830**
- 830 tie points: 63 columns × 10 rows (A–J) + 4 bus rails × 50 holes
- Bus strips split at midpoint — two independent 25-hole segments per rail (critical — most commonly missed)
- Center channel: 7.62mm (0.3") — NOT a row of holes
- Pitch: 2.54mm both axes

**GS-400**
- 400 tie points: 30 columns × 10 rows + 4 rails × 25 holes
- Pitch: 2.54mm both axes
- Center channel: 7.62mm

### Component Lead Spacing

| Component | Holes apart | Notes |
|---|---|---|
| 1/4W resistor | 4 spaces (5 holes) | Minimum 3 |
| Electrolytic ≤100µF | 1 | Native 2.5mm pitch |
| Electrolytic 100–470µF | 2 | Native 5.0mm pitch |
| TO-92 transistor | 3 consecutive | Must bend leads |
| DIP IC narrow | Straddles center channel | Rows E and F exactly |
| DIP IC wide 0.6" | Does NOT fit standard breadboard | Special handling required |

### SVG Layer Architecture

Single `<svg>` with ordered `<g>` groups:
1. `board-base` — background, edge markings
2. `rail-markings` — bus strip labels and split indicators
3. `hole-grid` — use `<symbol>/<use>` pattern (94% smaller DOM)
4. `components` — component bodies with proportional sizing
5. `wires` — Bézier curves, color coded (red=VCC, black=GND, green=signal in, blue=signal out)
6. `annotations` — labels, polarity markers

**Resistor body width**: compute as `(endCol - startCol - 1) * 30` — NOT a fixed `width="30"`.

**Stripboard copper-side mirror**: apply `transform="scale(-1, 1) translate(-width, 0)"` to the component layer. Currently missing — renders same x-coordinates as component side.

### 6-Stage Validation Pipeline

Must execute between AI output and renderer. Returns structured error JSON for iterative correction (max 5 cycles).

1. **Schema validation** — all fields present, types correct
2. **Occupancy grid** — no two leads share the same tie-point
3. **Lead spacing enforcement** — per-component lookup table above
4. **Body overlap detection** — AABB intersection check
5. **Electrical connectivity** — netlist comparison vs AI-specified nets
6. **Strip connectivity** (stripboard only) — copper strip continuity verification

---

## File Structure

```
pedalpath-app/src/
  components/
    visualizations/
      components-svg/          ← static SVG sprite library
      ComponentVisualEngine.ts ← sprite + decorator orchestrator
      decorators/
        ResistorBandDecorator.ts
        CapacitorBodySelector.ts
        LEDColorDecorator.ts
        ICPinCountSelector.ts
      breadboard/
        BB830Renderer.ts
        GS400Renderer.ts
        ValidationPipeline.ts
  utils/
    decoders/                  ← existing — DO NOT REWRITE (154 tests)
  pages/
    UploadPage.tsx             ← quota enforcement (2 commented lines — uncomment at Stripe launch)
```

---

## Supabase Schema

Live schema always available at `docs/generated/supabase_schema.sql` (generated by `tools/sync_supabase_schema.py`).

Key tables: `reference_circuits`, `reference_bom_items`, `supplier_links`, `user_uploads`, `analysis_cache` (pHash → AnalyzedComponent[] JSON).

---

## Deployment

- **Frontend**: Vercel auto-deploy on `main` push. Manual: `vercel --prod --yes`
- **Python microservice**: Modal (`modal deploy tools/schematic_processor.py`) — not yet implemented, Phase 3
- **Supabase Edge Functions**: `supabase functions deploy` — orchestration layer

---

## Cost Model

| Scenario | Per schematic | 100K/month |
|---|---|---|
| Phase 1 (100% Claude + pHash cache) | ~$0.009 blended | ~$900 |
| Phase 2 (cache + Gemini routing) | ~$0.004 blended | ~$400 |
| Phase 3 (full four-tier) | ~$0.0019 blended | ~$190 |

Full cost analysis in `_REFERENCE/technical-specs/SCHEMATIC_PIPELINE_COST_OPTIMIZATION.md`.
