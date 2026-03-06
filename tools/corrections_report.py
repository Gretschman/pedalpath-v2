# corrections_report.py
# Queries component_corrections table and reports error patterns for prompt improvement.
# Usage: python3 tools/corrections_report.py [--days N] [--circuit NAME] [--all]

import argparse
import os
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv("/home/rob/.pedalpath_env")
DB_URL = os.environ.get("SUPABASE_DB_URL")
if not DB_URL:
    print("ERROR: SUPABASE_DB_URL not set in /home/rob/.pedalpath_env", file=sys.stderr)
    sys.exit(1)


def fetch_corrections(days: int | None, circuit: str | None, include_reviewed: bool):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    clauses = []
    params = []

    if not include_reviewed:
        clauses.append("reviewed = false")

    if days:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        clauses.append("created_at >= %s")
        params.append(since)

    if circuit:
        clauses.append("circuit_name ILIKE %s")
        params.append(f"%{circuit}%")

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    cur.execute(
        f"""
        SELECT id, created_at, circuit_name, original_ref,
               component_type, reported_value,
               correct_value, corrected_type,
               issue_type, description, reviewed
        FROM component_corrections
        {where}
        ORDER BY created_at DESC
        """,
        params,
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def group_patterns(rows):
    """Group corrections into error patterns for easy reading."""
    by_issue = defaultdict(list)
    for r in rows:
        by_issue[r["issue_type"]].append(r)

    # Within wrong_value: sub-group by (component_type, reported_value → correct_value)
    value_patterns = defaultdict(list)
    for r in by_issue.get("wrong_value", []):
        key = (r["component_type"], r["reported_value"], r["correct_value"] or "?")
        value_patterns[key].append(r)

    # Within wrong_type: sub-group by (reported_type → corrected_type)
    type_patterns = defaultdict(list)
    for r in by_issue.get("wrong_type", []):
        key = (r["component_type"], r["corrected_type"] or "?")
        type_patterns[key].append(r)

    return by_issue, value_patterns, type_patterns


def print_report(rows, days, circuit, include_reviewed):
    total = len(rows)
    date_str = datetime.now().strftime("%Y-%m-%d")

    scope = []
    if days:
        scope.append(f"last {days} days")
    if circuit:
        scope.append(f"circuit: {circuit}")
    if not include_reviewed:
        scope.append("unreviewed only")
    scope_str = ", ".join(scope) if scope else "all time, all circuits"

    print(f"\nComponent Corrections Report — {date_str}")
    print(f"{'=' * 50}")
    print(f"Scope: {scope_str}")
    print(f"Total corrections: {total}\n")

    if total == 0:
        print("No corrections found.")
        return

    by_issue, value_patterns, type_patterns = group_patterns(rows)

    # ── Wrong value errors ──────────────────────────────────────
    wv = by_issue.get("wrong_value", [])
    if wv:
        print(f"WRONG VALUE  ({len(wv)} corrections)")
        print("-" * 40)
        sorted_patterns = sorted(value_patterns.items(), key=lambda x: -len(x[1]))
        for (ctype, reported, correct), instances in sorted_patterns:
            refs = ", ".join(
                r["original_ref"] for r in instances if r["original_ref"]
            ) or "—"
            circuits = sorted({r["circuit_name"] for r in instances if r["circuit_name"]})
            circuit_str = ", ".join(circuits) if circuits else "unknown circuit"
            print(f"  ×{len(instances):2d}  [{ctype}]  {reported!r} → {correct!r}")
            print(f"        refs: {refs}")
            print(f"        circuits: {circuit_str}")
            notes = [r["description"] for r in instances if r["description"]]
            if notes:
                print(f"        notes: {'; '.join(notes)}")
        print()

    # ── Wrong type errors ───────────────────────────────────────
    wt = by_issue.get("wrong_type", [])
    if wt:
        print(f"WRONG TYPE  ({len(wt)} corrections)")
        print("-" * 40)
        sorted_type = sorted(type_patterns.items(), key=lambda x: -len(x[1]))
        for (orig_type, corrected_type), instances in sorted_type:
            refs = ", ".join(
                r["original_ref"] for r in instances if r["original_ref"]
            ) or "—"
            circuits = sorted({r["circuit_name"] for r in instances if r["circuit_name"]})
            circuit_str = ", ".join(circuits) if circuits else "unknown circuit"
            values = [r["reported_value"] for r in instances]
            print(f"  ×{len(instances):2d}  {orig_type!r} → {corrected_type!r}  (values: {', '.join(values)})")
            print(f"        refs: {refs}")
            print(f"        circuits: {circuit_str}")
        print()

    # ── Other / unspecified ─────────────────────────────────────
    other = by_issue.get("other", []) + by_issue.get("missing", []) + by_issue.get("extra", [])
    if other:
        print(f"OTHER / MISSING / EXTRA  ({len(other)} corrections)")
        print("-" * 40)
        for r in other:
            print(f"  [{r['issue_type']}]  {r['component_type']} {r['reported_value']!r}"
                  f"  ref: {r['original_ref'] or '—'}"
                  f"  circuit: {r['circuit_name'] or '—'}")
            if r["description"]:
                print(f"    note: {r['description']}")
        print()

    # ── Prompt action items ─────────────────────────────────────
    print("PROMPT ACTION ITEMS")
    print("-" * 40)
    top_value = sorted(value_patterns.items(), key=lambda x: -len(x[1]))[:5]
    top_type = sorted(type_patterns.items(), key=lambda x: -len(x[1]))[:3]

    if top_value:
        print("  Value errors to address:")
        for (ctype, reported, correct), instances in top_value:
            print(f"    • {ctype} {reported!r} consistently read as {correct!r} (×{len(instances)})")
    if top_type:
        print("  Type errors to address:")
        for (orig, corrected), instances in top_type:
            print(f"    • {orig!r} confused with {corrected!r} (×{len(instances)})")
    if not top_value and not top_type:
        print("  No clear patterns yet — need more data.")
    print()


def main():
    parser = argparse.ArgumentParser(description="Report on user-submitted component corrections")
    parser.add_argument("--days", type=int, default=None, help="Limit to last N days (default: all time)")
    parser.add_argument("--circuit", type=str, default=None, help="Filter by circuit name (partial match)")
    parser.add_argument("--all", action="store_true", help="Include already-reviewed corrections")
    args = parser.parse_args()

    rows = fetch_corrections(
        days=args.days,
        circuit=args.circuit,
        include_reviewed=args.all,
    )
    print_report(rows, days=args.days, circuit=args.circuit, include_reviewed=args.all)


if __name__ == "__main__":
    main()
