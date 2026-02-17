# -*- coding: utf-8 -*-
"""Capacitor marking decoder and encoder for PedalPath v2.

Supports:
  - Box film capacitor codes: EIA 3-digit (473), alphanumeric (47nK100)
  - Ceramic disc codes: EIA 3-digit (104, 222)
  - Electrolytic markings: direct value + voltage (47uF 25V)
  - Tantalum markings: direct value + voltage
  - Bidirectional: decode (marking -> value) and encode (value -> marking)
  - Unit conversion: always provides pF, nF, uF
  - Tolerance and voltage parsing

OCR/image/PDF features deferred to Phase 3.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional

# ---------------------------------------------------------------------------
# Constants and lookup tables
# ---------------------------------------------------------------------------

class CapType(Enum):
    """Capacitor type classification."""
    FILM_BOX = "film_box"
    CERAMIC = "ceramic"
    ELECTROLYTIC = "electrolytic"
    TANTALUM = "tantalum"
    UNKNOWN = "unknown"


# Tolerance letter codes (IEC / EIA standard)
TOLERANCE_CODES: dict[str, float] = {
    "B": 0.1,    # \u00b10.1pF (only for very small values)
    "C": 0.25,   # \u00b10.25pF
    "D": 0.5,    # \u00b10.5pF
    "F": 1.0,    # \u00b11%
    "G": 2.0,    # \u00b12%
    "J": 5.0,    # \u00b15%
    "K": 10.0,   # \u00b110%
    "M": 20.0,   # \u00b120%
    "Z": -20.0,  # +80/-20% (special, used on some electrolytics)
}

# Reverse: tolerance percent -> letter (common ones only)
TOLERANCE_TO_LETTER: dict[float, str] = {
    1.0:  "F",
    2.0:  "G",
    5.0:  "J",
    10.0: "K",
    20.0: "M",
}

# IEC 60062 voltage codes (letter + digit)
# Common on smaller film/ceramic caps where space is tight
VOLTAGE_CODES: dict[str, int] = {
    "0G": 4,    "0L": 5,    "0J": 6,    "1A": 10,   "1B": 12,
    "1C": 16,   "1E": 25,   "1H": 50,   "1J": 63,   "1K": 80,
    "2A": 100,  "2B": 125,  "2C": 160,  "2D": 200,  "2E": 250,
    "2F": 315,  "2G": 400,  "2H": 500,  "2J": 630,  "2K": 800,
    "3A": 1000, "3B": 1250, "3C": 1600, "3D": 2000, "3E": 2500,
}

# Reverse: voltage -> common code
VOLTAGE_TO_CODE: dict[int, str] = {v: k for k, v in VOLTAGE_CODES.items()}

# Unit multipliers relative to picofarads
UNIT_TO_PF: dict[str, float] = {
    "pf": 1.0,
    "p":  1.0,
    "nf": 1_000.0,
    "n":  1_000.0,
    "uf": 1_000_000.0,
    "u":  1_000_000.0,
    "\u00b5f": 1_000_000.0,   # micro sign
    "\u00b5":  1_000_000.0,
    "mf": 1_000_000.0,        # old notation, sometimes seen
}

# Standard capacitor values in the E12 series (significands)
E12_CAP_VALUES: tuple[float, ...] = (
    1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2,
)

# Common film cap voltages
COMMON_VOLTAGES: tuple[int, ...] = (
    25, 50, 63, 100, 160, 200, 250, 400, 500, 630, 1000,
)


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class CapUnit:
    """Capacitance expressed in all three units."""
    pf: float
    nf: float
    uf: float

    def pretty(self) -> str:
        """Return the most natural unit representation."""
        if self.uf >= 1.0:
            return f"{_fmt(self.uf)} \u00b5F"
        if self.nf >= 1.0:
            return f"{_fmt(self.nf)} nF"
        return f"{_fmt(self.pf)} pF"

    def all_units(self) -> str:
        """All three units on one line."""
        return f"{_fmt(self.pf)} pF  /  {_fmt(self.nf)} nF  /  {_fmt(self.uf)} \u00b5F"


@dataclass(frozen=True)
class DecodedCap:
    """Result of decoding a capacitor marking."""

    capacitance: CapUnit
    tolerance_percent: Optional[float] = None
    tolerance_letter: Optional[str] = None
    voltage_max: Optional[int] = None
    cap_type: CapType = CapType.UNKNOWN
    source_code: str = ""
    confidence: float = 1.0

    def pretty(self) -> str:
        parts = [self.capacitance.pretty()]
        if self.tolerance_letter and self.tolerance_percent:
            parts.append(f"\u00b1{self.tolerance_percent:g}% ({self.tolerance_letter})")
        elif self.tolerance_percent:
            parts.append(f"\u00b1{self.tolerance_percent:g}%")
        if self.voltage_max:
            parts.append(f"{self.voltage_max}V")
        return "  ".join(parts)

    def summary(self) -> str:
        lines = [
            f"Value:      {self.capacitance.all_units()}",
            f"Type:       {self.cap_type.value}",
        ]
        if self.tolerance_percent and self.tolerance_letter:
            lines.append(f"Tolerance:  \u00b1{self.tolerance_percent:g}% (code: {self.tolerance_letter})")
        elif self.tolerance_percent:
            lines.append(f"Tolerance:  \u00b1{self.tolerance_percent:g}%")
        if self.voltage_max:
            lines.append(f"Voltage:    {self.voltage_max}V max")
        if self.source_code:
            lines.append(f"Source:     \"{self.source_code}\"")
        if self.confidence < 1.0:
            lines.append(f"Confidence: {self.confidence:.0%}")
        return "\n".join(lines)


@dataclass(frozen=True)
class EncodedCap:
    """Result of encoding a capacitance value to marking strings."""

    capacitance: CapUnit
    eia_code: str              # e.g. "473"
    alpha_code: str            # e.g. "47n"
    full_film_code: str        # e.g. "473K100"
    full_alpha_code: str       # e.g. "47nK100"
    tolerance_letter: str
    voltage: Optional[int]

    def summary(self) -> str:
        lines = [
            f"Value:       {self.capacitance.all_units()}",
            f"EIA code:    {self.eia_code}",
            f"Alpha code:  {self.alpha_code}",
            f"Film box:    {self.full_film_code}",
            f"Alpha full:  {self.full_alpha_code}",
        ]
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fmt(val: float) -> str:
    """Format a numeric value cleanly (no trailing zeros, reasonable precision)."""
    if val == 0:
        return "0"
    if val >= 1000:
        if float(val).is_integer():
            return f"{int(val)}"
        return f"{val:.1f}"
    if val >= 1:
        if float(val).is_integer():
            return f"{int(val)}"
        return f"{val:.3g}"
    # Sub-1 values
    return f"{val:.4g}"


def pf_to_units(pf: float) -> CapUnit:
    """Convert picofarads to all three units."""
    return CapUnit(
        pf=pf,
        nf=pf / 1_000,
        uf=pf / 1_000_000,
    )


def nf_to_units(nf: float) -> CapUnit:
    """Convert nanofarads to all three units."""
    return pf_to_units(nf * 1_000)


def uf_to_units(uf: float) -> CapUnit:
    """Convert microfarads to all three units."""
    return pf_to_units(uf * 1_000_000)


# ---------------------------------------------------------------------------
# Decoder (marking -> value)
# ---------------------------------------------------------------------------

# Regex patterns for different marking styles

# Pattern 1: EIA 3-digit code with optional tolerance + voltage
# Examples: 473, 223K, 473J250, 104, 222K100
_RE_EIA = re.compile(
    r"^(\d{2})(\d)"                     # 2 significand digits + 1 multiplier digit
    r"(?:([A-MZ]))?"                    # optional tolerance letter
    r"(?:(\d{2,4}))?$",                 # optional voltage (2-4 digits)
    re.IGNORECASE,
)

# Pattern 2: Alphanumeric with explicit unit
# Examples: 47n, 47nK100, 0.047uF, 4.7n, 100p, 47nK, 0.047uF K 100
_RE_ALPHA = re.compile(
    r"^(\d+\.?\d*)"                     # numeric value
    r"\s*"
    r"([pnu\u00b5]f?)"                  # unit (p, n, u, pf, nf, uf, \u00b5f)
    r"\s*"
    r"([A-MZ])?"                        # optional tolerance letter
    r"\s*"
    r"(\d{2,4})?$",                     # optional voltage
    re.IGNORECASE,
)

# Pattern 2b: R-notation where unit letter replaces decimal point
# Examples: 4n7, 2u2, 4p7, 1n5K100
_RE_RDECIMAL = re.compile(
    r"^(\d+)"                           # integer part
    r"([pnu\u00b5])"                    # unit letter AS decimal point
    r"(\d+)"                            # fractional digits
    r"\s*"
    r"([A-MZ])?"                        # optional tolerance letter
    r"\s*"
    r"(\d{2,4})?$",                     # optional voltage
    re.IGNORECASE,
)

# Pattern 3: Direct electrolytic/tantalum style
# Examples: 47uF 25V, 100uF/16V, 10u 50V, 220uF 35V
_RE_ELECTROLYTIC = re.compile(
    r"^(\d+\.?\d*)"                     # numeric value
    r"\s*"
    r"([u\u00b5]f?)"                    # unit (must be uF for electrolytic)
    r"\s*[/,]?\s*"
    r"(\d{1,4})\s*[vV]$",              # voltage with V suffix
    re.IGNORECASE,
)


def decode_capacitor(marking: str) -> DecodedCap:
    """Decode a capacitor marking string.

    Handles:
      - EIA 3-digit codes: '473', '223K100', '104'
      - Alphanumeric: '47n', '47nK100', '0.047uF K 100'
      - R-decimal notation: '4n7', '2u2', '1n5K100'
      - Electrolytic: '47uF 25V', '100uF/16V'

    Args:
        marking: The text printed on the capacitor.

    Returns:
        DecodedCap with capacitance in all units, tolerance, voltage.

    Raises:
        ValueError: If the marking cannot be parsed.
    """
    cleaned = marking.strip()
    if not cleaned:
        raise ValueError("Empty marking string.")

    # Try electrolytic pattern first (has mandatory V suffix, most specific)
    result = _try_electrolytic(cleaned)
    if result:
        return result

    # Try R-decimal notation (4n7, 2u2) — before alpha since it's more specific
    result = _try_rdecimal(cleaned)
    if result:
        return result

    # Try alphanumeric pattern (has explicit unit letter)
    result = _try_alpha(cleaned)
    if result:
        return result

    # Try EIA 3-digit pattern (most ambiguous, try last)
    result = _try_eia(cleaned)
    if result:
        return result

    raise ValueError(
        f"Unable to decode \"{cleaned}\" - "
        f"no matching capacitor code pattern found."
    )


def _try_eia(marking: str) -> Optional[DecodedCap]:
    """Attempt EIA 3-digit decode."""
    m = _RE_EIA.match(marking)
    if not m:
        return None

    sig_str, mult_digit, tol_letter, voltage_str = m.groups()
    significand = int(sig_str)
    multiplier = int(mult_digit)

    # Special case: multiplier digit 8 = 0.01, digit 9 = 0.1 (for sub-pF, rare)
    if multiplier == 8:
        pf = significand * 0.01
    elif multiplier == 9:
        pf = significand * 0.1
    else:
        pf = significand * (10 ** multiplier)

    tol_pct = None
    if tol_letter:
        tol_letter = tol_letter.upper()
        tol_pct = TOLERANCE_CODES.get(tol_letter)

    voltage = int(voltage_str) if voltage_str else None

    # Guess cap type from value range
    cap_type = _guess_type_from_pf(pf, voltage)

    return DecodedCap(
        capacitance=pf_to_units(pf),
        tolerance_percent=tol_pct,
        tolerance_letter=tol_letter if tol_pct else None,
        voltage_max=voltage,
        cap_type=cap_type,
        source_code=marking,
    )


def _try_alpha(marking: str) -> Optional[DecodedCap]:
    """Attempt alphanumeric decode with explicit unit."""
    m = _RE_ALPHA.match(marking)
    if not m:
        return None

    value_str, unit_str, tol_letter, voltage_str = m.groups()
    value = float(value_str)
    unit_key = unit_str.lower().rstrip("f") + "f" if not unit_str.lower().endswith("f") else unit_str.lower()

    # Normalize unit key
    unit_lower = unit_str.lower()
    if unit_lower in UNIT_TO_PF:
        multiplier = UNIT_TO_PF[unit_lower]
    elif unit_lower + "f" in UNIT_TO_PF:
        multiplier = UNIT_TO_PF[unit_lower + "f"]
    else:
        return None

    pf = value * multiplier

    tol_pct = None
    if tol_letter:
        tol_letter = tol_letter.upper()
        tol_pct = TOLERANCE_CODES.get(tol_letter)

    voltage = int(voltage_str) if voltage_str else None
    cap_type = _guess_type_from_pf(pf, voltage)

    return DecodedCap(
        capacitance=pf_to_units(pf),
        tolerance_percent=tol_pct,
        tolerance_letter=tol_letter if tol_pct else None,
        voltage_max=voltage,
        cap_type=cap_type,
        source_code=marking,
    )


def _try_rdecimal(marking: str) -> Optional[DecodedCap]:
    """Attempt R-decimal notation decode (4n7, 2u2, 1n5K100)."""
    m = _RE_RDECIMAL.match(marking)
    if not m:
        return None

    int_part, unit_char, frac_part, tol_letter, voltage_str = m.groups()

    # Reconstruct the decimal value: "4" + "." + "7" = 4.7
    value = float(f"{int_part}.{frac_part}")

    unit_lower = unit_char.lower()
    if unit_lower in UNIT_TO_PF:
        multiplier = UNIT_TO_PF[unit_lower]
    elif unit_lower + "f" in UNIT_TO_PF:
        multiplier = UNIT_TO_PF[unit_lower + "f"]
    else:
        return None

    pf = value * multiplier

    tol_pct = None
    if tol_letter:
        tol_letter = tol_letter.upper()
        tol_pct = TOLERANCE_CODES.get(tol_letter)

    voltage = int(voltage_str) if voltage_str else None
    cap_type = _guess_type_from_pf(pf, voltage)

    return DecodedCap(
        capacitance=pf_to_units(pf),
        tolerance_percent=tol_pct,
        tolerance_letter=tol_letter if tol_pct else None,
        voltage_max=voltage,
        cap_type=cap_type,
        source_code=marking,
    )


def _try_electrolytic(marking: str) -> Optional[DecodedCap]:
    """Attempt electrolytic/tantalum decode."""
    m = _RE_ELECTROLYTIC.match(marking)
    if not m:
        return None

    value_str, unit_str, voltage_str = m.groups()
    value = float(value_str)

    unit_lower = unit_str.lower()
    if unit_lower in UNIT_TO_PF:
        multiplier = UNIT_TO_PF[unit_lower]
    elif unit_lower + "f" in UNIT_TO_PF:
        multiplier = UNIT_TO_PF[unit_lower + "f"]
    else:
        return None

    pf = value * multiplier
    voltage = int(voltage_str)

    # Electrolytics are typically 20% tolerance
    return DecodedCap(
        capacitance=pf_to_units(pf),
        tolerance_percent=20.0,
        tolerance_letter="M",
        voltage_max=voltage,
        cap_type=CapType.ELECTROLYTIC,
        source_code=marking,
        confidence=0.95,
    )


def _guess_type_from_pf(pf: float, voltage: Optional[int]) -> CapType:
    """Heuristic guess at capacitor type based on value and voltage."""
    uf = pf / 1_000_000

    # Very large values (>1uF) are almost always electrolytic
    if uf >= 1.0:
        return CapType.ELECTROLYTIC

    # Sub-1nF values (< 1000pF) are often ceramic
    if pf < 1_000:
        return CapType.CERAMIC

    # Film caps are common from 1nF to 1uF
    # Higher voltages strongly suggest film
    if voltage and voltage >= 50:
        return CapType.FILM_BOX

    # 1nF to 1uF range defaults to film (most common in pedals)
    if 1_000 <= pf <= 1_000_000:
        return CapType.FILM_BOX

    return CapType.UNKNOWN


# ---------------------------------------------------------------------------
# Encoder (value -> markings)
# ---------------------------------------------------------------------------

def encode_capacitor(
    pf: Optional[float] = None,
    nf: Optional[float] = None,
    uf: Optional[float] = None,
    tolerance_percent: float = 10.0,
    voltage: Optional[int] = None,
) -> EncodedCap:
    """Encode a capacitance value into standard marking strings.

    Provide exactly one of pf, nf, or uf.

    Args:
        pf: Value in picofarads.
        nf: Value in nanofarads.
        uf: Value in microfarads.
        tolerance_percent: Desired tolerance (default 10% = K).
        voltage: Max voltage rating (e.g. 100, 250).

    Returns:
        EncodedCap with EIA 3-digit code, alphanumeric code, and full codes.

    Raises:
        ValueError: If input is ambiguous or can't be encoded.
    """
    # Resolve to picofarads
    provided = sum(1 for x in (pf, nf, uf) if x is not None)
    if provided != 1:
        raise ValueError("Provide exactly one of pf, nf, or uf.")

    if pf is not None:
        pf_val = pf
    elif nf is not None:
        pf_val = nf * 1_000
    else:
        pf_val = uf * 1_000_000

    if pf_val <= 0:
        raise ValueError("Capacitance must be positive.")

    units = pf_to_units(pf_val)

    # Tolerance letter
    tol_letter = TOLERANCE_TO_LETTER.get(tolerance_percent)
    if tol_letter is None:
        raise ValueError(
            f"Tolerance {tolerance_percent}% has no standard letter code. "
            f"Valid: {sorted(TOLERANCE_TO_LETTER.keys())}"
        )

    # Generate EIA 3-digit code
    eia_code = _encode_eia(pf_val)

    # Generate alphanumeric code
    alpha_code = _encode_alpha(pf_val)

    # Full codes with tolerance and voltage
    voltage_str = str(voltage) if voltage else ""
    full_film = f"{eia_code}{tol_letter}{voltage_str}"
    full_alpha = f"{alpha_code}{tol_letter}{voltage_str}"

    return EncodedCap(
        capacitance=units,
        eia_code=eia_code,
        alpha_code=alpha_code,
        full_film_code=full_film,
        full_alpha_code=full_alpha,
        tolerance_letter=tol_letter,
        voltage=voltage,
    )


def _encode_eia(pf: float) -> str:
    """Generate EIA 3-digit code from picofarads.

    The code is: 2 significand digits + 1 multiplier digit (power of 10).
    Example: 47000 pF -> 473 (47 * 10^3)
    """
    if pf <= 0:
        raise ValueError("Capacitance must be positive.")

    # Handle sub-10 pF values (multiplier digits 8 and 9)
    if pf < 10:
        # For very small values, we use direct 2-digit + multiplier 0
        # e.g., 4.7 pF = 4R7 (but EIA doesn't handle this well)
        # Just return the integer rounded if possible
        sig = round(pf)
        if sig >= 10:
            return f"{sig}0"  # e.g., 10pF = 100
        if sig > 0:
            return f"{sig:02d}0"  # e.g., 4pF = "040" — non-standard
        raise ValueError(f"Cannot represent {pf} pF as EIA 3-digit code.")

    # Find the multiplier: pf = significand * 10^multiplier
    # significand must be 10-99 (two digits)
    import math
    for mult in range(0, 10):
        divisor = 10 ** mult
        sig = pf / divisor
        if 9.95 <= sig <= 99.5:
            sig_int = round(sig)
            # Verify round-trip
            if abs(sig_int * divisor - pf) / pf < 0.001:
                return f"{sig_int}{mult}"

    raise ValueError(f"Cannot represent {pf} pF as EIA 3-digit code.")


def _encode_alpha(pf: float) -> str:
    """Generate alphanumeric code from picofarads.

    Uses the most natural unit (p, n, or u).
    Examples: 47000 pF -> '47n', 4700 pF -> '4n7', 100 pF -> '100p'
    """
    uf = pf / 1_000_000
    nf = pf / 1_000

    # Use uF for values >= 0.1 uF
    if uf >= 0.1:
        return _alpha_fmt(uf, "u")

    # Use nF for values >= 0.1 nF
    if nf >= 0.1:
        return _alpha_fmt(nf, "n")

    # Use pF
    return _alpha_fmt(pf, "p")


def _alpha_fmt(value: float, unit: str) -> str:
    """Format a value with unit letter, using R-style decimal notation.

    Examples: 47.0 -> '47n', 4.7 -> '4n7', 0.47 -> '0u47'
    """
    if float(value).is_integer():
        return f"{int(value)}{unit}"

    # Check if it's a clean single-decimal value like 4.7
    int_part = int(value)
    frac_part = value - int_part
    frac_str = f"{frac_part:.3g}".lstrip("0").lstrip(".")

    if int_part > 0:
        return f"{int_part}{unit}{frac_str}"
    else:
        return f"0{unit}{frac_str}"


# ---------------------------------------------------------------------------
# Convenience: decode with type hint
# ---------------------------------------------------------------------------

def decode_with_type(
    marking: str,
    cap_type: Optional[CapType] = None,
) -> DecodedCap:
    """Decode a marking with an optional type override.

    If cap_type is provided, it overrides the heuristic guess.
    Useful when the user knows they're looking at a ceramic vs film cap.
    """
    result = decode_capacitor(marking)
    if cap_type is not None:
        # Create a new DecodedCap with the overridden type
        return DecodedCap(
            capacitance=result.capacitance,
            tolerance_percent=result.tolerance_percent,
            tolerance_letter=result.tolerance_letter,
            voltage_max=result.voltage_max,
            cap_type=cap_type,
            source_code=result.source_code,
            confidence=result.confidence,
        )
    return result


# ---------------------------------------------------------------------------
# Demo / smoke test
# ---------------------------------------------------------------------------

def _demo() -> None:
    print("=" * 65)
    print("CAPACITOR DECODER / ENCODER DEMO")
    print("=" * 65)

    decode_examples = [
        # Box film EIA codes
        ("473",       "Film box - 47nF bare EIA code"),
        ("223K100",   "Film box - 22nF, 10%, 100V"),
        ("473J250",   "Film box - 47nF, 5%, 250V"),
        ("104",       "Ceramic - 100nF bare EIA code"),
        ("222K100",   "Film box - 2.2nF, 10%, 100V"),
        ("471",       "Ceramic/Film - 470pF bare"),
        # Alphanumeric codes
        ("47nK100",   "Alpha - 47nF, 10%, 100V"),
        ("47n",       "Alpha - 47nF bare"),
        ("4n7",       "Alpha - 4.7nF"),
        ("100p",      "Alpha - 100pF"),
        ("0.047uF",   "Alpha - 0.047uF"),
        # Electrolytic style
        ("47uF 25V",  "Electrolytic - 47uF 25V"),
        ("100uF/16V", "Electrolytic - 100uF 16V"),
        ("10u 50V",   "Electrolytic - 10uF 50V"),
    ]

    print("\n--- DECODE (marking \u2192 value) ---")
    for marking, label in decode_examples:
        try:
            result = decode_capacitor(marking)
            print(f"\n  \"{marking}\"  ({label})")
            print(f"    {result.summary()}")
        except ValueError as e:
            print(f"\n  \"{marking}\"  ({label})")
            print(f"    ERROR: {e}")

    print("\n--- ENCODE (value \u2192 marking) ---")
    encode_examples = [
        (dict(nf=47), 10.0, 100, "47nF, K, 100V"),
        (dict(nf=22), 5.0, 250, "22nF, J, 250V"),
        (dict(pf=470), 10.0, None, "470pF, K"),
        (dict(uf=0.1), 10.0, 100, "0.1uF, K, 100V"),
        (dict(nf=4.7), 5.0, 63, "4.7nF, J, 63V"),
        (dict(pf=100), 5.0, None, "100pF, J"),
    ]

    for value_kwarg, tol, volt, label in encode_examples:
        try:
            enc = encode_capacitor(**value_kwarg, tolerance_percent=tol, voltage=volt)
            print(f"\n  {label}")
            print(f"    {enc.summary()}")
        except ValueError as e:
            print(f"\n  {label}")
            print(f"    ERROR: {e}")


if __name__ == "__main__":
    _demo()
