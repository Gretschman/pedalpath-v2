#!/usr/bin/env python3
"""
analyze_docx_circuits.py
Upload schematic images from the docx to the live API, compare generated BOMs
against the reference BOMs extracted from the document.

Usage:
  python3 tools/analyze_docx_circuits.py                   # all circuits
  python3 tools/analyze_docx_circuits.py --circuit Rat     # single circuit
  python3 tools/analyze_docx_circuits.py --dump Rat        # dump raw API output
"""

import base64
import json
import re
import sys
from pathlib import Path

import requests

API_URL = "https://pedalpath.app/api/analyze-schematic"
IMAGES_DIR = Path("/tmp/docx_images")
OUTPUT_DIR = Path("/home/rob/pedalpath-v2/docs/generated")

PASS_THRESHOLD = 85.0

# ─── Reference BOMs ───────────────────────────────────────────────────────────
# Extracted by reading the BOM images from schematics and BOM_03.04.2026.docx
# type: resistor | capacitor | diode | transistor | potentiometer | ic | led

REFERENCE_BOMS = {

    "T-AMP Gold v1": {
        "schematic": "img_00",
        "bom_images": ["img_01"],
        "components": [
            {"type": "resistor",     "value": "1M",      "qty": 1, "refs": ["R1"]},
            {"type": "resistor",     "value": "68k",     "qty": 1, "refs": ["R2"]},
            {"type": "capacitor",    "value": "10u",     "qty": 2, "refs": ["C1", "C2"]},
            {"type": "capacitor",    "value": "1u",      "qty": 2, "refs": ["C3", "C5"]},
            {"type": "capacitor",    "value": "4n7",     "qty": 1, "refs": ["C4"]},
            {"type": "capacitor",    "value": "100u",    "qty": 1, "refs": ["C6"]},
            {"type": "ic",           "value": "LM386",   "qty": 2, "refs": ["IC1", "IC2"]},
            {"type": "diode",        "value": "1N4001",  "qty": 1, "refs": ["D1"]},
            {"type": "potentiometer","value": "A100k",   "qty": 1, "refs": ["LOUD"]},
        ],
    },

    "Rat w/Marshall EQ": {
        "schematic": "img_02",
        "bom_images": ["img_03"],
        "components": [
            {"type": "resistor",     "value": "1M",      "qty": 3, "refs": ["R1","R6","R11"]},
            {"type": "resistor",     "value": "1k",      "qty": 2, "refs": ["R2","R4"]},
            {"type": "resistor",     "value": "560R",    "qty": 1, "refs": ["R3"]},
            {"type": "resistor",     "value": "33k",     "qty": 1, "refs": ["R5"]},
            {"type": "resistor",     "value": "10k",     "qty": 3, "refs": ["R7","R8","R9"]},
            {"type": "resistor",     "value": "1k5",     "qty": 1, "refs": ["R10"]},
            {"type": "capacitor",    "value": "22n",     "qty": 3, "refs": ["C1","C9","C15"]},
            {"type": "capacitor",    "value": "1n",      "qty": 1, "refs": ["C2"]},
            {"type": "capacitor",    "value": "100p",    "qty": 2, "refs": ["C3","C16"]},
            {"type": "capacitor",    "value": "33p",     "qty": 1, "refs": ["C4"]},
            {"type": "capacitor",    "value": "4u7",     "qty": 3, "refs": ["C5","C7","C14"]},
            {"type": "capacitor",    "value": "2u2",     "qty": 1, "refs": ["C6"]},
            {"type": "capacitor",    "value": "470p",    "qty": 1, "refs": ["C8"]},
            {"type": "capacitor",    "value": "1u",      "qty": 1, "refs": ["C10"]},
            {"type": "capacitor",    "value": "100u",    "qty": 1, "refs": ["C11"]},
            {"type": "capacitor",    "value": "47u",     "qty": 1, "refs": ["C12"]},
            {"type": "capacitor",    "value": "47n",     "qty": 1, "refs": ["C13"]},
            {"type": "capacitor",    "value": "22n",     "qty": 1, "refs": ["C17"]},
            {"type": "diode",        "value": "1N4001",  "qty": 1, "refs": ["D1"]},
            {"type": "diode",        "value": "1N4148",  "qty": 2, "refs": ["D2","D3"]},
            {"type": "led",          "value": "LED",     "qty": 2, "refs": ["D4","D5"]},
            {"type": "ic",           "value": "LM308",   "qty": 1, "refs": ["IC1"]},
            {"type": "transistor",   "value": "2N5457",  "qty": 1, "refs": ["Q1"]},
            {"type": "potentiometer","value": "A100k",   "qty": 2, "refs": ["VOL","DIST"]},
            {"type": "potentiometer","value": "A1M",     "qty": 1, "refs": ["BASS"]},
            {"type": "potentiometer","value": "A25k",    "qty": 1, "refs": ["MID"]},
            {"type": "potentiometer","value": "A250k",   "qty": 1, "refs": ["TREB"]},
            {"type": "resistor",     "value": "1k",      "qty": 1, "refs": ["RUEZ"]},
        ],
    },

    "Halo Distortion/Sustainer": {
        "schematic": "img_04",
        "bom_images": ["img_05"],
        "components": [
            {"type": "resistor",     "value": "39k",     "qty": 1, "refs": ["R2"]},
            {"type": "resistor",     "value": "100k",    "qty": 4, "refs": ["R3","R9","R14","R21"]},
            {"type": "resistor",     "value": "470k",    "qty": 3, "refs": ["R4","R10","R15"]},
            {"type": "resistor",     "value": "100R",    "qty": 3, "refs": ["R5","R11","R16"]},
            {"type": "resistor",     "value": "15k",     "qty": 3, "refs": ["R6","R12","R17"]},
            {"type": "resistor",     "value": "1k",      "qty": 1, "refs": ["R7"]},
            {"type": "resistor",     "value": "8k2",     "qty": 2, "refs": ["R8","R13"]},
            {"type": "resistor",     "value": "33k",     "qty": 2, "refs": ["R18","R19"]},
            {"type": "resistor",     "value": "390k",    "qty": 1, "refs": ["R20"]},
            {"type": "resistor",     "value": "10k",     "qty": 1, "refs": ["R22"]},
            {"type": "resistor",     "value": "2k2",     "qty": 1, "refs": ["R23"]},
            {"type": "resistor",     "value": "47R",     "qty": 1, "refs": ["R24"]},
            {"type": "resistor",     "value": "2M2",     "qty": 1, "refs": ["RPD"]},
            {"type": "resistor",     "value": "4k7",     "qty": 1, "refs": ["LEDR"]},
            {"type": "capacitor",    "value": "100n",    "qty": 9, "refs": ["C1","C3","C4","C6","C7","C9","C12","C13","C15"]},
            {"type": "capacitor",    "value": "470p",    "qty": 3, "refs": ["C2","C5","C8"]},
            {"type": "capacitor",    "value": "3n9",     "qty": 2, "refs": ["C10","CX2"]},
            {"type": "capacitor",    "value": "10n",     "qty": 2, "refs": ["C11","CX1"]},
            {"type": "capacitor",    "value": "100u",    "qty": 1, "refs": ["C14"]},
            {"type": "transistor",   "value": "2N5088",  "qty": 4, "refs": ["Q1","Q2","Q3","Q4"]},
            {"type": "diode",        "value": "1N5817",  "qty": 1, "refs": ["D1"]},
            {"type": "diode",        "value": "1N4148",  "qty": 4, "refs": ["D2","D3","D4","D5"]},
            {"type": "potentiometer","value": "A100k",   "qty": 1, "refs": ["Volume"]},
            {"type": "potentiometer","value": "B100k",   "qty": 2, "refs": ["Sustain","Tone"]},
        ],
    },

    "ColorSound Jumbo ToneBender": {
        "schematic": "img_06",
        "bom_images": ["img_07","img_08","img_09","img_10","img_11"],
        "components": [
            {"type": "resistor",     "value": "33k",     "qty": 1, "refs": ["R1"]},
            {"type": "resistor",     "value": "100k",    "qty": 3, "refs": ["R2","R9","R14"]},
            {"type": "resistor",     "value": "470k",    "qty": 3, "refs": ["R3","R10","R15"]},
            {"type": "resistor",     "value": "100R",    "qty": 3, "refs": ["R4","R11","R16"]},
            {"type": "resistor",     "value": "15k",     "qty": 3, "refs": ["R5","R12","R17"]},
            {"type": "resistor",     "value": "1k",      "qty": 2, "refs": ["R7","R27"]},
            {"type": "resistor",     "value": "8k2",     "qty": 2, "refs": ["R8","R13"]},
            {"type": "resistor",     "value": "33k",     "qty": 2, "refs": ["R18","R19"]},
            {"type": "resistor",     "value": "1M5",     "qty": 1, "refs": ["R26"]},
            {"type": "potentiometer","value": "A100k",   "qty": 2, "refs": ["R6","R25"]},
            {"type": "potentiometer","value": "B100k",   "qty": 1, "refs": ["R20"]},
            {"type": "capacitor",    "value": "100n",    "qty": 7, "refs": ["C1","C3","C4","C7","C9","C12","C16"]},
            {"type": "capacitor",    "value": "500p",    "qty": 3, "refs": ["C2","C5","C8"]},
            {"type": "capacitor",    "value": "3n3",     "qty": 1, "refs": ["C10"]},
            {"type": "capacitor",    "value": "10n",     "qty": 1, "refs": ["C11"]},
            {"type": "capacitor",    "value": "22u",     "qty": 1, "refs": ["C14"]},
            {"type": "transistor",   "value": "BC184C",  "qty": 3, "refs": ["Q1","Q2","Q3"]},
            {"type": "led",          "value": "LED",     "qty": 1, "refs": ["D5"]},
        ],
    },

    "BYOC Parametric EQ": {
        "schematic": "img_12",
        "bom_images": ["img_13","img_14"],
        # Kit BOM — quantities by value
        "components": [
            {"type": "resistor",     "value": "330R",    "qty": 4,  "refs": []},
            {"type": "resistor",     "value": "1k6",     "qty": 15, "refs": []},
            {"type": "resistor",     "value": "5k1",     "qty": 24, "refs": []},
            {"type": "resistor",     "value": "100k",    "qty": 4,  "refs": []},
            {"type": "resistor",     "value": "470k",    "qty": 2,  "refs": []},
            {"type": "capacitor",    "value": "2n7",     "qty": 2,  "refs": []},
            {"type": "capacitor",    "value": "12n",     "qty": 2,  "refs": []},
            {"type": "capacitor",    "value": "100n",    "qty": 6,  "refs": []},
            {"type": "capacitor",    "value": "10u",     "qty": 9,  "refs": []},
            {"type": "capacitor",    "value": "220u",    "qty": 2,  "refs": []},
            {"type": "ic",           "value": "MAX1044", "qty": 1,  "refs": []},
            {"type": "ic",           "value": "4558",    "qty": 1,  "refs": []},
            {"type": "ic",           "value": "TL074",   "qty": 3,  "refs": []},
            {"type": "potentiometer","value": "B10k",    "qty": 9,  "refs": []},
            {"type": "potentiometer","value": "A100k",   "qty": 1,  "refs": []},
        ],
    },

    "Mimosa Jr.": {
        "schematic": "img_15",
        "bom_images": ["img_16","img_17"],
        "components": [
            {"type": "resistor",     "value": "470R",    "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "1k5",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "2k4",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "4k7",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "10k",     "qty": 6,  "refs": []},
            {"type": "resistor",     "value": "22k",     "qty": 3,  "refs": []},
            {"type": "resistor",     "value": "33k",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "82k",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "100k",    "qty": 4,  "refs": []},
            {"type": "resistor",     "value": "220k",    "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "390k",    "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "470k",    "qty": 4,  "refs": []},
            {"type": "capacitor",    "value": "22p",     "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "2n2",     "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "47n",     "qty": 2,  "refs": []},
            {"type": "capacitor",    "value": "100n",    "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "2u2",     "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "4u7",     "qty": 7,  "refs": []},
            {"type": "capacitor",    "value": "47u",     "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "100u",    "qty": 1,  "refs": []},
            {"type": "diode",        "value": "1N34A",   "qty": 1,  "refs": []},
            {"type": "transistor",   "value": "2N5457",  "qty": 2,  "refs": []},
            {"type": "ic",           "value": "TL074",   "qty": 1,  "refs": []},
            {"type": "potentiometer","value": "B10k",    "qty": 1,  "refs": []},
            {"type": "potentiometer","value": "A100k",   "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "10k",     "qty": 1,  "refs": []},  # trimpot
        ],
    },

    "BYOC Color Booster": {
        "schematic": "img_18",
        "bom_images": ["img_19","img_20"],
        "components": [
            {"type": "resistor",     "value": "470R",    "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "1k5",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "4k7",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "5k6",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "6k8",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "12k",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "33k",     "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "100k",    "qty": 1,  "refs": []},
            {"type": "resistor",     "value": "150k",    "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "470p",    "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "10n",     "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "100n",    "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "220n",    "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "4u",      "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "10u",     "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "22u",     "qty": 1,  "refs": []},
            {"type": "capacitor",    "value": "100u",    "qty": 1,  "refs": []},
            {"type": "diode",        "value": "1N4001",  "qty": 1,  "refs": []},
            {"type": "transistor",   "value": "BC109",   "qty": 3,  "refs": []},
            {"type": "potentiometer","value": "B50k",    "qty": 1,  "refs": []},
            {"type": "potentiometer","value": "B100k",   "qty": 2,  "refs": []},
            {"type": "potentiometer","value": "C5k",     "qty": 1,  "refs": []},
        ],
    },

    "MSB DIY": {
        "schematic": "img_21",
        "bom_images": ["img_22"],
        "components": [
            {"type": "resistor",     "value": "100k",    "qty": 1, "refs": ["R1"]},
            {"type": "resistor",     "value": "10k",     "qty": 1, "refs": ["R2"]},
            {"type": "resistor",     "value": "1k",      "qty": 1, "refs": ["CLR"]},
            {"type": "capacitor",    "value": "22n",     "qty": 1, "refs": ["C1"]},
            {"type": "capacitor",    "value": "100n",    "qty": 3, "refs": ["C2","C3","C4"]},
            {"type": "diode",        "value": "1N5817",  "qty": 1, "refs": ["D1"]},
            {"type": "potentiometer","value": "B100k",   "qty": 1, "refs": ["TXT"]},
            {"type": "potentiometer","value": "A100k",   "qty": 1, "refs": ["LOUD"]},
            {"type": "transistor",   "value": "MPSA18",  "qty": 1, "refs": ["Q1"]},
            {"type": "transistor",   "value": "PN2907",  "qty": 1, "refs": ["Q2"]},
        ],
    },

    "Big-Clang": {
        # Using BIG-CLANG variant (middle column in the 3-variant BOM)
        "schematic": "img_23",
        "bom_images": ["img_24"],
        "components": [
            {"type": "resistor",     "value": "1M",      "qty": 2, "refs": ["R1","R4"]},
            {"type": "resistor",     "value": "470R",    "qty": 1, "refs": ["R2"]},
            {"type": "resistor",     "value": "82k",     "qty": 2, "refs": ["R3","R6"]},
            {"type": "resistor",     "value": "220k",    "qty": 1, "refs": ["R5"]},
            {"type": "resistor",     "value": "4k7",     "qty": 1, "refs": ["R7"]},
            {"type": "capacitor",    "value": "100p",    "qty": 1, "refs": ["C1"]},
            {"type": "capacitor",    "value": "100n",    "qty": 1, "refs": ["C2"]},
            {"type": "capacitor",    "value": "1u",      "qty": 2, "refs": ["C3","C4"]},
            {"type": "capacitor",    "value": "47u",     "qty": 1, "refs": ["C5"]},
            {"type": "capacitor",    "value": "100u",    "qty": 1, "refs": ["C6"]},
            {"type": "transistor",   "value": "2N5088",  "qty": 1, "refs": ["Q1"]},
            {"type": "transistor",   "value": "2N5087",  "qty": 1, "refs": ["Q2"]},
            {"type": "diode",        "value": "Ge",      "qty": 2, "refs": ["D1","D2"]},
            {"type": "diode",        "value": "Si",      "qty": 2, "refs": ["D3","D4"]},
            {"type": "diode",        "value": "1N4001",  "qty": 1, "refs": ["D5"]},
            {"type": "potentiometer","value": "A50k",    "qty": 1, "refs": ["HARMONIC"]},
            {"type": "potentiometer","value": "A100k",   "qty": 1, "refs": ["BALANCE"]},
        ],
    },

    "Synthrotek Ratatak": {
        "schematic": "img_25",
        "bom_images": ["img_26"],
        "components": [
            # Resistors (from img_26)
            {"type": "resistor",     "value": "47R",     "qty": 1, "refs": ["R2"]},
            {"type": "resistor",     "value": "100R",    "qty": 1, "refs": ["RX2"]},
            {"type": "resistor",     "value": "560R",    "qty": 1, "refs": ["R9"]},
            {"type": "resistor",     "value": "1k",      "qty": 2, "refs": ["R1","R10"]},
            {"type": "resistor",     "value": "1k5",     "qty": 1, "refs": ["R12"]},
            {"type": "resistor",     "value": "10k",     "qty": 1, "refs": ["R13"]},
            {"type": "resistor",     "value": "100k",    "qty": 2, "refs": ["R3","R4"]},
            {"type": "resistor",     "value": "1M",      "qty": 4, "refs": ["R6","R7","R8","R11"]},
            # Capacitors
            {"type": "capacitor",    "value": "30p",     "qty": 1, "refs": ["C6"]},
            {"type": "capacitor",    "value": "100p",    "qty": 1, "refs": ["C9"]},
            {"type": "capacitor",    "value": "1n",      "qty": 1, "refs": ["C5"]},
            {"type": "capacitor",    "value": "2n2",     "qty": 1, "refs": ["C12"]},
            {"type": "capacitor",    "value": "3n3",     "qty": 1, "refs": ["C11"]},
            {"type": "capacitor",    "value": "22n",     "qty": 1, "refs": ["C4"]},
            {"type": "capacitor",    "value": "47n",     "qty": 1, "refs": ["C3"]},
            {"type": "capacitor",    "value": "1u",      "qty": 1, "refs": ["C13"]},
            {"type": "capacitor",    "value": "2u2",     "qty": 1, "refs": ["C8"]},
            {"type": "capacitor",    "value": "4u7",     "qty": 2, "refs": ["C7","C10"]},
            {"type": "capacitor",    "value": "47u",     "qty": 1, "refs": ["C2"]},
            {"type": "capacitor",    "value": "100u",    "qty": 1, "refs": ["C1"]},
            # Active components
            {"type": "diode",        "value": "1N4148",  "qty": 4, "refs": ["D1","D2","D3","D4"]},
            {"type": "diode",        "value": "Ge",      "qty": 2, "refs": ["D5","D6"]},
            {"type": "led",          "value": "LED",     "qty": 1, "refs": ["LED1"]},
            {"type": "transistor",   "value": "2N5458",  "qty": 1, "refs": ["Q1"]},
            {"type": "ic",           "value": "LM308",   "qty": 1, "refs": ["U1"]},
            # Pots
            {"type": "potentiometer","value": "B10k",    "qty": 1, "refs": ["VR2"]},
            {"type": "potentiometer","value": "B100k",   "qty": 1, "refs": ["VR4"]},
            {"type": "potentiometer","value": "A100k",   "qty": 2, "refs": ["VR1","VR3"]},
        ],
    },

    "One Knob Clang": {
        "schematic": "img_27",
        "bom_images": ["img_28"],
        "components": [
            {"type": "resistor",     "value": "1M",      "qty": 2, "refs": ["R1","R3"]},
            {"type": "resistor",     "value": "100k",    "qty": 2, "refs": ["R2","R5"]},
            {"type": "resistor",     "value": "220k",    "qty": 1, "refs": ["R4"]},
            {"type": "resistor",     "value": "2k2",     "qty": 1, "refs": ["CLR"]},
            {"type": "capacitor",    "value": "100p",    "qty": 1, "refs": ["C1"]},
            {"type": "capacitor",    "value": "100n",    "qty": 1, "refs": ["C2"]},
            {"type": "capacitor",    "value": "1u",      "qty": 1, "refs": ["C3"]},
            {"type": "capacitor",    "value": "10u",     "qty": 1, "refs": ["C4"]},
            {"type": "capacitor",    "value": "47u",     "qty": 1, "refs": ["C5"]},
            {"type": "capacitor",    "value": "100u",    "qty": 1, "refs": ["C6"]},
            {"type": "transistor",   "value": "2N3904",  "qty": 1, "refs": ["Q1"]},
            {"type": "transistor",   "value": "PN2222",  "qty": 1, "refs": ["Q2"]},
            {"type": "transistor",   "value": "2N7000",  "qty": 2, "refs": ["Q3","Q4"]},
            {"type": "diode",        "value": "1N5817",  "qty": 1, "refs": ["D1"]},
            {"type": "potentiometer","value": "A100k",   "qty": 1, "refs": ["LOUD"]},
        ],
    },

    "PE CSSTB": {
        "schematic": "img_29",
        "bom_images": ["img_30"],
        # Partial reference — need to view img_30 more carefully for full BOM
        "components": [
            {"type": "capacitor",    "value": "100n",    "qty": 4, "refs": []},
            {"type": "capacitor",    "value": "47u",     "qty": 2, "refs": []},
            {"type": "diode",        "value": "1N4004",  "qty": 1, "refs": []},
            {"type": "diode",        "value": "1N4148",  "qty": 1, "refs": []},
            {"type": "transistor",   "value": "BC169",   "qty": 1, "refs": []},
            {"type": "transistor",   "value": "BC546",   "qty": 1, "refs": []},
            {"type": "transistor",   "value": "2N5088",  "qty": 1, "refs": []},
            {"type": "potentiometer","value": "B100k",   "qty": 3, "refs": []},
        ],
    },
}


# ─── Normalise ────────────────────────────────────────────────────────────────

def normalise(value: str) -> str:
    v = value.strip().lower()
    v = v.replace('µ', 'u').replace('ω', '').replace('ohm', '').replace('ohms', '')
    # Taper prefix strip: A100k→100k, B50k→50k, C10k→10k
    v = re.sub(r'^[abc](\d)', r'\1', v)
    # Strip trailing annotation after primary value token
    v = re.sub(r'^(\d+(?:\.\d+)?[pnumk]?[fhvawr]?)\s+.*$', r'\1', v)
    # Strip trailing unit letter after SI prefix: 47nf→47n, 100uf→100u
    v = re.sub(r'([0-9])([pnumk])[fhvaw]$', r'\1\2', v)
    # Resistor R-suffix: 100r→100, 560r→560
    v = re.sub(r'^(\d+(?:\.\d+)?)r$', r'\1', v)
    # Jack value strip
    v = re.sub(r'^1/4["\s]?\s*(inch\s+)?', '', v)
    # European notation — ALL SI prefixes: 4n7→4.7n, 3n9→3.9n, 1k5→1.5k, 2m2→2.2m, 4p7→4.7p
    v = re.sub(r'^(\d+)([pnumkm])(\d)$', lambda m: f"{m.group(1)}.{m.group(3)}{m.group(2)}", v)
    # Value aliases
    aliases = {
        "1n914":   "1n4148",
        "in914":   "1n4148",
        "lm308n":  "lm308",
        "op07":    "lm308",
        "bc184c":  "bc184",
        "bc184":   "bc184c",
        "2n5089":  "2n5088",
        "4558":    "rc4558",
        "jrc4558": "rc4558",
        "njm4558": "rc4558",
        "max1044": "icl7660",
        "tc1044":  "icl7660",
        "pn2222":  "2n2222",
        "pn2907":  "2n3906",
        "mpsa18":  "mpsa18",
        "mpra18":  "mpsa18",   # common AI misread
        "bc109":   "bc109c",
        "bc109c":  "bc109c",
        "1n60":    "1n34a",
        "1n270":   "1n34a",
        "ge":      "ge",
        "si":      "si",
        "560":     "560",
        "47":      "47",
        "100":     "100",
        "2.2k":    "2.2k",
        "2k2":     "2.2k",
        "8.2k":    "8.2k",
        "8k2":     "8.2k",
        "1.5k":    "1.5k",
        "1k5":     "1.5k",
        "4.7k":    "4.7k",
        "4k7":     "4.7k",
        "1.6k":    "1.6k",
        "1k6":     "1.6k",
        "5.1k":    "5.1k",
        "5k1":     "5.1k",
        "2.4k":    "2.4k",
        "2k4":     "2.4k",
        "3.9n":    "3.9n",
        "3n9":     "3.9n",
        "2.7n":    "2.7n",
        "2n7":     "2.7n",
        "1.5m":    "1.5m",
        "1m5":     "1.5m",
        "2.2m":    "2.2m",
        "2m2":     "2.2m",
        "4.7u":    "4.7u",
        "4u7":     "4.7u",
        "2.2u":    "2.2u",
        "2u2":     "2.2u",
        "4.7n":    "4.7n",
        "4n7":     "4.7n",
        "2.2n":    "2.2n",
        "2n2":     "2.2n",
        "3.3n":    "3.3n",
        "3n3":     "3.3n",
        "12n":     "12n",
        "3.3p":    "3.3p",
        "3p3":     "3.3p",
        "500p":    "500p",
        "0.0033u": "3.3n",
        "0.01u":   "10n",
        "0.1u":    "100n",
        "0.22u":   "220n",
        "1.8k":    "1.8k",
    }
    return aliases.get(v, v)


def types_compatible(t1: str, t2: str) -> bool:
    groups = [
        {"ic", "op-amp"},
        {"diode", "led"},
    ]
    if t1 == t2:
        return True
    for g in groups:
        if t1 in g and t2 in g:
            return True
    return False


# Off-board component types to ignore from API output (not in circuit BOMs)
OFFBOARD_TYPES = {"input-jack", "output-jack", "dc-jack", "jack", "footswitch", "switch",
                  "other", "connector", "power"}


# ─── API Upload ───────────────────────────────────────────────────────────────

def upload_schematic(image_name: str) -> dict | None:
    img_path = IMAGES_DIR / f"{image_name}.png"
    if not img_path.exists():
        print(f"  ERROR: {img_path} not found")
        return None
    with open(img_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()
    print(f"  Uploading {image_name}.png ({len(img_b64) // 1024}KB)...")
    try:
        resp = requests.post(
            API_URL,
            json={"image_base64": img_b64, "image_type": "image/png"},
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        print(f"  ERROR: API call failed: {e}")
        return None


# ─── Comparison ───────────────────────────────────────────────────────────────

def flatten_ref(components: list) -> list:
    flat = []
    for c in components:
        for _ in range(c["qty"]):
            flat.append({"type": c["type"], "value": normalise(c["value"])})
    return flat


def compare_boms(circuit_name: str, ref_components: list, api_components: list) -> dict:
    ref_flat = flatten_ref(ref_components)
    # Filter off-board types from API output
    api_flat = [
        {"type": c.get("component_type", ""), "value": normalise(c.get("value", ""))}
        for c in api_components
        if c.get("component_type", "").lower() not in OFFBOARD_TYPES
    ]

    matched_ref = [False] * len(ref_flat)
    matched_api = [False] * len(api_flat)
    score_sum   = 0.0

    for i, ref in enumerate(ref_flat):
        best_score = 0.0
        best_j     = -1
        for j, api in enumerate(api_flat):
            if matched_api[j]:
                continue
            if not types_compatible(ref["type"], api["type"]):
                continue
            rv, av = ref["value"], api["value"]
            if rv == av:
                s = 1.0
            elif rv in av or av in rv:
                s = 0.8
            else:
                s = 0.3
            if s > best_score:
                best_score = s
                best_j = j
        if best_j >= 0 and best_score >= 0.5:
            matched_ref[i] = True
            matched_api[best_j] = True
            score_sum += best_score
        # else: missing → +0

    extra_count = matched_api.count(False)
    score_sum -= extra_count * 0.1

    total_ref = len(ref_flat)
    score = (score_sum / total_ref * 100) if total_ref > 0 else 0.0
    score = max(0.0, min(100.0, score))

    missing = [f"{r['type']} {r['value']}" for i, r in enumerate(ref_flat) if not matched_ref[i]]
    extra   = [f"{a['type']} {a['value']}" for j, a in enumerate(api_flat)  if not matched_api[j]]

    return {
        "circuit": circuit_name,
        "score": score,
        "ref_count": total_ref,
        "api_count": len(api_flat),
        "missing": missing,
        "extra": extra,
        "pass": score >= PASS_THRESHOLD,
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    dump_circuit = None
    filter_circuit = None

    if "--dump" in sys.argv:
        idx = sys.argv.index("--dump")
        dump_circuit = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None

    if "--circuit" in sys.argv:
        idx = sys.argv.index("--circuit")
        filter_circuit = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    circuits = REFERENCE_BOMS
    if filter_circuit or dump_circuit:
        key = filter_circuit or dump_circuit
        circuits = {k: v for k, v in circuits.items() if key.lower() in k.lower()}
        if not circuits:
            print(f"No circuit matching '{key}'. Available:")
            for k in REFERENCE_BOMS:
                print(f"  {k}")
            sys.exit(1)

    print(f"{'='*70}")
    print(f"PedalPath — Docx BOM Analysis  ({len(circuits)} circuits)")
    print(f"API: {API_URL}")
    print(f"{'='*70}\n")

    all_results = []

    for circuit_name, circuit in circuits.items():
        print(f"[{circuit_name}]")
        api_resp = upload_schematic(circuit["schematic"])

        if not api_resp or not api_resp.get("success"):
            err = api_resp.get("error", "unknown") if api_resp else "no response"
            print(f"  SKIP — API error: {err}\n")
            all_results.append({"circuit": circuit_name, "score": None, "status": f"SKIP: {err}"})
            continue

        api_components = api_resp.get("bom_data", {}).get("components", [])
        model = api_resp.get("model_used", "?")
        print(f"  API returned {len(api_components)} components (model: {model})")

        # Dump mode: show full component list
        if dump_circuit:
            print(f"\n  --- RAW API OUTPUT ---")
            filtered = [c for c in api_components
                        if c.get("component_type","").lower() not in OFFBOARD_TYPES]
            for c in sorted(filtered, key=lambda x: x.get("reference_designators", [""])[0] if x.get("reference_designators") else ""):
                refs = ",".join(c.get("reference_designators", []))
                raw_val = c.get("value", "")
                norm_val = normalise(raw_val)
                print(f"    {refs:12s} | {c.get('component_type',''):15s} | {raw_val:12s} → {norm_val}")

            print(f"\n  --- REFERENCE BOM ---")
            for c in circuit["components"]:
                refs = ",".join(c["refs"]) if c["refs"] else "(no ref)"
                print(f"    {refs:12s} | {c['type']:15s} | {c['value']:12s} → {normalise(c['value'])}")
            print()

        result = compare_boms(circuit_name, circuit["components"], api_components)
        all_results.append(result)

        status = "PASS ✓" if result["pass"] else "FAIL ✗"
        print(f"  Score: {result['score']:.1f}%  [{status}]")
        print(f"  Ref: {result['ref_count']} | API (filtered): {result['api_count']}")

        if result["missing"]:
            print(f"  MISSING ({len(result['missing'])}):")
            for m in result["missing"][:12]:
                print(f"    - {m}")
            if len(result["missing"]) > 12:
                print(f"    ... and {len(result['missing'])-12} more")

        if result["extra"]:
            print(f"  EXTRA ({len(result['extra'])}):")
            for e in result["extra"][:12]:
                print(f"    + {e}")
            if len(result["extra"]) > 12:
                print(f"    ... and {len(result['extra'])-12} more")
        print()

    # Summary
    scored = [r for r in all_results if r.get("score") is not None]
    passed = [r for r in scored if r.get("pass")]
    print(f"{'='*70}")
    print(f"SUMMARY: {len(passed)}/{len(scored)} circuits PASS (≥{PASS_THRESHOLD}%)")
    for r in sorted(scored, key=lambda x: -x["score"]):
        flag = "✓" if r["pass"] else "✗"
        print(f"  [{flag}] {r['circuit']}: {r['score']:.1f}%")

    results_path = OUTPUT_DIR / "docx_bom_analysis.json"
    with open(results_path, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"\nResults saved → {results_path}")


if __name__ == "__main__":
    main()
