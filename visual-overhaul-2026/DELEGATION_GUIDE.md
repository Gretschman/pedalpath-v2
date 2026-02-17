# Delegation Guide for Multi-AI Coordination

**Purpose:** Instructions for assigning work to multiple AI assistants (ChatGPT, Claude, Codex, etc.)
**Date:** 2026-02-16

## How to Use This Workspace

This project is structured for **parallel execution** across multiple AI workers. Each worker gets a focused task with clear inputs and outputs.

## Quick Start for Delegating Work

### Template for Each Worker:

```
"I'm working on PedalPath v2 Visual Overhaul. Your task is [WORK STREAM NAME].

📁 Read these files first:
[List of requirement and technical design files]

🎯 Your task:
[Specific implementation goals]

💾 Implement here:
[Specific folder path]

✅ Success criteria:
[Clear completion checklist]

📝 When complete:
Update the STATUS.md file at [path] with your progress.

Do you need any clarification before starting?"
```

---

## Worker Assignments

### 🔴 Phase 1: Foundation (BLOCKING - Must Complete First)

#### Worker A: Component Decoder System

**Copy this to ChatGPT/Claude/Codex:**

```
I'm working on PedalPath v2 Visual Overhaul. Your task is implementing the Component Decoder System (Phase 1, Work Stream A).

📁 Read these files first:
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/1-requirements/component-visual-specs.md
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/2-technical-design/decoder-system-design.md
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/3-implementation/phase1-decoders/README.md

🎯 Your task:
Create TypeScript utilities that decode component value strings (like "10kΩ", "100nF") into visual specifications (color bands, types, polarities).

Files to create:
- src/types/component-specs.types.ts
- src/utils/decoders/resistor-decoder.ts
- src/utils/decoders/capacitor-decoder.ts
- src/utils/decoders/ic-decoder.ts
- src/utils/decoders/diode-decoder.ts
- src/utils/decoders/index.ts
- Tests with 80%+ coverage

💾 Implement at:
/home/rob/git/pedalpath-v2/pedalpath-app/src/

✅ Success criteria:
- decodeResistor("10kΩ") returns {bands: ["brown", "black", "orange", "gold"], ...}
- decodeCapacitor("100nF") returns {capType: "ceramic", ...}
- All tests pass
- JSDoc comments on all public functions

⚠️ IMPORTANT:
User mentioned Python decoders may exist in Dropbox. Search for resistor_decoder.py and capacitor_decoder.py - port their logic instead of building from scratch.

📝 When complete:
Update /home/rob/git/pedalpath-v2/visual-overhaul-2026/3-implementation/phase1-decoders/STATUS.md

Do you need any clarification before starting?
```

#### Worker B: Breadboard Base Component

**Copy this to ChatGPT/Claude/Codex:**

```
I'm working on PedalPath v2 Visual Overhaul. Your task is implementing the Realistic Breadboard Base (Phase 1, Work Stream B).

📁 Read these files first:
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/1-requirements/breadboard-specifications.md
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/2-technical-design/breadboard-base-architecture.md
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/3-implementation/phase1-decoders/README.md

📸 Reference photos:
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/1-requirements/breadboard-reference-images/breadboard-ref-1.png
- (... all 4 reference images)

🎯 Your task:
Create a React component that renders a photorealistic breadboard SVG EXACTLY matching the reference photos.

Files to create:
- src/components/visualizations/BreadboardBase.tsx
- src/components/visualizations/BreadboardBase.css
- src/utils/breadboard-utils.ts
- Tests for utilities

Key requirements:
- White base (#F5F5F5)
- Red power rail at TOP, blue at BOTTOM (HORIZONTAL, not vertical!)
- Column labels 1-63, row letters a-j
- Proper 2.54mm hole spacing
- NO components yet - just bare board

💾 Implement at:
/home/rob/git/pedalpath-v2/pedalpath-app/src/

✅ Success criteria:
- BreadboardBase component renders without errors
- Visual comparison to reference photos: >95% match
- Power rails in correct position (top/bottom, not sides)
- Props: {size: '830' | '400', highlightHoles?: string[]}

📝 When complete:
Update /home/rob/git/pedalpath-v2/visual-overhaul-2026/3-implementation/phase1-decoders/STATUS.md

Do you need any clarification before starting?
```

---

### 🟡 Phase 2: Component Rendering (Blocked until Phase 1 Complete)

#### Worker C: Component SVG Library

**Wait for Phase 1, then copy:**

```
Phase 1 is complete. Your task is creating the Component SVG Library (Phase 2, Work Stream C).

📁 Read these files first:
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/1-requirements/component-visual-specs.md
- /home/rob/git/pedalpath-v2/visual-overhaul-2026/3-implementation/phase1-decoders/HANDOFF.md

🎯 Your task:
Create realistic SVG components (resistors, capacitors, ICs) that use the specs from Phase 1 decoders.

Files to create:
- src/components/visualizations/components-svg/ResistorSVG.tsx
- src/components/visualizations/components-svg/CapacitorSVG.tsx
- src/components/visualizations/components-svg/ICSVG.tsx
- src/components/visualizations/components-svg/DiodeSVG.tsx
- src/components/visualizations/components-svg/WireSVG.tsx
- src/components/visualizations/components-svg/index.ts

Key requirements:
- ResistorSVG shows accurate color bands from ResistorSpec
- CapacitorSVG shows different types (ceramic/electrolytic) with polarity
- ICSVG shows pin numbers and notch
- Realistic 3D-like appearance with shadows

💾 Implement at:
/home/rob/git/pedalpath-v2/pedalpath-app/src/

✅ Success criteria:
- Each component renders with correct visual specs
- Color bands match real resistor standards
- Polarity markers visible on capacitors
- Components look realistic, not flat/schematic

📝 When complete:
Update STATUS.md for Phase 2

Do you need any clarification before starting?
```

---

### 🟢 Phase 3: Mobile Responsiveness (Can Start Anytime - Parallel Work)

#### Workers E, F, G: Mobile UI

**These can start immediately, no dependencies:**

**Worker E - Navigation:**
```
Your task is making Navigation responsive (Phase 3, Work Stream E).

📁 Read: /home/rob/git/pedalpath-v2/visual-overhaul-2026/1-requirements/mobile-responsive-requirements.md

🎯 Task: Add hamburger menu and mobile breakpoints to Navbar.tsx

Files to modify:
- src/components/Navbar.tsx
- src/components/Layout.tsx

Pattern:
<button className="md:hidden">Hamburger</button>
<div className="hidden md:flex">Desktop Menu</div>

Test at 375px width (iPhone SE)
```

**Worker F - Pages:**
```
Your task is making Pages responsive (Phase 3, Work Stream F).

📁 Read: /home/rob/git/pedalpath-v2/visual-overhaul-2026/1-requirements/mobile-responsive-requirements.md

🎯 Task: Add responsive breakpoints to all page components

Files to modify:
- src/pages/LandingPage.tsx
- src/pages/DashboardPage.tsx
- src/pages/ResultsPage.tsx (CRITICAL: fix tab overflow)
- src/pages/UploadPage.tsx
- src/pages/SignInPage.tsx
- src/pages/SignUpPage.tsx

Pattern:
- Headings: text-2xl sm:text-3xl md:text-4xl
- Grids: grid-cols-1 sm:grid-cols-2 md:grid-cols-3
- Padding: p-4 sm:p-6 lg:p-8

Test at 375px width
```

**Worker G - Data Display:**
```
Your task is making Data Display responsive (Phase 3, Work Stream G).

📁 Read: /home/rob/git/pedalpath-v2/visual-overhaul-2026/1-requirements/mobile-responsive-requirements.md

🎯 Task: Convert BOMTable to card layout on mobile

Files to modify:
- src/components/bom/BOMTable.tsx (MOST COMPLEX)
- src/components/payment/PricingModal.tsx
- src/components/guides/BreadboardGuide.tsx
- src/components/guides/StripboardGuide.tsx

Pattern for BOMTable:
<div className="block md:hidden">{/* Mobile cards */}</div>
<div className="hidden md:block"><table>...</table></div>

All buttons must be 44px+ tap targets
```

---

### 🔵 Phase 4: Integration (After All Phases)

#### Worker I: End-to-End Integration

**Wait for Phases 1-3, then:**
```
All phases complete. Your task is connecting everything (Phase 4, Work Stream I).

🎯 Task:
- Connect BOM data → decoders → visualizations
- Update guides to show real components
- Remove all demo/hardcoded data

Test full workflow:
Upload → BOM → Breadboard → Stripboard
```

#### Worker J: QA Testing

**Continuous throughout, final verification in Phase 4:**
```
Your task is comprehensive testing (Phase 4, Work Stream J).

📁 Read: /home/rob/git/pedalpath-v2/visual-overhaul-2026/4-testing-qa/test-plan.md

🎯 Test:
- Mobile devices: iPhone SE (375px), iPhone 14 (390px), iPad (768px)
- All component types render correctly
- Color codes match real components
- Full workflow end-to-end
- Visual comparison to real breadboards

Success: All tests pass, visual similarity >95%
```

---

## Status Tracking

Each worker should update their phase's `STATUS.md` file regularly:

```markdown
## Work Stream [X]: [Name]

**Worker:** [Your name/ID]
**Status:** 🟡 In Progress
**Progress:** 45%

### Completed:
- [x] Task 1
- [x] Task 2

### In Progress:
- [ ] Task 3 (50% done)

### Blockers:
None currently

### Notes:
- Found Python decoders in /path/to/dropbox
- Need clarification on...
```

## Handoffs Between Phases

When a phase completes, create `HANDOFF.md`:

```markdown
# Phase [N] Handoff to Phase [N+1]

## What We Built
[Summary of deliverables]

## How to Use It
[Import statements, example code]

## Known Limitations
[What's not implemented, edge cases]

## Files Created
- path/to/file1.ts
- path/to/file2.tsx

## What Phase [N+1] Needs to Know
[Important details, gotchas, decisions made]
```

---

## Communication Protocol

### When Starting:
1. Read assigned files in `1-requirements/` and `2-technical-design/`
2. Update `STATUS.md` to "🟡 In Progress"
3. Ask clarifying questions if needed

### During Work:
1. Update `STATUS.md` progress regularly
2. Document blockers immediately
3. Share discoveries (e.g., found Python files)

### When Complete:
1. Update `STATUS.md` to "🟢 Complete"
2. Create `HANDOFF.md` if next phase depends on you
3. Run tests and document results
4. Notify that phase is ready for next stage

### If Blocked:
1. Update `STATUS.md` with "⚠️ Blocked" status
2. Document what's blocking you
3. Propose alternatives if possible

---

## Quality Checks Before Marking Complete

**Code Quality:**
- [ ] TypeScript types defined
- [ ] No `any` types
- [ ] JSDoc comments on public functions
- [ ] Consistent code style

**Testing:**
- [ ] Unit tests written
- [ ] Tests pass: `npm test`
- [ ] Coverage >80%

**Documentation:**
- [ ] STATUS.md updated
- [ ] HANDOFF.md created (if needed)
- [ ] Code has inline comments for complex logic

**Visual (if applicable):**
- [ ] Visual comparison to reference photos
- [ ] Responsive at 375px, 768px, 1440px
- [ ] No console errors

---

## Emergency Contact

If stuck or need clarification:
1. Document in STATUS.md
2. Check if other workers encountered same issue
3. Consult main project docs: `/home/rob/git/pedalpath-v2/*.md`
4. Escalate to project lead if truly blocked

---

## Expected Timeline

- **Phase 1**: 2 days (BLOCKING)
- **Phase 2**: 3 days (Work Streams C + D)
- **Phase 3**: 5 days (Work Streams E + F + G + H, some parallel)
- **Phase 4**: 4 days (Integration + Testing)

**Total: ~2 weeks with full parallelization**

---

**This delegation guide ensures all AI workers know exactly what to do, where to find information, and how to hand off work to the next phase.**
