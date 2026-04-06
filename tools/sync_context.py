"""
sync_context.py — Rob Frankel Master Context Generator
=======================================================
Generates MASTER_CONTEXT.md — the universal session primer for all Claude platforms:
  Claude Desktop (Filesystem MCP reads it directly)
  Claude Web / Projects (paste as first message)
  Claude iOS / iPadOS (open in Dropbox app, paste)
  Claude Code terminal (auto-loaded at session start)

Usage:
    python sync_context.py           # regenerate + print briefing
    python sync_context.py --quiet   # regenerate only, no print
    python sync_context.py --brief   # print briefing only (no regen)

Install locations (kept in sync):
    C:\\Users\\Rob\\Dropbox\\!Claude\\SYSTEM\\sync_context.py
    /home/rob/pedalpath-v2/tools/sync_context.py
"""

import os
import sys
import io
import subprocess
import datetime
from pathlib import Path

# Force UTF-8 output on Windows so Unicode characters don't crash the script
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ─── PLATFORM DETECTION ───────────────────────────────────────────────────────

ON_WINDOWS = os.name == "nt"
ON_WSL     = "microsoft" in open("/proc/version").read().lower() if Path("/proc/version").exists() else False

DROPBOX = Path(r"C:\Users\Rob\Dropbox") if ON_WINDOWS else Path("/mnt/c/Users/Rob/Dropbox")

# ─── PATHS ────────────────────────────────────────────────────────────────────

CLAUDE_ROOT     = DROPBOX / "!Claude"
MASTER_CONTEXT  = CLAUDE_ROOT / "MASTER_CONTEXT.md"
INBOX           = CLAUDE_ROOT / "INBOX_Dx"
OUTBOX          = CLAUDE_ROOT / "OUTBOX_Dx"
LOOSE_FILES     = CLAUDE_ROOT / "_LOOSE_FILES"
SESSIONS_OUTPUT = CLAUDE_ROOT / "_SESSIONS_OUTPUT"
SYSTEM          = CLAUDE_ROOT / "SYSTEM"
TICKLER         = SYSTEM / "TICKLER.md"
VELOQUOTE_ROOT  = DROPBOX / "VeloQuote"
TAX_ROOT        = DROPBOX / "Frankels" / "TL Pkg 2026"

# ─── PROJECT REGISTRY ─────────────────────────────────────────────────────────
# Add new projects here. sync_context reads SESSION_STATE.md from each.

PROJECTS = [
    {
        "key":          "veloquote",
        "name":         "VeloQuote",
        "desc":         "AI-powered lending quote platform — fintech startup",
        "docs":         VELOQUOTE_ROOT,
        "code_wsl":     None,
        "code_win":     None,
        "session_file": VELOQUOTE_ROOT / "Meetings" / "SESSION_STATE.md",
        "roadmap_file": None,
        "url":          None,
        "active":       True,
        "note":         "11am daily standup. Push Fathom to Meetings/[month]/ after each call.",
    },
    {
        "key":          "pedalpath",
        "name":         "PedalPath",
        "desc":         "AI guitar pedal schematic analyzer — BOM + visual build guide",
        "docs":         CLAUDE_ROOT / "Proj_PedalPath",
        "code_wsl":     Path("/home/rob/pedalpath-v2"),
        "code_win":     None,
        "session_file": CLAUDE_ROOT / "Proj_PedalPath" / "SESSION_STATE.md",
        "roadmap_file": CLAUDE_ROOT / "Proj_PedalPath" / "ROADMAP.md",
        "url":          "https://pedalpath.app",
        "active":       True,
        "note":         "Path to first revenue. Visual pipeline blocker before paid launch.",
    },
    {
        "key":          "walkbuddy",
        "name":         "WalkBuddy",
        "desc":         "AI walking companion PWA for dog owners",
        "docs":         CLAUDE_ROOT / "Proj_WalkBuddy",
        "code_wsl":     Path("/home/rob/git/walkbuddy"),
        "code_win":     None,
        "session_file": CLAUDE_ROOT / "Proj_WalkBuddy" / "SESSION_STATE.md",
        "roadmap_file": None,
        "url":          "https://mywalkbuddy.app",
        "active":       True,
        "note":         "Sprint 3 — PawPass paywall. Deploy index.html, then Supabase auth.",
    },
    {
        "key":          "tax2025",
        "name":         "Tax 2025",
        "desc":         "Frankel family 2025 tax package for attorney (TL)",
        "docs":         TAX_ROOT,
        "code_wsl":     None,
        "code_win":     None,
        "session_file": None,
        "roadmap_file": None,
        "url":          None,
        "active":       True,
        "note":         "Download all 7 sources (see DOWNLOAD_INSTRUCTIONS.md). Build master Excel workbook.",
    },
    {
        "key":          "joscho",
        "name":         "Joscho / GGA",
        "desc":         "Gypsy Guitar Academy lesson downloader and organizer",
        "docs":         CLAUDE_ROOT / "Proj_Joscho",
        "code_wsl":     None,
        "code_win":     None,
        "session_file": None,
        "roadmap_file": None,
        "url":          None,
        "active":       False,
        "note":         "Utility. Run gga_downloader_v4.py as needed.",
    },
]

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def read_file_safe(path, max_lines=120):
    try:
        lines = Path(path).read_text(encoding="utf-8").splitlines()
        if len(lines) > max_lines:
            lines = lines[:max_lines] + [f"... [{len(lines) - max_lines} more lines truncated]"]
        return "\n".join(lines)
    except Exception:
        return None


def git_last_commit(repo_path):
    try:
        r = subprocess.run(
            ["git", "-C", str(repo_path), "log", "--oneline", "-1"],
            capture_output=True, text=True, timeout=5
        )
        return r.stdout.strip() or None
    except Exception:
        return None


def git_status_clean(repo_path):
    try:
        r = subprocess.run(
            ["git", "-C", str(repo_path), "status", "--porcelain"],
            capture_output=True, text=True, timeout=5
        )
        return r.stdout.strip() == ""
    except Exception:
        return None


def list_inbox():
    try:
        return [f.name for f in INBOX.iterdir()
                if f.is_file() and f.name not in ("desktop.ini", ".keep")]
    except Exception:
        return []


def list_loose():
    try:
        return sum(1 for f in LOOSE_FILES.rglob("*")
                   if f.is_file() and f.name not in ("desktop.ini", ".keep"))
    except Exception:
        return 0


def list_sessions_output():
    try:
        return sum(1 for f in SESSIONS_OUTPUT.rglob("*")
                   if f.is_file() and f.name not in ("desktop.ini", ".keep"))
    except Exception:
        return 0


def read_tickler_today():
    """Return (today_items, overdue_items, recurring_items) from TICKLER.md."""
    today        = datetime.date.today()
    today_items  = []
    overdue      = []
    recurring    = []
    current_date = None

    try:
        content = TICKLER.read_text(encoding="utf-8")
    except Exception:
        return [], [], []

    import re
    for line in content.splitlines():
        date_m = re.match(r"##\s*(?:DUE:\s*)?(\d{4}-\d{2}-\d{2})", line)
        if date_m:
            current_date = datetime.date.fromisoformat(date_m.group(1))
            continue
        if re.match(r"##\s*RECURRING", line, re.I):
            current_date = "RECURRING"
            continue
        if re.match(r"##\s*SOMEDAY", line, re.I):
            current_date = None
            continue

        task_m = re.match(r"- \[ \] (.+)", line)
        if not task_m:
            continue
        task = task_m.group(1).strip()

        if current_date == "RECURRING":
            recurring.append(task)
        elif isinstance(current_date, datetime.date):
            if current_date == today:
                today_items.append(task)
            elif current_date < today:
                overdue.append((current_date.isoformat(), task))

    return today_items, overdue, recurring


# ─── MASTER CONTEXT GENERATOR ─────────────────────────────────────────────────

def generate_master_context():
    now          = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    today        = datetime.date.today()
    today_str    = today.strftime("%A, %B %d, %Y").replace(" 0", " ")

    today_tasks, overdue_tasks, recurring = read_tickler_today()

    lines = [
        "# MASTER CONTEXT — Rob Frankel",
        f"_Last generated: {now}_",
        "_Auto-generated by sync_context.py — do not edit by hand_",
        "",
        "---",
        "",
        "## HOW TO LOAD THIS FILE INTO ANY CLAUDE SESSION",
        "",
        "**Claude Desktop (Project — permanent, no paste needed after setup):**",
        "  1. Left sidebar → Projects → Rob Command Center",
        "  2. If first time: New Project → name it 'Rob Command Center'",
        "     Click 'Project Instructions' → paste DESKTOP_SYSTEM_PROMPT.md → Save",
        "  3. Inside that project: paste this file (MASTER_CONTEXT.md) as your first message",
        "  4. Once MCP is configured: Claude reads files directly — no paste needed at all",
        "",
        "**Claude Web (claude.ai):**",
        "  1. Go to claude.ai → Projects → Rob Command Center (or create it)",
        "  2. Paste this entire file as your first message",
        "",
        "**Claude iOS:**",
        "  1. Open Dropbox app on iPhone/iPad",
        "  2. Navigate to: !Claude → MASTER_CONTEXT.md",
        "  3. Tap Share → Copy → open Claude iOS app → paste as first message",
        "",
        "**Claude Code (this terminal):** Loads automatically. No action needed.",
        "",
        "---",
        "",
        "## GLOBAL RULES — READ AND FOLLOW IN EVERY SESSION",
        "",
        "**Session start — do all of these before anything else:**",
        "1. Check INBOX_Dx (path below). List any files with a 1-line description each.",
        "   Do not move or act on them unless Rob explicitly asks.",
        "2. If _LOOSE_FILES has content, remind Rob to review it.",
        "3. If Rob names a project or says resume/continue: read its SESSION_STATE.md immediately.",
        "   Never ask Rob to re-explain anything already written there.",
        "4. Session end: update SESSION_STATE.md — what was done, what is next, open flags.",
        "",
        "**Never delete anything.** Stage to _LOOSE_FILES instead.",
        "",
        "**Output files:** name_v##_mmddyy_hhmm.ext → OUTBOX_Dx",
        "DOCX header: Left=Title | Right=Rob Frankel | robsfrankel@gmail.com",
        "DOCX footer: Left=Version+date | Center=Page X of Y | Right=Confidential",
        "Default: DOCX + MD + TXT every session that produces content.",
        "",
        "**Privacy:** All work stays local. No public artifacts. No AI training on Rob's data.",
        "",
        "**Before delegating to ChatGPT or Gemini:** confirm plain browser session (no MCP active),",
        "no credentials or file paths in content. See SYSTEM/EXTERNAL_AI_DELEGATION.md.",
        "",
        "**Tone:** Sentences and paragraphs, not bullet points in prose.",
        "Prioritize monetization. Prefer automated solutions.",
        "Rob has ADHD — every instruction must be specific, granular, and step-by-step.",
        "Assume memory and capacity degrade as the day goes on. Compensate with more detail, not less.",
        "",
        "---",
        "",
        "## SYSTEM OVERVIEW",
        f"Today: {today_str}",
        "",
        "### Daily Automation (runs automatically)",
        "- **6:30am** — Morning Command Center email → robsfrankel@gmail.com",
        "- **5:00pm** — Evening Wrap & Tomorrow Prep email → robsfrankel@gmail.com",
        "- Scripts: `C:\\Users\\Rob\\Dropbox\\!Claude\\SYSTEM\\morning_agenda.py` / `evening_update.py`",
        "- After standup: run `python fathom_processor.py` to extract action items",
        "",
        "### Master Task File",
        f"`C:\\Users\\Rob\\Dropbox\\!Claude\\SYSTEM\\TICKLER.md`",
        "Add tasks there. They appear in both emails and this context automatically.",
        "",
    ]

    # ── TICKLER TODAY ──
    if today_tasks or overdue_tasks:
        lines += ["---", "", "## TODAY'S TASKS", ""]
        if overdue_tasks:
            lines.append("### ⚠️ OVERDUE")
            for date_str, task in overdue_tasks:
                lines.append(f"- [{date_str}] {task}")
            lines.append("")
        if today_tasks:
            lines.append(f"### Due Today — {today_str}")
            for task in today_tasks:
                lines.append(f"- {task}")
            lines.append("")

    # ── PROJECTS ──
    lines += ["---", "", "## ACTIVE PROJECTS", ""]

    for proj in PROJECTS:
        if not proj["active"]:
            continue

        lines.append(f"### {proj['name']}")
        lines.append(f"**Description:** {proj['desc']}")
        if proj.get("url"):
            lines.append(f"**URL:** {proj['url']}")
        if proj.get("note"):
            lines.append(f"**Note:** {proj['note']}")
        lines.append(f"**Docs:** `{proj['docs']}`")

        code = proj.get("code_wsl")
        if code and Path(code).exists():
            last  = git_last_commit(code)
            clean = git_status_clean(code)
            lines.append(f"**Code (WSL):** `{code}`")
            if last:
                lines.append(f"**Last commit:** {last}")
            if clean is not None:
                lines.append(f"**Working tree:** {'✓ clean' if clean else '⚠️ uncommitted changes'}")

        sf = proj.get("session_file")
        if sf and Path(sf).exists():
            content = read_file_safe(sf)
            if content:
                lines += ["", "**SESSION STATE:**", "```", content, "```"]
        lines.append("")

    # ── INBOX / HOUSEKEEPING ──
    inbox_files    = list_inbox()
    loose_count    = list_loose()
    sessions_count = list_sessions_output()

    lines += ["---", "", "## INBOX STATUS"]
    if inbox_files:
        lines.append(f"⚠️ {len(inbox_files)} file(s) waiting in INBOX_Dx:")
        for f in inbox_files:
            lines.append(f"  - {f}")
    else:
        lines.append("✓ INBOX_Dx is empty")

    lines += [
        "",
        "## HOUSEKEEPING",
        f"- `_LOOSE_FILES`: {loose_count} file(s) pending review before deletion",
        f"- `_SESSIONS_OUTPUT`: {sessions_count} session-generated file(s) awaiting project assignment",
        "",
        "---",
        "",
        "## FILE SYSTEM MAP",
        "",
        "### Dropbox (all platforms)",
        "```",
        "C:\\Users\\Rob\\Dropbox\\",
        "├── !Claude\\                        ← Claude workspace root",
        "│   ├── INBOX_Dx\\                   ← files coming IN to sessions",
        "│   ├── OUTBOX_Dx\\                  ← files produced BY sessions",
        "│   ├── SYSTEM\\                     ← scripts, TICKLER.md, AgendaReports",
        "│   │   ├── TICKLER.md              ← MASTER TASK FILE (edit here)",
        "│   │   ├── morning_agenda.py       ← 6:30am email script",
        "│   │   ├── evening_update.py       ← 5pm email script",
        "│   │   └── fathom_processor.py     ← standup transcript → action items",
        "│   ├── Proj_PedalPath\\             ← PedalPath session docs + roadmap",
        "│   ├── Proj_WalkBuddy\\             ← WalkBuddy session docs",
        "│   ├── Proj_HUD-Form-90014\\        ← HUD form project (inactive)",
        "│   ├── Proj_Joscho\\                ← GGA lesson downloader",
        "│   ├── _LOOSE_FILES\\               ← staging for deletion review",
        "│   └── _SESSIONS_OUTPUT\\           ← orphaned session outputs",
        "├── VeloQuote\\                      ← VeloQuote company files",
        "│   ├── Meetings\\                   ← standups, Fathom transcripts",
        "│   ├── VeloQuote Accounting\\",
        "│   ├── VeloQuote Angel Round\\",
        "│   └── Legal\\",
        "├── Frankels\\",
        "│   └── TL Pkg 2026\\                ← 2025 tax package for attorney",
        "│       └── RSF Biz Expenses\\        ← Truist PDFs + expense workbook",
        "└── Fathom Export\\                  ← Fathom transcript archive",
        "```",
        "",
        "### Linux WSL (code repos)",
        "```",
        "/home/rob/",
        "├── pedalpath-v2/                   ← CANONICAL PedalPath repo",
        "└── git/",
        "    └── walkbuddy/                  ← WalkBuddy PWA repo",
        "```",
        "",
        "---",
        "",
        "## GLOBAL RULES (applies to all sessions)",
        "- Never delete files — stage to `_LOOSE_FILES` for daily review",
        "- Check INBOX_Dx at session start — list files, do not act without asking",
        "- Read SESSION_STATE.md immediately when a project is named",
        "- All work stays local — no public artifacts, no external AI training",
        "- Output file format: `name_v##_mmddyy_hhmm.ext` → OUTBOX_Dx",
        "",
        "---",
        "",
        "## PLATFORM QUICK-START",
        "",
        "| Platform | What to do |",
        "|---|---|",
        "| Claude Code | Memory auto-loads. Run `python sync_context.py` in WSL to refresh. |",
        "| Claude Desktop | Paste this file. Filesystem MCP reads project files directly. |",
        "| Claude Web / Projects | Paste this file as first message. |",
        "| Claude iOS | Open MASTER_CONTEXT.md in Dropbox app → copy all → paste. |",
        "",
        "## CLAUDE DESKTOP — MCP DIRECTORIES",
        "Ensure these are in Claude Desktop → Settings → Filesystem allowed directories:",
        "- `C:\\Users\\Rob\\Dropbox\\!Claude`",
        "- `C:\\Users\\Rob\\Dropbox\\VeloQuote`",
        "- `C:\\Users\\Rob\\Dropbox\\Frankels`",
        "- `C:\\Users\\Rob\\Dropbox\\Fathom Export`",
        "",
        "---",
        f"_Generated {now} by sync_context.py_",
    ]

    return "\n".join(lines)


# ─── TERMINAL BRIEFING ────────────────────────────────────────────────────────

def print_briefing():
    today = datetime.date.today()
    today_tasks, overdue_tasks, recurring = read_tickler_today()

    print("\n" + "=" * 60)
    print("  ROB FRANKEL — SESSION BRIEFING")
    print(f"  {today.strftime('%A, %B %d, %Y')}")
    print("=" * 60)

    # Overdue first — most urgent
    if overdue_tasks:
        print(f"\n⚠️  OVERDUE ({len(overdue_tasks)} items):")
        for date_str, task in overdue_tasks[:5]:
            print(f"  [{date_str}] {task[:70]}")

    # Today's tasks
    if today_tasks:
        print(f"\n● TODAY ({len(today_tasks)} tasks):")
        for task in today_tasks[:8]:
            print(f"  {task[:70]}")
    elif not overdue_tasks:
        print("\n✓ No tasks due today")

    # Projects
    print()
    for proj in PROJECTS:
        if not proj["active"]:
            continue
        print(f"▸ {proj['name'].upper()}")
        if proj.get("note"):
            print(f"  {proj['note']}")
        code = proj.get("code_wsl")
        if code and Path(code).exists():
            last  = git_last_commit(code)
            clean = git_status_clean(code)
            if last:
                print(f"  Last commit : {last}")
            if clean is not None:
                print(f"  Working tree: {'✓ clean' if clean else '⚠ uncommitted changes'}")
        sf = proj.get("session_file")
        if sf and Path(sf).exists():
            try:
                for line in Path(sf).read_text(encoding="utf-8").splitlines():
                    s = line.strip()
                    if s and not s.startswith("#") and not s.startswith("_"):
                        print(f"  {s[:70]}")
                        break
            except Exception:
                pass
        print()

    # Inbox
    inbox = list_inbox()
    if inbox:
        print(f"▸ INBOX: {len(inbox)} file(s) waiting")
        for f in inbox[:5]:
            print(f"  → {f}")
    else:
        print("▸ INBOX: clear")

    loose = list_loose()
    if loose:
        print(f"\n▸ _LOOSE_FILES: {loose} item(s) need review before deletion")

    print("\n" + "=" * 60 + "\n")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    args   = sys.argv[1:]
    quiet  = "--quiet" in args
    brief  = "--brief" in args

    if not brief:
        content = generate_master_context()
        try:
            MASTER_CONTEXT.write_text(content, encoding="utf-8")
            print(f"[sync_context] OK MASTER_CONTEXT.md updated -> {MASTER_CONTEXT}")
        except Exception as e:
            print(f"[sync_context] ERROR: {e}")
            return

    if not quiet:
        print_briefing()


if __name__ == "__main__":
    main()
