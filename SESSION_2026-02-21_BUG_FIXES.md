# Session 2026-02-21 — Bug Fix Sprint

## Status: IN PROGRESS (paused mid-session)

All changes are committed to GitHub and deployed to https://pedalpath-v2.vercel.app

---

## Bugs Fixed This Session (Issues #14, #8/#12, #7, #13)

### ✅ Issue #14 — Supabase auth fetch error / invalid Authorization header (Windows)
**File**: `pedalpath-app/src/services/supabase.ts`
**Fix**: Changed `.trim()` to `.replace(/\s+/g, '')` on both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to strip embedded `\n` characters that Vercel stored in environment variables on Windows.

### ✅ Issues #8/#12 — Save button permanently greyed out + Dashboard showing 0 projects
**Files**: `pedalpath-app/src/pages/ResultsPage.tsx`, `pedalpath-app/src/hooks/useProjects.ts`

`ResultsPage.tsx`: Replaced a fragile nested join (single query `projects(schematics(...))`) with two clean separate queries:
1. `schematics` → get `project_id` for this schematic
2. `projects` → get `status` for that project_id
This ensures `projectId` is reliably resolved, which enables the Save button correctly.

`useProjects.ts`: Changed dashboard filter from client-side array length check to server-side `.neq('status', 'draft')` — projects are now correctly shown after saving.

### ✅ Issue #7 — AI hallucination (ignored uploaded Rangemaster schematic, generated TL072 circuit instead)
**File**: `pedalpath-app/api/analyze-schematic.ts`
Three root causes fixed:
1. Moved "You are an expert..." persona to Anthropic `system` parameter (was incorrectly in user message)
2. Removed specific component examples (`"TL072"`, `"2N3904"`) from the schema template that were anchoring Claude's output
3. Added explicit `"CRITICAL: Only report components you can actually see in THIS image"` instruction

### ✅ Issue #13 — Enclosure drill template hole labels only visible on hover
**File**: `pedalpath-app/src/components/guides/EnclosureGuide.tsx`
Each drill hole in the SVG now permanently shows:
- Component name below the hole circle (e.g., "3PDT Footswitch", "100kB Pot")
- Diameter label (e.g., ⌀8mm)
- Letter badge (A, B, C...) upper-right of hole
- X,Y coordinates at the panel bottom
No hover required.

---

## Bugs Remaining (NOT YET FIXED)

### ⏳ Issue #10 — Breadboard component overlays too small / not realistic
Components placed on the breadboard SVG are too small and don't look like real physical parts.
**Expected**: Resistors should look like colored band cylinders, capacitors like actual cylinders/discs, etc.
**Files to look at**: `src/components/guides/BreadboardGuide.tsx` and any component rendering files

### ⏳ Issues #9/#11 — No transistor visuals in build guide steps
Transistors are listed in the BOM but no visual representation exists for them in the build guide steps.
**Files to look at**: Same breadboard guide files as above

---

## Next Steps (in order)

1. **Issue #10 + #9/#11 (breadboard visuals)** — These are related and should be done together.
   - Look at `src/components/guides/BreadboardGuide.tsx` and related breadboard component files
   - Check `src/components/breadboard/` for any component overlay files
   - Reference screenshots in `/mnt/c/Users/Rob/Dropbox/!Claude/PedalPath-v2_Files/Issues/IMG_2196.PNG` through `IMG_2201.PNG`
   - The breadboard itself uses `BreadboardBase.tsx` which was fixed previously (squares not circles, correct aspect ratio)

2. **After those bugs**: Re-run full test suite (`npm test -- --run` from `pedalpath-app/`) and do a final deploy

---

## Key Paths
- Repo: `/home/rob/pedalpath-v2/pedalpath-app/`
- Deploy: `cd /home/rob/pedalpath-v2 && vercel --prod`
- Tests: `cd /home/rob/pedalpath-v2/pedalpath-app && npm test -- --run`
- Issue screenshots: `/mnt/c/Users/Rob/Dropbox/!Claude/PedalPath-v2_Files/Issues/`

## Notes
- All 168 tests pass as of this session
- The Stripe TS errors in the Vercel build output are pre-existing and non-blocking
- Supabase schema/data: no changes were needed this session
