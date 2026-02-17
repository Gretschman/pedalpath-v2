# -*- coding: utf-8 -*-
"""PedalPath v2 integration module for component decoders.

Bridges the resistor and capacitor decoders with PedalPath's:
  - BOM generator (component list -> decoded details)
  - Component advisory database (type-specific build tips)
  - Build guide step generator (value -> visual identification hints)
  - API contract for the React Native / Next.js frontend

This module is the single import point for the frontend API layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import re

from resistor_decoder import (
    ResistorValue,
    EncodedResistor,
    decode_resistor,
    encode_resistor,
    find_e_series,
    format_ohms,
)

from capacitor_decoder import (
    DecodedCap,
    EncodedCap,
    CapType,
    CapUnit,
    decode_capacitor,
    encode_capacitor,
    decode_with_type,
    pf_to_units,
    nf_to_units,
    uf_to_units,
)


# ---------------------------------------------------------------------------
# Component advisory database
# (Pulled from PedalPath's existing reference tables)
# ---------------------------------------------------------------------------

class ComponentAdvice:
    """Build tips and warnings specific to component types in pedal circuits."""

    RESISTOR_ADVICE = {
        "metal_film": {
            "use": "Everything - best all-around choice for pedals",
            "notes": "1% tolerance, low noise, stable. Standard for pedals.",
            "identification": "Usually blue or green body, 5 color bands.",
            "avoid": None,
        },
        "carbon_film": {
            "use": "Anywhere metal film is used",
            "notes": "5% tolerance. Slightly noisier than metal film but fine for most pedal circuits.",
            "identification": "Usually beige/tan body, 4 color bands.",
            "avoid": "High-impedance circuits where noise matters (e.g., input stages of high-gain preamps).",
        },
        "carbon_comp": {
            "use": "Vintage-accurate builds only",
            "notes": "Worse specs than modern resistors but 'vintage mojo'. Drift over time.",
            "identification": "Larger body, earth-tone colors, typically 4 bands.",
            "avoid": "Modern builds - no benefit except nostalgia and higher noise floor.",
        },
    }

    CAPACITOR_ADVICE = {
        CapType.FILM_BOX: {
            "use": "Audio path - coupling, tone shaping. The workhorse of pedal building.",
            "notes": "Low distortion, stable, excellent for audio. Polyester, polypropylene, or 'box' types.",
            "identification": "Rectangular plastic body, usually yellow, blue, or red. Marked with 3-digit EIA code.",
            "avoid": "Nothing - this is the default choice for audio path caps.",
            "polarity": False,
            "audio_path_safe": True,
        },
        CapType.CERAMIC: {
            "use": "Power filtering, high-frequency bypass (small values only in audio path).",
            "notes": "Cheap, small, but can add distortion in audio path. OK for 470pF-1000pF filter caps and power supply decoupling.",
            "identification": "Small disc shape, usually orange/brown. Marked with 3-digit code (e.g., '104').",
            "avoid": "Large values (>0.01µF) in audio path - use film instead. Ceramics can introduce microphonics.",
            "polarity": False,
            "audio_path_safe": False,  # with caveats
        },
        CapType.ELECTROLYTIC: {
            "use": "Power supply filtering, large value coupling caps (>1µF).",
            "notes": "Polarized! Positive lead toward higher DC voltage. Good for >1µF values.",
            "identification": "Cylindrical, stripe on negative side. Value/voltage printed directly (e.g., '47µF 25V').",
            "avoid": "Audio path unless >1µF is needed and no film alternative exists. Watch polarity!",
            "polarity": True,
            "audio_path_safe": False,
        },
        CapType.TANTALUM: {
            "use": "Power filtering where space is limited.",
            "notes": "Polarized. Better than electrolytic for some applications but can fail catastrophically if reverse-biased.",
            "identification": "Small teardrop shape, colored body. Stripe or dot marks positive lead.",
            "avoid": "Audio path. Use with voltage derating. Can explode if reverse-biased or over-voltaged.",
            "polarity": True,
            "audio_path_safe": False,
        },
    }


# ---------------------------------------------------------------------------
# Unified component result (API response model)
# ---------------------------------------------------------------------------

@dataclass
class ComponentLookupResult:
    """Unified result returned by the PedalPath component lookup API.

    This is the data contract between the Python backend and the
    React Native / Next.js frontend.
    """

    # Core identification
    component_type: str                  # "resistor" or "capacitor"
    input_query: str                     # what the user typed or BOM entry

    # Decoded value
    value_display: str                   # "47 kΩ ±1%" or "47 nF ±10% 100V"
    value_detail: str                    # multi-line summary

    # For build guide: how to find this part in a bag
    identification_hints: list[str]      # ["Look for: yellow/violet/black/red/brown bands"]

    # Equivalent markings (what to look for on the part)
    markings: list[str]                  # ["473K100", "47nK100"] or ["yellow/violet/black/red/brown"]

    # Advisory from component database
    build_advice: Optional[str] = None
    warnings: list[str] = field(default_factory=list)

    # For frontend rendering
    band_colors: Optional[list[str]] = None          # resistor only
    cap_type: Optional[str] = None                    # capacitor only
    cap_all_units: Optional[str] = None               # "47000 pF / 47 nF / 0.047 µF"
    e_series: Optional[str] = None                    # "E24" or "non-standard"
    is_polarized: Optional[bool] = None               # capacitor only

    def to_dict(self) -> dict:
        """Serialize to dict for JSON API response."""
        d = {
            "component_type": self.component_type,
            "input_query": self.input_query,
            "value_display": self.value_display,
            "value_detail": self.value_detail,
            "identification_hints": self.identification_hints,
            "markings": self.markings,
            "build_advice": self.build_advice,
            "warnings": self.warnings,
        }
        if self.band_colors is not None:
            d["band_colors"] = self.band_colors
        if self.cap_type is not None:
            d["cap_type"] = self.cap_type
        if self.cap_all_units is not None:
            d["cap_all_units"] = self.cap_all_units
        if self.e_series is not None:
            d["e_series"] = self.e_series
        if self.is_polarized is not None:
            d["is_polarized"] = self.is_polarized
        return d


# ---------------------------------------------------------------------------
# High-level API functions
# ---------------------------------------------------------------------------

def lookup_resistor_by_value(
    ohms: float,
    tolerance_percent: float = 1.0,
) -> ComponentLookupResult:
    """Look up a resistor by its ohm value (for build guides).

    This is the primary use case: PedalPath's BOM says "R3: 47kΩ"
    and the builder needs to know what color bands to look for.
    """
    enc = encode_resistor(ohms, tolerance_percent)
    series_name, nearest = find_e_series(ohms)

    hints = [f"Look for these color bands: {enc.pretty_5band()}"]
    if enc.bands_4 is not None:
        hints.append(f"4-band alternative: {enc.pretty_4band()}")

    advice_key = "metal_film"  # default for pedal builds
    advice = ComponentAdvice.RESISTOR_ADVICE[advice_key]

    warnings = []
    if series_name is None and nearest is not None:
        warnings.append(
            f"Non-standard value. Nearest E96 standard: {format_ohms(nearest)}. "
            f"Check your schematic."
        )

    return ComponentLookupResult(
        component_type="resistor",
        input_query=f"{format_ohms(ohms)} ±{tolerance_percent:g}%",
        value_display=f"{format_ohms(ohms)} ±{tolerance_percent:g}%",
        value_detail=f"5-band: {enc.pretty_5band()}\n4-band: {enc.pretty_4band()}",
        identification_hints=hints,
        markings=[enc.pretty_5band(), enc.pretty_4band()],
        build_advice=advice["notes"],
        warnings=warnings,
        band_colors=list(enc.bands_5),
        e_series=series_name if series_name else f"non-standard (nearest: {format_ohms(nearest)})" if nearest else None,
    )


def lookup_resistor_by_bands(
    bands: list[str],
) -> ComponentLookupResult:
    """Look up a resistor by its color bands (for identification).

    The builder is staring at a resistor and wants to know its value.
    """
    dec = decode_resistor(bands)
    series_name, nearest = find_e_series(dec.ohms)

    warnings = []
    if series_name is None and nearest is not None:
        warnings.append(
            f"Decoded value {format_ohms(dec.ohms)} is non-standard. "
            f"Nearest E96: {format_ohms(nearest)}. Possible misread?"
        )

    return ComponentLookupResult(
        component_type="resistor",
        input_query=" / ".join(bands),
        value_display=dec.pretty(),
        value_detail=dec.summary(),
        identification_hints=[f"Value: {dec.pretty()}"],
        markings=[" / ".join(dec.bands)],
        build_advice=ComponentAdvice.RESISTOR_ADVICE["metal_film"]["notes"],
        warnings=warnings,
        band_colors=list(dec.bands),
        e_series=series_name or "non-standard",
    )


def lookup_capacitor_by_marking(
    marking: str,
    cap_type_override: Optional[CapType] = None,
) -> ComponentLookupResult:
    """Look up a capacitor by its printed marking.

    The builder reads "473J250" off a capacitor and wants to know the value.
    """
    if cap_type_override:
        dec = decode_with_type(marking, cap_type_override)
    else:
        dec = decode_capacitor(marking)

    advice = ComponentAdvice.CAPACITOR_ADVICE.get(dec.cap_type, {})
    warnings = []

    # Audio path warning for ceramic caps in larger values
    if dec.cap_type == CapType.CERAMIC and dec.capacitance.pf > 10_000:
        warnings.append(
            "This is a ceramic capacitor with a relatively large value. "
            "Consider using a film capacitor if it's in the audio signal path."
        )

    # Polarity warning for electrolytics
    is_polarized = advice.get("polarity", False)
    if is_polarized:
        warnings.append(
            "This capacitor is POLARIZED. The positive lead must go toward "
            "higher DC voltage. Incorrect polarity can cause failure."
        )

    return ComponentLookupResult(
        component_type="capacitor",
        input_query=marking,
        value_display=dec.pretty(),
        value_detail=dec.summary(),
        identification_hints=[
            advice.get("identification", "Check marking on component body.")
        ],
        markings=[dec.source_code],
        build_advice=advice.get("notes"),
        warnings=warnings,
        cap_type=dec.cap_type.value,
        cap_all_units=dec.capacitance.all_units(),
        is_polarized=is_polarized,
    )


def lookup_capacitor_by_value(
    pf: Optional[float] = None,
    nf: Optional[float] = None,
    uf: Optional[float] = None,
    tolerance_percent: float = 10.0,
    voltage: Optional[int] = 100,
) -> ComponentLookupResult:
    """Look up a capacitor by its value (for build guides).

    PedalPath's BOM says "C3: 47nF" and the builder needs to know
    what markings to look for on the part.
    """
    enc = encode_capacitor(
        pf=pf, nf=nf, uf=uf,
        tolerance_percent=tolerance_percent,
        voltage=voltage,
    )

    # Determine likely cap type from value
    cap_type = CapType.FILM_BOX
    if enc.capacitance.uf >= 1.0:
        cap_type = CapType.ELECTROLYTIC
    elif enc.capacitance.pf < 1_000:
        cap_type = CapType.CERAMIC

    advice = ComponentAdvice.CAPACITOR_ADVICE.get(cap_type, {})
    is_polarized = advice.get("polarity", False)

    hints = [
        f"Look for EIA code: {enc.full_film_code}",
        f"Or alphanumeric: {enc.full_alpha_code}",
        advice.get("identification", ""),
    ]
    hints = [h for h in hints if h]

    warnings = []
    if is_polarized:
        warnings.append(
            "This capacitor is POLARIZED. Watch orientation during installation."
        )

    return ComponentLookupResult(
        component_type="capacitor",
        input_query=enc.capacitance.pretty(),
        value_display=enc.capacitance.pretty(),
        value_detail=enc.summary(),
        identification_hints=hints,
        markings=[enc.full_film_code, enc.full_alpha_code],
        build_advice=advice.get("notes"),
        warnings=warnings,
        cap_type=cap_type.value,
        cap_all_units=enc.capacitance.all_units(),
        is_polarized=is_polarized,
    )


# ---------------------------------------------------------------------------
# BOM integration: process a full component list
# ---------------------------------------------------------------------------

@dataclass
class BOMComponent:
    """A single component from a PedalPath BOM."""
    ref: str            # "R1", "C3", "Q1"
    comp_type: str      # "Resistor", "Capacitor", etc.
    value: str          # "47k", "47nF", "2N5088"
    description: str    # "1/4W Metal Film"
    quantity: int = 1


def process_bom_component(comp: BOMComponent) -> Optional[ComponentLookupResult]:
    """Process a single BOM component through the decoders.

    Returns a ComponentLookupResult if the component is a resistor or capacitor,
    None otherwise (transistors, ICs, etc. are not yet supported).
    """
    ref_upper = comp.ref.upper()
    value = comp.value.strip()

    # Resistor: ref starts with R, or type contains "resistor"
    if ref_upper.startswith("R") or "resistor" in comp.comp_type.lower():
        ohms = _parse_resistor_value_string(value)
        if ohms is not None:
            return lookup_resistor_by_value(ohms)

    # Capacitor: ref starts with C, or type contains "capacitor"
    if ref_upper.startswith("C") or "capacitor" in comp.comp_type.lower():
        try:
            return lookup_capacitor_by_marking(value)
        except ValueError:
            # Try parsing as a plain value
            pass

    return None


def _parse_resistor_value_string(value: str) -> Optional[float]:
    """Parse common resistor value strings from BOMs.

    Examples: "47k", "4.7k", "100", "1M", "2.2M", "470", "4.7", "560R"
    """
    value = value.strip().upper()

    # Remove trailing ohm symbol
    value = value.replace("Ω", "").replace("OHM", "").replace("OHMS", "").strip()

    # Pattern: number + optional multiplier suffix
    m = re.match(r'^(\d+\.?\d*)\s*([KMR]?)$', value, re.IGNORECASE)
    if m:
        num = float(m.group(1))
        suffix = m.group(2).upper()
        multipliers = {"": 1, "R": 1, "K": 1_000, "M": 1_000_000}
        return num * multipliers.get(suffix, 1)

    # Pattern: number with decimal replaced by multiplier (4K7 = 4.7k)
    m = re.match(r'^(\d+)([KMR])(\d+)$', value, re.IGNORECASE)
    if m:
        int_part = m.group(1)
        suffix = m.group(2).upper()
        frac_part = m.group(3)
        num = float(f"{int_part}.{frac_part}")
        multipliers = {"R": 1, "K": 1_000, "M": 1_000_000}
        return num * multipliers.get(suffix, 1)

    return None


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def _demo() -> None:
    print("=" * 65)
    print("  PEDALPATH v2 — COMPONENT INTEGRATION DEMO")
    print("=" * 65)

    # Scenario 1: Build guide says "install R3: 47k"
    print("\n--- Scenario 1: Build guide step 'Install R3: 47kΩ' ---")
    result = lookup_resistor_by_value(47_000, 1.0)
    for key, val in result.to_dict().items():
        if val:
            print(f"  {key}: {val}")

    # Scenario 2: Builder reads "473J250" off a capacitor
    print("\n--- Scenario 2: Builder reads '473J250' off a cap ---")
    result = lookup_capacitor_by_marking("473J250")
    for key, val in result.to_dict().items():
        if val:
            print(f"  {key}: {val}")

    # Scenario 3: BOM says "C3: 47nF" and builder needs to find it
    print("\n--- Scenario 3: BOM says 'C3: 47nF', find the part ---")
    result = lookup_capacitor_by_value(nf=47, voltage=100)
    for key, val in result.to_dict().items():
        if val:
            print(f"  {key}: {val}")

    # Scenario 4: Builder has a bag of parts, reads bands
    print("\n--- Scenario 4: Read bands off a mystery resistor ---")
    result = lookup_resistor_by_bands(["yellow", "violet", "black", "red", "brown"])
    for key, val in result.to_dict().items():
        if val:
            print(f"  {key}: {val}")

    # Scenario 5: Electrolytic with polarity warning
    print("\n--- Scenario 5: Electrolytic cap '47uF 25V' ---")
    result = lookup_capacitor_by_marking("47uF 25V")
    for key, val in result.to_dict().items():
        if val:
            print(f"  {key}: {val}")

    # Scenario 6: Process BOM entries
    print("\n--- Scenario 6: Process BOM components ---")
    bom = [
        BOMComponent("R1", "Resistor", "2.2M", "1/4W Metal Film"),
        BOMComponent("R2", "Resistor", "390k", "1/4W Metal Film"),
        BOMComponent("R3", "Resistor", "47k", "1/4W Metal Film"),
        BOMComponent("C1", "Capacitor", "0.1uF", "Film"),
        BOMComponent("C2", "Capacitor", "47nF", "Film"),
        BOMComponent("C3", "Capacitor", "47uF 25V", "Electrolytic"),
        BOMComponent("Q1", "Transistor", "2N5088", "NPN"),
    ]

    for comp in bom:
        result = process_bom_component(comp)
        if result:
            print(f"\n  {comp.ref} ({comp.value}):")
            print(f"    -> {result.value_display}")
            print(f"    -> Hints: {result.identification_hints[0]}")
            if result.warnings:
                print(f"    -> ⚠️  {result.warnings[0]}")
        else:
            print(f"\n  {comp.ref} ({comp.value}): (decoder not available for {comp.comp_type})")


if __name__ == "__main__":
    _demo()
