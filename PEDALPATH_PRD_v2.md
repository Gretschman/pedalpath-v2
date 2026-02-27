# PedalPath — Product Requirements Document

**Version:** 2.0
**Original:** January 27, 2026
**Revised:** February 26, 2026
**Status:** Active Development — MVP Target: March 17, 2026
**Author:** Rob Frankel

---

## Executive Summary

PedalPath is an AI-powered SaaS platform that turns guitar pedal schematics into LEGO-simple build instructions. Upload a schematic photo → Claude Vision extracts a complete Bill of Materials → the app generates a visual breadboard guide, stripboard guide, and enclosure drilling/wiring diagram — all formatted for a complete beginner.

**Mission:** Make DIY pedal building accessible to anyone who can follow IKEA instructions.

**Tagline:** *"Upload a schematic. Get Lego-simple build instructions in minutes."*

---

## Change Log (v1.0 → v2.0)

| Item | v1.0 (Jan 27) | v2.0 (Feb 26) |
|------|--------------|----------------|
| Primary AI | OpenAI GPT-4 Vision (Claude as fallback) | **Claude Vision (sole AI — no OpenAI)** |
| AI fallback chain | GPT-4V → Claude → Gemini | **Claude Sonnet 4.6 → Opus 4.6 → Haiku 4.5 → legacy Claude models** |
| Layout generation | "Automatic routing algorithm" (planned) | **Static LEGO-style guides generated from BOM data** |
| Stripboard | Text-based instructions | **Full SVG with realistic phenolic board, copper tracks, track cuts** |
| Breadboard | "Automatic routing" | **MB-102/Matrix-5 visual with BOM-placed components** |
| Enclosure | Generic circles | **6 enclosure sizes, 1:1 printable drill templates, collision detection** |
| Wiring diagram | Static 3PDT text grid | **BOM-driven SVG — adapts to passive/active circuits** |
| Passive circuit detection | Not implemented | **Two-layer guard: prompt rules + post-processing** |
| Test coverage | 0 | **168 tests passing (Vitest)** |
| MVP timeline | March 17, 2026 | **March 17–24, 2026 (realistic with remaining work)** |
| Pricing | Free / $9 / $49 | **Unchanged — Free / $9 Pro / $49 Enterprise** |

---

## Problem Statement

1. **Complexity barrier** — Reading schematics requires electronics knowledge most beginners don't have
2. **Layout confusion** — Converting a schematic to a physical breadboard or stripboard is error-prone
3. **Parts sourcing** — Finding the right components at the right suppliers wastes hours
4. **Build failures** — First builds fail because wiring diagrams are hard to follow
5. **Fragmented resources** — Instructions are scattered across forums, PDFs, YouTube, and expensive books

### Target Users

| Segment | Description | Size |
|---------|-------------|------|
| Primary | Beginner DIY pedal builders, ages 18–45, guitar players | ~500K globally |
| Secondary | Intermediate builders wanting faster prototyping | ~200K |
| Tertiary | Music educators, makerspaces, workshop instructors | ~50K |

---

## Competitive Landscape

| Product | Type | Weakness |
|---------|------|----------|
| DIY Layout Creator | Desktop app, manual | Outdated UI, steep learning curve, no AI |
| Fritzing | General electronics | Not pedal-specific, complex |
| PedalPCB | Sells PCBs | Fixed circuits only, no custom schematic support |
| DIYRE | Kits only | No custom builds |
| **PedalPath** | **AI SaaS** | **AI-powered, mobile-first, custom schematics, beginner-focused** |

**Key differentiator:** We are the only tool that takes *any* handwritten or printed schematic and turns it into beginner-safe build instructions automatically.

---

## Feature Specification

### MVP Features (Phase 1)

#### 1. Schematic Upload
- File upload: JPG, PNG, PDF (max 10MB)
- Camera: Take photo directly (mobile)
- Photo roll: Select from device gallery
- Image sent as base64 to Claude Vision API via `/api/analyze-schematic`

**Status:** ✅ Complete — SchematicUpload.tsx + UploadPage.tsx

#### 2. AI Schematic Analysis
- Claude Vision extracts components with symbol + reference designator requirement
- Returns structured JSON: components[], enclosure, power, confidence_score
- Passive circuit guard: strips power recommendation if no active components
- Model fallback chain: Sonnet 4.6 → Opus 4.6 → Haiku 4.5 → legacy models
- Conservative prompt: never invents components, rejects board labels/section names

**Status:** ✅ Complete — `/api/analyze-schematic.ts`

#### 3. Bill of Materials (BOM)
- Full parts list with component type, value, quantity, reference designators
- Editable inline — user can correct AI errors
- Confidence scores per component
- Supplier links (Tayda Electronics)
- CSV/text export
- Enclosure size recommendation
- Power requirements (9V, current draw, polarity)

**Status:** ✅ Complete — BOMTable.tsx + BOMExport.tsx

#### 4. Breadboard Guide (11 Steps)
- LEGO-style step-by-step: power rails → resistors → capacitors → ICs → diodes → transistors → hardware → jacks → LED → footswitch → final test
- MB-102 (830-point) and Matrix-5 (400-point) visual board at accurate scale (24px = 2.54mm)
- Component SVGs placed on board: resistors (color bands), capacitors (electrolytic/film), ICs (DIP with pin labels), diodes (banded), transistors (TO-92 black / TO-18 metal can)
- Step progress tracking (checkboxes)
- "What you need" component list per step

**Status:** ✅ Core complete — Issues #9/#10/#11 open (component visuals in steps)

#### 5. Stripboard Guide
- Component side: warm phenolic brown (#D4A870) with annular pads
- Copper side: brushed copper gradient tracks on dark board
- Track cuts shown as red ✕ with board-colored gap
- 24 columns (A–X) × 25 rows (1–25)
- Scale: 24px = 2.54mm (matches breadboard)

**Status:** ✅ Complete

#### 6. Enclosure Guide
- Six standard sizes: 1590A, 1590B, 125B, 1590N1, 1590BB, 1590DD
- 1:1 printable drill templates with 25mm calibration ruler
- Forbidden zone detection (jacks/DC zone + footswitch zone per enclosure)
- Hardware collision warnings
- Face panel + side panel templates
- BOM-driven wiring diagram:
  - Passive circuits: jacks + PCB + pots/switches only
  - Active circuits: adds 3PDT footswitch, DC jack, LED, ground bus
  - Wire color coded: green=input, blue=output, red=power, black=ground

**Status:** ✅ Complete

#### 7. User Authentication + Project Management
- Supabase Auth: email/password, OAuth (Google, GitHub)
- Sign in / Sign up pages
- Protected routes
- Project creation on upload
- Dashboard with saved projects

**Status:** ✅ Auth complete — Dashboard basic — project history display needs work

#### 8. Demo Content
- Demo page showing full flow without requiring upload
- Current: Tube Screamer clone (wrong/outdated)
- Required: Electra Distortion (simpler, correct, verifiable)

**Status:** ❌ Issue #16 open

---

### Post-MVP Features (Phase 2, Q2 2026)

| Feature | Description | Priority |
|---------|-------------|----------|
| PDF export | Print-ready build guide with all tabs | High |
| Supplier price lookup | Live prices from Mouser, Tayda | Medium |
| Community library | Shared verified builds | Medium |
| Project sharing | Public URL for build guides | Medium |
| PWA / offline | Add-to-home-screen, offline access | Medium |
| AI chatbot | "Why does this value matter?" support | Low |
| 3D component visualization | Interactive 3D placement | Low |
| PCB layout generation | Auto-route PCB (premium) | Low |
| Tone stack calculator | Interactive EQ analysis | Low |
| Build difficulty rating | Auto-score by component count/type | Low |

---

## Pricing Model

### Free Tier
- 3 schematics per month
- All 4 guide types (BOM, breadboard, stripboard, enclosure)
- Standard export (no watermark in MVP — add later)
- Community support

### Pro ($9/month)
- Unlimited schematics
- Priority processing
- PDF export (coming Phase 2)
- Supplier comparison across Tayda, Mouser, Digikey
- Email support

### Enterprise ($49/month)
- Everything in Pro
- API access
- White-label option
- Custom component libraries
- Dedicated support

**Break-even:** 100 Pro users (~Month 6 post-launch)

---

## Success Metrics

### Launch KPIs (March 2026)
- 50 beta users signed up
- 100 schematics processed
- < 30 second processing time (AI response)
- ≥ 90% successful BOM generation (components extracted)
- ≤ 5% crash/error rate on upload flow

### Month 3 KPIs
- 500 monthly active users
- 1,000 schematics processed total
- 75% 30-day retention
- 4.5+ user rating
- 20 paid Pro subscribers

### Month 6 KPIs
- 100 paid Pro subscribers ($900 MRR)
- 3,000 MAU
- Break-even reached

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AI reads components incorrectly | Medium | High | Rigorous prompt v3, passive circuit guard, user-editable BOM |
| Low conversion free→paid | Medium | High | Good free tier UX, gate PDF export on Pro |
| Stripe integration delays MVP | Medium | Medium | Can soft-launch without Stripe, add within 2 weeks |
| Mobile UX is poor | Medium | High | PWA + responsive testing before public launch |
| Schematic copyright complaints | Low | High | ToS: user responsibility, DMCA compliance |
| Claude API costs spike | Low | Medium | Caching, rate limits, freemium caps |

---

# System Architecture (Updated)

**Version:** 2.0 — February 26, 2026

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser / PWA)                  │
│                                                            │
│  React 18 SPA · TypeScript · Vite · Tailwind CSS          │
│                                                            │
│  Routes:                                                   │
│  /              → LandingPage                              │
│  /signin        → SignInPage                               │
│  /signup        → SignUpPage                               │
│  /upload        → UploadPage          [Protected]          │
│  /results/:id   → ResultsPage         [Protected]          │
│  /dashboard     → DashboardPage       [Protected]          │
│  /demo          → DemoPage                                 │
│                                                            │
│  State: React useState/useContext · Supabase Auth hooks    │
│  Icons: Lucide React                                       │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS · Vercel CDN edge network
                        ▼
┌──────────────────────────────────────────────────────────┐
│              API LAYER (Vercel Serverless Functions)       │
│                                                            │
│  POST /api/analyze-schematic   ← Claude Vision call        │
│  POST /api/create-checkout-session ← Stripe checkout       │
│  POST /api/stripe-webhook      ← Stripe event handling     │
│                                                            │
│  [Future]                                                  │
│  POST /api/export-pdf          ← jsPDF build guide         │
│  GET  /api/projects            ← project CRUD              │
└────────┬───────────────────────┬─────────────────────────┘
         │                       │
         ▼                       ▼
┌────────────────┐   ┌───────────────────────────────────┐
│  Claude Vision │   │         Supabase Backend           │
│  API           │   │                                    │
│                │   │  PostgreSQL (RLS enabled):         │
│  Model chain:  │   │  • projects                        │
│  Sonnet 4.6    │   │  • schematics                      │
│  Opus 4.6      │   │  • bom_items                       │
│  Haiku 4.5     │   │  • build_steps                     │
│  (+ legacy)    │   │  • subscriptions                   │
│                │   │                                    │
│  Max tokens:   │   │  Auth: Supabase Auth (email/OAuth) │
│  4096          │   │  Storage: schematics + exports     │
└────────────────┘   └───────────────────────────────────┘
                              │
                              ▼
                     ┌──────────────┐
                     │   Stripe     │
                     │   Payments   │
                     │  (pending)   │
                     └──────────────┘
```

---

## Frontend Component Tree

```
App.tsx
├── LandingPage.tsx           ← Marketing + "Get Started" CTA
├── SignInPage.tsx            ← Email/OAuth sign in
├── SignUpPage.tsx            ← Registration
├── DashboardPage.tsx         ← Project list + "New Build" button
├── UploadPage.tsx            ← Drag/drop + camera + file upload
│   └── SchematicUpload.tsx   ← Upload UI component
├── ResultsPage.tsx           ← Post-analysis 4-tab view
│   ├── BOMTable.tsx          ← Editable component list
│   ├── BOMExport.tsx         ← CSV / text export
│   ├── BreadboardGuide.tsx   ← 11-step build guide
│   │   ├── BreadboardBase.tsx     ← MB-102 / Matrix-5 SVG board
│   │   ├── BomBreadboardView.tsx  ← Components placed on board
│   │   └── components-svg/
│   │       ├── ResistorSVG.tsx    ← Color band rendering
│   │       ├── CapacitorSVG.tsx   ← Electrolytic / film
│   │       ├── ICSVG.tsx          ← DIP package + pin labels
│   │       ├── DiodeSVG.tsx       ← Banded diode
│   │       ├── TransistorSVG.tsx  ← TO-92 / TO-18 packages
│   │       └── WireSVG.tsx        ← Jumper wires
│   ├── StripboardGuide.tsx   ← Phenolic board + copper view
│   │   └── StripboardView.tsx
│   └── EnclosureGuide.tsx    ← Drill templates + wiring diagram
├── DemoPage.tsx              ← Demo without upload (Electra Distortion)
└── Navbar.tsx                ← Auth state + navigation
```

---

## AI Pipeline (Current)

```
User uploads image (JPG/PNG/PDF)
        │
        ▼
UploadPage → base64 encode image
        │
        ▼
POST /api/analyze-schematic
        │
        ├─ Validate: image_base64, image_type present
        ├─ Validate: image type in [jpeg, png, webp, gif]
        ├─ Read ANTHROPIC_API_KEY from environment
        │
        ▼
Claude Vision API call
  SYSTEM: "Expert electronics engineer. Rigorous: never invent components,
           never misidentify text labels or PCB names as components."
  USER:   Structured prompt requiring:
          • Schematic SYMBOL + reference designator (both required)
          • NOT-A-COMPONENT list (board names, revision, section labels)
          • Reference designator guide (R/C/Q/U/P/SW/J)
          • Grouping only when values clearly identical
          • Value disambiguation (1k vs 1M, nF vs pF, etc.)
          • Enclosure sizing rules (1590A→1-2 controls … 1590DD→7+)
          • Power: only for active circuits (Q/U/IC present)
        │
        ▼
JSON parse + cleanup
  ├─ Extract JSON from possible markdown wrapper
  ├─ Passive circuit guard:
  │    if no (transistor | ic | op-amp) in components → delete power field
  └─ Validate: components array not empty
        │
        ▼
Return { success, bom_data, raw_response }
        │
        ▼
ResultsPage: 4-tab display
  Tab 1: BOM (editable table)
  Tab 2: Breadboard Guide (11 steps)
  Tab 3: Stripboard Guide
  Tab 4: Enclosure Guide (drill templates + wiring diagram)
```

---

## Database Schema (Supabase PostgreSQL)

```sql
projects        — id, user_id, title, status, created_at
schematics      — id, project_id, image_url, status, created_at
bom_items       — id, schematic_id, component_type, value, quantity,
                   reference_designators[], part_number, supplier,
                   supplier_url, confidence, verified, notes
build_steps     — id, project_id, step_number, title, description,
                   image_url, completed
subscriptions   — (Stripe integration — schema TBD)
```

All tables: RLS enabled, users can only access their own data.

---

## Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend framework | React 18 + TypeScript | ✅ |
| Build tool | Vite 7.3 | ✅ |
| Styling | Tailwind CSS | ✅ |
| Routing | React Router v6 | ✅ |
| Icons | Lucide React | ✅ |
| Testing | Vitest | ✅ 168 tests |
| Hosting | Vercel | ✅ |
| Database | Supabase PostgreSQL | ✅ |
| Auth | Supabase Auth | ✅ |
| File storage | Supabase Storage | ✅ |
| AI | Claude Vision (Anthropic) | ✅ |
| Payments | Stripe | ⚠️ Partial |
| Error tracking | Sentry | ❌ Not set up |
| Analytics | Vercel Analytics | ❌ Not enabled |
| PDF export | jsPDF | ❌ Not built |
| PWA | Service worker | ❌ Not built |

---

# Master Build Checklist

## Phase 0 — Foundation ✅ COMPLETE (Jan 27 – Feb 4, 2026)

- [x] Repo created: github.com/Gretschman/pedalpath-v2
- [x] React 18 + TypeScript + Vite + Tailwind project scaffolded
- [x] Vercel deployment configured (vercel.json with SPA catch-all)
- [x] Supabase project created + environment variables configured
- [x] Database schema designed and applied (projects, schematics, bom_items, build_steps)
- [x] Row Level Security (RLS) policies configured
- [x] GitHub Actions / Vercel auto-deploy on push
- [x] `.env.local` + secrets management (`/home/rob/.pedalpath_env`)
- [x] CLAUDE.md written with project conventions

---

## Phase 1 — Authentication ✅ COMPLETE (Feb 4–10, 2026)

- [x] Supabase Auth integration
- [x] Sign In page (email + OAuth structure)
- [x] Sign Up page with validation
- [x] AuthContext + useAuth hook
- [x] ProtectedRoute component
- [x] Navbar with auth state (sign in / sign out)
- [x] Redirect after login to /upload
- [x] Session persistence (Supabase handles this)

---

## Phase 2 — AI Pipeline ✅ COMPLETE (Feb 10–16, 2026)

- [x] Vercel serverless function: `/api/analyze-schematic.ts`
- [x] Claude Vision API integration (Anthropic SDK)
- [x] Model fallback chain (Sonnet 4.6 → Opus → Haiku → legacy)
- [x] Structured JSON prompt (v3 — rigorous component rules)
- [x] SYSTEM_PROMPT: conservative, rejects labels/board names
- [x] NOT-A-COMPONENT explicit list in prompt
- [x] Reference designator guide in prompt
- [x] Grouping rules (only when clearly identical values)
- [x] Value disambiguation warnings (1k/1M, nF/pF)
- [x] Enclosure sizing logic (1590A → 1590DD)
- [x] Post-processing passive circuit guard
- [x] JSON parse with markdown wrapper cleanup
- [x] CORS headers configured
- [x] SchematicUpload.tsx (camera + file upload UI)
- [x] UploadPage.tsx (creates project in DB, calls API, navigates to results)
- [x] ResultsPage.tsx (4-tab display)
- [x] base64 image encoding client-side

---

## Phase 3 — BOM System ✅ COMPLETE (Feb 16–20, 2026)

- [x] BOMTable.tsx — editable component grid
- [x] Inline editing (click to edit value, quantity, notes)
- [x] Confidence score display per component
- [x] Verified toggle
- [x] Supplier link column (Tayda)
- [x] Enclosure info panel
- [x] Power requirements panel
- [x] BOMExport.tsx — CSV + text export
- [x] Component type icons/badges
- [x] Grouping by component type

---

## Phase 4 — Visual Components ✅ COMPLETE (Feb 20–24, 2026)

### Component SVGs
- [x] ResistorSVG.tsx — E12/E24 color band decoding (61 tests)
- [x] CapacitorSVG.tsx — electrolytic vs film/ceramic (60 tests)
- [x] ICSVG.tsx — DIP-N with pin count + notch indicator
- [x] DiodeSVG.tsx — glass body with cathode band
- [x] TransistorSVG.tsx — TO-92 (black D-shape) + TO-18 (metal can)
- [x] WireSVG.tsx — colored jumper wires

### Breadboard Visualization
- [x] BreadboardBase.tsx — MB-102 (830-point) + Matrix-5 (400-point)
- [x] Scale: 24px = 2.54mm (verified to physical spec)
- [x] Power rails: Matrix-5 pattern (group-of-5), 50 holes/rail
- [x] Terminal strip alignment (9/9 tests pass)
- [x] Power rail alignment (6/6 tests pass)
- [x] BomBreadboardView.tsx — BOM → placed components on board
- [x] 168 tests total passing (Vitest)

### Stripboard Visualization
- [x] StripboardView.tsx — 24col × 25row board
- [x] Component side: phenolic brown, annular copper pads
- [x] Copper side: brushed copper gradient tracks
- [x] Track cuts: red ✕ marker + board-colored gap
- [x] Scale matches breadboard (24px = 2.54mm)

### Enclosure Guide
- [x] All 6 enclosure sizes: 1590A, 1590B, 125B, 1590N1, 1590BB, 1590DD
- [x] Accurate mm dimensions per size
- [x] Forbidden zone rendering (jacks/DC zone + footswitch zone)
- [x] Hardware collision detection + warning message
- [x] 1:1 scale drill templates (25mm calibration ruler)
- [x] Face panel + side panel templates
- [x] Drilling order list (safe sequence)
- [x] Wire connections list

### Offboard Wiring Diagram
- [x] BOM-driven SVG (960px wide)
- [x] Passive circuits: jacks + PCB + pots/switches (no footswitch/DC/LED)
- [x] Active circuits: 3PDT footswitch + DC jack + LED + full wiring
- [x] PCB always centered with IN/OUT/GND pads (+9V if active)
- [x] Jacks vertically aligned with PCB mid
- [x] Pots/switches as labeled boxes above PCB with wire connections
- [x] Ground bus at bottom
- [x] Wire color legend (hides Red for passive circuits)

---

## Phase 5 — Build Guides ✅ MOSTLY COMPLETE (Feb 24–26, 2026)

### Breadboard Guide
- [x] 11-step LEGO-style guide generated from BOM
- [x] Step descriptions + component lists
- [x] Step progress tracking (checkboxes)
- [x] Board visual updates as steps complete
- [ ] **#9** — Transistor visual reference in "What You Need" section
- [ ] **#10** — Realistic component overlays on breadboard (not tiny shapes)
- [ ] **#11** — Component visuals in "What You Need" for steps 4–11

### Stripboard Guide
- [x] Component placement instructions
- [x] Track cut instructions
- [x] Wire link instructions
- [x] Component side + copper side toggle

### Enclosure Guide
- [x] All above (Phase 4 complete)
- [x] Build checklist (5-step final assembly sequence)

---

## Phase 6 — Demo Content ⚠️ IN PROGRESS

- [x] DemoPage.tsx scaffolded with 4-tab layout
- [x] Sample Tube Screamer BOM data
- [ ] **#16** — Replace Tube Screamer with Electra Distortion
  - Electra Distortion: 1× transistor (2N5088 or BC109), 4× R, 2× C, 1× D (clipping), 1× D (protection), 1× pot, jacks
  - Simpler circuit → easier to verify → better demo
  - Must be fully correct (components, values, wiring)

---

## Phase 7 — Payments ❌ NOT STARTED

- [ ] Install Stripe SDK: `npm install stripe`
- [ ] Complete `/api/create-checkout-session.ts`
- [ ] Complete `/api/stripe-webhook.ts`
- [ ] Stripe webhook secret configured in Vercel env
- [ ] `subscriptions` table in Supabase (user_id, stripe_customer_id, plan, status, period_end)
- [ ] Free tier enforcement: count uploads per user per month, block at 3
- [ ] Upgrade prompt modal when free limit hit
- [ ] Pro tier: skip limit check for subscribed users
- [ ] PricingModal.tsx: connect to real Stripe checkout
- [ ] Post-payment: update subscription in DB via webhook
- [ ] Customer portal link (Stripe billing portal)

---

## Phase 8 — Mobile / PWA ❌ NOT STARTED

- [ ] **#4** — iOS/mobile optimization
- [ ] PWA manifest.json (name, icons, theme color)
- [ ] Service worker registration
- [ ] "Add to Home Screen" prompt
- [ ] iOS Safari safe area handling (env(safe-area-inset-*))
- [ ] Touch target sizing (44px minimum per Apple HIG)
- [ ] No hover-only states (touch devices)
- [ ] Responsive test: iPhone 14 (390px), iPad 10.9" (820px), Desktop (1440px)
- [ ] Camera permission handling (iOS requires user gesture)
- [ ] Offline: cache static assets + demo page

---

## Phase 9 — Production Readiness ❌ NOT STARTED

- [ ] Rate limiting on `/api/analyze-schematic` (e.g., 10 req/min per IP)
- [ ] Image validation: reject files > 10MB, enforce type allowlist
- [ ] Error tracking: Sentry DSN configured
- [ ] Vercel Analytics enabled
- [ ] CSP (Content Security Policy) headers
- [ ] GDPR compliance: privacy policy page, cookie consent
- [ ] ToS page
- [ ] Email: transactional emails (welcome, receipt) via Resend or SendGrid
- [ ] 404 page
- [ ] Error boundary components (React error boundaries)
- [ ] Loading states / skeleton screens
- [ ] Retry logic for failed API calls

---

## Phase 10 — Beta Launch ❌ NOT STARTED

- [ ] Landing page copy finalized + SEO meta tags
- [ ] OG image for social sharing
- [ ] Favicon + app icons (all sizes)
- [ ] Beta invite system OR open registration
- [ ] Onboarding: first-time user tooltip tour
- [ ] Help/FAQ page
- [ ] Feedback widget (Canny or Sentry Feedback)
- [ ] Internal test: process 20 different schematics end-to-end
- [ ] Load test: 50 concurrent users
- [ ] Private beta: 20–50 invited users from DIY pedal communities
- [ ] Collect feedback, fix critical bugs (1 week)
- [ ] **Public launch**

---

## Phase 11 — Post-MVP / Phase 2 ❌ FUTURE

- [ ] PDF build guide export (jsPDF)
- [ ] Supplier price lookup (Tayda/Mouser APIs)
- [ ] Project sharing (public URL)
- [ ] Community library of verified builds
- [ ] Shared build links
- [ ] AI chatbot ("Why is this resistor value important?")
- [ ] 3D component visualization
- [ ] PCB layout generation (premium)
- [ ] Build difficulty auto-scoring
- [ ] Multiple language support
- [ ] Build video export (annotated MP4)
- [ ] Tone stack calculator integration

---

# Current Status & Timeline

**Today: February 26, 2026**
**Original MVP target: March 17, 2026 (19 days)**

## What is DONE ✅

All foundation, auth, AI pipeline, BOM system, all visual components,
breadboard/stripboard/enclosure guides, offboard wiring diagram,
passive circuit detection — **168 tests passing, deployed to Vercel.**

The core product loop works:
- User signs up ✅
- User uploads schematic ✅
- Claude Vision analyzes it ✅
- BOM is generated and displayed ✅
- Breadboard, stripboard, enclosure guides render ✅

## What Remains ❌

| Task | Phase | Estimated Sessions | Blocks Launch? |
|------|-------|-------------------|----------------|
| Demo page: Electra Distortion (#16) | 6 | 1 | Yes — demo is broken |
| Breadboard component overlays (#10) | 5 | 2–3 | No (soft) |
| Component visuals in steps (#11) | 5 | 1–2 | No (soft) |
| Transistor visual reference (#9) | 5 | 1 | No (soft) |
| Stripe payments | 7 | 3–4 | Soft — can soft-launch free |
| Free tier enforcement (3/month) | 7 | 1 | Yes for monetization |
| Mobile/PWA (#4) | 8 | 2–3 | Yes — users are on mobile |
| Rate limiting + image validation | 9 | 1 | Yes for production safety |
| Error tracking (Sentry) | 9 | 0.5 | No |
| Landing page SEO | 10 | 1 | Yes for launch |
| Onboarding / help content | 10 | 1–2 | Yes (UX) |
| Internal end-to-end testing | 10 | 1 | Yes |
| Beta invite + feedback loop | 10 | ongoing | Yes |

## Revised Timeline

```
Week 1   Feb 26 – Mar 4    Demo fix + Breadboard overlays (#9/#10/#11/#16)
Week 2   Mar 5  – Mar 11   Stripe + Free tier + Mobile/PWA
Week 3   Mar 12 – Mar 17   Production hardening + landing page + testing
Week 4   Mar 17 – Mar 24   Private beta (20–50 users) → collect feedback
Week 5   Mar 24 – Mar 31   Bug fixes from beta feedback
Week 6   Apr 1             🚀 PUBLIC LAUNCH
```

**Revised public launch: April 1, 2026** (2 weeks after original target).
Private beta on schedule for March 17.

## Where We Are

```
Phase 0  Foundation         ████████████████████ 100%
Phase 1  Authentication     ████████████████████ 100%
Phase 2  AI Pipeline        ████████████████████ 100%
Phase 3  BOM System         ████████████████████ 100%
Phase 4  Visual Components  ████████████████████ 100%
Phase 5  Build Guides       ████████████████░░░░  80%  (overlays pending)
Phase 6  Demo Content       ████████████░░░░░░░░  60%  (#16 pending)
Phase 7  Payments           ░░░░░░░░░░░░░░░░░░░░   0%
Phase 8  Mobile / PWA       ░░░░░░░░░░░░░░░░░░░░   0%
Phase 9  Production Ready   ░░░░░░░░░░░░░░░░░░░░   0%
Phase 10 Beta Launch        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 11 Phase 2 Features   ░░░░░░░░░░░░░░░░░░░░   0%
─────────────────────────────────────────────────────
OVERALL                     ████████████░░░░░░░░  55%  (to public launch)
```

---

## Open GitHub Issues

| # | Title | Blocks Launch? |
|---|-------|---------------|
| #2 | Realistic stripboard with component overlays | No (Phase 2) |
| #4 | iOS / PWA optimization | Yes |
| #9 | Transistor visual missing in breadboard guide | No (soft) |
| #10 | Breadboard component overlays not realistic | No (soft) |
| #11 | Component visuals missing from build steps 4–11 | No (soft) |
| #15 | Major visual bugs + reference materials | In progress (most resolved) |
| #16 | Demo project broken — replace with Electra Distortion | Yes |

---

*Document Owner: Rob Frankel*
*Last Updated: February 26, 2026*
*Next Review: March 17, 2026 (beta launch checkpoint)*
