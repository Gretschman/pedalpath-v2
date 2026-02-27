# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath.app | https://pedalpath-app.vercel.app

---

## Current Status

Phase 2 complete + visual overhaul complete. 172 tests passing. Live at pedalpath.app.

**Completed this session (2026-02-27 — session 2):**
- ✅ Issue #21 — Clipboard paste: Ctrl+V anywhere captures schematic from clipboard
- ✅ Issue #4 — PWA/iOS: manifest.json, icon.svg, viewport-fit=cover, OG/Twitter meta, apple-mobile-web-app-*
- ✅ Issue #26 — BOM flagging: Flag button per component, Submit Report → component_corrections table, migration 004
- ✅ Issue #2 — Stripboard visualization: generateStripboardLayout() + component overlays (transistor/resistor/cap/diode)
- ✅ Closed GitHub issues: #2, #4, #15, #21, #26 (also #9, #22, #24, #25 carried from session 1)
- ✅ Resource library indexed to memory files (reference-library.md in .claude/projects memory)

**Next session priority order:**
1. **Decide pricing model** — Free-only launch vs Free+Paid (deferred, discuss with Rob)
2. **Stripe integration** — products/prices/env vars/checkout flow/success page
3. **Run migration 004** — Apply 004_component_corrections.sql in Supabase dashboard
4. **Issue #18, #19, #20** — Close as informational (no code work needed)

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
- `start_session.sh` — runs all sync tools + git status before starting Claude Code

---

## Rules

- Co-author all commits: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Every new tool: add one line to **Tools Available** above immediately after creation
- Tool secrets: load from `/home/rob/.pedalpath_env` via python-dotenv
- Tool output: `docs/generated/` (not committed to git)
- Never commit `.env.local` or `.pedalpath_env`
