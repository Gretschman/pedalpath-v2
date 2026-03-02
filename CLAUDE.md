# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath.app | https://pedalpath-app.vercel.app

---

## Current Status

Upload bug fixed. Delete projects added. 172 tests passing. Live at pedalpath.app.

**Completed this session (2026-03-02 — session 4):**
- ✅ CRITICAL FIX: analyze-schematic.ts — trim API key (strips CRLF that caused `Headers.append` error + leaked key in response)
- ✅ SECURITY: removed `VITE_ANTHROPIC_API_KEY` fallback; error responses no longer expose raw SDK messages
- ✅ Dashboard: delete project button — two-click confirm (trash icon → Confirm/Cancel)
- ✅ useProjects.ts: deleteProject mutation — deletes bom_items/enclosure_recommendations/power_requirements/schematics in order
- ✅ GitHub issue #28: affiliate links — Tayda, Mouser, StompBoxParts, PedalPartsAndKits
- ✅ _TRASH folder created at _INBOX/../_TRASH for Rob's manual review
- ✅ tools/verify_alignment.py — copied from _INBOX; MB-102 mechanical audit
- ✅ _INBOX audit complete — all new intel captured (see MEMORY.md for details)

**⚠️ ACTION REQUIRED (Rob):** Rotate the Anthropic API key immediately — it was exposed in a screenshot
(console.anthropic.com → API Keys)

**New intel from _INBOX (ready to process):**
- 7 ground-truth BOMs: 1_Knob_Fuzz_V2, ratticus_V1, dart_v2, sunburn_v2, BOMs_All + 3 existing
- New schematics: OKF-v2-2021, SHO-Nuff-v4, Super-Sonic-02, T-AMP 1.1, One Knob Clang 2.0
- Stripe files built in another AI session (create-checkout-session.ts, stripe-webhook.ts) — in _INBOX/pedalpath-v2-main/
- iOS web shell (pedalpath-ios-web-shell-gh) — tokens, components, PWA — for Phase 8
- pedal_factory.py + new "Lego Gold Standard" PRD — physics kernel + rendering overhaul spec
- pedalpath_integration.py — Python component decoder bridge (resistor/capacitor lookup API)

**Next session priority order:**
1. **IMMEDIATE**: Run `python3 tools/populate_ground_truth.py` — 7 BOMs waiting in _INBOX/ground-truth/
2. **IMMEDIATE**: Run `python3 tools/accuracy_test.py` — get baseline scores; review GitHub issues
3. **Fix highest-impact prompt issues** in `api/analyze-schematic.ts` based on discrepancy data
4. **Re-run accuracy tests** — target all circuits ≥85%
5. **Stripe integration** — copy files from _INBOX/pedalpath-v2-main/pedalpath-app/api/ + wire up
6. **New PRD integration** — pedal_factory.py architecture: SVG contact shadows, active grid labels, material-based transistors

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
