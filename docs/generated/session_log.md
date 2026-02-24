# Session Log — 2026-02-24

## What We Accomplished
- Rewrote CLAUDE.md from ~2500 tokens down to ~310 tokens (lean version)
- Built tools/sync_github_issues.py — pulls 7 open issues → docs/generated/issues_current.md
- Built tools/sync_upload_queue.py — scans upload-queue/, extracts docx previews → docs/generated/session_manifest.md
- Built start_session.sh — orchestrates both sync tools + git status at session start
- Added docs/generated/ to .gitignore (generated output never committed)
- Fixed PyGithub deprecation warning (Auth.Token)

## What Is Next
- Build session_end.py — updates session_log.md, stages new tools, commits, pushes
- Build export_doc.py — generates .docx with Rob's header/footer spec

## Key Paths
- Repo: /home/rob/pedalpath-v2
- Upload queue: /home/rob/pedalpath-v2/upload-queue
- Secrets: /home/rob/.pedalpath_env
- Tools: /home/rob/pedalpath-v2/tools/
- Generated output: /home/rob/pedalpath-v2/docs/generated/ (not committed)

## Session Startup (use every session)
```bash
cd /home/rob/pedalpath-v2
bash start_session.sh
claude
```
Then open with: `Read docs/generated/session_log.md`

## Tools Built So Far
- tools/check_prereqs.py — 21/21 checks
- tools/sync_github_issues.py — GitHub issues → issues_current.md
- tools/sync_upload_queue.py — upload queue scan → session_manifest.md
- start_session.sh — runs all of the above

## Planned Tools Library

### Tier 1 — Build Next Session
- session_end.py — updates session_log.md, commits new tools, pushes
- export_doc.py — generates .docx with Rob's exact header/footer spec
- summarize_session.py — reads Dev Sessions Fathom exports, extracts decisions and next steps, writes to session_log.md

### Tier 2 — Build Soon
- new_project_scaffold.py — creates complete new project structure in one command (reusable for VeloQuote etc.)
- export_meeting_notes.py — formats Fathom transcript exports as structured docx with action items extracted
- sync_vercel_status.py — pulls Vercel deployment status to docs/generated/deploy_status.md
- lint_claude_md.py — counts tokens in CLAUDE.md, warns if over 400, flags bloat patterns

### Tier 3 — Build When Needed
- generate_changelog.py — reads git log between commits, formats as changelog entry
- export_bom_csv.py — exports PedalPath BOM JSON from Supabase to formatted CSV/Excel
- check_supabase_health.py — pings Supabase, checks row counts, writes to docs/generated/db_health.md
- archive_old_sessions.py — moves Dev Sessions docs older than 30 days to dated archive subfolder
- generate_component_reference.py — reads src/utils/decoders/ and generates human-readable component reference md

### Tier 4 — Cross-Project (VeloQuote + PedalPath)
- export_linkedin_post.py — takes transcript or summary, generates LinkedIn post draft in Rob's voice
- sync_medium_drafts.py — flags which VeloQuote transcripts haven't been turned into Medium articles yet
- project_status_report.py — reads session_log, issues, deploy_status and generates weekly one-page status docx

## Tool Building Rules
- Every new tool gets one line added to CLAUDE.md Tools Available section immediately after creation
- Tools that read secrets use /home/rob/.pedalpath_env via python-dotenv
- All output files go to docs/generated/ (ephemeral, not committed)
- All tools go in /home/rob/pedalpath-v2/tools/
- Naming: sync_*.py for fetching, export_*.py for generating files, validate_*.py for checks, generate_*.py for boilerplate

## Context From Previous Sessions

### Development State (as of 2026-02-21)
- Phase 1 COMPLETE: Component decoders (resistor/capacitor), BreadboardBase, 156 tests
- Phase 2 COMPLETE: All 5 SVG components, BomBreadboardView, bom-layout, 168 tests passing
- Phase 3 NOT STARTED: Mobile responsiveness, touch zoom/pan, stripboard enhancements
- Phase 4 NOT STARTED: Stripe payment integration, marketing, user testing

### Immediate Next Development Tasks (Priority Order)
1. Breadboard rewrite — BreadboardGuide.tsx complete rewrite, TransistorSVG, realistic sizing
2. Stripboard rewrite — StripboardGuide.tsx, tagboardeffects.com style
3. Enclosure drill templates — all 1590-series, Tayda format
4. Offboard wiring diagram — jacks/pot/LED/3PDT step
5. AI accuracy — passive circuit detection

### Known Outstanding Issues (from GitHub)
- #2  Stripboard visualization missing
- #4  iOS/PWA support
- #9  Transistor components not rendered
- #10 Breadboard overlays not realistic
- #11 Build guide steps missing component visuals
- #15 Major bugs + resources (main visual overhaul ticket)
- #16 Demo Project no longer accessible

### Both Vercel Deployments Active
- Primary: https://pedalpath-v2.vercel.app
- Secondary: https://pedalpath-app.vercel.app

### Key Source Paths
- App source: pedalpath-app/src/
- Component SVGs: src/components/visualizations/components-svg/
- Decoders: src/utils/decoders/
- Tests: src/utils/__tests__/ and src/utils/decoders/__tests__/
- Visual overhaul docs: /visual-overhaul-2026/
