"""
sync_supabase_schema.py
Dumps live Supabase schema → docs/generated/supabase_schema.sql

Produces readable annotated SQL:
  - Full CREATE TABLE for public.* tables
  - Column types, nullable, defaults
  - Primary keys, foreign keys, unique constraints
  - Indexes
  - RLS policies

Usage:
    python3 tools/sync_supabase_schema.py
    python3 tools/sync_supabase_schema.py --all   # include auth/storage internals
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
    import psycopg2
    import psycopg2.extras
except ImportError:
    print('[FAIL]  psycopg2-binary not installed. Run: pip install psycopg2-binary --break-system-packages')
    sys.exit(1)

OUTPUT         = Path('/home/rob/pedalpath-v2/docs/generated/supabase_schema.sql')
PUBLIC_SCHEMA  = 'public'
INTERNAL_SCHEMAS = {'auth', 'realtime', 'storage', 'vault', 'extensions',
                    'graphql', 'graphql_public'}

PASS = '[PASS]'; FAIL = '[FAIL]'; INFO = '[INFO]'


def connect(url: str):
    try:
        conn = psycopg2.connect(url, connect_timeout=10)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f'{FAIL}  Could not connect to Supabase: {e}')
        sys.exit(1)


def fetch(conn, sql: str, params=None) -> list:
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def get_tables(conn, schemas: list[str]) -> list[dict]:
    rows = fetch(conn, """
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND table_schema = ANY(%s)
        ORDER BY table_schema, table_name
    """, (schemas,))
    return [dict(r) for r in rows]


def get_columns(conn, schema: str, table: str) -> list[dict]:
    rows = fetch(conn, """
        SELECT
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default,
            ordinal_position
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position
    """, (schema, table))
    return [dict(r) for r in rows]


def get_constraints(conn, schema: str, table: str) -> list[dict]:
    rows = fetch(conn, """
        SELECT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_schema AS foreign_schema,
            ccu.table_name   AS foreign_table,
            ccu.column_name  AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema    = kcu.table_schema
        LEFT JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = rc.unique_constraint_name
        WHERE tc.table_schema = %s AND tc.table_name = %s
          AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
        ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position
    """, (schema, table))
    return [dict(r) for r in rows]


def get_indexes(conn, schema: str, table: str) -> list[dict]:
    rows = fetch(conn, """
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = %s AND tablename = %s
          AND indexname NOT LIKE '%%_pkey'
        ORDER BY indexname
    """, (schema, table))
    return [dict(r) for r in rows]


def get_policies(conn, schema: str, table: str) -> list[dict]:
    rows = fetch(conn, """
        SELECT policyname, cmd, qual, with_check, roles
        FROM pg_policies
        WHERE schemaname = %s AND tablename = %s
        ORDER BY policyname
    """, (schema, table))
    return [dict(r) for r in rows]


def get_rls_enabled(conn, schema: str, table: str) -> bool:
    rows = fetch(conn, """
        SELECT relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = %s AND c.relname = %s
    """, (schema, table))
    return rows[0]['relrowsecurity'] if rows else False


def fmt_column(col: dict) -> str:
    """Format a column definition line."""
    dtype = col['data_type'].upper()
    if col['character_maximum_length']:
        dtype += f"({col['character_maximum_length']})"
    nullable = '' if col['is_nullable'] == 'YES' else ' NOT NULL'
    default = f" DEFAULT {col['column_default']}" if col['column_default'] else ''
    return f"    {col['column_name']} {dtype}{nullable}{default}"


def render_table(conn, schema: str, table: str) -> list[str]:
    lines = []
    lines.append(f'-- ─────────────────────────────────────────────')
    lines.append(f'-- {schema}.{table}')
    lines.append(f'-- ─────────────────────────────────────────────')

    # RLS indicator
    rls = get_rls_enabled(conn, schema, table)
    if rls:
        lines.append(f'-- RLS: ENABLED')

    columns    = get_columns(conn, schema, table)
    constraints = get_constraints(conn, schema, table)
    indexes    = get_indexes(conn, schema, table)
    policies   = get_policies(conn, schema, table)

    # Group constraints by type
    pks, fks, uniques = [], [], []
    for c in constraints:
        if c['constraint_type'] == 'PRIMARY KEY':
            pks.append(c)
        elif c['constraint_type'] == 'FOREIGN KEY':
            fks.append(c)
        elif c['constraint_type'] == 'UNIQUE':
            uniques.append(c)

    # CREATE TABLE
    lines.append(f'CREATE TABLE {schema}.{table} (')
    col_lines = [fmt_column(c) for c in columns]

    # Primary key inline
    pk_cols = [p['column_name'] for p in pks]
    if pk_cols:
        col_lines.append(f'    PRIMARY KEY ({", ".join(pk_cols)})')

    # Unique constraints
    seen_unique = set()
    for u in uniques:
        key = u['constraint_name']
        if key not in seen_unique:
            seen_unique.add(key)
            cols = [x['column_name'] for x in uniques if x['constraint_name'] == key]
            col_lines.append(f'    UNIQUE ({", ".join(cols)})')

    lines.append(',\n'.join(col_lines))
    lines.append(');')

    # Foreign keys (after table)
    fk_seen = set()
    for fk in fks:
        key = fk['constraint_name']
        if key in fk_seen:
            continue
        fk_seen.add(key)
        lines.append(
            f'ALTER TABLE {schema}.{table} ADD CONSTRAINT {key} '
            f'FOREIGN KEY ({fk["column_name"]}) '
            f'REFERENCES {fk["foreign_schema"]}.{fk["foreign_table"]} ({fk["foreign_column"]});'
        )

    # Indexes
    for idx in indexes:
        lines.append(f'{idx["indexdef"]};')

    # RLS policies
    if rls and policies:
        lines.append(f'ALTER TABLE {schema}.{table} ENABLE ROW LEVEL SECURITY;')
        for p in policies:
            roles = ', '.join(p['roles']) if p['roles'] else 'public'
            cmd = p['cmd'] or 'ALL'
            lines.append(f'-- Policy: {p["policyname"]} | cmd={cmd} | roles={roles}')
            if p['qual']:
                lines.append(f'--   USING: {p["qual"]}')
            if p['with_check']:
                lines.append(f'--   WITH CHECK: {p["with_check"]}')

    lines.append('')
    return lines


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--all', action='store_true',
                        help='Include auth/storage/realtime internal tables')
    args = parser.parse_args()

    print()
    print('=' * 60)
    print('  PedalPath v2 - Sync Supabase Schema')
    print('=' * 60)
    print()

    url = os.getenv('SUPABASE_DB_URL')
    if not url:
        print(f'{FAIL}  SUPABASE_DB_URL not found in /home/rob/.pedalpath_env')
        sys.exit(1)

    conn = connect(url)

    # Get version info
    rows = fetch(conn, 'SELECT current_database(), version()')
    db_name = rows[0][0]
    pg_ver  = rows[0][1].split(',')[0]
    print(f'{INFO}  Connected: {db_name}  ({pg_ver})')

    # Decide which schemas to detail
    detail_schemas = [PUBLIC_SCHEMA]
    if args.all:
        detail_schemas += sorted(INTERNAL_SCHEMAS)

    all_schemas_for_listing = [PUBLIC_SCHEMA] + sorted(INTERNAL_SCHEMAS)
    all_tables = get_tables(conn, all_schemas_for_listing)

    public_tables  = [t for t in all_tables if t['table_schema'] == PUBLIC_SCHEMA]
    internal_tables = [t for t in all_tables if t['table_schema'] != PUBLIC_SCHEMA]

    print(f'{INFO}  public tables:   {len(public_tables)}')
    print(f'{INFO}  internal tables: {len(internal_tables)}')
    print()

    # Build SQL output
    lines = []
    ts = datetime.now().strftime('%Y-%m-%d %H:%M')
    lines.append(f'-- Supabase Schema Dump')
    lines.append(f'-- Database: {db_name}  ({pg_ver})')
    lines.append(f'-- Generated: {ts}')
    lines.append(f'-- Repo: https://github.com/Gretschman/pedalpath-v2')
    lines.append('')

    # ── Public schema (full detail) ──────────────────────────────────────────
    lines.append('-- ═══════════════════════════════════════════════')
    lines.append('-- PUBLIC SCHEMA (app tables)')
    lines.append('-- ═══════════════════════════════════════════════')
    lines.append('')

    for t in public_tables:
        table_lines = render_table(conn, PUBLIC_SCHEMA, t['table_name'])
        lines.extend(table_lines)
        print(f'  {PASS}  public.{t["table_name"]}')

    # ── Internal schemas (summary only unless --all) ─────────────────────────
    if args.all:
        for schema in sorted(INTERNAL_SCHEMAS):
            schema_tables = [t for t in internal_tables if t['table_schema'] == schema]
            if not schema_tables:
                continue
            lines.append(f'-- ═══════════════════════════════════════════════')
            lines.append(f'-- {schema.upper()} SCHEMA')
            lines.append(f'-- ═══════════════════════════════════════════════')
            lines.append('')
            for t in schema_tables:
                table_lines = render_table(conn, schema, t['table_name'])
                lines.extend(table_lines)
    else:
        lines.append('-- ═══════════════════════════════════════════════')
        lines.append('-- INTERNAL SCHEMAS (table names only)')
        lines.append('-- Run with --all to include full definitions')
        lines.append('-- ═══════════════════════════════════════════════')
        lines.append('')
        current_schema = None
        for t in internal_tables:
            if t['table_schema'] != current_schema:
                current_schema = t['table_schema']
                lines.append(f'-- {current_schema}:')
            lines.append(f'--   {t["table_schema"]}.{t["table_name"]}')
        lines.append('')

    conn.close()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text('\n'.join(lines))

    print()
    print(f'{PASS}  Written: {OUTPUT}')
    print()


if __name__ == '__main__':
    main()
