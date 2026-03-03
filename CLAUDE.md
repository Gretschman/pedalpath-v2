# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath.app | https://pedalpath-app.vercel.app

---

## Current Status

**Sessions 4 & 5 complete (2026-03-02). 172 tests passing. Live at pedalpath.app.**

**Completed sessions 4 & 5:**
- ✅ Reset password page (`/reset-password`) — Supabase PASSWORD_RECOVERY flow
- ✅ Stripe integration — code deployed, quota gate disabled for beta (all uploads free until launch)
- ✅ DB migrations 001–006 live in production; subscriptions + payment_transactions tables seeded
- ✅ LEGO references removed (3 occurrences across codebase)
- ✅ Germanium transistor detection — `material:"Ge"` → TO-18 Metal Can SVG
- ✅ Transistor pinout protection — PINOUT_MAP for 20+ transistors, orientation diagram in step 3
- ✅ ComponentGallery — visual grid of all BOM components with SVG, type badge, quantity, ID hint
- ✅ SVG depth filters — holeBevel on holes, componentShadow on placed components
- ✅ Active grid labels — current step's column/row shown bold in breadboard
- ✅ Step thumbnails enlarged to 120×64px with shadow and quantity badge
- ✅ Ground truth pipeline — 32 circuits, 554 components across 8 JSON files
- ✅ BOM accuracy: all circuits ≥85% (Stratoblaster 59%→90%, Sunburn 57%→85%)
- ✅ Prompt improvements: Rule 0 OVERRIDE (taper prefix = pot), European notation, pot label rule

**⚠️ ACTION REQUIRED (Rob):** Ask your company engineer to rotate the Anthropic API key
— it was exposed in a screenshot. Generate new key at console.anthropic.com → API Keys.

**When ready to charge (Stripe):**
Set these 5 env vars in Vercel Dashboard, then register the webhook:
1. `STRIPE_SECRET_KEY` — Stripe Dashboard → Developers → API keys
2. `STRIPE_WEBHOOK_SECRET` — Stripe Dashboard → Webhooks (after creating endpoint)
3. `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → service_role
4. `VITE_APP_URL` = `https://pedalpath.app`
5. `VITE_STRIPE_PRO_PRICE_ID` — Stripe Dashboard → Product catalog
Webhook endpoint: `https://pedalpath.app/api/stripe-webhook`
To re-enable quota at launch: uncomment 2 clearly marked lines in `src/pages/UploadPage.tsx`

**Next session priority order:**
1. **Phase 4 — Collision & Safety** — enclosure boundaries, forbidden zones, proactive alerts
   - Create `src/utils/enclosure-boundaries.ts` and `src/components/sidebar/CollisionAlert.tsx`
   - 125B: 62.7×118mm; 1590B: 60.3×94mm; forbidden Y<25mm (jacks), Y>95mm (footswitch)
2. **iOS Phase 8** — integrate `_INBOX/pedalpath-ios-web-shell-gh/` design tokens + native-feel UI
3. **New ground truth circuits** — add BOMs for: OKF-v2, SHO-Nuff-v4, Super-Sonic-02, T-AMP 1.1, One Knob Clang 2.0
   - Source PDFs/docs are in `_INBOX/`

**Reference images**: /mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE/

---

## Commands

```bash
cd /home/rob/pedalpath-v2/pedalpath-app
npm test -- --run    # run all tests
npm run build        # TypeScript check
npm run dev          # localhost:5173
vercel --prod --yes  # deploy
```

---

## Key Paths

- App source: `pedalpath-app/src/`
- Component SVGs: `src/components/visualizations/components-svg/`
- Decoders: `src/utils/decoders/`
- Tests: `src/utils/**/__tests__/`
- Upload queue / Inbox: `/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX` (drop files here from Windows)
- Reference library: `/mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE/` — breadboard-specs/, transistor-reference/, offboard-wiring/, drill-templates/, circuit-library/, demo-circuits/
- Session docs: `docs/generated/session_log.md`

---

## Tools Available

- `tools/check_prereqs.py` — checks all dev prerequisites
- `tools/sync_github_issues.py` — pulls open GitHub issues → docs/generated/issues_current.md
- `tools/sync_upload_queue.py` — scans upload-queue/, extracts previews → docs/generated/session_manifest.md
- `tools/session_end.py` — stages, commits, pushes at session end (interactive or -m "msg")
- `tools/export_doc.py` — converts markdown → .docx with Rob's header/footer spec
- `tools/sync_supabase_schema.py` — dumps live Supabase schema → docs/generated/supabase_schema.sql
- `tools/populate_ground_truth.py` — seeds reference_circuits + reference_bom_items from _INBOX/ground-truth/*.json
- `tools/populate_supplier_links.py` — upserts supplier_links from _INBOX/ground-truth/supplier_links.json
- `tools/accuracy_test.py` — runs BOM accuracy tests against reference circuits; files GitHub issues for <85% scores
- `tools/verify_alignment.py` — MB-102 mechanical audit: verifies coordinate-to-grid mapping + Matrix-5 power rail positions
- `start_session.sh` — runs all sync tools + git status before starting Claude Code

---

## Rules

- Co-author all commits: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Every new tool: add one line to **Tools Available** above immediately after creation
- Tool secrets: load from `/home/rob/.pedalpath_env` via python-dotenv
- Tool output: `docs/generated/` (not committed to git)
- Never commit `.env.local` or `.pedalpath_env`
