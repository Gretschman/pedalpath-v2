# Phase 1: Foundation (BLOCKING)

**Timeline:** Days 1-2 (Week 1)
**Status:** 🔴 NOT STARTED
**Dependencies:** None - can start immediately

## Overview

Phase 1 creates the foundation that all other work depends on:
- **Work Stream A**: Component decoder system (TypeScript utilities)
- **Work Stream B**: Realistic breadboard base (SVG component)

Both must be complete before Phase 2 can begin.

## Work Stream A: Component Decoder System

**Assignable to:** Backend/TypeScript specialist
**Duration:** 2 days
**Location:** `/home/rob/git/pedalpath-v2/pedalpath-app/src/utils/decoders/`

### Read First:
1. `../../1-requirements/component-visual-specs.md` - What components should look like
2. `../../2-technical-design/decoder-system-design.md` - How to implement

### Task:
Create TypeScript decoders that convert component value strings into visual specifications.

**Files to create:**
```
pedalpath-app/src/
├── utils/decoders/
│   ├── index.ts                    # Barrel export
│   ├── resistor-decoder.ts         # "10kΩ" → color bands
│   ├── capacitor-decoder.ts        # "100nF" → type/polarity
│   ├── ic-decoder.ts               # "TL072" → pin count
│   ├── diode-decoder.ts            # "1N4148" → cathode marking
│   └── __tests__/
│       ├── resistor-decoder.test.ts
│       └── ...
└── types/
    └── component-specs.types.ts    # TypeScript interfaces
```

### Key Requirements:
- Resistor decoder must map "10kΩ" → `["brown", "black", "orange", "gold"]`
- Capacitor decoder must determine type (ceramic/electrolytic/film)
- All decoders return spec objects matching TypeScript interfaces
- Minimum 80% test coverage

### Python Reference:
User mentioned Python decoders exist (resistor_decoder.py, capacitor_decoder.py). Search Dropbox and port logic to TypeScript rather than building from scratch.

### Success Criteria:
- [ ] All decoder files created with proper TypeScript types
- [ ] Test suite passes (run: `npm test decoders`)
- [ ] Example: `decodeResistor("10kΩ")` returns correct color bands
- [ ] Example: `decodeCapacitor("100nF")` identifies type correctly
- [ ] JSDoc comments on all public functions

### Update When Complete:
Update `STATUS.md` with completion status and any notes for Phase 2.

---

## Work Stream B: Realistic Breadboard Base

**Assignable to:** Graphics/SVG specialist
**Duration:** 2 days
**Location:** `/home/rob/git/pedalpath-v2/pedalpath-app/src/components/visualizations/`

### Read First:
1. `../../1-requirements/breadboard-specifications.md` - Exact breadboard specs
2. `../../1-requirements/breadboard-reference-images/` - Real breadboard photos
3. `../../2-technical-design/breadboard-base-architecture.md` - Implementation guide

### Task:
Complete rewrite of BreadboardGrid.tsx to match real breadboard photos EXACTLY.

**Files to create/modify:**
```
pedalpath-app/src/
├── components/visualizations/
│   ├── BreadboardBase.tsx          # NEW - Reusable base component
│   ├── BreadboardBase.css          # NEW - Styling
│   └── BreadboardGrid.tsx          # MODIFY - Will use BreadboardBase
└── utils/
    └── breadboard-utils.ts         # NEW - Coordinate helpers
```

### Key Requirements:
- White plastic base (#F5F5F5)
- **CRITICAL**: Red power rail at TOP, blue ground rail at BOTTOM
  - NOT on sides! (Common mistake - reference photos show horizontal)
- Column labels: 1-63 (centered above/below columns)
- Row letters: a-j (left side)
- Proper hole spacing (2.54mm scale)
- Circular holes with metallic rim
- Center divider between rows e/f
- NO components yet - just bare board

### Visual Verification:
Compare side-by-side with `breadboard-ref-1.png`:
- [ ] Power rails in correct position (horizontal, not vertical)
- [ ] Hole spacing uniform
- [ ] Labels readable and positioned correctly
- [ ] Colors match (#F5F5F5 base, #CC0000 red, #0066CC blue)

### Success Criteria:
- [ ] `BreadboardBase.tsx` component created
- [ ] Props: `{ size: '830' | '400', highlightHoles?: string[] }`
- [ ] Renders breadboard matching reference photos
- [ ] Power rails at top/bottom (NOT sides)
- [ ] Visual regression test passes
- [ ] Responsive (scales properly in mobile view)

### Update When Complete:
Update `STATUS.md` and create `HANDOFF.md` for Phase 2.

---

## Collaboration Notes

**Workers A & B can work in parallel** - no interdependencies.

**Communication:**
- Update STATUS.md regularly with progress
- Note any blockers immediately
- Share discoveries (e.g., if Python decoders found, share location)

**Testing Together:**
Once both complete, test integration:
```tsx
// Quick integration test
import { decodeResistor } from '@/utils/decoders';
import { BreadboardBase } from '@/components/visualizations/BreadboardBase';

const spec = decodeResistor("10kΩ");
console.log(spec.bands); // Should show color array

<BreadboardBase size="830" highlightHoles={["a15", "a16"]} />
```

---

## Resources

- Main codebase: `/home/rob/git/pedalpath-v2/pedalpath-app/`
- Reference images: `../../1-requirements/breadboard-reference-images/`
- Existing docs: `/home/rob/git/pedalpath-v2/*.md`
- Python decoders (if found): Link here when located

---

## Next Phase

**Phase 2 BLOCKED until Phase 1 complete.**

Once complete:
- Phase 2 will use decoders to generate component specs
- Phase 2 will place components on BreadboardBase
- Create `HANDOFF.md` documenting:
  - How to import and use decoders
  - How to position components on breadboard
  - Known limitations

---

**Last Updated:** 2026-02-16
**Status:** Awaiting worker assignment
