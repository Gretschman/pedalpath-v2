# -*- coding: utf-8 -*-
"""Comprehensive test suite for resistor and capacitor decoders.

Run with: python test_decoders.py
"""

from __future__ import annotations
import sys

from resistor_decoder import (
    decode_resistor, encode_resistor, find_e_series, format_ohms,
    TOLERANCE_TO_COLOR,
)
from capacitor_decoder import (
    decode_capacitor, encode_capacitor, decode_with_type,
    CapType, pf_to_units, nf_to_units, uf_to_units,
)

_pass = 0
_fail = 0

def section(name):
    print(f"\n{'='*60}\n  {name}\n{'='*60}")

def check(desc, cond, detail=""):
    global _pass, _fail
    if cond:
        _pass += 1
        print(f"  ✓ {desc}")
    else:
        _fail += 1
        extra = f" -- {detail}" if detail else ""
        print(f"  ✗ FAIL: {desc}{extra}")

def check_raises(desc, exc_type, fn, *a, **kw):
    global _pass, _fail
    try:
        fn(*a, **kw)
        _fail += 1; print(f"  ✗ FAIL: {desc} (no exception)")
    except exc_type:
        _pass += 1; print(f"  ✓ {desc}")
    except Exception as e:
        _fail += 1; print(f"  ✗ FAIL: {desc} (wrong: {e})")

def approx(a, b, rel=0.001):
    if b == 0: return abs(a) < rel
    return abs(a - b) / max(abs(b), 1e-12) < rel


# ===================================================================
# RESISTOR TESTS
# ===================================================================

def test_r_5band():
    section("Resistor: 5-Band Decode")
    cases = [
        (["brown","black","black","black","brown"],   100, 1.0),
        (["brown","black","black","brown","brown"],   1000, 1.0),
        (["yellow","violet","black","red","brown"],   47000, 1.0),
        (["brown","black","black","yellow","brown"],  1000000, 1.0),
        (["green","blue","black","black","brown"],    560, 1.0),
        (["red","red","black","red","brown"],         22000, 1.0),
        (["orange","orange","black","orange","brown"], 330000, 1.0),
    ]
    for bands, ohms, tol in cases:
        r = decode_resistor(bands)
        check(f"{format_ohms(ohms)}: ohms correct", approx(r.ohms, ohms), f"got {r.ohms}")
        check(f"{format_ohms(ohms)}: tol={tol}%", r.tolerance_percent == tol)

def test_r_4band():
    section("Resistor: 4-Band Decode")
    cases = [
        (["yellow","violet","orange","gold"], 47000, 5.0),
        (["brown","black","red","silver"], 1000, 10.0),
        (["yellow","violet","gold","gold"], 4.7, 5.0),
        (["red","red","orange","silver"], 22000, 10.0),
    ]
    for bands, ohms, tol in cases:
        r = decode_resistor(bands)
        check(f"{format_ohms(ohms)}: ohms", approx(r.ohms, ohms), f"got {r.ohms}")
        check(f"{format_ohms(ohms)}: tol={tol}%", r.tolerance_percent == tol)

def test_r_all_tolerances():
    section("Resistor: All Tolerance Colors")
    base = ["brown","black","black","red"]  # 10k
    expected = {"brown":1.0,"red":2.0,"green":0.5,"blue":0.25,
                "violet":0.1,"gray":0.05,"gold":5.0,"silver":10.0}
    for color, pct in expected.items():
        r = decode_resistor(base + [color])
        check(f"{color} = ±{pct}%", r.tolerance_percent == pct, f"got {r.tolerance_percent}")

def test_r_silver_multiplier():
    section("Resistor: Silver/Gold Multipliers")
    r = decode_resistor(["yellow","violet","black","silver","brown"])
    check("Silver mult: 470*0.01=4.7Ω", approx(r.ohms, 4.7))
    r2 = decode_resistor(["yellow","violet","gold","gold"])
    check("Gold mult: 47*0.1=4.7Ω", approx(r2.ohms, 4.7))

def test_r_encode():
    section("Resistor: Encode + Round-Trip")
    cases = [(47000,1.0),(4700,5.0),(560,1.0),(1000000,2.0),(22000,10.0),(4.7,5.0)]
    for ohms, tol in cases:
        enc = encode_resistor(ohms, tol)
        check(f"Encode {format_ohms(ohms)}: 5 bands", len(enc.bands_5) == 5)
        dec = decode_resistor(list(enc.bands_5))
        check(f"Round-trip {format_ohms(ohms)}", approx(dec.ohms, ohms), f"got {dec.ohms}")

def test_r_encode_all_tol():
    section("Resistor: Encode All Tolerances")
    for pct, color in TOLERANCE_TO_COLOR.items():
        enc = encode_resistor(10000, pct)
        check(f"±{pct}% -> {color}", enc.tolerance_color == color)

def test_r_4band_encode():
    section("Resistor: 4-Band Encode")
    enc = encode_resistor(47000, 5.0)
    check("47k has 4-band", enc.bands_4 is not None)
    if enc.bands_4:
        dec = decode_resistor(list(enc.bands_4))
        check("47k 4-band round-trips", approx(dec.ohms, 47000))
    enc2 = encode_resistor(475, 1.0)
    check("475Ω has no 4-band (3 sig digits)", enc2.bands_4 is None)

def test_r_eseries():
    section("Resistor: E-Series Validation")
    for v in [100, 120, 150, 220, 330, 470, 1000, 4700, 10000, 47000, 100000]:
        s, _ = find_e_series(v)
        check(f"{format_ohms(v)} is E12", s == "E12", f"got {s}")
    for v in [47300, 123456]:
        s, n = find_e_series(v)
        check(f"{format_ohms(v)} non-standard", s is None)
        check(f"{format_ohms(v)} has nearest", n is not None)

def test_r_pedal_values():
    section("Resistor: All Common Pedal Values")
    vals = [100,220,330,470,560,680,1000,1500,2200,3300,4700,5600,6800,
            10000,15000,22000,33000,47000,68000,100000,150000,220000,
            330000,390000,470000,680000,1000000,2200000,4700000,10000000,
            4.7,10,22,47]
    fails = 0
    for v in vals:
        try:
            enc = encode_resistor(v, 1.0)
            dec = decode_resistor(list(enc.bands_5))
            if not approx(dec.ohms, v): fails += 1
        except: fails += 1
    check(f"All {len(vals)} pedal resistors round-trip", fails == 0, f"{fails} failed")

def test_r_errors():
    section("Resistor: Error Handling")
    check_raises("3 bands", ValueError, decode_resistor, ["red","red","red"])
    check_raises("6 bands", ValueError, decode_resistor, ["red"]*6)
    check_raises("Bad color", ValueError, decode_resistor, ["red","pink","blue","brown","gold"])
    check_raises("Empty", ValueError, decode_resistor, [])
    check_raises("Bad tolerance", ValueError, encode_resistor, 10000, 3.0)
    check_raises("Zero ohms", ValueError, encode_resistor, 0, 1.0)

def test_r_aliases():
    section("Resistor: Color Aliases")
    r1 = decode_resistor(["violet","grey","black","red","brown"])
    r2 = decode_resistor(["purple","gray","black","red","brown"])
    check("violet/purple + grey/gray interchangeable", r1.ohms == r2.ohms)


# ===================================================================
# CAPACITOR TESTS
# ===================================================================

def test_c_eia():
    section("Capacitor: EIA 3-Digit Decode")
    cases = [
        ("473", 47000, None, None),
        ("223", 22000, None, None),
        ("104", 100000, None, None),
        ("471", 470, None, None),
        ("222", 2200, None, None),
        ("100", 10, None, None),
        ("220", 22, None, None),
        ("473J250", 47000, 5.0, 250),
        ("223K100", 22000, 10.0, 100),
        ("104M", 100000, 20.0, None),
    ]
    for marking, pf, tol, volt in cases:
        d = decode_capacitor(marking)
        check(f"\"{marking}\": pf={pf}", approx(d.capacitance.pf, pf), f"got {d.capacitance.pf}")
        if tol: check(f"\"{marking}\": tol={tol}%", d.tolerance_percent == tol)
        if volt: check(f"\"{marking}\": volt={volt}V", d.voltage_max == volt)

def test_c_alpha():
    section("Capacitor: Alphanumeric Decode")
    cases = [
        ("47n", 47000), ("47nF", 47000), ("47nK100", 47000),
        ("0.047uF", 47000), ("100p", 100), ("22n", 22000),
        ("0.1uF", 100000), ("10nJ63", 10000),
    ]
    for marking, pf in cases:
        d = decode_capacitor(marking)
        check(f"\"{marking}\": pf={pf}", approx(d.capacitance.pf, pf), f"got {d.capacitance.pf}")

def test_c_rdecimal():
    section("Capacitor: R-Decimal Notation")
    cases = [
        ("4n7", 4700), ("2n2", 2200), ("1n5", 1500),
        ("4p7", 4.7), ("1n0", 1000),
    ]
    for marking, pf in cases:
        d = decode_capacitor(marking)
        check(f"\"{marking}\": pf={pf}", approx(d.capacitance.pf, pf), f"got {d.capacitance.pf}")

def test_c_electrolytic():
    section("Capacitor: Electrolytic Decode")
    cases = [
        ("47uF 25V", 47e6, 25),
        ("100uF/16V", 100e6, 16),
        ("10u 50V", 10e6, 50),
        ("220uF 35V", 220e6, 35),
        ("1uF 50V", 1e6, 50),
    ]
    for marking, pf, volt in cases:
        d = decode_capacitor(marking)
        check(f"\"{marking}\": type=electrolytic", d.cap_type == CapType.ELECTROLYTIC)
        check(f"\"{marking}\": pf", approx(d.capacitance.pf, pf), f"got {d.capacitance.pf}")
        check(f"\"{marking}\": volt={volt}V", d.voltage_max == volt)

def test_c_unit_conversion():
    section("Capacitor: Unit Conversion")
    u = pf_to_units(47000)
    check("47000pF -> 47nF", approx(u.nf, 47))
    check("47000pF -> 0.047uF", approx(u.uf, 0.047))

    u2 = nf_to_units(100)
    check("100nF -> 100000pF", approx(u2.pf, 100000))
    check("100nF -> 0.1uF", approx(u2.uf, 0.1))

    u3 = uf_to_units(10)
    check("10uF -> 10000nF", approx(u3.nf, 10000))
    check("10uF -> 10000000pF", approx(u3.pf, 10000000))

def test_c_type_heuristic():
    section("Capacitor: Type Classification")
    # Sub-1nF -> ceramic
    d1 = decode_capacitor("471")  # 470pF
    check("470pF -> ceramic", d1.cap_type == CapType.CERAMIC)

    # 1nF-1uF -> film_box
    d2 = decode_capacitor("473")  # 47nF
    check("47nF -> film_box", d2.cap_type == CapType.FILM_BOX)

    # >1uF -> electrolytic
    d3 = decode_capacitor("47uF 25V")
    check("47uF -> electrolytic", d3.cap_type == CapType.ELECTROLYTIC)

    # Type override
    d4 = decode_with_type("104", CapType.CERAMIC)
    check("104 override to ceramic", d4.cap_type == CapType.CERAMIC)

def test_c_encode():
    section("Capacitor: Encode + Round-Trip")
    cases = [
        (dict(nf=47), 10.0, 100, "473K100", "47nK100"),
        (dict(nf=22), 5.0, 250, "223J250", "22nJ250"),
        (dict(pf=470), 10.0, None, "471K", "0n47K"),
        (dict(nf=4.7), 5.0, 63, "472J63", "4n7J63"),
    ]
    for kw, tol, volt, exp_eia, exp_alpha in cases:
        enc = encode_capacitor(**kw, tolerance_percent=tol, voltage=volt)
        check(f"EIA: {exp_eia}", enc.full_film_code == exp_eia, f"got {enc.full_film_code}")
        check(f"Alpha: {exp_alpha}", enc.full_alpha_code == exp_alpha, f"got {enc.full_alpha_code}")
        # Round-trip EIA
        dec = decode_capacitor(enc.full_film_code)
        orig_pf = list(kw.values())[0] * (1000 if "nf" in kw else (1 if "pf" in kw else 1e6))
        check(f"Round-trip {enc.full_film_code}", approx(dec.capacitance.pf, orig_pf))

def test_c_pedal_values():
    section("Capacitor: Common Pedal Values Round-Trip")
    nf_vals = [0.47, 1, 2.2, 3.3, 4.7, 10, 22, 33, 47, 68, 100, 220, 470]
    fails = 0
    for nf in nf_vals:
        try:
            enc = encode_capacitor(nf=nf, tolerance_percent=10.0, voltage=100)
            dec = decode_capacitor(enc.full_film_code)
            if not approx(dec.capacitance.nf, nf): fails += 1
        except: fails += 1
    check(f"All {len(nf_vals)} pedal cap values round-trip", fails == 0, f"{fails} failed")

def test_c_tolerance_codes():
    section("Capacitor: All Tolerance Codes Decode")
    for letter in ["J", "K", "M", "F", "G"]:
        marking = f"473{letter}100"
        d = decode_capacitor(marking)
        check(f"Tolerance {letter} recognized", d.tolerance_percent is not None, f"marking={marking}")

def test_c_errors():
    section("Capacitor: Error Handling")
    check_raises("Empty string", ValueError, decode_capacitor, "")
    check_raises("Nonsense", ValueError, decode_capacitor, "XYZZY")
    check_raises("Bad tolerance for encode", ValueError, encode_capacitor, nf=47, tolerance_percent=3.0)
    check_raises("No value for encode", ValueError, encode_capacitor, tolerance_percent=10.0)
    check_raises("Multiple values for encode", ValueError, encode_capacitor, nf=47, pf=47000, tolerance_percent=10.0)


# ===================================================================
# RUN ALL TESTS
# ===================================================================

def main():
    print("=" * 60)
    print("  PEDALPATH v2 — COMPONENT DECODER TEST SUITE")
    print("=" * 60)

    # Resistor tests
    test_r_5band()
    test_r_4band()
    test_r_all_tolerances()
    test_r_silver_multiplier()
    test_r_encode()
    test_r_encode_all_tol()
    test_r_4band_encode()
    test_r_eseries()
    test_r_pedal_values()
    test_r_errors()
    test_r_aliases()

    # Capacitor tests
    test_c_eia()
    test_c_alpha()
    test_c_rdecimal()
    test_c_electrolytic()
    test_c_unit_conversion()
    test_c_type_heuristic()
    test_c_encode()
    test_c_pedal_values()
    test_c_tolerance_codes()
    test_c_errors()

    print(f"\n{'='*60}")
    print(f"  RESULTS: {_pass} passed, {_fail} failed")
    print(f"{'='*60}")
    sys.exit(1 if _fail > 0 else 0)


if __name__ == "__main__":
    main()
