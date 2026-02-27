# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath-app.vercel.app | https://pedalpath-v2.vercel.app

---

## Current Status

Phase 2 complete + visual overhaul complete. 168 tests passing. Deployed to pedalpath-app.vercel.app.
Domain purchased: **pedalpath.app** — configure as custom domain in Vercel next session.

**Completed this session (2026-02-26):**
- ✅ Issue #16 — Electra Distortion demo (verified BOM: 4R/2C/1Q/2D/1VR)
- ✅ Issue #10 — Board dimming: focusComponentTypes prop, step-aware 15% opacity
- ✅ Issue #11 — ComponentThumbnail uses real values + correct resistor color bands (120×56px)
- ✅ PRD v2.0 — PEDALPATH_PRD_v2.md committed to repo
- ✅ Resources organized — drill templates + offboard wiring copied to _REFERENCE
- ✅ Issues #19, #20 created (knowledge base: drill templates + wiring as AI teachers)

**Next session priority order:**
1. **Configure pedalpath.app custom domain** in Vercel dashboard (takes 5 min)
2. **Decide pricing model** — Free-only launch vs Free+Paid at launch (discuss with Rob)
3. **Stripe integration** — products/prices/env vars/checkout flow/success page
4. **Issue #9** — Transistor visual reference in breadboard guide steps
5. AI passive-circuit detection — verify fix is still working

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
