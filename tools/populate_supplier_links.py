# populate_supplier_links.py
# Seeds supplier_links table from JSON file
# Usage: python3 tools/populate_supplier_links.py

import json
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

INPUT_FILE = Path("/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX/ground-truth/supplier_links.json")

load_dotenv("/home/rob/.pedalpath_env")
DB_URL = os.environ.get("SUPABASE_DB_URL")
if not DB_URL:
    print("ERROR: SUPABASE_DB_URL not set in /home/rob/.pedalpath_env", file=sys.stderr)
    sys.exit(1)

if not INPUT_FILE.exists():
    print(f"ERROR: input file not found: {INPUT_FILE}", file=sys.stderr)
    print("Run ChatGPT-4o Browse (Track C) to generate supplier_links.json first.")
    sys.exit(1)

try:
    with open(INPUT_FILE, encoding="utf-8") as f:
        links = json.load(f)
except json.JSONDecodeError as e:
    print(f"ERROR: invalid JSON in {INPUT_FILE}: {e}", file=sys.stderr)
    sys.exit(1)

conn = psycopg2.connect(DB_URL)
conn.autocommit = True
cur = conn.cursor()

upserted = 0
errors = 0

for entry in links:
    component_type = entry.get("component_type", "").strip()
    value = entry.get("value", "").strip()
    supplier = entry.get("supplier", "").strip()
    url = entry.get("url", "").strip()
    price_usd = entry.get("price_usd", None)
    in_stock = entry.get("in_stock", True)

    if not all([component_type, value, supplier, url]):
        print(f"  SKIP: incomplete entry {entry}")
        continue

    if supplier not in ("tayda", "mouser"):
        print(f"  SKIP: invalid supplier '{supplier}' for {value}")
        continue

    try:
        cur.execute(
            """
            INSERT INTO public.supplier_links
                (component_type, value, supplier, url, price_usd, in_stock, verified_at)
            VALUES (%s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (component_type, value, supplier) DO UPDATE
                SET url = EXCLUDED.url,
                    price_usd = EXCLUDED.price_usd,
                    in_stock = EXCLUDED.in_stock,
                    verified_at = now()
            """,
            (component_type, value, supplier, url, price_usd, in_stock),
        )
        upserted += 1
    except psycopg2.Error as e:
        print(f"  ERROR: DB error for {supplier}/{value}: {e}")
        errors += 1

cur.close()
conn.close()
print(f"\n{upserted} links upserted" + (f", {errors} errors" if errors else ""))
