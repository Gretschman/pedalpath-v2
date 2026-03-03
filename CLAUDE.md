# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath.app | https://pedalpath-app.vercel.app

---

## Current Status

**Session 7 complete (2026-03-03). 172 tests passing. Live at pedalpath.app.**

**Completed session 7:**
- ✅ GT1–GT19 ground truth pipeline — 18 new JSON files, DB now 51 circuits / 967 components
- ✅ Accuracy tested: 19/31 circuits ≥85% (8 new circuits pass immediately on first run)
- ✅ Fixed page_number bug — ground truth JSON must use `"page_number"` not `"page"`
- ✅ 1590A enclosure spec added to `enclosure-drill-templates.ts` — confirmed from FuzzDog build guide
  - Face 35×78mm; footswitch Y=66mm; DC on north end Y=18mm; jacks east/west at 34mm & 45mm
- ✅ build_guide_1590A.pdf studied (13 pages) — all measurements extracted + EAST_WEST_JACKS_1590A
- ✅ HOLE_MM constants corrected from canonical drill guide: dc_barrel 8→12mm, led_5mm 7.9→5.1mm, led_3mm 6.35→3.2mm
- ✅ Tayda SKUs indexed (memory/tayda_and_drill.md) — vetted pot/cap/resistor SKUs for BOM shopping

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
1. **Accuracy failures** — investigate Aeon Drive (61.5%), Buff N Blend (64.7%), Black Dog (79.3%);
   re-test WattAmp + Three Time Champ (gt3/gt7 PDFs, sync timing issue on last run)
2. **iOS Phase 8** — integrate `_INBOX/pedalpath-ios-web-shell-gh/` design tokens + native-feel UI
3. **Phase 4 sidebar CollisionAlert** — `src/components/sidebar/CollisionAlert.tsx`
4. **1590A EnclosureGuide** — wire up 1590A spec + east/west jacks in EnclosureGuide.tsx

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
