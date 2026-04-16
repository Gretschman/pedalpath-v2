-- Migration 010: package_type_taxonomy + backfill component_reference
-- Canonical mapping from visual taxonomy keys → SVG components, build order, and pedagogy.
-- Build order derived from CopperSound/BYOC/Aion FX pattern analysis (April 2026).

-- ─────────────────────────────────────────────
-- package_type_taxonomy
-- ─────────────────────────────────────────────
CREATE TABLE public.package_type_taxonomy (
    package_type        TEXT PRIMARY KEY,
    display_name        TEXT NOT NULL,
    category            TEXT NOT NULL,           -- passive | active | connector | protection
    svg_component       TEXT NOT NULL,           -- React component name
    sort_order          INTEGER NOT NULL,        -- PCB build order (shortest-to-tallest)
    signal_flow_order   INTEGER,                 -- Pedagogical order (nullable — not all types appear in signal flow)
    identification_hint TEXT,                    -- Builder-facing: "Look for colored bands"
    polarity            BOOLEAN NOT NULL DEFAULT false,
    orientation_note    TEXT,                    -- "Stripe = cathode (negative end)"
    difficulty_tier     INTEGER NOT NULL DEFAULT 1  -- 1=beginner, 2=intermediate, 3=advanced
);

ALTER TABLE public.package_type_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read package type taxonomy"
    ON public.package_type_taxonomy FOR SELECT TO public USING (true);

-- ─────────────────────────────────────────────
-- SEED: 18 package_type categories
-- ─────────────────────────────────────────────
INSERT INTO public.package_type_taxonomy
    (package_type, display_name, category, svg_component, sort_order, signal_flow_order, identification_hint, polarity, orientation_note, difficulty_tier)
VALUES
    ('resistor',               'Resistor',               'passive',    'ResistorSVG',    1,  NULL, 'Small cylinder with colored bands. Read bands left-to-right with the tolerance band (gold/silver) on the right.',                         false, NULL,                                                              1),
    ('diode',                  'Diode',                  'active',     'DiodeSVG',       2,  4,    'Small glass or plastic cylinder with a stripe on one end. The stripe marks the cathode (negative end).',                                  true,  'Stripe = cathode (negative). Current flows from anode to cathode.', 1),
    ('capacitor-ceramic',      'Ceramic Capacitor',      'passive',    'CapacitorSVG',   3,  NULL, 'Tiny disc or flat rectangle, often orange/brown/blue. Marked with a 3-digit code (e.g., 104 = 100nF). Non-polarized.',                    false, NULL,                                                              1),
    ('capacitor-film',         'Film Capacitor',         'passive',    'CapacitorSVG',   4,  NULL, 'Small box shape, usually yellow, green, or blue. Marked with value code. Non-polarized — either lead can go in either hole.',              false, NULL,                                                              1),
    ('ferrite',                'Ferrite Bead',           'passive',    'ResistorSVG',    5,  NULL, 'Looks like a small resistor but usually all black or dark grey. Used for noise filtering.',                                               false, NULL,                                                              2),
    ('inductor',               'Inductor',               'passive',    'ResistorSVG',    6,  NULL, 'Looks like a resistor with colored bands, or a small toroid (donut shape). Used in wah and filter circuits.',                             false, NULL,                                                              2),
    ('crystal',                'Crystal Oscillator',     'passive',    'CapacitorSVG',   7,  NULL, 'Small metal can with 2 pins, often silver or gold colored. Rare in guitar pedals.',                                                       false, NULL,                                                              2),
    ('fuse',                   'Fuse',                   'protection', 'ResistorSVG',    8,  NULL, 'Small glass tube or PTC resettable disc. Protects circuit from overcurrent.',                                                             false, NULL,                                                              2),
    ('ic',                     'Integrated Circuit',     'active',     'ICSVG',          9,  3,    'Black rectangle with pins on two sides (DIP package). Has a notch or dot marking pin 1. NEVER solder directly — use a socket.',            true,  'Notch/dot = pin 1 end. Pin 1 is left of notch when notch faces up.', 2),
    ('capacitor-electrolytic', 'Electrolytic Capacitor', 'passive',    'CapacitorSVG',  10,  NULL, 'Tall cylinder, usually black or blue. Has a stripe marking the NEGATIVE lead. Longer lead = positive.',                                   true,  'Stripe = negative. Longer lead = positive. Reversing polarity can cause failure.', 1),
    ('transistor',             'Transistor',             'active',     'TransistorSVG', 11,  2,    'Small black half-cylinder (TO-92) with 3 pins and a flat face. Flat face orientation is critical — check the datasheet.',                  false, 'Flat face indicates front. Pin order (EBC or CBE) varies by part — always verify.', 2),
    ('led',                    'LED',                    'active',     'DiodeSVG',      12,  5,    'Small colored dome with 2 leads. Longer lead = anode (positive). Flat edge on lens = cathode.',                                           true,  'Longer lead = positive (anode). Flat edge = negative (cathode).',  1),
    ('relay',                  'Relay',                  'active',     'ICSVG',         13,  NULL, 'Small sealed box with multiple pins. Has a stripe or dot marking pin 1. Rare in guitar pedals.',                                          true,  'Stripe/dot marks pin 1 side. Match orientation to PCB silkscreen.', 3),
    ('transformer',            'Transformer',            'passive',    'ICSVG',         14,  NULL, 'Heavier component with wire coils, usually with a metal core. Used in some vintage-style circuits.',                                      false, NULL,                                                              3),
    ('potentiometer',          'Potentiometer',          'passive',    'ResistorSVG',   15,  6,    '3-pin rotary knob. The center pin (wiper) is the output. Snap off alignment tabs before mounting.',                                      false, 'Center pin = wiper (output). Outer pins = full resistance range.', 1),
    ('switch',                 'Switch',                 'connector',  'ResistorSVG',   16,  NULL, 'Toggle, momentary, or rotary. 3PDT footswitch is most common in pedals — 9 lugs in a 3x3 grid.',                                         false, NULL,                                                              1),
    ('connector',              'Connector',              'connector',  'ResistorSVG',   17,  1,    'Jacks (1/4" mono), DC power jack, or pin headers. Panel-mount — installed during enclosure assembly.',                                    false, NULL,                                                              1),
    ('generic',                'Other Component',        'passive',    'ResistorSVG',   18,  NULL, 'Component type not in standard taxonomy. Check the schematic symbol and datasheet.',                                                      false, NULL,                                                              1);

-- ─────────────────────────────────────────────
-- Add package_type column to component_reference
-- ─────────────────────────────────────────────
ALTER TABLE public.component_reference
    ADD COLUMN package_type TEXT REFERENCES public.package_type_taxonomy(package_type);

-- ─────────────────────────────────────────────
-- Backfill package_type from existing data
-- ─────────────────────────────────────────────

-- Simple 1:1 mappings
UPDATE public.component_reference SET package_type = 'resistor'      WHERE component_type = 'resistor';
UPDATE public.component_reference SET package_type = 'transistor'    WHERE component_type = 'transistor';
UPDATE public.component_reference SET package_type = 'diode'         WHERE component_type = 'diode';
UPDATE public.component_reference SET package_type = 'ic'            WHERE component_type = 'ic';
UPDATE public.component_reference SET package_type = 'potentiometer' WHERE component_type = 'potentiometer';
UPDATE public.component_reference SET package_type = 'potentiometer' WHERE component_type = 'trimmer';

-- Capacitors: use subcategory (already clean in seed data)
UPDATE public.component_reference SET package_type = 'capacitor-electrolytic' WHERE component_type = 'capacitor' AND subcategory = 'Electrolytic';
UPDATE public.component_reference SET package_type = 'capacitor-film'         WHERE component_type = 'capacitor' AND subcategory = 'Film';
UPDATE public.component_reference SET package_type = 'capacitor-ceramic'      WHERE component_type = 'capacitor' AND subcategory = 'Ceramic';

-- Catch any capacitors without a subcategory match (shouldn't exist, but safety net)
UPDATE public.component_reference SET package_type = 'generic' WHERE component_type = 'capacitor' AND package_type IS NULL;

-- Index for lookups
CREATE INDEX idx_component_ref_pkg_type ON public.component_reference (package_type);
