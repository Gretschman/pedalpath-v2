"""Metal-film resistor color code decoder. 

"""https://chatgpt.com/s/cd_6990d907b76c81918a77e99e75b732cc


Supports common 5-band metal-film decoding:
- band1, band2, band3 => significant digits
- band4 => multiplier
- band5 => tolerance

Also supports 4-band decoding as a convenience.
"""

from __future__ import annotations

from dataclasses import dataclass

DIGIT_COLORS = {
    "black": 0,
    "brown": 1,
    "red": 2,
    "orange": 3,
    "yellow": 4,
    "green": 5,
    "blue": 6,
    "violet": 7,
    "purple": 7,
    "gray": 8,
    "grey": 8,
    "white": 9,
}

MULTIPLIER_COLORS = {
    "black": 1,
    "brown": 10,
    "red": 100,
    "orange": 1_000,
    "yellow": 10_000,
    "green": 100_000,
    "blue": 1_000_000,
    "violet": 10_000_000,
    "purple": 10_000_000,
    "gray": 100_000_000,
    "grey": 100_000_000,
    "white": 1_000_000_000,
    "gold": 0.1,
}

TOLERANCE_COLORS = {
    "brown": 1,
    "red": 2,
    "gold": 5,
}


@dataclass(frozen=True)
class ResistorValue:
    ohms: float
    tolerance_percent: float | None

    def pretty(self) -> str:
        value = _format_ohms(self.ohms)
        if self.tolerance_percent is None:
            return value
        return f"{value} ±{self.tolerance_percent:g}%"


def _format_ohms(ohms: float) -> str:
    units = [(1_000_000_000, "GΩ"), (1_000_000, "MΩ"), (1_000, "kΩ"), (1, "Ω")]
    for scale, unit in units:
        if ohms >= scale:
            scaled = ohms / scale
            if float(scaled).is_integer():
                return f"{int(scaled)} {unit}"
            return f"{scaled:.3g} {unit}"
    return f"{ohms:g} Ω"


def decode_resistor(bands: list[str] | tuple[str, ...]) -> ResistorValue:
    """Decode a resistor value from its color bands.

    Args:
        bands: A list/tuple of color names, left-to-right.
               5-band: [d1, d2, d3, multiplier, tolerance]
               4-band: [d1, d2, multiplier, tolerance]
    """

    normalized = [b.strip().lower() for b in bands]

    if len(normalized) == 5:
        d1, d2, d3, multiplier_band, tolerance_band = normalized
        try:
            digits = (DIGIT_COLORS[d1] * 100) + (DIGIT_COLORS[d2] * 10) + DIGIT_COLORS[d3]
            multiplier = MULTIPLIER_COLORS[multiplier_band]
        except KeyError as exc:
            raise ValueError(f"Unsupported color for 5-band decoding: {exc.args[0]}") from exc
        tolerance = TOLERANCE_COLORS.get(tolerance_band)
        return ResistorValue(ohms=digits * multiplier, tolerance_percent=tolerance)

    if len(normalized) == 4:
        d1, d2, multiplier_band, tolerance_band = normalized
        try:
            digits = (DIGIT_COLORS[d1] * 10) + DIGIT_COLORS[d2]
            multiplier = MULTIPLIER_COLORS[multiplier_band]
        except KeyError as exc:
            raise ValueError(f"Unsupported color for 4-band decoding: {exc.args[0]}") from exc
        tolerance = TOLERANCE_COLORS.get(tolerance_band)
        return ResistorValue(ohms=digits * multiplier, tolerance_percent=tolerance)

    raise ValueError("Expected 4 or 5 color bands.")


def _demo() -> None:
    examples = {
        "47k example from chart": ["yellow", "violet", "black", "red", "brown"],
        "4.7k": ["yellow", "violet", "black", "brown", "brown"],
        "560": ["green", "blue", "black", "black", "brown"],
        "1M": ["brown", "black", "black", "yellow", "brown"],
    }

    for label, bands in examples.items():
        decoded = decode_resistor(bands)
        print(f"{label:24} {bands} -> {decoded.pretty()}")


if __name__ == "__main__":
    _demo()
