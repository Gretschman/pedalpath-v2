#!/bin/bash
# start_session.sh — PedalPath v2 session startup
# Run this before every Claude Code session. No exceptions.

set -e

REPO="/home/rob/pedalpath-v2"
APP="$REPO/pedalpath-app"

echo "╔══════════════════════════════════════════════╗"
echo "║     PedalPath v2 — Session Startup            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 0. Session state (last sprint, pending items) ───
SESSION_STATE="$REPO/SESSION_STATE.md"
if [ -f "$SESSION_STATE" ]; then
    echo "▶ SESSION STATE (last sprint + pending):"
    echo "──────────────────────────────────────────────"
    cat "$SESSION_STATE"
    echo "──────────────────────────────────────────────"
    echo ""
fi

# ── 1. Git status ───────────────────────────────────
echo "▶ Git status"
cd "$REPO"
git status --short
git log --oneline -3
echo ""

# ── 2. Sync GitHub issues ───────────────────────────
echo "▶ Syncing GitHub issues..."
python3 "$REPO/tools/sync_github_issues.py" && echo "  ✓ issues_current.md updated" || echo "  ⚠ sync_github_issues failed"
echo ""

# ── 3. Sync upload queue / manifest ────────────────
echo "▶ Syncing upload queue..."
python3 "$REPO/tools/sync_upload_queue.py" && echo "  ✓ session_manifest.md updated" || echo "  ⚠ sync_upload_queue failed"
echo ""

# ── 4. Inbox hygiene (auto-archive stale files) ────
echo "▶ Running inbox hygiene..."
python3 "$REPO/tools/inbox_hygiene.py" || echo "  ⚠ inbox_hygiene failed (non-fatal)"
echo ""

# ── 5. Show session manifest (new _INBOX files) ────
MANIFEST="$REPO/docs/generated/session_manifest.md"
if [ -f "$MANIFEST" ]; then
    echo "▶ New files in _INBOX:"
    cat "$MANIFEST"
    echo ""
fi

# ── 6. Context budget reminder ──────────────────────
echo "┌─────────────────────────────────────────────────────┐"
echo "│ CONTEXT BUDGET: Read CLAUDE.md + session_log.md     │"
echo "│ + issues_current.md ONLY before confirming          │"
echo "│ priorities with Rob. Do not read large reference    │"
echo "│ files until a specific task requires them.          │"
echo "└─────────────────────────────────────────────────────┘"
echo ""

# ── 7. Show session log summary ─────────────────────
SESSION_LOG="$REPO/docs/generated/session_log.md"
if [ -f "$SESSION_LOG" ]; then
    echo "▶ Session log (last 40 lines):"
    tail -40 "$SESSION_LOG"
    echo ""
fi

echo "═══════════════════════════════════════════════"
echo "  Startup complete. Review above, then tell"
echo "  Rob what priorities you see before starting."
echo "═══════════════════════════════════════════════"
