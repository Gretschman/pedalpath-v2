# Session Shutdown: 2026-02-22
**Status**: Bug sprint complete ✅ | Major visual overhaul scoped 📋 | Ready to continue tomorrow

---

## ✅ What Was Completed Today

### GitHub Issue Cleanup
- **Closed #14** — Auth fetch error / invalid Authorization header (fixed Feb 21)
- **Closed #13** — Drill template labels only on hover (fixed Feb 21)
- **Closed #12** — Dashboard showing 0 projects (fixed Feb 21)
- **Closed #8** — Save button greyed out (fixed Feb 21)
- **Closed #7** — AI hallucination / wrong schematic analysis (fixed Feb 21)

### Issue #15 Created & Triaged
New comprehensive issue filed: **"Major bugs and resources to assist in fixing problems"**
- Linked to sub-issues #9, #10, #11, #2
- Reference materials catalogued and commented on the issue
- Covers 4 work streams: breadboard, stripboard, enclosures, offboard wiring

---

## 🔴 Open Issues (Priority Order for Tomorrow)

### PRIORITY 1 — Breadboard Visual Overhaul (#15 / #10 / #9 / #11)
**Status**: Core product failure. The breadboard guide is the #1 user-facing feature and it is broken.

**Problem**: Components placed on the breadboard SVG are:
- Too small — look like abstract symbols, not real parts
- Missing transistors entirely (no TO-92 package)
- Missing "What You Need" visuals per step (Steps 4–11)

**Target standard**: Music Techknowledgy / barbarach.com style
- Components labeled directly on board with ref designators (C1, R1, Q1)
- Realistic component shapes occupying correct holes
- Offboard components (input/output jacks, pots) shown CONNECTED to the board with colored wires
- Power rail clearly shown red (+) / blue (−)

**Reference images**:
- `Updates 02.22.26\Breadboard Images\IMG_1845.jpg` — Music Techknowledgy style with offboard jacks/pot
- `Updates 02.22.26\Breadboard Images\IMG_1062.jpg` — BOM table + breadboard diagram side-by-side
- `Updates 02.22.26\Breadboard Images\IMG_6625.jpg` — Educational diagram with power rail annotations

**What needs to change in code**:
- `BreadboardGuide.tsx` — add offboard wiring view, transistor placement
- `components-svg/` — add `TransistorSVG.tsx` (TO-92 package: D-shaped body, 3 leads labeled B/C/E)
- `BomBreadboardView.tsx` — scale components up to realistic size, add labels
- Step "What You Need" section — render component visual (color bands, shape) per step

---

### PRIORITY 2 — Stripboard/Veroboard Visualization (#15 / #2)
**Status**: StripboardGuide.tsx exists but is text-only. Target is tagboardeffects.com quality.

**Target standard**: tagboardeffects.com / diy-layout.com style
- Orange board (`#F5A500`) with white dots at each hole
- Black vertical lines = copper strips
- Red squares = track cuts
- Blue vertical lines = jumper wires
- Component symbols in color:
  - Electrolytic caps: Blue circle with + marker
  - Film caps: Teal elongated oval
  - ICs: Brown rounded rectangle with pin dots
  - Resistors: Yellow/tan rectangle
  - Diodes: Black rectangle with band mark
  - Transistors: Brown D-shaped body
- External wiring notes at board edges (e.g., "Ground", "+9V", "Volume 1", "Input")
- Cut count and jumper count shown in header
- "VERIFIED" badge if circuit has been tested

**Reference images** (all in `Updates 02.22.26\Layouts.Vero.Stripboard\`):
- `IMG_1095.jpg` — Earthquaker Acapulco Gold (tagboardeffects.com style)
- `IMG_2459.PNG` — Dallas Rangemaster NPN (sabrotone.com style with VERIFIED badge)
- `IMG_3221.PNG` — Tillman FET Preamp (diy-layout.com style, minimal)
- 29 more examples in the folder

**Current code**: `src/components/guides/StripboardGuide.tsx`

---

### PRIORITY 3 — Enclosure Drill Templates (#15)
**Status**: Drill template exists for 125B only; dimensions are wrong; only 1 enclosure supported.

**Problems**:
- Current template uses wrong hole positions and dimensions
- Only supports 125B — should support all common enclosures
- Template format doesn't match industry standard (Tayda Electronics style)

**Target standard**: Tayda Electronics flat-pack format
- Flat unfolded view showing ALL sides (A/B/C/D/E)
- Dimension table: Hole #, Side, Ø (mm), X (mm), Y (mm)
- Battery compartment zone highlighted
- Centerlines shown (red dashed)
- 1590-series enclosures to support (from reference image `IMG_2192.jpg`):

| Model | Size (inches) |
|-------|--------------|
| 1590LB | 2.0 × 2.0 |
| 1590A | 3.7 × 1.5 |
| 1590B / 1590B2 | 4.4 × 2.4 |
| 1590B3 | 4.6 × 3.0 |
| 1590BB / 1590BB2 / 1590C | 4.7 × 3.7 |
| 1590XX / 1590X | 5.7 × 4.8 |
| 1590J | 5.71 × 3.74 |
| 1590P1 | 6.02 × 3.27 |
| 1590DD / 1590D / 1590E | 7.4 × 4.7 |
| 1590F | 7.4 × 7.4 |
| 1032L | 10 × 2.8 |

**Reference images** in `Updates 02.22.26\Enclosures.Drilling\`:
- `IMG_1978.PNG` — Tayda Electronics flat-pack template format (authoritative format)
- `IMG_2192.jpg` — Full enclosure size comparison chart

**Current code**: `src/components/guides/EnclosureGuide.tsx`

---

### PRIORITY 4 — Offboard Wiring Diagram (#15)
**Status**: Missing entirely. No wiring guide exists for connecting board to jacks, pots, LED, switch.

**What needs to be built**: A new guide step (or standalone component) showing:
- Input/output TS jacks with tip/ring/sleeve labels
- 3PDT footswitch wiring (bypass + LED)
- Volume/tone/gain pot wiring (lug 1/2/3)
- LED + current limiting resistor
- 9V battery snap or DC jack
- All connected with colored wires (green = signal, black = ground, red = 9V, etc.)

**Target standard**:
- pedalparts.co.uk style — clean vector diagrams (`IMG_2042.PNG`, `IMG_2043.PNG`)
- skreddypedals.com 3PDT diagram (`IMG_2076.PNG`) — clear labeled connections
- Wire colors: conventional (green = signal, black/blue = ground, red = power)

**Reference images** in `Updates 02.22.26\Offboard Wiring\`:
- `IMG_2042.PNG` — Input/output jack wiring to PCB header
- `IMG_2043.PNG` — Another wiring example
- `IMG_2076.PNG` — 3PDT switch wiring diagram
- `IMG_1550.jpg`, `IMG_1551.jpg`, `IMG_1552.jpg` — Additional wiring examples

---

### PRIORITY 5 — AI Schematic Accuracy (#15)
**Status**: Hallucination fix deployed Feb 21 (issue #7 closed). But new accuracy concern raised.

**New problem reported**: Amptweaker Defizzerator upload generated BOM including 9V power supply recommendation — but the Defizzerator is a **passive circuit** (no power needed). The AI is still generating plausible-but-wrong output for circuits it doesn't correctly understand.

**Google Slides reference**: `https://share.google/K3UqnENHpFvXzN0JL`
(Contains actual unit photo + layout + component list for Defizzerator — compare to what the app produced)

**Root cause to investigate**:
- Is Claude misreading the schematic or is the uploaded schematic itself ambiguous?
- Does `analyze-schematic.ts` prompt need to add: "If the circuit has no active components (transistors, ICs, op-amps), set power_requirements to null/passive"?
- Add passive-circuit detection: if no transistors/ICs in BOM → flag as passive → no 9V recommendation

**Current code**: `pedalpath-app/api/analyze-schematic.ts`

---

### PRIORITY 6 — Schematic Library (#15)
**Status**: New schematics provided for future use.

Reference schematics in `Updates 02.22.26\Schematics\`:
- 24 schematic images (various pedal designs)
- `rat_clone.pdf` — RAT clone schematic

These are for testing the AI analysis pipeline, not necessarily for building a static library. Use them to verify the Defizzerator problem is fixed and to QA the schematic analysis against known circuits.

---

### LOWER PRIORITY

**Issue #4** — iOS PWA optimization
**Issue #2** — Stripboard visualization (covered under Priority 2 above, but the existing issue predates #15)

---

## 📁 Reference Materials Location

All new reference assets are at:
```
C:\Users\Rob\Dropbox\!PedalPath\Upload to Claude COde\2b Uploaded to Claude Code\Updates 02.22.26\
```

WSL path: `/mnt/c/Users/Rob/Dropbox/!PedalPath/Upload to Claude COde/2b Uploaded to Claude Code/Updates 02.22.26/`

| Folder | Files | Use For |
|--------|-------|---------|
| `Breadboard Images` | 3 jpg/png | Breadboard rendering standard |
| `Layouts.Vero.Stripboard` | 32 images | Stripboard rendering standard |
| `Enclosures.Drilling` | 2 images | Drill template format + enclosure sizes |
| `Offboard Wiring` | 6 images | Wiring diagram standard |
| `Schematics` | 24 images + rat_clone.pdf | AI accuracy testing |

---

## 📊 GitHub Issue Board State

| # | Title | Status |
|---|-------|--------|
| 15 | Major bugs and resources to fix problems | 🔴 OPEN |
| 11 | Build guide missing component visuals (Steps 4–11) | 🔴 OPEN |
| 10 | Breadboard overlays not realistic | 🔴 OPEN |
| 9 | No transistor visuals | 🔴 OPEN |
| 4 | iOS/PWA optimization | 🟡 OPEN (lower priority) |
| 2 | Realistic stripboard visualization | 🟡 OPEN (lower priority) |
| 14 | Auth fetch error | ✅ CLOSED (fixed Feb 21) |
| 13 | Drill labels hover-only | ✅ CLOSED (fixed Feb 21) |
| 12 | Dashboard 0 projects | ✅ CLOSED (fixed Feb 21) |
| 8 | Save button greyed out | ✅ CLOSED (fixed Feb 21) |
| 7 | AI hallucination | ✅ CLOSED (fixed Feb 21) |

---

## 🏗️ Current Codebase State

### Test Status
- 168/168 tests passing (last verified Feb 21)
- Run: `cd /home/rob/pedalpath-v2/pedalpath-app && npm test -- --run`

### Deployments
- **Primary**: https://pedalpath-v2.vercel.app (from `/home/rob/pedalpath-v2`)
- **Secondary**: https://pedalpath-app.vercel.app (from `/home/rob/pedalpath-v2/pedalpath-app`)
- Last deployed: Feb 21, 2026

### Key Files for Tomorrow's Work
```
pedalpath-app/src/
  components/
    guides/
      BreadboardGuide.tsx         ← Priority 1 — complete rewrite needed
      StripboardGuide.tsx         ← Priority 2 — complete rewrite needed
      EnclosureGuide.tsx          ← Priority 3 — add enclosures, fix dimensions
    visualizations/
      components-svg/
        ResistorSVG.tsx           ← Exists but may need scaling
        CapacitorSVG.tsx          ← Exists but may need scaling
        ICSVG.tsx                 ← Exists
        DiodeSVG.tsx              ← Exists
        WireSVG.tsx               ← Exists
        TransistorSVG.tsx         ← MISSING — needs to be created
  utils/
    bom-layout.ts                 ← Auto-placement algorithm
api/
  analyze-schematic.ts            ← Priority 5 — passive circuit detection
```

---

## 🚀 How to Start Tomorrow

```bash
# 1. Navigate to project
cd /home/rob/pedalpath-v2/pedalpath-app

# 2. Verify tests still pass
npm test -- --run

# 3. Start dev server
npm run dev
# → http://localhost:5174

# 4. Read this file, read CLAUDE.md
# 5. Read reference images before touching breadboard code:
#    /mnt/c/Users/Rob/Dropbox/!PedalPath/Upload to Claude COde/2b Uploaded to Claude Code/Updates 02.22.26/

# 6. Start with Priority 1: BreadboardGuide.tsx rewrite
#    Look at reference: IMG_1845.jpg and IMG_1062.jpg in Breadboard Images folder

# 7. Deploy after each priority completes:
cd /home/rob/pedalpath-v2 && vercel --prod
cd /home/rob/pedalpath-v2/pedalpath-app && vercel --prod
```

---

## ⚠️ Important Notes

1. **The Defizzerator problem** — check the Google Slides link in issue #15 before touching the AI prompt. Understand exactly what the app produced vs. what the circuit actually is.

2. **All reference images are originals from public sources** — per issue #15 note, our implementations must be original work inspired by the examples, not copies. We build our own SVG components.

3. **barbarach.com articles** are the quality target for the overall build guide experience — read a few before starting the breadboard rewrite to understand the narrative flow and visual standard expected.

4. **Do NOT start Stripe activation** until visual issues are resolved — a broken product shouldn't be sold.

---

**Shutdown time**: 2026-02-22
**Next session starts at**: Priority 1 — BreadboardGuide.tsx rewrite
