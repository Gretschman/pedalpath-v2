# PedalPath v2 — Product Requirements Document

**Version**: 2.1 (March 2026 strategic review)
**Status**: Active development — Session 9 complete, 172 tests passing

---

## Product Vision

PedalPath is a SaaS tool for DIY guitar pedal builders. A user uploads a schematic image; PedalPath returns a complete bill of materials with accurate visual component illustrations and a step-by-step breadboard build guide. The experience should feel like having a knowledgeable builder friend who can read any schematic and hand you a laminated instruction sheet.

**Target user**: The hobbyist builder who can solder but struggles to read schematics, identify components from value strings, or translate a circuit diagram into a physical layout.

**Commercial target**: 50,000 users, subscription model. Stripe integration is the next monetization milestone.

---

## Platform Priority

**Primary target**: Desktop web browser — Windows (Chrome/Edge) and macOS (Safari/Chrome), equally supported.

**Rationale**: Desktop users have larger screens for schematic viewing, more comfortable file upload workflows, and the target audience (DIY builders at a workbench) is overwhelmingly desktop-first. Desktop also provides more rendering resources for the SVG-heavy breadboard and component visualization features.

**Mobile / iOS**: Backlog. Do not work on mobile-specific UI, PWA features, safe area insets, viewport meta optimization, or iOS web shell integration until Stripe is live and the core desktop experience is complete. The `pedalpath-ios-web-shell-gh` folder in `_INBOX` is archived — do not pull it into active work.

**Minimum desktop standard**:
- Layout designed for 1280px minimum viewport width
- Schematic upload via drag-and-drop and file picker (both work on desktop)
- BOM cards and breadboard view optimized for mouse + keyboard interaction
- No hamburger menus, bottom nav bars, or touch-target sizing constraints

---

## Core User Flow

1. User uploads schematic image (JPG, PNG, PDF)
2. System analyzes schematic via tiered pipeline (see Architecture)
3. User sees BOM cards — one per component, with accurate visual illustration
4. User steps through breadboard guide — circuit-functional sections (power → input → active → clipping → tone → output), each with a WHY explanation
5. Cumulative board view: components accumulate step by step; current step glows amber

---

## Visual Fidelity Standard

**This is the most critical product requirement.**

A builder must be able to hold any component from a standard pedal BOM, look at its card on a mobile screen, and immediately confirm they are holding the correct part. This means:

- Resistors render with correct IEC 60062 color bands computed from value string
- Electrolytic capacitors render as dark cylindrical cans with white polarity stripe and radial leads
- Ceramic disc capacitors render as small orange discs — NOT cylinders
- Film capacitors render as yellow/orange rectangular bricks
- Tantalum capacitors render as teardrop-shaped yellow bodies with polarity marking
- TO-92 transistors render as D-shaped black epoxy packages with labeled E/B/C leads — NOT schematic symbols
- DIP ICs render as black DIP packages with correct pin count and notch at pin 1
- LEDs render with correct lens color matching the color value from AI analysis
- Mono jacks render as 6.35mm TS jack side profiles
- Barrel jacks render as 5.5/2.1mm connectors with center polarity marked
- DPDT/3PDT switches render as stomp switch top-down view footprints

**Architecture that achieves this**: Static SVG sprite library + dynamic decorator engine. One sprite per distinct physical appearance. Decorator engine applies value-based properties (color bands, lens color, body selector) deterministically. This replaces the former parameterized-template approach which conflated component type with package and could not represent distinct physical appearances.

---

## AI Output Contract

Every component returned by the schematic analysis pipeline must conform to this interface:

```typescript
interface AnalyzedComponent {
  ref: string;           // "R1", "C3", "Q1"
  type: ComponentType;   // "resistor" | "capacitor" | "transistor" | "ic" | "diode" | "led" | "pot" | "jack" | "switch"
  value: string;         // "3k9", "470uF", "2N3904"
  package: string;       // "axial" | "electrolytic" | "ceramic-disc" | "film" | "tantalum" | "to92" | "to18" | "dip8" | "dip14" | "dip16" | "ts" | "trs" | "barrel" | "stomp"
  polarized: boolean;
  quantity: number;
  notes: string;
  confidence: number;    // 0–1
}
```

The `package` field is required. Without it, the visual system cannot select the correct sprite. Any prompt change that removes `package` from the AI output schema breaks the visual system.

---

## BOM Section Classification

Components are classified into circuit-functional sections at analysis time via Rule 8 in the Claude prompt:

- `power` — voltage regulators, power filter caps, clipping diodes on power rail
- `input` — input coupling caps, input resistors, input buffer stage
- `active` — op-amps, transistors, ICs — the core gain stage
- `clipping` — clipping diodes, hard/soft clipping networks
- `tone` — tone stack components, EQ caps and resistors
- `output` — output coupling caps, output resistors, volume pot

Build guide steps follow this section order exactly. Each section has a WHY explanation of its electrical purpose.

---

## Accuracy Standard

BOM accuracy is measured as: (correctly identified components / total reference components) × 100.

**Threshold**: 85% accuracy required before a circuit is considered supported.

`tools/accuracy_test.py` runs automated accuracy tests against reference circuits in Supabase and files GitHub issues for any circuit scoring below 85%. Run after every prompt change.

**Current known regressions** (as of session 9): see `docs/generated/session_log.md` for current accuracy scores. Do not hardcode percentages here — they change every session.

---

## Breadboard Layout Standard

See `PEDALPATH_ARCHITECTURE.md` for full BB830/GS-400 specifications and the 6-stage validation pipeline.

Key requirements:
- Component bodies sized proportionally to actual lead spacing — not fixed pixel widths
- BB830 center channel gap (7.62mm) must be visible
- BB830 bus strips are split at midpoint — two independent 25-hole segments per rail
- All component placements pass 6-stage validation before rendering
- Stripboard copper-side view is horizontally mirrored
- Wires render as Bézier curves with color coding (red=VCC, black=GND, green=signal in, blue=signal out)

---

## Monetization

**Stripe integration is the next major milestone after visual system and breadboard rendering are correct.**

See `docs/stripe-launch-checklist.md` for the complete pre-launch env var setup sequence. Do not begin Stripe work until component visualization and breadboard rendering meet the standards above.

**Pricing model**: Free tier (limited uploads/month) + Pro subscription. Quota enforcement is implemented in `src/pages/UploadPage.tsx` with two commented-out lines clearly marked — uncomment at launch.

---

## Out of Scope (current phase)

- **Mobile / iOS UI** — backlog until after Stripe launches. This includes PWA manifest, safe area insets, viewport meta optimization, bottom navigation, touch targets, and the `pedalpath-ios-web-shell-gh` integration.

- Batch schematic uploads (may be a Pro feature later)
- Multi-model LLM routing (GPT-4o-mini, Gemini routing) — use Claude for all analysis for consistency
- PCB layout generation
- Export to KiCad / EasyEDA formats

---

## Reference Material

- `PEDALPATH_ARCHITECTURE.md` — technical architecture, component pipeline, breadboard spec
- `docs/stripe-launch-checklist.md` — Stripe launch steps
- `docs/generated/session_log.md` — current status, accuracy scores, priorities
- `_REFERENCE/technical-specs/` — strategic review documents (breadboard audit, pipeline cost analysis, component visualization epic)
