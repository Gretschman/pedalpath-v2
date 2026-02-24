"""
sync_github_issues.py
Pulls open GitHub issues → docs/generated/issues_current.md

Usage:
    python3 tools/sync_github_issues.py
    python3 tools/sync_github_issues.py --all   # include closed issues
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    import os
    load_dotenv('/home/rob/.pedalpath_env')
except ImportError:
    print('[FAIL]  python-dotenv not installed. Run: pip install python-dotenv')
    sys.exit(1)

try:
    from github import Auth, Github, GithubException
except ImportError:
    print('[FAIL]  PyGithub not installed. Run: pip install PyGithub')
    sys.exit(1)

REPO_NAME  = 'Gretschman/pedalpath-v2'
OUTPUT     = Path('/home/rob/pedalpath-v2/docs/generated/issues_current.md')
MAX_BODY   = 400   # chars to show from issue body before truncating

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--all', action='store_true', help='Include closed issues')
    args = parser.parse_args()

    token = os.getenv('GITHUB_TOKEN')
    if not token:
        print('[FAIL]  GITHUB_TOKEN not found in /home/rob/.pedalpath_env')
        sys.exit(1)

    print()
    print('=' * 60)
    print('  PedalPath v2 - Sync GitHub Issues')
    print('=' * 60)
    print()

    try:
        gh   = Github(auth=Auth.Token(token))
        repo = gh.get_repo(REPO_NAME)
    except GithubException as e:
        if e.status == 401:
            print('[FAIL]  GitHub token rejected (401). Token may be expired.')
            print('        Generate a new one at: https://github.com/settings/tokens')
            print('        Then update: /home/rob/.pedalpath_env')
        else:
            print(f'[FAIL]  Could not connect to GitHub: {e}')
        sys.exit(1)

    state  = 'all' if args.all else 'open'
    issues = list(repo.get_issues(state=state, sort='created', direction='asc'))

    # Separate open vs closed for summary
    open_issues   = [i for i in issues if i.state == 'open']
    closed_issues = [i for i in issues if i.state == 'closed']

    print(f'  Repo:   {REPO_NAME}')
    print(f'  Open:   {len(open_issues)}')
    if args.all:
        print(f'  Closed: {len(closed_issues)}')
    print()

    # Build markdown
    lines = []
    lines.append(f'# GitHub Issues — {REPO_NAME}')
    lines.append(f'_Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}_')
    lines.append(f'_State: {"all" if args.all else "open only"} | {len(open_issues)} open, {len(closed_issues)} closed_')
    lines.append('')

    def render_issues(issue_list, heading):
        if not issue_list:
            return
        lines.append(f'## {heading} ({len(issue_list)})')
        lines.append('')
        for issue in issue_list:
            labels = ', '.join(f'`{l.name}`' for l in issue.labels) if issue.labels else ''
            assignees = ', '.join(a.login for a in issue.assignees) if issue.assignees else 'unassigned'
            lines.append(f'### #{issue.number} — {issue.title}')
            if labels:
                lines.append(f'**Labels**: {labels}  ')
            lines.append(f'**Assignee**: {assignees}  ')
            lines.append(f'**Created**: {issue.created_at.strftime("%Y-%m-%d")}  ')
            lines.append(f'**URL**: {issue.html_url}')
            lines.append('')
            if issue.body:
                body = issue.body.strip()
                if len(body) > MAX_BODY:
                    body = body[:MAX_BODY].rsplit(' ', 1)[0] + ' …'
                lines.append(body)
                lines.append('')
            lines.append('---')
            lines.append('')

    render_issues(open_issues, 'Open Issues')
    if args.all:
        render_issues(closed_issues, 'Closed Issues')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text('\n'.join(lines))

    print(f'[PASS]  Written: {OUTPUT}')
    print()

    # Console preview of open issue titles
    if open_issues:
        print('  Open issues:')
        for i in open_issues:
            labels = ' '.join(f'[{l.name}]' for l in i.labels)
            print(f'    #{i.number:3d}  {i.title}  {labels}')
    else:
        print('  No open issues.')
    print()

if __name__ == '__main__':
    main()
