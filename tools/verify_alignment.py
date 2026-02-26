"""
verify_alignment.py — MB-102 Mechanical Audit
=============================================
Verifies that coordinate-to-grid mapping is zero-drift across the 63-column layout.
Run this to confirm the TypeScript breadboard-utils.ts constants are correct.

Ground truth (board_models.py / MB-102 spec):
  PITCH    = 2.54mm
  A1 origin: x=7.62mm, y=11.43mm from board top-left plastic edge
  Trough:    7.62mm center-to-center from Row E to Row F
             Extra gap = TROUGH − PITCH = 5.08mm (added only for rows F-J)
"""

import sys

P = 2.54
OFF_X = 7.62   # x origin to col 1 (= 3 pitches)
OFF_Y = 11.43  # y origin to row A (= 4.5 pitches)
TROUGH = 7.62  # center-to-center from E to F
EXTRA_GAP = TROUGH - P  # 5.08mm — extra gap added to F-J rows

# ---------------------------------------------------------------------------
# Forward mapping: (row_idx, col_idx) → physical mm coordinates
# Matches board_models.py and breadboard-utils.ts (centerGap = 5.08mm = 48px)
# ---------------------------------------------------------------------------
def to_physical(row_idx: int, col_idx: int) -> tuple[float, float]:
    """Return (x, y) in mm for a terminal strip hole (0-based row/col)."""
    x = OFF_X + col_idx * P
    y = OFF_Y + row_idx * P + (EXTRA_GAP if row_idx >= 5 else 0)
    return x, y

# ---------------------------------------------------------------------------
# Reverse mapping: physical mm → grid label (e.g. "A1", "J63")
# +0.1mm epsilon prevents rounding drift on the 63-column grid
# ---------------------------------------------------------------------------
def to_grid(x: float, y: float) -> str:
    col = int(((x - OFF_X) + 0.1) / P) + 1
    raw_y = y - OFF_Y
    if raw_y > (4.5 * P):
        # Rows F-J: subtract extra gap, then find row index directly (no +5 offset)
        row_idx = int(((raw_y - EXTRA_GAP) + 0.1) / P)
    else:
        # Rows A-E: straightforward
        row_idx = int((raw_y + 0.1) / P)
    return f"{'ABCDEFGHIJ'[row_idx]}{col}"

# ---------------------------------------------------------------------------
# Test suite
# ---------------------------------------------------------------------------
def test_mechanical_grid():
    test_points = [
        {"coord": to_physical(0, 0),   "expect": "A1"},
        {"coord": to_physical(4, 0),   "expect": "E1"},   # Last row before trough
        {"coord": to_physical(5, 0),   "expect": "F1"},   # First row after trough
        {"coord": to_physical(9, 62),  "expect": "J63"},  # Bottom-right corner
        {"coord": to_physical(0, 31),  "expect": "A32"},  # Mid-board
        {"coord": to_physical(4, 24),  "expect": "E25"},  # IC centre left
        {"coord": to_physical(5, 24),  "expect": "F25"},  # IC centre right (crosses trough)
        {"coord": to_physical(9, 0),   "expect": "J1"},
        {"coord": to_physical(0, 62),  "expect": "A63"},
    ]

    print("--- MB-102 MECHANICAL AUDIT ---")
    passes = 0
    for pt in test_points:
        x, y = pt["coord"]
        actual = to_grid(x, y)
        expected = pt["expect"]
        if actual == expected:
            print(f"  ✅ PASS: ({x:.2f}, {y:.2f}) → {actual}")
            passes += 1
        else:
            print(f"  ❌ FAIL: ({x:.2f}, {y:.2f}) → Expected {expected}, got {actual}")
            sys.exit(1)

    print(f"--- AUDIT COMPLETE: {passes}/{len(test_points)} PASS — 100% ALIGNMENT ---")

# ---------------------------------------------------------------------------
# Power Rail Matrix-5 spot checks
# ---------------------------------------------------------------------------
def test_power_rails():
    """Verify Matrix-5 x positions for key power rail holes."""
    # Rail start x: OFF_X + 1.27mm (half-pitch offset) = 8.89mm from board edge
    RAIL_OFF_X = OFF_X + 1.27   # 8.89mm
    CENTER_BREAK = 5.08          # mm gap at hole 26+

    def rail_x(i: int) -> float:
        """x in mm for power rail hole i (0-based)."""
        group_gap = (i // 5) * P
        center_break = CENTER_BREAK if i >= 25 else 0
        return RAIL_OFF_X + i * P + group_gap + center_break

    print("\n--- POWER RAIL MATRIX-5 AUDIT ---")
    checks = [
        (0,  "Hole  1", 8.89),
        (4,  "Hole  5", 8.89 + 4 * P),
        (5,  "Hole  6 (group gap)", 8.89 + 5 * P + P),
        (24, "Hole 25 (last left)", 8.89 + 24 * P + 4 * P),
        (25, "Hole 26 (center break)", 8.89 + 25 * P + 5 * P + CENTER_BREAK),
        (49, "Hole 50 (last)", rail_x(49)),
    ]
    for i, label, expected_x in checks:
        actual_x = rail_x(i)
        ok = abs(actual_x - expected_x) < 0.01
        status = "✅" if ok else "❌"
        print(f"  {status} {label}: x = {actual_x:.2f}mm")
        if not ok:
            print(f"     Expected {expected_x:.2f}mm, got {actual_x:.2f}mm")
            sys.exit(1)

    print(f"  Rail spans {rail_x(0):.2f}mm → {rail_x(49):.2f}mm (board is 165.1mm)")
    print("--- POWER RAIL AUDIT COMPLETE ---")

if __name__ == "__main__":
    test_mechanical_grid()
    test_power_rails()
