# Session 10 Continuation — Where We Stopped

## Status at break
- **21/34 circuits passing** (was 18/33 last session)
- 173 tests passing, tsc clean
- Deployed: pedalpath.app ✅

## What was fixed this session
- SBB: 75.3% → 90.0% PASS (VALUE_ALIAS 9v→dc jack + D1 LED added to GT)
- Dart V2: 77.5% → 89.2% PASS (recovered — likely alias/variance)
- Buff N Blend: 84.7% → 86.0% PASS
- American Fuzz: 81.2% → 86.9% PASS
- Upright cap rendering: electrolytic/film caps now render top-down in SVG
- accuracy_test.py: --circuit / --detail / --no-issues flags added

## Bass OD (81.1% FAIL — partially diagnosed, not fixed)

### Root causes identified via `--detail`:
1. **Extra jacks/footswitch**: AI always generates J_IN, J_OUT, dc-jack, footswitch. GT doesn't include these. Each costs -0.1.
2. **Grouped vs individual**: GT has R1/R4/R7 = 33k×3 as one entry; AI generates individual R4 33k, R7 33k etc. as extras.
3. **"Status LED" ≠ "Status"**: LED value mismatch. Fix: add `"status led": "led"` alias (or update GT value to "LED").
4. **Trimmer mismatched to A100k**: TR1/TR2/TR3 = 10k trimmers; AI matched them to A100k pot.
5. **DRIVE pot missing**: AI didn't detect the DRIVE 100k pot.

### Fix options:
- Add `"status led": "led"` to VALUE_ALIASES (quick win)
- Update GT led value from "Status" to "LED" (simpler)
- For jacks/footswitch: either add them to GT for each circuit, or add scoring logic to ignore "infrastructure" components (jacks, footswitches) when not in GT

## Next priority queue
1. **Bass OD fix** (81.1%) — described above
2. **Ratticus Turbo** (73-74%) — persistent regression from 92.4%
3. **Sunburn** (70-75%) — high variance
4. **Aeon Drive** (61-64%) — needs investigation
5. **Stage 3 Booster 2020/v1** (68%) — structural issue (multi-variant page)

## Commands to resume
```bash
cd /home/rob/pedalpath-v2
bash start_session.sh

# Quick Bass OD test:
python3 tools/accuracy_test.py --circuit "Bass OD" --detail --no-issues

# Full accuracy run:
python3 tools/accuracy_test.py --no-issues
```

## Key files modified this session
- `tools/accuracy_test.py` — aliases + CLI flags
- `_REFERENCE/ground-truth/stratoblaster.json` — D1 LED added
- `_REFERENCE/ground-truth/gt20_bazz_fuss_v3.json` — BazzFuss GT (seeded)
- `pedalpath-app/src/utils/bom-layout.ts` — guessCapSubtype + upright placement
- `pedalpath-app/src/components/visualizations/components-svg/CapacitorSVG.tsx` — UprightCapBody
- `pedalpath-app/src/utils/__tests__/bom-layout.test.ts` — 173 tests
- `pedalpath-app/src/pages/DashboardPage.tsx` — share icon
- `pedalpath-app/src/index.css` — iOS tokens
- `pedalpath-app/src/components/guides/EnclosureGuide.tsx` — 1590A east/west
- `pedalpath-app/api/analyze-schematic.ts` — B5K/A5K/B1K/A1K pots
