#!/usr/bin/env bash
# start_session.sh — PedalPath v2 session startup
# Run this before starting Claude Code to pre-populate context files.
# Usage: bash start_session.sh

set -e
REPO="/home/rob/pedalpath-v2"
cd "$REPO"

echo ""
echo "============================================================"
echo "  PedalPath v2 — Session Startup"
echo "============================================================"
echo ""

# 1. Pull open GitHub issues
echo "--- GitHub Issues ---"
python3 tools/sync_github_issues.py
echo ""

# 2. Scan upload queue
echo "--- Upload Queue ---"
python3 tools/sync_upload_queue.py
echo ""

# 3. Sync Supabase schema
echo "--- Supabase Schema ---"
python3 tools/sync_supabase_schema.py
echo ""

# 4. Quick git status
echo "--- Git Status ---"
git log --oneline -5
echo ""
git status --short
echo ""

echo "============================================================"
echo "  Ready. Start Claude Code with:"
echo "    cd $REPO && claude"
echo ""
echo "  Opening prompt:"
echo "    Read docs/generated/session_log.md"
echo "============================================================"
echo ""
