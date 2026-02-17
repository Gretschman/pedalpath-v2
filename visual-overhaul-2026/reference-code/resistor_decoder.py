# -*- coding: utf-8 -*-
"""Resistor color-code decoder and encoder for PedalPath v2.

Supports:
  - 4-band and 5-band color-code decoding (bands -> value)
  - Reverse encoding (value -> bands) for build guides
  - E-series validation (E12, E24, E48, E96)
  - Human-friendly formatting with proper Unicode symbols

All lookup tables are complete per IEC 60062.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional

# ---------------------------------------------------------------------------
# Lookup tables (complete per IEC 60062)
# ---------------------------------------------------------------------------

DIGIT_COLORS: dict[str, int] = {
    "black":  0,
    "brown":  1,
    "red":    2,
    "orange": 3,
    "yellow": 4,
    "green":  5,
    "blue":   6,
    "violet": 7,
    "purple": 7,   # alias
    "gray":   8,
    "grey":   8,   # alias
    "white":  9,
}

# Reverse: digit -> canonical color name (no aliases)
DIGIT_TO_COLOR: dict[int, str] = {
    0: "black",
    1: "brown",
    2: "red",
    3: "orange",
    4: "yellow",
    5: "green",
    6: "blue",
    7: "violet",
    8: "gray",
    9: "white",
}

MULTIPLIER_COLORS: dict[str, float] = {
    "black":  1,
    "brown":  10,
    "red":    100,
    "orange": 1_000,
    "yellow": 10_000,
    "green":  100_000,
    "blue":   1_000_000,
    "violet": 10_000_000,
    "purple": 10_000_000,   # alias
    "gray":   100_000_000,
    "grey":   100_000_000,  # alias
    "white":  1_000_000_000,
    "gold":   0.1,
    "silver": 0.01,
}

# Reverse: multiplier value -> canonical color name
MULTIPLIER_TO_COLOR: dict[float, str] = {
    1:             "black",
    10:            "brown",
    100:           "red",
    1_000:         "orange",
    10_000:        "yellow",
    100_000:       "green",
    1_000_000:     "blue",
    10_000_000:    "violet",
    100_000_000:   "gray",
    1_000_000_000: "white",
    0.1:           "gold",
    0.01:          "silver",
}

TOLERANCE_COLORS: dict[str, float] = {
    "brown":  1.0,
    "red":    2.0,
    "green":  0.5,
    "blue":   0.25,
    "violet": 0.1,
    "purple": 0.1,    # alias
    "gray":   0.05,
    "grey":   0.05,   # alias
    "gold":   5.0,
    "silver": 10.0,
}

# Reverse: tolerance percent -> canonical color name
TOLERANCE_TO_COLOR: dict[float, str] = {
    0.05: "gray",
    0.1:  "violet",
    0.25: "blue",
    0.5:  "green",
    1.0:  "brown",
    2.0:  "red",
    5.0:  "gold",
    10.0: "silver",
}

# ---------------------------------------------------------------------------
# E-series standard values (significands, multiply by decade)
# ---------------------------------------------------------------------------

E12_VALUES: tuple[float, ...] = (
    1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2,
)

E24_VALUES: tuple[float, ...] = (
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
    3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
)

E48_VALUES: tuple[float, ...] = (
    1.00, 1.05, 1.10, 1.15, 1.21, 1.27, 1.33, 1.40, 1.47, 1.54,
    1.62, 1.69, 1.78, 1.87, 1.96, 2.05, 2.15, 2.26, 2.37, 2.49,
    2.61, 2.74, 2.87, 3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02,
    4.22, 4.42, 4.64, 4.87, 5.11, 5.36, 5.62, 5.90, 6.19, 6.49,
    6.81, 7.15, 7.50, 7.87, 8.25, 8.66, 9.09, 9.53,
)

E96_VALUES: tuple[float, ...] = (
    1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24,
    1.27, 1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58,
    1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00,
    2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55,
    2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24,
    3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
    4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23,
    5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65,
    6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45,
    8.66, 8.87, 9.09, 9.31, 9.53, 9.76,
)

E_SERIES: dict[str, tuple[float, ...]] = {
    "E12": E12_VALUES,
    "E24": E24_VALUES,
    "E48": E48_VALUES,
    "E96": E96_VALUES,
}


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ResistorValue:
    """Decoded resistor value with tolerance and E-series info."""

    ohms: float
    tolerance_percent: Optional[float] = None
    bands: tuple[str, ...] = ()
    e_series_match: Optional[str] = None        # e.g. "E24"
    nearest_standard: Optional[float] = None     # nearest E-series ohm value

    def pretty(self) -> str:
        value = format_ohms(self.ohms)
        tol = f" ±{self.tolerance_percent:g}%" if self.tolerance_percent is not None else ""
        return f"{value}{tol}"

    def summary(self) -> str:
        """Multi-line summary suitable for UI display."""
        lines = [f"Value:     {self.pretty()}"]
        if self.bands:
            lines.append(f"Bands:     {' / '.join(self.bands)}")
        if self.e_series_match:
            lines.append(f"E-series:  standard {self.e_series_match} value")
        elif self.nearest_standard is not None:
            near = format_ohms(self.nearest_standard)
            lines.append(f"E-series:  non-standard (nearest E96 = {near})")
        return "\n".join(lines)


@dataclass(frozen=True)
class EncodedResistor:
    """Result of encoding an ohm value to color bands."""

    ohms: float
    bands_5: tuple[str, ...]
    bands_4: Optional[tuple[str, ...]]
    tolerance_color: str
    tolerance_percent: float

    def pretty_5band(self) -> str:
        return " / ".join(self.bands_5)

    def pretty_4band(self) -> str:
        if self.bands_4 is None:
            return "(not representable as 4-band)"
        return " / ".join(self.bands_4)


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def format_ohms(ohms: float) -> str:
    """Format an ohm value with SI prefix and Ω symbol."""
    units = [
        (1_000_000_000, "GΩ"),
        (1_000_000,     "MΩ"),
        (1_000,         "kΩ"),
        (1,             "Ω"),
    ]
    for scale, unit in units:
        if ohms >= scale:
            scaled = ohms / scale
            if float(scaled).is_integer():
                return f"{int(scaled)} {unit}"
            return f"{scaled:.3g} {unit}"
    # Sub-ohm values
    if ohms > 0:
        return f"{ohms:.3g} Ω"
    return "0 Ω"


# ---------------------------------------------------------------------------
# E-series validation
# ---------------------------------------------------------------------------

def find_e_series(ohms: float) -> tuple[Optional[str], Optional[float]]:
    """Check which E-series (if any) contains this value.

    Returns (series_name, None) if exact match, or
    (None, nearest_e96_value) if no match found.
    """
    if ohms <= 0:
        return None, None

    # Normalize to significand in [1.0, 10.0)
    decade = 10 ** math.floor(math.log10(ohms))
    significand = ohms / decade

    # Round to 2 decimal places to handle float imprecision
    sig_rounded = round(significand, 2)

    # Check each series from most restrictive to least
    for series_name in ("E12", "E24", "E48", "E96"):
        series_values = E_SERIES[series_name]
        for val in series_values:
            if abs(round(val, 2) - sig_rounded) < 0.005:
                return series_name, None

    # No match -- find nearest E96 value
    best_val = None
    best_diff = float("inf")
    for val in E96_VALUES:
        candidate = val * decade
        diff = abs(candidate - ohms)
        if diff < best_diff:
            best_diff = diff
            best_val = candidate
    return None, best_val


# ---------------------------------------------------------------------------
# Decoder (bands -> value)
# ---------------------------------------------------------------------------

def decode_resistor(bands: list[str] | tuple[str, ...]) -> ResistorValue:
    """Decode a resistor value from its color bands.

    Args:
        bands: Color names left-to-right.
               5-band: [d1, d2, d3, multiplier, tolerance]
               4-band: [d1, d2, multiplier, tolerance]

    Returns:
        ResistorValue with ohms, tolerance, E-series info, and original bands.

    Raises:
        ValueError: If band count is wrong or a color is unrecognized.
    """
    normalized = tuple(b.strip().lower() for b in bands)

    if len(normalized) == 5:
        d1, d2, d3, mult_band, tol_band = normalized
        try:
            digits = (DIGIT_COLORS[d1] * 100) + (DIGIT_COLORS[d2] * 10) + DIGIT_COLORS[d3]
            multiplier = MULTIPLIER_COLORS[mult_band]
        except KeyError as exc:
            raise ValueError(f"Unsupported color for 5-band decoding: {exc.args[0]}") from exc
        tolerance = TOLERANCE_COLORS.get(tol_band)
        ohms = digits * multiplier

    elif len(normalized) == 4:
        d1, d2, mult_band, tol_band = normalized
        try:
            digits = (DIGIT_COLORS[d1] * 10) + DIGIT_COLORS[d2]
            multiplier = MULTIPLIER_COLORS[mult_band]
        except KeyError as exc:
            raise ValueError(f"Unsupported color for 4-band decoding: {exc.args[0]}") from exc
        tolerance = TOLERANCE_COLORS.get(tol_band)
        ohms = digits * multiplier

    else:
        raise ValueError(f"Expected 4 or 5 color bands, got {len(normalized)}.")

    series_name, nearest = find_e_series(ohms)

    return ResistorValue(
        ohms=ohms,
        tolerance_percent=tolerance,
        bands=normalized,
        e_series_match=series_name,
        nearest_standard=nearest,
    )


# ---------------------------------------------------------------------------
# Encoder (value -> bands)  --  the reverse lookup PedalPath needs
# ---------------------------------------------------------------------------

def encode_resistor(
    ohms: float,
    tolerance_percent: float = 1.0,
) -> EncodedResistor:
    """Encode an ohm value into color bands.

    Args:
        ohms: Resistance in ohms (e.g. 47000 for 47k).
        tolerance_percent: Desired tolerance (default 1% = brown, typical metal film).

    Returns:
        EncodedResistor with 5-band (always) and 4-band (when possible).

    Raises:
        ValueError: If the value can't be represented or tolerance is unknown.
    """
    if tolerance_percent not in TOLERANCE_TO_COLOR:
        valid = sorted(TOLERANCE_TO_COLOR.keys())
        raise ValueError(
            f"Tolerance {tolerance_percent}% not available. "
            f"Valid: {valid}"
        )
    tol_color = TOLERANCE_TO_COLOR[tolerance_percent]

    bands_5 = _encode_5band(ohms, tol_color)
    bands_4 = _encode_4band(ohms, tol_color)

    return EncodedResistor(
        ohms=ohms,
        bands_5=bands_5,
        bands_4=bands_4,
        tolerance_color=tol_color,
        tolerance_percent=tolerance_percent,
    )


def _encode_5band(ohms: float, tol_color: str) -> tuple[str, ...]:
    """Encode to 5-band: 3 digit bands + multiplier + tolerance."""
    if ohms <= 0:
        raise ValueError("Resistance must be positive.")

    # Try each multiplier to find 3-digit significand in [100, 999]
    for mult_value in sorted(MULTIPLIER_TO_COLOR.keys()):
        if mult_value <= 0:
            continue
        candidate = ohms / mult_value
        if 99.5 <= candidate <= 999.5:
            sig = round(candidate)
            if abs(sig * mult_value - ohms) / max(ohms, 1e-12) < 0.001:
                d1 = sig // 100
                d2 = (sig // 10) % 10
                d3 = sig % 10
                return (
                    DIGIT_TO_COLOR[d1],
                    DIGIT_TO_COLOR[d2],
                    DIGIT_TO_COLOR[d3],
                    MULTIPLIER_TO_COLOR[mult_value],
                    tol_color,
                )

    # Try gold (0.1) and silver (0.01) multipliers for sub-10 ohm values
    for mult_value in (0.1, 0.01):
        candidate = ohms / mult_value
        if 99.5 <= candidate <= 999.5:
            sig = round(candidate)
            if abs(sig * mult_value - ohms) / max(ohms, 1e-12) < 0.01:
                d1 = sig // 100
                d2 = (sig // 10) % 10
                d3 = sig % 10
                return (
                    DIGIT_TO_COLOR[d1],
                    DIGIT_TO_COLOR[d2],
                    DIGIT_TO_COLOR[d3],
                    MULTIPLIER_TO_COLOR[mult_value],
                    tol_color,
                )

    raise ValueError(f"Cannot represent {ohms} Ω as a 5-band resistor.")


def _encode_4band(ohms: float, tol_color: str) -> Optional[tuple[str, ...]]:
    """Encode to 4-band: 2 digit bands + multiplier + tolerance.

    Returns None if the value needs 3 significant digits.
    """
    for mult_value in sorted(MULTIPLIER_TO_COLOR.keys()):
        if mult_value <= 0:
            continue
        candidate = ohms / mult_value
        if 9.5 <= candidate <= 99.5:
            sig = round(candidate)
            if abs(sig * mult_value - ohms) / max(ohms, 1e-12) < 0.001:
                d1 = sig // 10
                d2 = sig % 10
                return (
                    DIGIT_TO_COLOR[d1],
                    DIGIT_TO_COLOR[d2],
                    MULTIPLIER_TO_COLOR[mult_value],
                    tol_color,
                )

    # Try fractional multipliers
    for mult_value in (0.1, 0.01):
        candidate = ohms / mult_value
        if 9.5 <= candidate <= 99.5:
            sig = round(candidate)
            if abs(sig * mult_value - ohms) / max(ohms, 1e-12) < 0.01:
                d1 = sig // 10
                d2 = sig % 10
                return (
                    DIGIT_TO_COLOR[d1],
                    DIGIT_TO_COLOR[d2],
                    MULTIPLIER_TO_COLOR[mult_value],
                    tol_color,
                )

    return None


# ---------------------------------------------------------------------------
# Demo / smoke test
# ---------------------------------------------------------------------------

def _demo() -> None:
    print("=" * 65)
    print("RESISTOR DECODER / ENCODER DEMO")
    print("=" * 65)

    decode_examples = {
        "47k (5-band)":   ["yellow", "violet", "black", "red", "brown"],
        "4.7k (5-band)":  ["yellow", "violet", "black", "brown", "brown"],
        "560 (5-band)":   ["green", "blue", "black", "black", "brown"],
        "1M (5-band)":    ["brown", "black", "black", "yellow", "brown"],
        "4.7 (4-band gold mult)": ["yellow", "violet", "gold", "gold"],
        "10k (4-band silver tol)": ["brown", "black", "orange", "silver"],
        "0.47 (5-band silver mult)": ["yellow", "violet", "black", "silver", "brown"],
    }

    print("\n--- DECODE (bands → value) ---")
    for label, bands in decode_examples.items():
        try:
            result = decode_resistor(bands)
            print(f"\n  {label}")
            print(f"    {result.summary()}")
        except ValueError as e:
            print(f"\n  {label}  ERROR: {e}")

    print("\n--- ENCODE (value → bands) ---")
    encode_examples = [
        (47_000, 1.0),
        (4_700, 5.0),
        (560, 1.0),
        (1_000_000, 2.0),
        (4.7, 5.0),
        (0.47, 1.0),
        (22_000, 10.0),
    ]

    for ohms, tol in encode_examples:
        try:
            enc = encode_resistor(ohms, tol)
            print(f"\n  {format_ohms(ohms)} ±{tol:g}%")
            print(f"    5-band: {enc.pretty_5band()}")
            print(f"    4-band: {enc.pretty_4band()}")
        except ValueError as e:
            print(f"\n  {format_ohms(ohms)} ±{tol:g}%  ERROR: {e}")

    print("\n--- E-SERIES VALIDATION ---")
    test_values = [47_000, 4_700, 560, 1_000_000, 47_300, 123_456]
    for v in test_values:
        series, nearest = find_e_series(v)
        if series:
            print(f"  {format_ohms(v):>10}  →  standard {series} value")
        else:
            print(f"  {format_ohms(v):>10}  →  NON-STANDARD (nearest E96: {format_ohms(nearest)})")


if __name__ == "__main__":
    _demo()
