"""
sync_upload_queue.py
Scans upload-queue/, categorizes files, extracts previews → docs/generated/session_manifest.md

Usage:
    python3 tools/sync_upload_queue.py
"""

import os
import sys
from pathlib import Path
from datetime import datetime

try:
    import docx as _docx_check  # noqa: F401
except ImportError:
    print('[FAIL]  python-docx not installed. Run: pip install python-docx')
    sys.exit(1)

from docx import Document

QUEUE_DIR = Path('/home/rob/pedalpath-v2/upload-queue')
OUTPUT    = Path('/home/rob/pedalpath-v2/docs/generated/session_manifest.md')

# File categories by extension
CATEGORIES = {
    'session_docs': {'.docx', '.doc'},
    'images':       {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'},
    'pdfs':         {'.pdf'},
    'schematics':   {'.svg', '.kicad_sch', '.sch'},
    'data':         {'.csv', '.json', '.xlsx', '.xls'},
    'text':         {'.md', '.txt'},
}

# Files to silently skip
SKIP_PATTERNS = {
    '.gitkeep',
    'Zone.Identifier',
    'com.dropbox.attrs',
    '.dropbox',
    'desktop.ini',
    'Thumbs.db',
}

def should_skip(path: Path) -> bool:
    name = path.name
    # Windows ADS metadata (colon in filename)
    if ':' in name:
        return True
    # Explicit skip list
    for pattern in SKIP_PATTERNS:
        if pattern in name:
            return True
    # Hidden files
    if name.startswith('.'):
        return True
    return False

def categorize(path: Path) -> str:
    ext = path.suffix.lower()
    for cat, exts in CATEGORIES.items():
        if ext in exts:
            return cat
    return 'other'

def fmt_size(n_bytes: int) -> str:
    if n_bytes < 1024:
        return f'{n_bytes} B'
    elif n_bytes < 1024 * 1024:
        return f'{n_bytes / 1024:.1f} KB'
    else:
        return f'{n_bytes / (1024*1024):.1f} MB'

def extract_docx_preview(path: Path, max_chars: int = 500) -> str:
    """Extract first meaningful paragraphs from a docx file."""
    try:
        doc = Document(path)
        chunks = []
        total = 0
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            chunks.append(text)
            total += len(text)
            if total >= max_chars:
                break
        if not chunks:
            return '_No text content found._'
        preview = '\n'.join(chunks)
        if total >= max_chars:
            preview = preview[:max_chars].rsplit(' ', 1)[0] + ' …'
        return preview
    except Exception as e:
        return f'_Could not read file: {e}_'

def main():
    print()
    print('=' * 60)
    print('  PedalPath v2 - Sync Upload Queue')
    print('=' * 60)
    print()

    if not QUEUE_DIR.exists():
        print(f'[FAIL]  Upload queue not found: {QUEUE_DIR}')
        sys.exit(1)

    # Scan and categorize all files
    all_files = sorted(QUEUE_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)

    categorized: dict[str, list[Path]] = {cat: [] for cat in list(CATEGORIES.keys()) + ['other']}
    skipped = []

    for f in all_files:
        if not f.is_file():
            continue
        if should_skip(f):
            skipped.append(f.name)
            continue
        cat = categorize(f)
        categorized[cat].append(f)

    total_files = sum(len(v) for v in categorized.values())

    print(f'  Queue: {QUEUE_DIR}')
    print(f'  Files: {total_files} actionable  |  {len(skipped)} metadata skipped')
    print()

    # Build markdown
    lines = []
    lines.append('# Upload Queue Manifest')
    lines.append(f'_Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}_')
    lines.append(f'_Location: `upload-queue/` (Windows: `\\\\wsl.localhost\\Ubuntu\\home\\rob\\pedalpath-v2\\upload-queue`)_')
    lines.append(f'_Files: {total_files} actionable_')
    lines.append('')

    if total_files == 0:
        lines.append('> Queue is empty. Drop files into `upload-queue/` from Windows to use them here.')
        lines.append('')
    else:
        # Session docs with previews
        if categorized['session_docs']:
            lines.append('## Session Documents')
            lines.append('')
            for f in categorized['session_docs']:
                stat = f.stat()
                lines.append(f'### {f.name}')
                lines.append(f'**Size**: {fmt_size(stat.st_size)}  ')
                lines.append(f'**Modified**: {datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")}')
                lines.append('')
                lines.append('**Preview:**')
                lines.append('')
                preview = extract_docx_preview(f)
                for line in preview.split('\n'):
                    lines.append(f'> {line}')
                lines.append('')
            print(f'  Session docs: {len(categorized["session_docs"])}')
            for f in categorized['session_docs']:
                print(f'    • {f.name}')

        # Images
        if categorized['images']:
            lines.append('## Reference Images')
            lines.append('')
            lines.append('| File | Size | Modified |')
            lines.append('|------|------|----------|')
            for f in categorized['images']:
                stat = f.stat()
                lines.append(
                    f'| `{f.name}` | {fmt_size(stat.st_size)} | '
                    f'{datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")} |'
                )
            lines.append('')
            print(f'  Images:       {len(categorized["images"])}')

        # PDFs
        if categorized['pdfs']:
            lines.append('## PDFs')
            lines.append('')
            for f in categorized['pdfs']:
                stat = f.stat()
                lines.append(f'- `{f.name}` — {fmt_size(stat.st_size)} — '
                              f'{datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")}')
            lines.append('')
            print(f'  PDFs:         {len(categorized["pdfs"])}')

        # Other categories
        for cat in ['schematics', 'data', 'text', 'other']:
            if categorized[cat]:
                label = cat.replace('_', ' ').title()
                lines.append(f'## {label}')
                lines.append('')
                for f in categorized[cat]:
                    stat = f.stat()
                    lines.append(f'- `{f.name}` — {fmt_size(stat.st_size)} — '
                                  f'{datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")}')
                lines.append('')
                print(f'  {label}:'.ljust(20) + f'{len(categorized[cat])}')

    # Skipped metadata
    if skipped:
        lines.append('## Skipped (Metadata)')
        lines.append('')
        lines.append('_These files were ignored automatically:_')
        lines.append('')
        for name in skipped:
            lines.append(f'- `{name}`')
        lines.append('')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text('\n'.join(lines))

    print()
    print(f'[PASS]  Written: {OUTPUT}')
    print()

if __name__ == '__main__':
    main()
