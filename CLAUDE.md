# PedalPath v2 - Claude Development Guide

**Last Updated**: 2026-02-21
**Current Phase**: Phase 2 ✅ COMPLETE | Phase 3 (Mobile) or Stripe Activation next
**Status**: 168 tests passing | Both Vercel projects deployed and working

---

## 🚀 Current Project Status (CRITICAL - READ FIRST)

### Phase 2 Visual Overhaul: COMPLETE ✅
**Completed**: 2026-02-21
**Full session notes**: `SESSION_2026-02-21_PHASE2_COMPLETE.md`

**What Was Built (Phase 2):**
1. **Component SVGs** — ResistorSVG, CapacitorSVG, ICSVG, DiodeSVG, WireSVG
2. **BomBreadboardView** — Full pipeline: BOM → decoders → layout → SVG overlay
3. **bom-layout.ts** — Auto-placement algorithm for all component types
4. **BreadboardGuide** — BomBreadboardView embedded in build steps 2–9
5. **5 Bug fixes** — Auth errors, enclosure diagram, dashboard 0-projects bug

**Deployments**: Both Vercel projects live and working
- Primary: https://pedalpath-v2.vercel.app (deploy from `/home/rob/pedalpath-v2`)
- Secondary: https://pedalpath-app.vercel.app (deploy from `/home/rob/pedalpath-v2/pedalpath-app`)

### Immediate Next Steps (choose one):
**Option A — Phase 3: Mobile Responsiveness**
- Read: `/visual-overhaul-2026/3-implementation/phase3-mobile/README.md`

**Option B — Stripe Activation**
- `npm install stripe` in pedalpath-app/
- Add env vars to both Vercel projects: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_APP_URL`
- Create Supabase tables: `subscriptions`, `payment_transactions`
- Create Supabase RPCs: `can_user_upload`, `increment_usage`
- Wire `PricingModal` into `UploadPage`
- Full checklist in `SESSION_2026-02-21_PHASE2_COMPLETE.md`

**Option C — Quick Cleanup (30 min)**
- Delete `src/components/visualizations/BreadboardGrid.tsx` (old, nothing imports it)

---

## Project Overview

PedalPath is a web application that helps guitar pedal builders analyze schematics using AI vision. Users upload schematic images, and Claude Vision analyzes them to generate Bill of Materials (BOM), enclosure recommendations, power requirements, and **realistic visual build guides**.

**Primary Goal**: Make DIY pedal building accessible through photorealistic breadboard visualizations and step-by-step guides.

**Critical Mission**: Replace text-based build instructions with LEGO-style visual guides showing exact component placement with color-coded parts matching real components.

---

## 🎯 Project Goals & Vision

### The Problem We Solve
DIY pedal building is intimidating for beginners because:
- Schematics are hard to read
- Components look confusing (color bands, markings)
- Build instructions are text-heavy
- No visual feedback until you're done

### Our Solution
1. **AI Schematic Analysis** - Upload schematic → instant BOM
2. **Visual Component Recognition** - Show what resistor color bands look like
3. **Interactive Breadboard Guides** - LEGO-instruction-style step-by-step placement
4. **Realistic Rendering** - Components look exactly like real parts

---

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool (fast!)
- **Tailwind CSS 3.4** - Styling
- **React Router v7** - Routing
- **Lucide React** - Icons
- **Vitest 4** - Testing framework (NEW)

### Backend & Services
- **Supabase** - Auth, PostgreSQL DB, file storage
- **Claude API (Anthropic)** - Schematic analysis (Claude 4.5 Sonnet)
- **Vercel** - Hosting & serverless functions

### Key Libraries
- `@anthropic-ai/sdk` - Claude API client
- `@supabase/supabase-js` - Supabase client
- `react-hook-form` + `zod` - Form handling
- `@tanstack/react-query` - Data fetching
- `vitest` - Unit testing

---

## Project Structure

```
pedalpath-v2/
├── pedalpath-app/                      # Main application
│   ├── api/                            # Vercel serverless functions
│   │   └── analyze-schematic.ts        # Claude Vision API endpoint
│   ├── src/
│   │   ├── components/
│   │   │   ├── guides/                 # Build guides
│   │   │   ├── schematic/              # Upload components
│   │   │   └── visualizations/         # ← NEW: BreadboardBase, component SVGs
│   │   │       ├── BreadboardBase.tsx  # ← NEW: Photorealistic breadboard
│   │   │       ├── BreadboardBase.css  # ← NEW
│   │   │       └── components-svg/     # ← PHASE 2: Resistor/Cap/IC SVGs
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   ├── BreadboardDemo.tsx      # ← NEW: Demo page
│   │   │   └── ...
│   │   ├── services/                   # API integration
│   │   ├── types/
│   │   │   └── component-specs.types.ts # ← NEW: Component type definitions
│   │   ├── utils/
│   │   │   ├── decoders/               # ← NEW: Resistor/capacitor decoders
│   │   │   │   ├── resistor-decoder.ts # ← NEW: IEC 60062 compliant
│   │   │   │   ├── capacitor-decoder.ts # ← NEW: Multi-format
│   │   │   │   ├── ic-decoder.ts       # ← NEW: Stub
│   │   │   │   ├── diode-decoder.ts    # ← NEW: Stub
│   │   │   │   └── index.ts            # ← NEW: Barrel export
│   │   │   ├── breadboard-utils.ts     # ← NEW: Coordinate calculations
│   │   │   ├── image-utils.ts
│   │   │   └── __tests__/              # ← NEW: Test files
│   │   └── vitest.config.ts            # ← NEW: Test configuration
│   └── package.json
├── visual-overhaul-2026/               # ← NEW: Visual overhaul project
│   ├── 1-requirements/
│   ├── 2-technical-design/
│   ├── 3-implementation/
│   │   └── phase1-decoders/
│   │       ├── STATUS.md               # ← Current status
│   │       └── HANDOFF.md              # ← Phase 2 integration guide
│   ├── 4-testing-qa/
│   ├── reference-code/                 # Python reference implementations
│   ├── DELEGATION_GUIDE.md             # Worker assignment templates
│   ├── README.md
│   └── START_HERE.md
├── archive/                            # Superseded docs moved here
├── docs/                               # Organized documentation
│   ├── knowledge-base/
│   └── design/
├── README.md                           # Project README
└── CLAUDE.md                           # This file
```

---

## 🧪 Testing (NEW)

### Run Tests
```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app

# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- resistor-decoder

# Run with UI
npm test:ui

# Coverage report
npm test:coverage
```

### Test Structure
- **Decoder tests**: `src/utils/decoders/__tests__/`
- **Utility tests**: `src/utils/__tests__/`
- **Component tests**: (Phase 2) `src/components/**/__tests__/`

### Current Test Coverage
- **156 tests total** (100% passing)
  - 61 resistor decoder tests
  - 60 capacitor decoder tests
  - 35 breadboard utility tests

---

## 🎨 Visual Overhaul Architecture

### Phase 1: Foundation (✅ COMPLETE)
**Deliverables**: Component decoders + breadboard base

**Key Exports**:
```typescript
// Decoders
import {
  encodeResistor,      // Value → color bands
  decodeResistor,      // Bands → value
  encodeCapacitor,     // Value → marking codes
  decodeCapacitor,     // Marking → value
  formatOhms,          // 47000 → "47 kΩ"
  formatCapacitance    // 47000pF → "47 nF"
} from '@/utils/decoders';

// Breadboard
import BreadboardBase from '@/components/visualizations/BreadboardBase';
import {
  holeToCoordinates,   // "a15" → { x, y }
  getConnectedHoles,   // "a15" → ["a15", "b15", ...]
  isValidHoleId        // Validation
} from '@/utils/breadboard-utils';

// Types
import type {
  ResistorSpec,
  CapacitorSpec,
  EncodedResistor,
  EncodedCapacitor
} from '@/types/component-specs.types';
```

**Usage Example**:
```typescript
// Get resistor color bands
const spec = encodeResistor(47000, 1.0);  // 47kΩ ±1%
// → { bands5: ['yellow', 'violet', 'black', 'red', 'brown'] }

// Render breadboard
<BreadboardBase
  size="830"
  highlightHoles={['a15', 'a16']}
  onHoleClick={(id) => console.log(id)}
/>

// Get hole position
const coords = holeToCoordinates('a15', LAYOUT_830);
// → { x: 407.6, y: 100 }
```

### Phase 2: Component SVG Rendering (IN PROGRESS)
**Goal**: Create realistic component SVGs using decoder specs

**Files to Create**:
- `ResistorSVG.tsx` - Renders resistor with accurate color bands
- `CapacitorSVG.tsx` - Different shapes for ceramic/film/electrolytic
- `ICSVG.tsx` - Black DIP package with pin numbers
- `DiodeSVG.tsx` - Glass body with cathode band
- `WireSVG.tsx` - Colored wire routing

**See**: `/visual-overhaul-2026/3-implementation/phase1-decoders/HANDOFF.md`

### Phase 3: Mobile & Polish (FUTURE)
- Responsive breakpoints for all 23 components
- Touch zoom/pan for breadboard
- Stripboard enhancement

---

## Common Patterns

### Using Decoders
```typescript
import { encodeResistor, decodeCapacitor } from '@/utils/decoders';

// Encode: Get component visual spec from value
const resistor = encodeResistor(47000, 1.0);
console.log(resistor.bands5);  // Color bands array
console.log(resistor.toleranceColor);  // 'brown'

// Decode: Parse component marking
const cap = decodeCapacitor('473J250');
console.log(cap.capacitance.nf);  // 47
console.log(cap.capType);  // 'film_box'
console.log(cap.polarized);  // false
```

### Breadboard Coordinate System
```typescript
import { holeToCoordinates, getConnectedHoles } from '@/utils/breadboard-utils';

// Get hole position
const start = holeToCoordinates('a15', LAYOUT_830);
const end = holeToCoordinates('a20', LAYOUT_830);

// Render component spanning holes
<ResistorSVG
  startX={start.x}
  startY={start.y}
  endX={end.x}
  endY={end.y}
  spec={resistorSpec}
/>

// Check which holes are connected
const connected = getConnectedHoles('a15', '830');
// → ['a15', 'b15', 'c15', 'd15', 'e15']
```

### Supabase Client Usage
```typescript
import { supabase } from '../services/supabase'

// Query
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)

// Insert
const { data, error } = await supabase
  .from('table_name')
  .insert({ field: value })
  .select()
  .single()
```

### Authentication
```typescript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return <div>Hello {user.email}</div>
}
```

---

## Git Workflow

### Before Committing
```bash
# Run tests
npm test -- --run

# Check for TypeScript errors
npm run build

# Lint code
npm run lint

# Check git status
git status

# Review changes
git diff
```

### Committing Changes (Anthropic Standards)
```bash
cd /home/rob/git/pedalpath-v2

# Stage all changes
git add -A

# Commit with descriptive message + co-author
git commit -m "$(cat <<'EOF'
Add Phase 1 visual overhaul foundation

Implements component decoders and breadboard base:
- Resistor decoder: IEC 60062 compliant, E-series validation
- Capacitor decoder: Multi-format (EIA, alphanumeric, R-decimal)
- BreadboardBase: Photorealistic 830/400-point SVG component
- Test suite: 156 tests, 100% passing

Closes visual-overhaul Phase 1. Ready for Phase 2 component SVGs.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Push to GitHub
git push origin main
```

### Commit Message Standards
- **Imperative mood**: "Add feature" not "Added feature"
- **First line**: Brief summary (<50 chars)
- **Body**: What + Why (not how - that's in the code)
- **Co-author**: Always include for AI pair programming
- **Reference**: Link to issues, phases, or docs

---

## Deployment

### Vercel Production
```bash
cd /home/rob/git/pedalpath-v2/pedalpath-app
vercel --prod --yes
```

- **Auto-deploy** on push to `main` branch
- **Production URL**: https://pedalpath-app.vercel.app
- **Environment variables**: Configured in Vercel dashboard

### Pre-Deployment Checklist
- [ ] All tests passing (`npm test -- --run`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No sensitive data in code
- [ ] Environment variables configured in Vercel

---

## Environment Variables

Located in `/pedalpath-app/.env.local` (NOT in git):

```bash
# Supabase
VITE_SUPABASE_URL=https://tudjjcamqxeybqqmvctr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Claude API
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

# Vercel (auto-generated)
VERCEL_OIDC_TOKEN=eyJ...
```

**Security**: Never commit `.env.local`. Use `VITE_` prefix for browser-accessible vars.

---

## Database Schema

### Core Tables
- **projects** - User's pedal projects
- **schematics** - Uploaded schematic files
- **bom_items** - Bill of materials components
- **enclosure_recommendations** - Enclosure size suggestions
- **power_requirements** - Power supply specs

### Row Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data
- Foreign keys enforce data relationships

**See**: Previous CONTINUATION docs for SQL migrations

---

## Common Commands

```bash
# Navigate to project
cd /home/rob/git/pedalpath-v2/pedalpath-app

# Install dependencies
npm install

# Development server (http://localhost:5174)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Git operations
git status
git diff
git log --oneline -10

# Deploy
vercel --prod --yes
```

---

## Design & UX Guidelines

**PRIMARY REFERENCE**: `/visual-overhaul-2026/1-requirements/`

**Philosophy**: "LEGO-Simple, Apple-Beautiful, Intuit-Obvious"
- Every interaction visually obvious
- Complex processes → discrete steps
- Immediate visual feedback
- Colorful, approachable, never intimidating

**Visual Standards**:
- **Breadboard**: White plastic (#F5F5F5), red/blue power rails, metallic holes
- **Components**: Match real parts exactly (resistor color codes per IEC 60062)
- **Layout**: 2.54mm hole spacing (standard IC pitch)
- **Labels**: Sans-serif, 8-12pt, #666666

**See**: `/visual-overhaul-2026/1-requirements/breadboard-specifications.md`

---

## Debugging Protocol

**When errors occur**:

1. **Check test suite first**
   ```bash
   npm test -- --run
   ```

2. **Check build**
   ```bash
   npm run build
   ```

3. **Check browser console** (F12 → Console)

4. **Check Vercel logs**
   ```bash
   vercel logs <deployment-url>
   ```

5. **Check git history** for context
   ```bash
   git log --oneline -10
   ```

**See**: `DEBUGGING_PROTOCOL.md` for complete protocols

---

## Session Continuity

### Starting a New Session
1. Read this `CLAUDE.md` file (you're here!)
2. Check `/visual-overhaul-2026/3-implementation/phase1-decoders/STATUS.md`
3. Read `/visual-overhaul-2026/3-implementation/phase1-decoders/HANDOFF.md` for Phase 2
4. Check recent git commits: `git log --oneline -10`
5. Run tests to verify everything works: `npm test -- --run`

### Ending a Session
1. **Run all tests**: `npm test -- --run`
2. **Commit all changes** with descriptive message
3. **Push to GitHub**: `git push origin main`
4. **Update STATUS.md** with current progress
5. **Create continuation doc** if mid-feature

**Document Structure**:
- Current status (what's working)
- Current blockers (what's not)
- Next steps (immediate actions)
- Testing checklist

---

## Important Files for Context

### Must-Read Documents
1. **`/visual-overhaul-2026/START_HERE.md`** - Visual overhaul overview
2. **`/visual-overhaul-2026/3-implementation/phase1-decoders/HANDOFF.md`** - Phase 2 integration guide
3. **`/visual-overhaul-2026/3-implementation/phase1-decoders/STATUS.md`** - Current status
4. **`/visual-overhaul-2026/DELEGATION_GUIDE.md`** - Worker templates
5. **`/visual-overhaul-2026/reference-code/README.md`** - Python reference code

### Quick Reference
- **Test files**: `src/utils/**/__tests__/*.test.ts`
- **Type definitions**: `src/types/component-specs.types.ts`
- **Decoders**: `src/utils/decoders/*.ts`
- **Breadboard**: `src/components/visualizations/BreadboardBase.tsx`
- **Utils**: `src/utils/breadboard-utils.ts`

---

## Phase Roadmap

### ✅ Phase 1: Foundation (COMPLETE - 2026-02-16)
- Component decoders (resistor, capacitor)
- Breadboard base component (830/400-point)
- Coordinate system utilities
- 156 tests passing

### 🔄 Phase 2: Component SVG Rendering (CURRENT)
**Work Stream C**: Create component SVG library
- ResistorSVG with color bands
- CapacitorSVG with type variants
- ICSVG with pin numbers
- DiodeSVG, WireSVG

**Work Stream D**: Breadboard integration
- Update BreadboardGrid to use BreadboardBase
- Overlay component SVGs
- Connect to BOM pipeline

**Estimated**: 5-6 days

### 📋 Phase 3: Mobile & Polish (FUTURE)
- Mobile responsive breakpoints (23 components)
- Touch zoom/pan on breadboard
- Stripboard enhancements
- Performance optimization

### 📋 Phase 4: Production Launch (FUTURE)
- Payment integration (Stripe)
- Advanced features (auto-routing, etc.)
- User testing & feedback
- Marketing & launch

---

## Resources

- **GitHub**: https://github.com/Gretschman/pedalpath-v2
- **Production**: https://pedalpath-app.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Anthropic API Docs**: https://docs.anthropic.com
- **Claude 4.5 Model**: `claude-sonnet-4-5-20250929`

---

## Quick Start for New Workers

### Phase 2 - Worker C (Component SVGs)
```bash
# 1. Read integration guide
cat /home/rob/git/pedalpath-v2/visual-overhaul-2026/3-implementation/phase1-decoders/HANDOFF.md

# 2. Check decoders work
cd /home/rob/git/pedalpath-v2/pedalpath-app
npm test -- decoders

# 3. Start implementing ResistorSVG
# Create: src/components/visualizations/components-svg/ResistorSVG.tsx
```

### Phase 2 - Worker D (Integration)
```bash
# 1. Read integration guide
cat /home/rob/git/pedalpath-v2/visual-overhaul-2026/3-implementation/phase1-decoders/HANDOFF.md

# 2. Test breadboard component
npm run dev
# Navigate to /breadboard-demo

# 3. Start integration
# Update: src/components/visualizations/BreadboardGrid.tsx
```

---

**Last Updated**: 2026-02-16 23:00 UTC
**Current Phase**: Phase 1 Complete ✅ | Phase 2 Ready 🚀
**Test Status**: 156/156 passing (100%)
**Production Status**: Foundation ready, components in progress
