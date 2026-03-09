# accuracy_test.py
# Automated BOM accuracy testing against reference circuits
# Usage: python3 tools/accuracy_test.py [--circuit NAME] [--detail] [--no-issues]

import argparse
import base64
import hashlib
import io
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
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
REFERENCE_DIR = Path("/mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE/circuit-library")
CACHE_FILE = Path("/home/rob/pedalpath-v2/docs/generated/accuracy_cache.json")
PROMPT_FILE = Path("/home/rob/pedalpath-v2/pedalpath-app/api/analyze-schematic.ts")

# Value aliases: keys normalise to their canonical alias target
VALUE_ALIASES: dict[str, str] = {
    "1n914": "1n4148",
    "in914": "1n4148",
    "jrc4558": "rc4558",
    "njm4558": "rc4558",
    "4558": "rc4558",
    "rc4559": "rc4558",   # Tube Screamer variant — functionally equivalent
    "ma150": "1n4148",   # MA150 silicon diode used in original TS808
    "tc1044": "icl7660",
    "tc1044s": "icl7660",
    # DC jack: AI sometimes reads battery label "9V" as the dc-jack value
    "9v": "dc jack",
    # LED: AI sometimes emits "standard" or bare "led" as the value
    "standard": "led",
    "red": "led",
    "green": "led",
    "yellow": "led",
}

# Component types that are interchangeable for matching purposes
COMPATIBLE_TYPE_GROUPS: dict[str, str] = {
    "ic": "active_ic",
    "op-amp": "active_ic",
    "switch": "switch_group",
    "footswitch": "switch_group",
}

# Scoring weights
SCORE_EXACT = 1.0
SCORE_ALIAS = 0.9
SCORE_WRONG_VALUE = 0.3   # right type, wrong value
SCORE_MISSING = 0.0       # in reference but not found
SCORE_EXTRA = -0.1        # in found but not in reference

PASS_THRESHOLD = 85.0

# Circuits excluded from pass/fail count due to source document quality issues.
# These are tested but not counted against the score and no GitHub issues are filed.
SOURCE_LIMITED: dict[str, str] = {
    "BazzFuss (Bulk Fuzz) V3": (
        "Tutorial PDF (tonefiend DIY Club p.16): pots labeled GAIN/TONE/VOLUME "
        "instead of RV1/RV2/RV3; overlapping text confuses vision model. "
        "Not fixable with prompt changes — needs a clean engineering schematic."
    ),
}


def normalise(value: str) -> str:
    """
    Normalise a component value for comparison.
    - Lowercase + strip whitespace
    - Normalise µ → u, strip Ω/ohm
    - Potentiometer taper prefix: A100K → 100k, B50K → 50k, C10K → 10k
    - Strip trailing annotations: "10uF 16V tant" → "10uf" → "10u"
      Also: "50k reverse log taper" → "50k"
    - Strip trailing unit letter after SI prefix (47nF → 47n, 100uF → 100u)
    - Resistor R-suffix: 100r → 100, 680r → 680 (plain ohms notation)
    """
    import re
    v = value.strip().lower()
    v = v.replace('µ', 'u').replace('ω', '').replace('ohm', '').replace('ohms', '')
    # Potentiometer taper prefix: a100k → 100k, b50k → 50k, c10k → 10k
    v = re.sub(r'^[abc](\d)', r'\1', v)
    # Strip everything after the primary value token (number + optional SI prefix + optional unit char)
    # Covers: "10uf 16v tant"→"10uf", "50k reverse log"→"50k", "1.5uf tant"→"1.5uf"
    # [fhvawr] catches: f=farads, h=henries, v=volts, a=amps, w=watts, r=ohms
    v = re.sub(r'^(\d+(?:\.\d+)?[pnumk]?[fhvawr]?)\s+.*$', r'\1', v)
    # Strip trailing unit letter after SI prefix: 47nf→47n, 100uf→100u, 220nf→220n
    v = re.sub(r'([0-9])([pnumk])[fhvaw]$', r'\1\2', v)
    # Resistor R-suffix (plain ohms notation): 100r → 100, 680r → 680
    v = re.sub(r'^(\d+(?:\.\d+)?)r$', r'\1', v)
    # Jack value normalisation: strip '1/4"' or '1/4 inch' prefix — all guitar pedal jacks are 1/4"
    # "1/4\" mono" → "mono", "1/4\" stereo" → "stereo", "1/4 inch mono" → "mono"
    v = re.sub(r'^1/4["\s]?\s*(inch\s+)?', '', v)
    # Switch variant suffix: "3pdt-fs" → "3pdt", "dpdt-fs" → "dpdt"
    v = re.sub(r'-fs$', '', v)
    # LED name suffix: "status led" → "status", "power led" → "power"
    v = re.sub(r'\s+led$', '', v)
    return v.strip()


def is_alias(a: str, b: str) -> bool:
    """Return True if a and b are known aliases of each other."""
    na, nb = normalise(a), normalise(b)
    return VALUE_ALIASES.get(na) == nb or VALUE_ALIASES.get(nb) == na


def types_compatible(type_a: str, type_b: str) -> bool:
    """Return True if two component types can be matched against each other."""
    if type_a == type_b:
        return True
    group_a = COMPATIBLE_TYPE_GROUPS.get(type_a)
    group_b = COMPATIBLE_TYPE_GROUPS.get(type_b)
    return group_a is not None and group_a == group_b


def image_to_base64(path: Path, page_number: int | None = None) -> tuple[str, str]:
    """
    Convert an image or PDF to base64.
    For PDFs: extract the specified page (1-based) as PNG using pdf2image.
    If page_number is None, defaults to page 1.
    Returns (base64_string, mime_type).
    """
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        try:
            from pdf2image import convert_from_path
        except ImportError:
            print("  ERROR: pdf2image not installed. Run: pip install pdf2image")
            raise

        pg = page_number or 1
        pages = convert_from_path(str(path), first_page=pg, last_page=pg, dpi=150)
        if not pages:
            raise ValueError(f"Could not extract page {pg} from PDF: {path}")
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
    """Search INBOX_DIR then REFERENCE_DIR for a file matching source_file (case-insensitive)."""
    target = Path(source_file).name.lower()
    for search_dir in (INBOX_DIR, REFERENCE_DIR):
        if not search_dir.exists():
            continue
        for candidate in search_dir.iterdir():
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

            if not types_compatible(found_type, ref_type):
                continue  # wrong type entirely — keep looking

            norm_ref = normalise(ref_value)
            norm_found = normalise(found_value)

            # Cross-type matches (e.g. ic vs op-amp) cap at SCORE_ALIAS
            type_mismatch = found_type != ref_type

            if norm_ref == norm_found:
                match_score = SCORE_ALIAS if type_mismatch else SCORE_EXACT
                if match_score > best_match_score:
                    best_match_score = match_score
                    best_match_idx = i
                    best_disc_type = "exact" if not type_mismatch else "alias"
                if not type_mismatch:
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
    # Offboard types (jacks, footswitch) are present on some schematics and absent on others.
    # Don't penalise Claude for finding them when the reference simply omitted them — only
    # penalise if the reference explicitly includes that type (so mismatches still count).
    OFFBOARD_TYPES = {"input-jack", "output-jack", "dc-jack", "footswitch"}
    # Synthetic reference designators injected by injectOffBoardComponents() after Claude responds.
    # These are never in any real schematic — always exempt from the EXTRA penalty.
    SYNTHETIC_REFS = {"J_IN", "J_OUT", "J_DC", "FS1", "LED1", "R_CLR"}
    ref_types_present = {c["component_type"] for c in reference}

    total_ref_qty = sum(c.get("quantity", 1) for c in reference)
    for i, found_comp in enumerate(found_pool):
        if i not in matched_found_indices:
            comp_type = found_comp.get("component_type", "")
            found_refs = set(found_comp.get("reference_designators", []))
            # Exempt synthetic off-board refs injected post-analysis
            if found_refs and found_refs.issubset(SYNTHETIC_REFS):
                continue
            if comp_type in OFFBOARD_TYPES and comp_type not in ref_types_present:
                # Offboard component not in reference — neutral, not penalised
                continue
            total_score += SCORE_EXTRA
            discrepancies.append(
                {
                    "discrepancy_type": "extra",
                    "expected_value": None,
                    "found_value": found_comp.get("value"),
                    "component_type": comp_type,
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


def get_prompt_hash() -> str:
    """SHA-256 of the Claude prompt file — changes when prompt is edited."""
    content = PROMPT_FILE.read_bytes() if PROMPT_FILE.exists() else b""
    return hashlib.sha256(content).hexdigest()[:16]


def load_cache() -> tuple[str, dict]:
    """Load cache file. Returns (prompt_hash, results_dict)."""
    if not CACHE_FILE.exists():
        return "", {}
    try:
        data = json.loads(CACHE_FILE.read_text())
        return data.get("prompt_hash", ""), data.get("results", {})
    except Exception:
        return "", {}


def save_cache(prompt_hash: str, results: dict) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps({"prompt_hash": prompt_hash, "results": results}, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="BOM accuracy test against reference circuits")
    parser.add_argument("--circuit", metavar="NAME", help="Filter to circuit name (substring match, case-insensitive)")
    parser.add_argument("--detail", action="store_true", help="Print per-component match details")
    parser.add_argument("--no-issues", action="store_true", help="Skip filing GitHub issues for failures")
    parser.add_argument("--force", action="store_true", help="Ignore cache and re-run all circuits via API")
    args = parser.parse_args()

    prompt_hash = get_prompt_hash()
    cached_hash, cache = load_cache()
    # Invalidate entire cache if prompt changed
    if cached_hash != prompt_hash:
        if cached_hash:
            print(f"[cache] Prompt changed — invalidating all cached results ({cached_hash[:8]} → {prompt_hash[:8]})\n")
        cache = {}
    elif args.force:
        print("[cache] --force: ignoring cache\n")
        cache = {}
    # Always bypass cache when targeting a specific circuit
    use_cache = not args.force and not args.circuit

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # Load all reference circuits
    cur.execute("SELECT id, name, source_file, page_number FROM public.reference_circuits ORDER BY name")
    circuits = cur.fetchall()

    if not circuits:
        print("No reference circuits found in database.")
        print("Run tools/populate_ground_truth.py first.")
        sys.exit(0)

    if args.circuit:
        circuits = [c for c in circuits if args.circuit.lower() in c[1].lower()]
        if not circuits:
            print(f"No circuits matching '{args.circuit}'")
            sys.exit(1)

    print(f"Testing {len(circuits)} circuits against {API_URL}\n")

    results = []

    for circuit_id, circuit_name, source_file, page_number in circuits:
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

        # If no page_number for a multi-page PDF, warn and skip
        if img_path.suffix.lower() == ".pdf" and page_number is None:
            print(f"  WARNING: multi-page PDF '{source_file}' has no page_number set — skipping")
            print(f"  Add \"page_number\": N to the ground-truth JSON and re-run populate_ground_truth.py")
            results.append(
                {
                    "name": circuit_name,
                    "expected": 0,
                    "found": 0,
                    "score": None,
                    "status": "SKIP (no page_number)",
                }
            )
            continue

        # Convert to base64
        try:
            img_b64, img_type = image_to_base64(img_path, page_number=page_number)
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

        # ── Cache check ───────────────────────────────────────────
        if use_cache and circuit_name in cache:
            cached = cache[circuit_name]
            score = cached["score"]
            total_ref_qty = cached["total_ref_qty"]
            total_found_qty = cached["total_found_qty"]
            discrepancies = cached["discrepancies"]
            status_str = cached["status_str"]
            print(f"  [cached {cached.get('cached_at','')[:10]}] Score: {score:.1f}%")
            if args.detail:
                for d in sorted(discrepancies, key=lambda x: x["discrepancy_type"]):
                    dtype = d["discrepancy_type"]
                    ctype = d.get("component_type", "?")
                    ref = d.get("reference_designator") or ""
                    exp = d.get("expected_value") or "—"
                    got = d.get("found_value") or "—"
                    if dtype == "missing":
                        print(f"    ✗ MISSING  {ctype} {ref}: expected {exp}")
                    elif dtype == "wrong_value":
                        print(f"    ~ WRONG    {ctype} {ref}: expected {exp}, got {got}")
                    elif dtype == "extra":
                        print(f"    + EXTRA    {ctype} {ref}: {got}")
            if score < PASS_THRESHOLD:
                print(f"  {status_str}")
            results.append({"name": circuit_name, "expected": total_ref_qty, "found": total_found_qty,
                             "score": score, "status": status_str})
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

        if args.detail:
            for d in sorted(discrepancies, key=lambda x: x["discrepancy_type"]):
                dtype = d["discrepancy_type"]
                ctype = d.get("component_type", "?")
                ref = d.get("reference_designator") or ""
                exp = d.get("expected_value") or "—"
                got = d.get("found_value") or "—"
                if dtype == "missing":
                    print(f"    ✗ MISSING  {ctype} {ref}: expected {exp}")
                elif dtype == "wrong_value":
                    print(f"    ~ WRONG    {ctype} {ref}: expected {exp}, got {got}")
                elif dtype == "extra":
                    print(f"    + EXTRA    {ctype} {ref}: {got}")

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

        # ── Save to cache ─────────────────────────────────────────
        if score >= PASS_THRESHOLD:
            status_str = "PASS"
        elif circuit_name in SOURCE_LIMITED:
            status_str = "SOURCE LIMITED"
        else:
            status_str = "FAIL"
        cache[circuit_name] = {
            "score": score,
            "total_ref_qty": total_ref_qty,
            "total_found_qty": total_found_qty,
            "discrepancies": discrepancies,
            "status_str": status_str,
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }
        save_cache(prompt_hash, cache)

        # File issue if below threshold
        status_str = "PASS"
        if score < PASS_THRESHOLD:
            if circuit_name in SOURCE_LIMITED:
                print(f"  SOURCE LIMITED — {SOURCE_LIMITED[circuit_name]}")
                status_str = "SOURCE LIMITED"
            elif args.no_issues:
                print(f"  FAIL")
                status_str = "FAIL"
            else:
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
    tested_count = sum(1 for r in results if r.get("score") is not None and r["status"] != "SOURCE LIMITED")
    limited_count = sum(1 for r in results if r.get("status") == "SOURCE LIMITED")
    print(f"\n{pass_count}/{tested_count} circuits passing at {PASS_THRESHOLD:.0f}%+", end="")
    if limited_count:
        print(f"  ({limited_count} excluded: source quality limited)", end="")
    print()


if __name__ == "__main__":
    main()
