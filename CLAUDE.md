# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath.app | https://pedalpath-app.vercel.app

---

## Current Status

Accuracy testing pipeline complete. Migration 006 live. 172 tests passing. Live at pedalpath.app.

**Completed this session (2026-02-27 — session 3):**
- ✅ Migration 006: 5 new tables — reference_circuits, reference_bom_items, supplier_links, accuracy_test_runs, accuracy_discrepancies
- ✅ tools/accuracy_test.py — scores Claude Vision BOM output vs reference; auto-files GitHub issues for <85%
- ✅ tools/populate_ground_truth.py — seeds reference BOMs from JSON files in _INBOX/ground-truth/
- ✅ tools/populate_supplier_links.py — upserts Tayda/Mouser URLs from supplier_links.json
- ✅ api/supplier-links.ts — GET /api/supplier-links?type=X&value=Y → Tayda+Mouser links
- ✅ BOMTable.tsx — [T]/[M] supplier badge links per row (orange=Tayda, blue=Mouser, grey=not found)
- ✅ Plan doc saved to _OUTPUT/PedalPath_AccuracyTestingPlan_2026-02-27.md

**BLOCKING — needs you before next session (free tier, no Claude Code):**
1. **Track B** — Run ChatGPT/Gemini on 4 PDFs → JSON BOMs → `_INBOX/ground-truth/*.json` → run `populate_ground_truth.py`
2. **Track C** — Run ChatGPT-4o Browse for 160 supplier URLs → `_INBOX/ground-truth/supplier_links.json` → run `populate_supplier_links.py`
3. Prompts for both are in `_OUTPUT/PedalPath_AccuracyTestingPlan_2026-02-27.md`

**Next session priority order (once B+C complete):**
1. **Run `python3 tools/accuracy_test.py`** — get baseline scores for 4 circuits; review GitHub issues filed
2. **Fix highest-impact prompt issues** in `api/analyze-schematic.ts` based on discrepancy data
3. **Re-run accuracy tests** — confirm improvement; target all 4 circuits ≥85%
4. **Decide pricing model** — Free-only launch vs Free+Paid (deferred, discuss with Rob)
5. **Stripe integration** — products/prices/env vars/checkout flow/success page

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
- `start_session.sh` — runs all sync tools + git status before starting Claude Code

---

## Rules

- Co-author all commits: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Every new tool: add one line to **Tools Available** above immediately after creation
- Tool secrets: load from `/home/rob/.pedalpath_env` via python-dotenv
- Tool output: `docs/generated/` (not committed to git)
- Never commit `.env.local` or `.pedalpath_env`
