import sys, subprocess, importlib
from pathlib import Path
from datetime import datetime

PASS = '[PASS]'; FAIL = '[FAIL]'; WARN = '[WARN]'
results = []

def check(label, passed, detail='', warning=False):
    status = WARN if warning else (PASS if passed else FAIL)
    line = f"{status}  {label}"
    if detail: line += f"\n       {detail}"
    results.append((passed or warning, line))
    print(line)

def run(cmd):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return r.returncode == 0, r.stdout.strip(), r.stderr.strip()
    except Exception as e:
        return False, '', str(e)

print()
print('=' * 60)
print('  PedalPath v2 - Prerequisites Check (WSL/Ubuntu)')
print('=' * 60)
print()

print('--- Python ---')
ver = sys.version_info
ok = ver.major == 3 and ver.minor >= 10
check(f'Python {ver.major}.{ver.minor}.{ver.micro}', ok,
      '' if ok else 'Need 3.10+. Run: sudo apt install python3')
ok2, out2, _ = run(['which', 'python3'])
check(f'python3 on PATH: {out2}', ok2)
print()

print('--- Python Packages ---')
for module, pkg, cmd in [
    ('github',  'PyGithub',      'pip install PyGithub'),
    ('docx',    'python-docx',   'pip install python-docx'),
    ('dotenv',  'python-dotenv', 'pip install python-dotenv'),
]:
    try:
        importlib.import_module(module)
        check(pkg, True)
    except ImportError:
        check(pkg, False, f'Run: {cmd}')

for module, pkg, cmd in [
    ('psycopg2', 'psycopg2-binary', 'pip install psycopg2-binary'),
]:
    try:
        importlib.import_module(module)
        check(f'{pkg} (optional)', True)
    except ImportError:
        check(f'{pkg} (optional - skip for now)', True,
              f'When ready: {cmd}', warning=True)
print()

print('--- Node.js ---')
ok, out, _ = run(['node', '--version'])
if ok:
    try:
        major = int(out.lstrip('v').split('.')[0])
        check(f'Node.js {out}', major >= 18,
              '' if major >= 18 else 'Need 18+. Run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs')
    except Exception:
        check(f'Node.js {out}', True, warning=True)
else:
    check('Node.js', False,
          'Run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs')

ok, out, _ = run(['npm', 'list', '-g', 'docx'])
installed = ok and 'docx' in out
check('npm package: docx', installed, '' if installed else 'Run: npm install -g docx')
print()

print('--- Git ---')
ok, out, _ = run(['git', '--version'])
check(f'Git: {out}', ok)
ok, out, _ = run(['git', 'config', 'user.name'])
check(f'git user.name: {out}', ok, '' if ok else 'Run: git config --global user.name "Rob"')
ok, out, _ = run(['git', 'config', 'user.email'])
check(f'git user.email: {out}', ok, '' if ok else 'Run: git config --global user.email "you@email.com"')
print()

print('--- PostgreSQL Tools (optional) ---')
ok, out, _ = run(['pg_dump', '--version'])
check(f'pg_dump: {out}' if ok else 'pg_dump (optional - skip for now)', True,
      'When ready: sudo apt install postgresql-client' if not ok else '', warning=not ok)
print()

print('--- Environment File ---')
env_path = Path('/home/rob/.pedalpath_env')
check(f'{env_path} exists', env_path.exists(),
      f'Run: nano {env_path}   then add GITHUB_TOKEN and SUPABASE_DB_URL')
if env_path.exists():
    content = env_path.read_text()
    check('GITHUB_TOKEN in env file', 'GITHUB_TOKEN' in content,
          'Add line: GITHUB_TOKEN=ghp_your_token_here')
    check('SUPABASE_DB_URL in env file', 'SUPABASE_DB_URL' in content,
          'Add line: SUPABASE_DB_URL=postgresql://...')
print()

print('--- Upload Queue (Dropbox via WSL) ---')
upload_path = Path('/home/rob/pedalpath-v2/upload-queue')
check('Upload queue folder accessible', upload_path.exists(),
      f'Expected: {upload_path}')
print()

print('--- Repo Structure ---')
repo = Path('/home/rob/pedalpath-v2')
check(f'Repo root: {repo}', repo.exists())
for d in ['tools', 'docs/generated', 'archive/old-sessions']:
    p = repo / d
    check(f'  {d}/', p.exists(), f'Run: mkdir -p {p}' if not p.exists() else '')

stale = [f for f in [
    'SESSION_2026-02-16_PHASE1_COMPLETE.md',
    'REPO_CLEANUP_SUMMARY.md',
    'READY_FOR_PRODUCTION.md'
] if (repo / f).exists()]
if stale:
    for f in stale:
        check(f'Stale root file: {f}', True, f'Run: git mv {f} archive/old-sessions/', warning=True)
else:
    check('Repo root clean (no stale session files)', True)
print()

passed = sum(1 for ok, _ in results if ok)
failed = sum(1 for ok, _ in results if not ok)
print('=' * 60)
if failed == 0:
    print(f'  ALL CHECKS PASSED ({passed}/{passed+failed})')
    print('  Ready to proceed with tool installation.')
else:
    print(f'  {passed}/{passed+failed} passed  |  {failed} item(s) to fix')
    print()
    print('  Fix these first:')
    for ok, line in results:
        if not ok:
            for l in line.split('\n'):
                print(f'    {l}')
print('=' * 60)

report = Path('/home/rob/pedalpath-v2/tools/prereqs_report.txt')
try:
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(
        'PedalPath v2 Prerequisites Report\n' +
        f'Generated: {datetime.now().strftime("%m/%d/%y %H:%M")}\n' +
        '=' * 60 + '\n\n' +
        '\n'.join(l for _, l in results) +
        f'\n\nResult: {passed}/{passed+failed} passed\n'
    )
    print(f'\nReport saved: {report}')
except Exception as e:
    print(f'\nCould not save report: {e}')
print()
