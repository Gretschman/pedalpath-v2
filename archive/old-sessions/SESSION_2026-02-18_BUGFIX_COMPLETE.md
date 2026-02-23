# Session: Bug Fix + Visual Polish Complete

**Date**: 2026-02-18
**Commit**: `6f45eb6`
**Production**: https://pedalpath-v2.vercel.app

---

## ✅ What Was Done This Session

### Fix 1 — Save Project Button (`src/pages/ResultsPage.tsx`)
- Added `onError` handler to `saveMutation`
- Added `saveError` derived state with human-readable message
- Button disabled while `projectId` not yet loaded (shows "Loading...")
- Button shows "Saving..." → "Saved ✓" → stays green on success
- Button turns red + shows error message below on failure

### Fix 2 — Dashboard Showing 0 Projects
**`src/hooks/useProjects.ts`**
- Removed `.neq('status', 'draft')` filter — projects stuck as `draft` were invisible
- Now filters client-side: only shows projects that have at least one schematic (`p.schematics.length > 0`)

**`src/services/schematic-processor.ts`** (Step 6 silent failure)
- Was updating `projects` with a nonexistent column `schematic_url` → silent Supabase error left status stuck as `draft`
- Fixed: removed `schematic_url`, added error logging, treated as non-fatal

### Fix 3 — Breadboard Photo Background (closes #3)
**`src/components/visualizations/BreadboardBase.tsx`**
- Replaced hand-drawn SVG board (white rect + texture + gradients) with real photo `<image>` background
- Hole component simplified: invisible click target + gold highlight ring only (photo provides visual holes)
- CSS hover fix: `.hole:hover rect` (was `.hole:hover circle`)

**`src/utils/breadboard-utils.ts` — Full Calibration**
- Fixed 3:1 photo vs 4:1 viewBox aspect ratio mismatch (was causing 35% horizontal stretch)
- All constants measured from actual `5312×1770` photo via Python/PIL analysis:

| Constant | Old | New | Source |
|---|---|---|---|
| `totalHeight` | 420 | **566** | 1700 × 1770/5312 |
| `holeSpacing` | 25.4 | **24** | ~75px × 0.32 scale |
| `centerGap` | 25.4 | **48** | 150px extra gap × scale |
| `terminalStripStart.x` | 50 | **103** | col 1 at photo x≈321 |
| `terminalStripStart.y` | 80 | **239** | row a at photo y=747 |
| `topGround` | 64 | **126** | blue rail detected y=394 |
| `topPositive` | 47 | **190** | red rail detected y=593 |
| `bottomPositive` | 380 | **552** | symmetric: row j + 154px |
| `bottomGround` | 359 | **616** | outside photo crop (not visible) |

- Power rail naming corrected: ground=outer, positive=inner (was backwards)
- All 168 tests updated and passing

**`src/components/guides/BreadboardGuide.tsx`**
- Breadboard visualization now shown for all build steps 2–9 (was only 2–3)

**Photos** (`public/`)
- `breadboard-830.jpg` — 5312×1770 crop from original photo (board edges, calibrated top)
- `breadboard-400.jpg` — left 2656px of the 830 crop (30-column board equivalent)

### Fix 4 — Drill Template Separate Panel Views (closes #1)
**`src/components/guides/EnclosureGuide.tsx`** — major refactor
- Top face: pots, footswitch, LED (original positions preserved)
- Left side panel (`height × depth`): input jack, centered (9.5mm hole)
- Right side panel (`height × depth`): output jack, centered (9.5mm hole)
- End panel (`width × depth`): DC power jack, centered (7.5mm hole)
- `renderDrillTemplate(holes, panelW, panelH, title)` — reusable per panel
- Drilling order list grouped by panel with colored L/R/DC badges

---

## 🗺️ Current App State

### What Works End-to-End
1. Upload schematic image → Claude Vision analyzes → BOM extracted
2. Results page shows BOM table, breadboard visualization, enclosure guide, power guide
3. Save button saves to Supabase (`status: completed`)
4. Dashboard shows all uploaded projects (with schematic)
5. Breadboard tab shows real photo with SVG overlays for component placement
6. Enclosure tab shows separate drill templates per face/panel

### Open GitHub Issues
| # | Title | Priority |
|---|---|---|
| #2 | Stripboard visualization | Medium |
| #4 | iOS / PWA support | Low |

---

## 🚀 Next Session Priorities

### Priority 1 — Breadboard x-axis fine-tuning (if needed)
Current calibration has `terminalStripStart.x=103` (symmetric estimate). Alignment looks good visually. If holes are off by a few columns, adjust `terminalStripStart.x` and/or `holeSpacing` in `breadboard-utils.ts`. The Python calibration script pattern:
```python
# Col 1 detected at photo x≈321 → SVG x = 321 × (1700/5312) = 102.7
# Symmetric: (5312 - 62×75) / 2 = 318.6px → SVG = 102.0
# Current: 103 — good enough
```

### Priority 2 — Breadboard component overlay QA
Now that the photo background is calibrated, test the actual component placement:
- Upload a known schematic (e.g., Big Muff, Tube Screamer)
- Check that `BomBreadboardView` places ICs, resistors, caps in sensible positions
- Common issues: IC pin counts, value parsing edge cases

### Priority 3 — Stripboard visualization (Issue #2)
Build `StripboardBase.tsx` similar to `BreadboardBase.tsx`:
- Copper tracks run horizontally (rows)
- No center gap — all rows connected horizontally
- Standard 0.1" grid
- Cuts rendered as breaks in the copper track

### Priority 4 — UX pass
Things noticed while working:
- ResultsPage tab labels could be clearer ("Enclosure" → "Drill Templates"?)
- BreadboardGuide step descriptions are placeholder text
- Mobile layout of enclosure drill templates may need check

---

## 🔧 Technical Reference

### Key Files
| File | Purpose |
|---|---|
| `src/utils/breadboard-utils.ts` | Layout constants, hole coords, connection logic |
| `src/components/visualizations/BreadboardBase.tsx` | Photo bg + SVG hole overlays |
| `src/components/visualizations/BomBreadboardView.tsx` | BOM → layout → component SVGs |
| `src/components/guides/BreadboardGuide.tsx` | Step-by-step guide wrapper |
| `src/components/guides/EnclosureGuide.tsx` | Drill template generator (4 panels) |
| `src/pages/ResultsPage.tsx` | Main results tabs + save button |
| `src/hooks/useProjects.ts` | Dashboard data fetching |
| `src/services/schematic-processor.ts` | Upload → analyze → save pipeline |

### Test Suite
```bash
cd /home/rob/pedalpath-v2/pedalpath-app
npm test -- --run        # 168 tests, ~1s
npm run build            # TypeScript check + Vite build
```

### Deploy
```bash
cd /home/rob/pedalpath-v2   # MUST be repo root (not pedalpath-app/)
vercel --prod
```

### Breadboard Photo Calibration
Photos at `public/breadboard-830.jpg` (5312×1770) and `public/breadboard-400.jpg` (2656×1770).
Original source: `/mnt/c/Users/Rob/Dropbox/!PedalPath/Upload to Claude COde/2b Uploaded to Claude Code/`
Python analysis tools: `PIL`, `numpy` — `pip3 install Pillow numpy -q --break-system-packages`

If re-calibrating, key measurement script pattern:
```python
from PIL import Image
import numpy as np
img = Image.open('public/breadboard-830.jpg')
arr = np.array(img)
gray = np.array(img.convert('L'))
# Autocorrelation for hole spacing, color channel analysis for rail positions
```

### Supabase Notes
- Anon key stored in Vercel env → has embedded `\n` → stripped in `src/services/supabase.ts`
- Project status flow: `draft` → `in_progress` (after analysis) → `completed` (after save)
- Dashboard filters: shows only projects with `schematics.length > 0`
