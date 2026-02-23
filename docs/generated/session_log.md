# Session Log — 2026-02-23

## What We Accomplished
- Discovered repo lives in WSL at /home/rob/pedalpath-v2 (not Windows)
- Archived 11 stale session files from repo root
- Created tools/, docs/generated/, archive/old-sessions/ directories
- Installed all prerequisites: PyGithub, python-dotenv, npm docx package
- Created /home/rob/.pedalpath_env with GitHub token and Supabase URL
- Created upload-queue/ folder, accessible from Windows via \\wsl.localhost\Ubuntu\home\rob\pedalpath-v2\upload-queue
- Pinned upload-queue to Windows File Explorer Quick Access
- Built and passed 21/21 prereqs checker

## What Is Next
- Build sync_upload_queue.py
- Build sync_github_issues.py
- Build session_end.py
- Build export_doc.py (docx with Rob's header/footer spec)
- Rewrite CLAUDE.md to lean version under 400 tokens
- Build session startup bash script (start_session.sh)

## Key Paths
- Repo: /home/rob/pedalpath-v2
- Upload queue: /home/rob/pedalpath-v2/upload-queue
- Secrets: /home/rob/.pedalpath_env
- Tools: /home/rob/pedalpath-v2/tools/

## Planned Tools Library

### Tier 1 — Build Next Session
- sync_upload_queue.py — scans upload-queue/, categorizes files, writes session_manifest.md
- sync_github_issues.py — pulls open GitHub issues to docs/generated/issues_current.md
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

## Tool Building Rules
- Every new tool gets one line added to CLAUDE.md Tools Available section immediately after creation
- Tools that read secrets use /home/rob/.pedalpath_env via python-dotenv
- All output files go to docs/generated/ (ephemeral, not committed)
- All tools go in /home/rob/pedalpath-v2/tools/
- Naming: sync_*.py for fetching, export_*.py for generating files, validate_*.py for checks, generate_*.py for boilerplate
