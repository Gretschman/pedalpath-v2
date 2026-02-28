# accuracy_test.py
# Automated BOM accuracy testing against reference circuits
# Usage: python3 tools/accuracy_test.py

import base64
import io
import json
import os
import subprocess
import sys
from pathlib import Path

import psycopg2
import requests
from dotenv import load_dotenv

# ─── Configuration ────────────────────────────────────────────────
load_dotenv("/home/rob/.pedalpath_env")
DB_URL = os.environ.get("SUPABASE_DB_URL")
if not DB_URL:
    print("ERROR: SUPABASE_DB_URL not set in /home/rob/.pedalpath_env", file=sys.stderr)
    sys.exit(1)

API_URL = "https://pedalpath.app/api/analyze-schematic"
INBOX_DIR = Path("/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX")

# Value aliases: keys normalise to their canonical alias target
VALUE_ALIASES: dict[str, str] = {
    "1n914": "1n4148",
    "in914": "1n4148",
    "jrc4558": "rc4558",
    "njm4558": "rc4558",
    "4558": "rc4558",
    "tc1044": "icl7660",
    "tc1044s": "icl7660",
}

# Scoring weights
SCORE_EXACT = 1.0
SCORE_ALIAS = 0.9
SCORE_WRONG_VALUE = 0.3   # right type, wrong value
SCORE_MISSING = 0.0       # in reference but not found
SCORE_EXTRA = -0.1        # in found but not in reference

PASS_THRESHOLD = 85.0


def normalise(value: str) -> str:
    """Lowercase + strip whitespace for comparison."""
    return value.strip().lower()


def is_alias(a: str, b: str) -> bool:
    """Return True if a and b are known aliases of each other."""
    na, nb = normalise(a), normalise(b)
    return VALUE_ALIASES.get(na) == nb or VALUE_ALIASES.get(nb) == na


def image_to_base64(path: Path) -> tuple[str, str]:
    """
    Convert an image or PDF to base64.
    For PDFs: extract page 1 as PNG using pdf2image.
    Returns (base64_string, mime_type).
    """
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        try:
            from pdf2image import convert_from_path
        except ImportError:
            print("  ERROR: pdf2image not installed. Run: pip install pdf2image")
            raise

        pages = convert_from_path(str(path), first_page=1, last_page=1, dpi=150)
        if not pages:
            raise ValueError(f"Could not extract page from PDF: {path}")
        buf = io.BytesIO()
        pages[0].save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode(), "image/png"

    elif suffix in (".jpg", ".jpeg"):
        return base64.b64encode(path.read_bytes()).decode(), "image/jpeg"
    elif suffix == ".png":
        return base64.b64encode(path.read_bytes()).decode(), "image/png"
    elif suffix == ".webp":
        return base64.b64encode(path.read_bytes()).decode(), "image/webp"
    else:
        raise ValueError(f"Unsupported image format: {suffix}")


def find_image(source_file: str) -> Path | None:
    """Search INBOX_DIR for a file matching source_file (case-insensitive stem)."""
    target = Path(source_file).name.lower()
    for candidate in INBOX_DIR.iterdir():
        if candidate.name.lower() == target:
            return candidate
    return None


def score_components(
    reference: list[dict], found: list[dict]
) -> tuple[float, float, list[dict]]:
    """
    Score found components against reference components.

    Returns:
        (overall_score 0-100, raw_score, discrepancies list)
    """
    discrepancies: list[dict] = []

    # Build a pool of found components to match against (copy so we can pop)
    found_pool = list(found)
    matched_found_indices: set[int] = set()
    total_score = 0.0

    for ref_comp in reference:
        ref_type = ref_comp["component_type"]
        ref_value = ref_comp["value"]
        qty = ref_comp.get("quantity", 1)

        best_match_score = SCORE_MISSING
        best_match_idx: int | None = None
        best_disc_type = "missing"

        for i, found_comp in enumerate(found_pool):
            if i in matched_found_indices:
                continue

            found_type = found_comp.get("component_type", "")
            found_value = found_comp.get("value", "")

            if found_type != ref_type:
                continue  # wrong type entirely — keep looking

            norm_ref = normalise(ref_value)
            norm_found = normalise(found_value)

            if norm_ref == norm_found:
                best_match_score = SCORE_EXACT
                best_match_idx = i
                best_disc_type = "exact"
                break  # perfect match, stop
            elif is_alias(ref_value, found_value):
                if best_match_score < SCORE_ALIAS:
                    best_match_score = SCORE_ALIAS
                    best_match_idx = i
                    best_disc_type = "alias"
            else:
                if best_match_score < SCORE_WRONG_VALUE:
                    best_match_score = SCORE_WRONG_VALUE
                    best_match_idx = i
                    best_disc_type = "wrong_value"

        # Accumulate score (weighted by qty)
        total_score += best_match_score * qty

        if best_match_idx is not None:
            matched_found_indices.add(best_match_idx)

        if best_disc_type != "exact":
            found_val = found_pool[best_match_idx]["value"] if best_match_idx is not None else None
            refs_str = ",".join(ref_comp.get("reference_designators", []))

            disc_type_map = {
                "missing": "missing",
                "wrong_value": "wrong_value",
                "alias": None,  # alias matches don't need a discrepancy row
            }
            disc_type = disc_type_map.get(best_disc_type, best_disc_type)

            if disc_type:
                discrepancies.append(
                    {
                        "discrepancy_type": disc_type,
                        "expected_value": ref_value,
                        "found_value": found_val,
                        "component_type": ref_type,
                        "reference_designator": refs_str,
                        "score_impact": (best_match_score - SCORE_EXACT) * qty,
                    }
                )

    # Extra components in found but not in reference
    total_ref_qty = sum(c.get("quantity", 1) for c in reference)
    for i, found_comp in enumerate(found_pool):
        if i not in matched_found_indices:
            total_score += SCORE_EXTRA
            discrepancies.append(
                {
                    "discrepancy_type": "extra",
                    "expected_value": None,
                    "found_value": found_comp.get("value"),
                    "component_type": found_comp.get("component_type"),
                    "reference_designator": ",".join(found_comp.get("reference_designators", [])),
                    "score_impact": SCORE_EXTRA,
                }
            )

    max_score = float(total_ref_qty)  # perfect score
    if max_score == 0:
        return 0.0, 0.0, discrepancies

    overall_score = max(0.0, (total_score / max_score) * 100)
    return overall_score, total_score, discrepancies


def file_github_issue(circuit_name: str, score: float, expected: int, found: int, discrepancies: list[dict]) -> bool:
    """File a GitHub issue via gh CLI. Returns True on success."""
    top_discs = discrepancies[:5]
    disc_lines = []
    for d in top_discs:
        if d["discrepancy_type"] == "missing":
            disc_lines.append(f"- Missing: {d['component_type']} {d['expected_value']}")
        elif d["discrepancy_type"] == "extra":
            disc_lines.append(f"- Extra (false positive): {d['component_type']} {d['found_value']}")
        elif d["discrepancy_type"] == "wrong_value":
            disc_lines.append(
                f"- Wrong value: expected {d['component_type']} {d['expected_value']}, "
                f"got {d['found_value']}"
            )
        elif d["discrepancy_type"] == "wrong_type":
            disc_lines.append(
                f"- Wrong type: expected {d['component_type']} {d['expected_value']}, "
                f"got {d['found_value']}"
            )

    discs_str = "\n".join(disc_lines) if disc_lines else "No top discrepancies recorded."

    title = f"Accuracy < 85%: {circuit_name} ({score:.0f}%)"
    body = (
        f"Circuit: {circuit_name}\n"
        f"Score: {score:.1f}%\n"
        f"Expected: {expected} components\n"
        f"Found: {found} components\n"
        f"\nTop discrepancies:\n{discs_str}"
    )

    result = subprocess.run(
        ["gh", "issue", "create",
         "--title", title,
         "--body", body,
         "--label", "accuracy"],
        capture_output=True,
        text=True,
        cwd="/home/rob/pedalpath-v2",
    )
    if result.returncode == 0:
        print(f"  GitHub issue filed: {result.stdout.strip()}")
        return True
    else:
        print(f"  WARNING: gh issue create failed: {result.stderr.strip()}")
        return False


def main() -> None:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # Load all reference circuits
    cur.execute("SELECT id, name, source_file FROM public.reference_circuits ORDER BY name")
    circuits = cur.fetchall()

    if not circuits:
        print("No reference circuits found in database.")
        print("Run tools/populate_ground_truth.py first.")
        sys.exit(0)

    print(f"Testing {len(circuits)} circuits against {API_URL}\n")

    results = []

    for circuit_id, circuit_name, source_file in circuits:
        print(f"[{circuit_name}]")

        # Find image file
        img_path = find_image(source_file)
        if not img_path:
            print(f"  WARNING: image not found for '{source_file}' — skipping")
            results.append(
                {
                    "name": circuit_name,
                    "expected": 0,
                    "found": 0,
                    "score": None,
                    "status": "SKIP (no image)",
                }
            )
            continue

        # Convert to base64
        try:
            img_b64, img_type = image_to_base64(img_path)
        except Exception as e:
            print(f"  ERROR: could not convert image: {e} — skipping")
            results.append(
                {
                    "name": circuit_name,
                    "expected": 0,
                    "found": 0,
                    "score": None,
                    "status": f"SKIP ({e})",
                }
            )
            continue

        print(f"  Image: {img_path.name} ({len(img_b64) // 1024}KB)")

        # Call API
        try:
            resp = requests.post(
                API_URL,
                json={"image_base64": img_b64, "image_type": img_type},
                timeout=120,
            )
            resp.raise_for_status()
            api_data = resp.json()
        except requests.RequestException as e:
            print(f"  ERROR: API call failed: {e} — skipping")
            results.append(
                {
                    "name": circuit_name,
                    "expected": 0,
                    "found": 0,
                    "score": None,
                    "status": f"SKIP (API error)",
                }
            )
            continue

        if not api_data.get("success"):
            print(f"  ERROR: API returned success=false: {api_data.get('error')} — skipping")
            results.append(
                {
                    "name": circuit_name,
                    "expected": 0,
                    "found": 0,
                    "score": None,
                    "status": "SKIP (API failure)",
                }
            )
            continue

        bom_data = api_data.get("bom_data", {})
        found_components = bom_data.get("components", [])
        model_used = api_data.get("model_used", "unknown")

        # Load reference BOM
        cur.execute(
            """
            SELECT component_type, value, quantity, reference_designators
            FROM public.reference_bom_items
            WHERE circuit_id = %s
            """,
            (circuit_id,),
        )
        ref_rows = cur.fetchall()
        reference_components = [
            {
                "component_type": r[0],
                "value": r[1],
                "quantity": r[2],
                "reference_designators": r[3] or [],
            }
            for r in ref_rows
        ]
        total_ref_qty = sum(c["quantity"] for c in reference_components)
        total_found_qty = sum(c.get("quantity", 1) for c in found_components)

        print(f"  Reference: {total_ref_qty} components ({len(reference_components)} unique)")
        print(f"  Found:     {total_found_qty} components ({len(found_components)} unique)")

        # Score
        score, _, discrepancies = score_components(reference_components, found_components)
        print(f"  Score:     {score:.1f}%")

        # Record test run
        cur.execute(
            """
            INSERT INTO public.accuracy_test_runs
                (circuit_id, model_used, overall_score, component_count_expected, component_count_found)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (circuit_id, model_used, score, total_ref_qty, total_found_qty),
        )
        run_id = cur.fetchone()[0]

        # Record discrepancies
        for d in discrepancies:
            cur.execute(
                """
                INSERT INTO public.accuracy_discrepancies
                    (run_id, discrepancy_type, expected_value, found_value,
                     component_type, reference_designator, score_impact)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    run_id,
                    d["discrepancy_type"],
                    d.get("expected_value"),
                    d.get("found_value"),
                    d.get("component_type"),
                    d.get("reference_designator"),
                    d.get("score_impact"),
                ),
            )

        # File issue if below threshold
        status_str = "PASS"
        if score < PASS_THRESHOLD:
            print(f"  FAIL — filing GitHub issue...")
            filed = file_github_issue(circuit_name, score, total_ref_qty, total_found_qty, discrepancies)
            status_str = "FAIL — issue filed" if filed else "FAIL"

        results.append(
            {
                "name": circuit_name,
                "expected": total_ref_qty,
                "found": total_found_qty,
                "score": score,
                "status": status_str,
            }
        )
        print()

    cur.close()
    conn.close()

    # Summary table
    print("─" * 70)
    print(f"{'Circuit':<25} {'Expected':>8} {'Found':>5} {'Score':>7}  Status")
    print("─" * 70)
    for r in results:
        score_str = f"{r['score']:.1f}%" if r["score"] is not None else "N/A"
        print(f"{r['name'][:25]:<25} {r['expected']:>8} {r['found']:>5} {score_str:>7}  {r['status']}")
    print("─" * 70)

    pass_count = sum(1 for r in results if r.get("score") is not None and r["score"] >= PASS_THRESHOLD)
    tested_count = sum(1 for r in results if r.get("score") is not None)
    print(f"\n{pass_count}/{tested_count} circuits passing at {PASS_THRESHOLD:.0f}%+")


if __name__ == "__main__":
    main()
