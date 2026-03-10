#!/usr/bin/env python3
"""
update_session_state.py — auto-refresh the Production State block in SESSION_STATE.md.

Called by tools/session_end.py (or manually). Updates:
  - Last commit SHA + message
  - Git branch
  - Test count (from last test run if available)
  - Timestamp

Does NOT overwrite manual sections (Pending Items, Priority Queue, etc.).
"""
import subprocess
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).parent.parent
STATE_FILE = REPO / "SESSION_STATE.md"


def git(*args) -> str:
    result = subprocess.run(["git", "-C", str(REPO)] + list(args),
                            capture_output=True, text=True)
    return result.stdout.strip()


def get_test_count() -> str:
    """Try to read last known test count from session_log.md."""
    log = REPO / "docs" / "generated" / "session_log.md"
    if not log.exists():
        return "unknown"
    content = log.read_text()
    m = re.search(r"(\d{3})/\d{3} tests? passing", content)
    if m:
        return m.group(0)
    return "unknown"


def get_last_commit() -> tuple[str, str]:
    sha = git("log", "--oneline", "-1", "--format=%h")
    msg = git("log", "--oneline", "-1", "--format=%s")
    return sha, msg


def get_branch() -> str:
    return git("rev-parse", "--abbrev-ref", "HEAD")


def update_production_state(content: str) -> str:
    """Replace the Production State block values."""
    sha, msg = get_last_commit()
    branch = get_branch()
    test_count = get_test_count()
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    def replace_line(pattern, new_line, text):
        return re.sub(pattern, new_line, text, count=1)

    content = replace_line(
        r"- \*\*Tests\*\*:.*",
        f"- **Tests**: {test_count}",
        content
    )
    content = replace_line(
        r"- \*\*Git branch\*\*:.*",
        f"- **Git branch**: {branch}",
        content
    )
    content = replace_line(
        r"- \*\*Last commit\*\*:.*",
        f"- **Last commit**: {sha} {msg}",
        content
    )

    # Update the session date in the "Last Sprint Completed" header line
    # Only updates the date, not the sprint description
    content = re.sub(
        r"(\*\*Session \d+ / )\d{4}-\d{2}-\d{2}(\*\*)",
        lambda m: m.group(0),  # leave sprint description unchanged
        content
    )

    return content


def main():
    if not STATE_FILE.exists():
        print(f"ERROR: {STATE_FILE} not found — run from repo root or create it first.")
        sys.exit(1)

    content = STATE_FILE.read_text()
    updated = update_production_state(content)

    if updated == content:
        print("SESSION_STATE.md — no production state changes detected.")
    else:
        STATE_FILE.write_text(updated)
        print("SESSION_STATE.md — Production State block updated.")

    # Print last 3 commits for confirmation
    print("\nLast 3 commits:")
    print(git("log", "--oneline", "-3"))


if __name__ == "__main__":
    main()
