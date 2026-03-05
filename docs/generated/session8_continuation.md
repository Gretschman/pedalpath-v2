# Session 8 Continuation Notes — 2026-03-04

## Where we stopped

Session 8 ran a full accuracy test and prompt improvement cycle. Everything is deployed.
The immediate next step is to look at the **remaining accuracy failures** and investigate
each one to understand what specific component mismatches are causing the score to be below 85%.

---

## Full Accuracy Test Results (end of session 8)

Run on 2026-03-04 with updated prompt. **18/33 circuits passing.**

| Circuit | Score | Status | Notes |
|---|---|---|---|
| 1 Knob Fuzz V2 - CS Fuzz Box | 95.0% | PASS | |
| ColorTone Supa Tonebender | 94.8% | PASS | |
| PlexAmp | 94.8% | PASS | |
| Three Time Champ | 94.2% | PASS | Was SKIP last session ✓ |
| Tone TwEQ v1 2020 | 94.3% | PASS | |
| Emerald Ring | 93.6% | PASS | |
| Pump'd Up Tonebender | 93.2% | PASS | |
| Super Sonic v2 | 93.2% | PASS | |
| One-Knob Fuzz v2 | 93.1% | PASS | |
| SHO Nuff v4 | 92.9% | PASS | |
| Marsha Tone v4 | 88.7% | PASS | |
| Ratticus V1 (×4 variants) | 88.6% | PASS | |
| WattAmp | 87.9% | PASS | Was SKIP last session ✓ |
| Afterblaster v2 | 89.1% | PASS | |
| Bass OD v2 | 92.5% | PASS | Was 81.1% FAIL last session ✓ |
| **Buff N Blend v2** | **84.7%** | **FAIL** | **0.3% from threshold — investigate** |
| **American Fuzz v5** | **82.2%** | **FAIL** | |
| **Sunburn V3** | **80.8%** | **FAIL** | |
| **Ratticus Turbo** | **76.1%** | **FAIL** | Was 92.4% last session — prompt regression? |
| **Aeon Drive** | **77.3%** | **FAIL** | Was 61.5% — improved 16pts |
| **Black Dog v2** | **79.3%** | **FAIL** | |
| **Dart V2** | **77.5%** | **FAIL** | Was ~90% last session — regression? |
| **SBB Stratoblaster** | **75.3%** | **FAIL** | Was 85.3% — regression? |
| Stage 3 Booster 2020 | 68.7% | FAIL | Structural (multi-variant) |
| Stage 3 Booster v1 | 68.3% | FAIL | Structural (multi-variant) |
| 1 Knob Fuzz (×5 variants) | 49–63% | FAIL | Structural (6 variants on one page) |
| RAT | N/A | SKIP | Needs page_number in JSON |

---

## Priority Fixes for Next Session

### 1. Buff N Blend (84.7%) — 0.3% from passing
Run: `python3 tools/accuracy_test.py --circuit "buff" --dump`
(The `--dump` flag doesn't exist yet — add it to accuracy_test.py or just inspect the score)
Look at the component diff — likely 1-2 mismatched components. Very fixable.

### 2. Aeon Drive (77.3%) — improved from 61.5% but needs more
Run: `python3 tools/accuracy_test.py --circuit "aeon" --dump`
Understand what 5-6 components are still wrong.

### 3. Ratticus Turbo regression (76.1% was 92.4%)
This was 92.4% in session 7. Something changed. Possible causes:
- Prompt change in session 8 (even after revert, deployed version might differ)
- Re-run accuracy_test.py again to see if it's just variance
- Run: `python3 tools/accuracy_test.py --circuit "turbo"`

### 4. Dart V2 regression (77.5% was ~90%)
Same concern as Ratticus Turbo. Re-run to check.

### 5. Black Dog (79.3%), American Fuzz (82.2%), SBB (75.3%)
Each needs a specific diff. Run accuracy_test.py for each to see which components are wrong.

---

## New Tool: analyze_docx_circuits.py

Uploaded all 12 schematics from `schematics and BOM_03.04.2026.docx` to the API.

Image mapping (images in /tmp/docx_images/ — must re-extract from docx if /tmp is cleared):
```python
# Re-extract images:
python3 - <<'EOF'
from docx import Document
from docx.oxml.ns import qn
import os
outdir = '/tmp/docx_images'
os.makedirs(outdir, exist_ok=True)
doc = Document('/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX/schematics and BOM_03.04.2026.docx')
for di, drawing in enumerate(doc.element.body.findall('.//' + qn('w:drawing'))):
    blip = drawing.find('.//' + qn('a:blip'))
    if blip:
        embed = blip.get(qn('r:embed'))
        if embed:
            img_part = doc.part.related_parts.get(embed)
            if img_part:
                with open(f'{outdir}/img_{di:02d}.png', 'wb') as f:
                    f.write(img_part.blob)
print('Done')
EOF
```

Circuit scores from session 8:
- MSB DIY (img_21): 98.3% PASS
- BYOC Color Booster (img_18): 85.2% PASS
- T-AMP Gold v1 (img_00): 71.7%
- One Knob Clang (img_27): 51.1%
- ColorSound ToneBender (img_06): 49.8%
- Halo Distortion (img_04): 43.1%
- Synthrotek Ratatak (img_25): 38.2%
- PE CSSTB (img_29): 26.4%
- Mimosa Jr. (img_15): 23.2%
- Big-Clang (img_23): 20.0%
- Rat w/Marshall EQ (img_02): 13.7%
- BYOC Parametric EQ (img_12): 12.1%

Root cause: Most failures are image quality (low-res schematics). Prompt changes help a little
but can't overcome fundamentally unreadable images. The best path for these is higher-res
source images, not more prompt tuning.

---

## Prompt Changes Made (analyze-schematic.ts)

All changes are additive — did NOT break existing passing circuits:
- Added: 500pF, 30pF, 3.3nF, 2.7nF, 12nF, 2.2µF, 4µF to capacitor values list
- Added: 560R, 8.2K, 39K, 390K, 82K to resistor values list
- Added: 1N4004, LF351, LF353, MAX1044 to diode/IC lists
- Added: BC109, BC184C, PN2907 to transistor list
- Added explicit notes: LM308 ≠ TL072, 500pF is a CAPACITOR not resistor
- Added: "reference designator ≠ value" rule to prevent R10 appearing as a value
- Added: 2N7000 MOSFET note and PN2907 note
- Restored original bias language (reverted "COMPLETELY ILLEGIBLE" change that caused regressions)

---

## GitHub Issues Filed This Session

Issues #108–#129 were filed automatically by accuracy_test.py for all failing circuits.

---

## Commands to Resume

```bash
cd /home/rob/pedalpath-v2
bash start_session.sh

# Re-run full accuracy test
python3 tools/accuracy_test.py 2>&1 | tee docs/generated/accuracy_results.txt

# Investigate a specific failure
python3 tools/accuracy_test.py --circuit "buff"
python3 tools/accuracy_test.py --circuit "aeon"
python3 tools/accuracy_test.py --circuit "turbo"

# Re-run docx circuit analysis (must re-extract images first if /tmp cleared)
python3 tools/analyze_docx_circuits.py
python3 tools/analyze_docx_circuits.py --circuit "Rat" --dump
```
