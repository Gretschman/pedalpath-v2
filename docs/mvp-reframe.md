# MVP Reframe Instructions

## New MVP Definition
Core product: schematic image in → BOM out, displayed as a single visual
reference sheet styled like a LEGO instruction manual. Component
pictures/renderings, quantities, and values on one page. Print-friendly.

## What Is DEFERRED (post-revenue)
- Breadboard build guides
- Step-by-step visual layout / placement guides
- Stripboard layouts
- Mobile responsiveness (Phase 3)
- IC/Diode decoder stubs

## Priority Order (replace whatever is currently listed)
1. Apply DB migrations 008 + 009 in Supabase
2. Set 8 Stripe env vars on both Vercel deployments
3. Register Stripe webhook at /api/stripe-webhook
4. Wire credit gate into UploadPage (uncomment 2 lines)
5. Delete BreadboardGrid.tsx
6. Fix 658KB bundle split

## Key Facts That Must Be Preserved
- Desktop-first (Windows Chrome/Edge, macOS Safari/Chrome)
- Both Vercel deployments: pedalpath-v2.vercel.app + pedalpath-app.vercel.app
- Sprite-library + decorator architecture model
- 172 tests passing, migrations 001-007 applied
