# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath-app.vercel.app | https://pedalpath-v2.vercel.app

---

## Current Status

Phase 2 complete (168 tests passing). Visual output unacceptable — full rewrite required (Issue #15).

**Priority order:**
1. Breadboard rewrite — BreadboardGuide.tsx, TransistorSVG, realistic sizing, offboard components
2. Stripboard rewrite — StripboardGuide.tsx, tagboardeffects.com style
3. Enclosure drill templates — all 1590-series, Tayda flat-pack format
4. Offboard wiring diagram — jacks/pot/LED/3PDT step
5. AI accuracy — passive circuit detection (no IC/transistor → no 9V recommendation)

**DO NOT** start Stripe until visual issues resolved.

**Reference images**: /mnt/c/Users/Rob/Dropbox/!PedalPath/Upload to Claude COde/2b Uploaded to Claude Code/Updates 02.22.26/

---

## Commands

```bash
cd /home/rob/pedalpath-v2/pedalpath-app
npm test -- --run    # run all tests
npm run build        # TypeScript check
npm run dev          # localhost:5174
vercel --prod --yes  # deploy
```

---

## Key Paths

- App source: `pedalpath-app/src/`
- Component SVGs: `src/components/visualizations/components-svg/`
- Decoders: `src/utils/decoders/`
- Tests: `src/utils/**/__tests__/`
- Upload queue: `upload-queue/` (Windows: `\\wsl.localhost\Ubuntu\home\rob\pedalpath-v2\upload-queue`)
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
