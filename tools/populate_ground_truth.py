# populate_ground_truth.py
# Seeds reference_circuits and reference_bom_items from JSON ground truth files
# Usage: python3 tools/populate_ground_truth.py

import json
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

GROUND_TRUTH_DIR = Path("/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX/ground-truth")

load_dotenv("/home/rob/.pedalpath_env")
DB_URL = os.environ.get("SUPABASE_DB_URL")
if not DB_URL:
    print("ERROR: SUPABASE_DB_URL not set in /home/rob/.pedalpath_env", file=sys.stderr)
    sys.exit(1)

conn = psycopg2.connect(DB_URL)
conn.autocommit = True
cur = conn.cursor()

circuits_inserted = 0
components_inserted = 0

json_files = sorted(GROUND_TRUTH_DIR.glob("*.json"))
if not json_files:
    print(f"No JSON files found in {GROUND_TRUTH_DIR}")
    sys.exit(0)

for json_path in json_files:
    # Skip supplier_links.json — that's for populate_supplier_links.py
    if json_path.name == "supplier_links.json":
        continue

    try:
        with open(json_path, encoding="utf-8") as f:
            data = json.load(f)

        # Handle both a single circuit object and a list of circuits
        circuits = data if isinstance(data, list) else [data]

        for circuit in circuits:
            circuit_name = circuit.get("circuit_name", "").strip()
            source_file = circuit.get("source_file", "").strip()
            circuit_type = circuit.get("circuit_type", None)
            components = circuit.get("components", [])

            if not circuit_name or not source_file:
                print(f"  SKIP: missing circuit_name or source_file in {json_path.name}")
                continue

            # Upsert circuit row; return id whether inserted or already existed
            cur.execute(
                """
                INSERT INTO public.reference_circuits (name, source_file, circuit_type)
                VALUES (%s, %s, %s)
                ON CONFLICT (name) DO UPDATE
                    SET source_file = EXCLUDED.source_file,
                        circuit_type = COALESCE(EXCLUDED.circuit_type, reference_circuits.circuit_type)
                RETURNING id
                """,
                (circuit_name, source_file, circuit_type),
            )
            row = cur.fetchone()
            circuit_id = row[0]
            circuits_inserted += 1

            for comp in components:
                comp_type = comp.get("component_type", "other")
                value = comp.get("value", "").strip()
                quantity = comp.get("quantity", 1)
                refs = comp.get("reference_designators", [])
                notes = comp.get("notes", None) or None

                if not value:
                    continue

                cur.execute(
                    """
                    INSERT INTO public.reference_bom_items
                        (circuit_id, component_type, value, quantity, reference_designators, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (circuit_id, comp_type, value, quantity, refs, notes),
                )
                components_inserted += 1

        print(f"  OK: {json_path.name}")

    except json.JSONDecodeError as e:
        print(f"  ERROR: invalid JSON in {json_path.name}: {e}")
    except psycopg2.Error as e:
        print(f"  ERROR: DB error processing {json_path.name}: {e}")
    except Exception as e:
        print(f"  ERROR: unexpected error in {json_path.name}: {e}")

cur.close()
conn.close()
print(f"\n{circuits_inserted} circuits inserted, {components_inserted} components inserted")
