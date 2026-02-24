"""
session_end.py
Wraps up a dev session: shows changes, commits everything, pushes to main.

Usage:
    python3 tools/session_end.py                        # interactive
    python3 tools/session_end.py -m "feat: add thing"  # non-interactive
    python3 tools/session_end.py --no-push              # commit only, skip push
    python3 tools/session_end.py --dry-run              # show what would happen
"""

import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

REPO          = Path('/home/rob/pedalpath-v2')
SESSION_LOG   = REPO / 'docs/generated/session_log.md'
CO_AUTHOR     = 'Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>'
MAIN_BRANCH   = 'main'

# Commit type hints based on changed paths
TYPE_HINTS = [
    (['tools/', 'start_session.sh'],                           'chore'),
    (['docs/', 'CLAUDE.md', '.md'],                            'docs'),
    (['src/components/', 'src/pages/'],                        'feat'),
    (['src/utils/__tests__/', 'src/utils/decoders/__tests__/'], 'test'),
    (['.gitignore', 'package.json', 'vite.config', 'tsconfig'], 'chore'),
    (['api/'],                                                  'feat'),
]

PASS = '[PASS]'; FAIL = '[FAIL]'; WARN = '[WARN]'; INFO = '[INFO]'


def run(cmd: list, capture=True, cwd=None) -> tuple[bool, str, str]:
    try:
        r = subprocess.run(
            cmd, capture_output=capture, text=True,
            cwd=str(cwd or REPO), timeout=30
        )
        return r.returncode == 0, r.stdout.rstrip(), r.stderr.rstrip()
    except Exception as e:
        return False, '', str(e)


def get_changed_files() -> dict:
    """Returns dict with keys: staged, unstaged, untracked."""
    ok, out, _ = run(['git', 'status', '--porcelain'])
    if not ok or not out:
        return {'staged': [], 'unstaged': [], 'untracked': []}

    staged, unstaged, untracked = [], [], []
    for line in out.splitlines():
        if len(line) < 3:
            continue
        x, y, path = line[0], line[1], line[3:]
        if x in ('A', 'M', 'D', 'R'):
            staged.append(path)
        elif y in ('M', 'D'):
            unstaged.append(path)
        elif x == '?':
            untracked.append(path)

    return {'staged': staged, 'unstaged': unstaged, 'untracked': untracked}


def guess_commit_type(files: list[str]) -> str:
    """Guess conventional commit type from changed file paths."""
    all_paths = ' '.join(files)
    for patterns, ctype in TYPE_HINTS:
        if any(p in all_paths for p in patterns):
            return ctype
    return 'chore'


def session_log_updated_today() -> bool:
    """Check if session_log.md was modified today."""
    if not SESSION_LOG.exists():
        return False
    mtime = datetime.fromtimestamp(SESSION_LOG.stat().st_mtime)
    return mtime.date() == datetime.today().date()


def stage_all_changes():
    """Stage all modified tracked files and new untracked files."""
    run(['git', 'add', '-A'])


def main():
    parser = argparse.ArgumentParser(description='End a PedalPath dev session.')
    parser.add_argument('-m', '--message', help='Commit message (skips interactive prompt)')
    parser.add_argument('--no-push', action='store_true', help='Commit but do not push')
    parser.add_argument('--dry-run', action='store_true', help='Show what would happen without doing it')
    args = parser.parse_args()

    print()
    print('=' * 60)
    print('  PedalPath v2 — Session End')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    print('=' * 60)
    print()

    # --- Check we're in the right place ---
    ok, branch, _ = run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
    if not ok:
        print(f'{FAIL}  Not in a git repo.')
        sys.exit(1)
    print(f'{INFO}  Branch: {branch}')
    if branch != MAIN_BRANCH:
        print(f'{WARN}  Expected branch "{MAIN_BRANCH}", got "{branch}".')

    # --- Show changed files ---
    changes = get_changed_files()
    all_files = changes['staged'] + changes['unstaged'] + changes['untracked']

    if not all_files:
        print(f'{INFO}  Nothing to commit. Working tree clean.')
        print()
        if not args.no_push:
            print(f'{INFO}  Pushing to ensure remote is up to date...')
            ok, _, err = run(['git', 'push', 'origin', MAIN_BRANCH])
            if ok:
                print(f'{PASS}  Push complete.')
            else:
                print(f'{WARN}  Push skipped or failed: {err}')
        print()
        sys.exit(0)

    print('  Changes to commit:')
    for f in changes['staged']:
        print(f'    M  {f}')
    for f in changes['unstaged']:
        print(f'    m  {f}  (will be staged)')
    for f in changes['untracked']:
        print(f'    +  {f}  (will be staged)')
    print()

    # --- Warn if session log not updated ---
    if not session_log_updated_today():
        print(f'{WARN}  session_log.md was not updated today.')
        print(f'       Consider updating it before committing.')
        print()

    # --- Build or prompt for commit message ---
    if args.message:
        msg_body = args.message
    else:
        commit_type = guess_commit_type(all_files)
        suggestion = f'{commit_type}: '
        print(f'  Suggested commit type: "{commit_type}"')
        print(f'  Enter commit message (e.g. "{suggestion}describe what changed"):')
        print(f'  > ', end='', flush=True)
        try:
            msg_body = input().strip()
        except (EOFError, KeyboardInterrupt):
            print()
            print(f'{FAIL}  Aborted.')
            sys.exit(1)
        if not msg_body:
            print(f'{FAIL}  Empty commit message. Aborted.')
            sys.exit(1)

    full_message = f'{msg_body}\n\n{CO_AUTHOR}'

    print()
    print('  Commit message:')
    for line in full_message.splitlines():
        print(f'    {line}')
    print()

    if args.dry_run:
        print(f'{INFO}  Dry run — no changes made.')
        sys.exit(0)

    # --- Confirm if interactive ---
    if not args.message:
        print('  Proceed? [Y/n] ', end='', flush=True)
        try:
            answer = input().strip().lower()
        except (EOFError, KeyboardInterrupt):
            answer = 'n'
        if answer not in ('', 'y', 'yes'):
            print(f'{FAIL}  Aborted.')
            sys.exit(1)
        print()

    # --- Stage, commit, push ---
    print(f'{INFO}  Staging all changes...')
    stage_all_changes()

    print(f'{INFO}  Committing...')
    ok, out, err = run(['git', 'commit', '-m', full_message])
    if not ok:
        print(f'{FAIL}  Commit failed:\n{err}')
        sys.exit(1)
    print(f'{PASS}  Committed.')

    # Show short hash
    ok, short_hash, _ = run(['git', 'rev-parse', '--short', 'HEAD'])
    if ok:
        print(f'       {short_hash}  {msg_body[:60]}')
    print()

    if args.no_push:
        print(f'{INFO}  --no-push set. Skipping push.')
    else:
        print(f'{INFO}  Pushing to origin/{MAIN_BRANCH}...')
        ok, _, err = run(['git', 'push', 'origin', MAIN_BRANCH])
        if ok:
            print(f'{PASS}  Pushed.')
        else:
            print(f'{FAIL}  Push failed: {err}')
            print(f'       Run manually: git push origin {MAIN_BRANCH}')
            sys.exit(1)

    print()
    print('=' * 60)
    print('  Session complete.')
    print('=' * 60)
    print()


if __name__ == '__main__':
    main()
