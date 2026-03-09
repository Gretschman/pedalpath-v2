#!/usr/bin/env python3
"""
inbox_hygiene.py — Auto-archive and clean the PedalPath _INBOX folder.

Rules:
  - Files < 24 hours old → leave (just arrived, not yet processed)
  - Named active folders (iOS shell, etc.) → leave (manual decision needed)
  - *.zip older than 24h → _REFERENCE/technical-specs/
  - *.json (ground-truth) older than 24h → delete (already in Supabase)
  - *.docx, *.pdf, *.png, *.jpg (analyzed schematics) older than 24h → _REFERENCE/circuit-library/
  - *.md, *.txt, *session*, *status*, *continuation* older than 24h → delete
  - Everything else older than 7 days → _REFERENCE/technical-specs/ (safe fallback)

Run via start_session.sh — no manual invocation needed.
"""

import os
import sys
import shutil
import time
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(Path.home() / ".pedalpath_env")

INBOX = Path("/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX")
REFERENCE = Path("/mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE")
TECH_SPECS = REFERENCE / "technical-specs"
CIRCUIT_LIB = REFERENCE / "circuit-library"

# Folders in _INBOX that should never be auto-touched (active work)
PROTECTED_FOLDERS = {
    # "pedalpath-ios-web-shell-gh" — REMOVED from protected. iOS work is backlog until after Stripe.
    #   If present in _INBOX, it will be archived to _REFERENCE/technical-specs/ after 24h.
    "ground-truth",
}

# Age thresholds
RECENT_HOURS = 24        # Files younger than this are never touched
STALE_DAYS = 7           # Catch-all fallback age for unknown types

archived = []
deleted = []
skipped = []


def age_hours(path: Path) -> float:
    mtime = path.stat().st_mtime
    return (time.time() - mtime) / 3600


def ensure_dirs():
    TECH_SPECS.mkdir(parents=True, exist_ok=True)
    CIRCUIT_LIB.mkdir(parents=True, exist_ok=True)


def safe_move(src: Path, dest_dir: Path):
    dest = dest_dir / src.name
    if dest.exists():
        stem = src.stem
        suffix = src.suffix
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dest = dest_dir / f"{stem}_{timestamp}{suffix}"
    shutil.move(str(src), str(dest))
    archived.append(f"{src.name} → {dest_dir.name}/")


def process_file(path: Path):
    name_lower = path.name.lower()
    hours_old = age_hours(path)

    # Never touch recent files
    if hours_old < RECENT_HOURS:
        skipped.append(f"{path.name} (recent, {hours_old:.0f}h old)")
        return

    suffix = path.suffix.lower()

    # ZIP files → technical-specs
    if suffix == ".zip":
        safe_move(path, TECH_SPECS)
        return

    # JSON ground-truth → delete (already in Supabase)
    if suffix == ".json":
        path.unlink()
        deleted.append(path.name)
        return

    # Schematics / analyzed docs → circuit-library
    if suffix in {".docx", ".pdf", ".png", ".jpg", ".jpeg"}:
        safe_move(path, CIRCUIT_LIB)
        return

    # Session docs → delete
    session_keywords = ["session", "status", "continuation", "summary", "manifest"]
    if suffix in {".md", ".txt"} or any(k in name_lower for k in session_keywords):
        path.unlink()
        deleted.append(path.name)
        return

    # Catch-all: anything older than STALE_DAYS → technical-specs
    if hours_old > STALE_DAYS * 24:
        safe_move(path, TECH_SPECS)
        return

    # Otherwise leave it
    skipped.append(f"{path.name} (unrecognized type, {hours_old:.0f}h old)")


def process_folder(path: Path):
    name = path.name
    if name in PROTECTED_FOLDERS:
        skipped.append(f"{name}/ (protected active folder)")
        return
    hours_old = age_hours(path)
    if hours_old < RECENT_HOURS:
        skipped.append(f"{name}/ (recent folder, {hours_old:.0f}h old)")
        return
    # Non-protected folder older than threshold → warn, don't auto-delete
    skipped.append(f"{name}/ (folder — manual review needed)")


def main():
    if not INBOX.exists():
        print("_INBOX not found — skipping hygiene")
        return 0

    ensure_dirs()

    items = list(INBOX.iterdir())
    if not items:
        print("_INBOX: already clean")
        return 0

    for item in sorted(items):
        if item.name.startswith("."):
            continue
        if item.is_dir():
            process_folder(item)
        else:
            process_file(item)

    # Summary
    total = len(archived) + len(deleted)
    remaining = len(skipped)

    print(f"\n_INBOX hygiene: {len(archived)} archived, {len(deleted)} deleted, {remaining} remain")

    if archived:
        for a in archived:
            print(f"  ✓ {a}")
    if deleted:
        for d in deleted:
            print(f"  🗑  {d}")
    if skipped:
        for s in skipped:
            print(f"  ○ {s}")

    if remaining > 0:
        print(f"\n_INBOX has {remaining} item(s) — review above")
    else:
        print("\n_INBOX is clean ✓")

    return 0


if __name__ == "__main__":
    sys.exit(main())
