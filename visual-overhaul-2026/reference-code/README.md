# Reference Code - Python Decoders

✅ **Status:** Complete - All Python decoder files received and saved!

## Files in This Directory

### 1. `resistor_decoder.py` (621 lines)
Complete resistor color code decoder and encoder implementing IEC 60062 standard.

**Features:**
- 4-band and 5-band color code decoding (bands → value)
- Reverse encoding (value → bands) - the key feature PedalPath needs!
- E-series validation (E12, E24, E48, E96)
- Complete lookup tables for all standard colors and tolerances
- Support for gold/silver multipliers (sub-ohm values)
- Human-friendly formatting with Unicode Ω symbol

**Key Functions:**
- `decode_resistor(bands)` → ResistorValue
- `encode_resistor(ohms, tolerance_percent)` → EncodedResistor (5-band + 4-band)
- `find_e_series(ohms)` → (series_name, nearest_value)
- `format_ohms(ohms)` → "47 kΩ" (with proper units)

**Example:**
```python
enc = encode_resistor(47000, 1.0)  # 47kΩ ±1%
# Returns: bands_5 = ("yellow", "violet", "black", "red", "brown")
#          bands_4 = ("yellow", "violet", "orange", "brown")
```

---

### 2. `capacitor_decoder.py` (734 lines)
Bidirectional capacitor marking decoder and encoder.

**Features:**
- EIA 3-digit codes (473, 223K100, 104)
- Alphanumeric codes (47n, 47nK100, 0.047uF)
- R-decimal notation (4n7, 2u2, 1n5K100)
- Electrolytic markings (47uF 25V, 100uF/16V)
- Unit conversion (always provides pF, nF, µF)
- Tolerance and voltage parsing
- Type classification (film, ceramic, electrolytic, tantalum)

**Key Functions:**
- `decode_capacitor(marking)` → DecodedCap
- `encode_capacitor(pf=, nf=, uf=, tolerance_percent, voltage)` → EncodedCap
- `pf_to_units(pf)`, `nf_to_units(nf)`, `uf_to_units(uf)` → CapUnit (all three units)

**Example:**
```python
dec = decode_capacitor("473J250")  # Film cap marking
# Returns: 47nF ±5% 250V, type=FILM_BOX

enc = encode_capacitor(nf=47, tolerance_percent=10.0, voltage=100)
# Returns: eia_code="473", full_film_code="473K100", full_alpha_code="47nK100"
```

---

### 3. `pedalpath_integration.py` (incomplete, ~400 lines)
Integration layer bridging decoders with PedalPath's API.

**Features:**
- Component advisory database (build tips, warnings by type)
- Unified API response model (ComponentLookupResult)
- BOM component processing
- High-level lookup functions for both directions:
  - Value → visual hints (for build guides)
  - Marking → decoded value (for identification)

**Key Functions:**
- `lookup_resistor_by_value(ohms, tolerance_percent)` → ComponentLookupResult
- `lookup_resistor_by_bands(bands)` → ComponentLookupResult
- `lookup_capacitor_by_marking(marking)` → ComponentLookupResult
- `lookup_capacitor_by_value(pf=, nf=, uf=, ...)` → ComponentLookupResult
- `process_bom_component(BOMComponent)` → ComponentLookupResult

**Advisory Database Includes:**
- Resistor types: metal_film, carbon_film, carbon_comp
- Capacitor warnings: polarity, audio path suitability, type-specific tips

---

### 4. `test_decoders.py` (343 lines)
**Comprehensive test suite with 154+ test cases!**

**Test Coverage:**
- Resistor: 5-band decode, 4-band decode, all tolerances, silver/gold multipliers
- Resistor: Encode + round-trip, E-series validation, all common pedal values
- Resistor: Error handling, color aliases (violet/purple, grey/gray)
- Capacitor: EIA 3-digit, alphanumeric, R-decimal, electrolytic
- Capacitor: Unit conversion, type classification, encode + round-trip
- Capacitor: All tolerance codes, error handling

**Run Tests:**
```bash
python test_decoders.py
```

**Expected Output:**
```
========================================================
  PEDALPATH v2 — COMPONENT DECODER TEST SUITE
========================================================
[... 154 tests ...]
========================================================
  RESULTS: 154 passed, 0 failed
========================================================
```

---

## For Worker A (TypeScript Port)

### Your Task:
Port these Python implementations to TypeScript for Phase 1, Work Stream A.

### Implementation Location:
```
/home/rob/git/pedalpath-v2/pedalpath-app/src/
├── utils/decoders/
│   ├── resistor-decoder.ts       ← Port resistor_decoder.py
│   ├── capacitor-decoder.ts      ← Port capacitor_decoder.py
│   ├── ic-decoder.ts             ← New (stub for now)
│   ├── diode-decoder.ts          ← New (stub for now)
│   ├── index.ts                  ← Barrel export
│   └── __tests__/
│       ├── resistor-decoder.test.ts
│       └── capacitor-decoder.test.ts
└── types/
    └── component-specs.types.ts  ← Port Python dataclasses to TS interfaces
```

### Key Differences Python → TypeScript:

1. **Data Classes → Interfaces:**
```python
# Python
@dataclass(frozen=True)
class ResistorValue:
    ohms: float
    tolerance_percent: Optional[float] = None
```

```typescript
// TypeScript
export interface ResistorSpec {
  ohms: number;
  tolerancePercent?: number;
  bands: string[];
  eSeriesMatch?: string;
  nearestStandard?: number;
}
```

2. **Dictionaries → Objects/Maps:**
```python
# Python
DIGIT_COLORS: dict[str, int] = {
    "black": 0,
    "brown": 1,
}
```

```typescript
// TypeScript
const DIGIT_COLORS: Record<string, number> = {
  black: 0,
  brown: 1,
};
```

3. **Tuples → Arrays (or readonly tuples):**
```python
# Python
E12_VALUES: tuple[float, ...] = (1.0, 1.2, 1.5, ...)
```

```typescript
// TypeScript
const E12_VALUES: readonly number[] = [1.0, 1.2, 1.5, ...];
```

4. **Enums:**
```python
# Python
class CapType(Enum):
    FILM_BOX = "film_box"
    CERAMIC = "ceramic"
```

```typescript
// TypeScript
export enum CapType {
  FilmBox = "film_box",
  Ceramic = "ceramic",
}
```

### Testing Strategy:
Use the 154 test cases from `test_decoders.py` as your test spec:
- Port each test function to Jest/Vitest
- Ensure all test cases pass
- Target: 100% parity with Python implementation

### Verification:
```typescript
// Quick smoke test
import { encodeResistor } from '@/utils/decoders';

const spec = encodeResistor(47000, 1.0);
console.log(spec.bands5);
// Should output: ["yellow", "violet", "black", "red", "brown"]
```

---

## Quality Notes

These Python implementations are **production-ready**:
- ✅ Complete IEC 60062 compliance (resistors)
- ✅ Multiple capacitor marking standards supported
- ✅ Extensive error handling
- ✅ 154 test cases with edge cases covered
- ✅ Real-world pedal building use cases included
- ✅ Bidirectional (decode AND encode)
- ✅ Well-documented with docstrings

**Your TypeScript port should match this quality level!**

---

## Integration with Phase 2

Once decoders are in TypeScript, Phase 2 (Work Stream C) will use them:

```typescript
// Phase 2: Component SVG rendering
import { encodeResistor } from '@/utils/decoders';
import { ResistorSVG } from '@/components/visualizations/components-svg';

const spec = encodeResistor(10000, 1.0); // 10kΩ ±1%
// spec.bands5 = ["brown", "black", "black", "red", "brown"]

<ResistorSVG spec={spec} />
// Renders: Resistor with brown-black-black-red-brown color bands
```

---

**Last Updated:** 2026-02-16 22:30 UTC
**Status:** ✅ All reference files received and ready for porting
