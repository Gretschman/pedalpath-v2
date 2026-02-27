-- Migration 005: component_reference + enclosure_reference
-- Shared read-only reference tables seeded from _REFERENCE library.
-- Frequency counts derived from Rob's personal pedal circuit dataset (600+ circuits).

-- ─────────────────────────────────────────────
-- component_reference
-- ─────────────────────────────────────────────
CREATE TABLE public.component_reference (
    id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
    component_type  TEXT        NOT NULL,   -- transistor | diode | ic | resistor | capacitor | potentiometer | trimmer
    value           TEXT        NOT NULL,   -- canonical form: '2N5088', '10K', '100nF', 'TL072', 'B100K'
    subcategory     TEXT,                   -- NPN | PNP | JFET | Germanium | Schottky | Zener | Op-Amp | etc.
    frequency_rank  INTEGER,               -- 1 = most common in pedal circuits
    frequency_count INTEGER,               -- raw occurrence count in reference dataset
    package         TEXT,                  -- TO-92 | DO-35 | DIP-8 | DIP-14 | DIP-16 etc.
    description     TEXT,                  -- brief builder-facing description
    aliases         TEXT[]      NOT NULL DEFAULT '{}',  -- alternate names/spellings
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (component_type, value)
);

CREATE INDEX idx_component_ref_type  ON public.component_reference (component_type);
CREATE INDEX idx_component_ref_value ON public.component_reference (value);
CREATE INDEX idx_component_ref_rank  ON public.component_reference (component_type, frequency_rank);

-- Public read-only, service_role write
ALTER TABLE public.component_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read component reference"
    ON public.component_reference FOR SELECT TO public USING (true);

-- ─────────────────────────────────────────────
-- enclosure_reference
-- ─────────────────────────────────────────────
CREATE TABLE public.enclosure_reference (
    id                  UUID    NOT NULL DEFAULT uuid_generate_v4(),
    size                TEXT    NOT NULL UNIQUE,  -- '1590B', '125B', etc.
    common_name         TEXT,                     -- 'Hammond 1590B', 'MXR-style'
    internal_w_mm       NUMERIC(6,1),
    internal_h_mm       NUMERIC(6,1),
    internal_d_mm       NUMERIC(6,1),
    typical_knob_count  INT,
    max_pcb_mm          TEXT,                     -- 'approx 54 x 105mm'
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE public.enclosure_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read enclosure reference"
    ON public.enclosure_reference FOR SELECT TO public USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════

-- ─── TRANSISTORS ─────────────────────────────────────────────────
INSERT INTO public.component_reference
    (component_type, value, subcategory, frequency_rank, frequency_count, package, description, aliases)
VALUES
  ('transistor','J201',    'JFET N-channel', 1, 127, 'TO-92', 'N-channel JFET, very popular in boutique overdrive and fuzz; high input impedance, low noise', ARRAY['J201','j201']),
  ('transistor','2N5088',  'NPN',            2,  84, 'TO-92', 'NPN silicon, high hFE (300–800), widely used in fuzz and boost circuits', ARRAY['2n5088','2N5088']),
  ('transistor','BC549C',  'NPN',            3,  71, 'TO-92', 'NPN silicon, low noise, C-grade selected for hFE; very common in boost and overdrive', ARRAY['BC549C','bc549c','BC 549C']),
  ('transistor','2N3904',  'NPN',            4,  67, 'TO-92', 'NPN silicon, general-purpose workhorse; extremely common in all types of pedal circuits', ARRAY['2n3904','2N3904']),
  ('transistor','BS170',   'N-channel MOSFET',5, 57, 'TO-92', 'N-channel enhancement MOSFET, used in switching and MOSFET boost/fuzz circuits', ARRAY['bs170','BS170']),
  ('transistor','2N5089',  'NPN',            6,  56, 'TO-92', 'NPN silicon, very high hFE (450–1800); preferred in treble boosters and vintage fuzz', ARRAY['2n5089','2N5089']),
  ('transistor','MPSA18',  'NPN',            7,  40, 'TO-92', 'NPN silicon, ultra-high gain Darlington-style; used in fuzz and extreme-gain stages', ARRAY['mpsa18','MPSA18','MPSA 18']),
  ('transistor','2N3906',  'PNP',            8,  35, 'TO-92', 'PNP silicon, general-purpose complement to 2N3904', ARRAY['2n3906','2N3906']),
  ('transistor','BC548',   'NPN',            9,  35, 'TO-92', 'NPN silicon, general purpose; similar to BC549 but without low-noise specification', ARRAY['bc548','BC548','BC 548']),
  ('transistor','MPF4393', 'JFET N-channel',10,  32, 'TO-92', 'N-channel JFET, used in clean switching and low-noise signal routing', ARRAY['mpf4393','MPF4393']),
  ('transistor','2N7000',  'N-channel MOSFET',11, 27, 'TO-92', 'N-channel enhancement MOSFET, general purpose logic-level switching', ARRAY['2n7000','2N7000']),
  ('transistor','2N5457',  'JFET N-channel',12,  24, 'TO-92', 'N-channel JFET, general-purpose audio; used in clean boost and buffer circuits', ARRAY['2n5457','2N5457']),
  ('transistor','BC550C',  'NPN',           13,  18, 'TO-92', 'NPN silicon, low noise selected grade; high-gain cousin of BC549C', ARRAY['bc550c','BC550C','BC 550C']),
  ('transistor','2SC1815', 'NPN',           14,  18, 'TO-92', 'NPN silicon (Japanese), widely used in vintage-style and Japanese pedal circuits', ARRAY['2sc1815','2SC1815']),
  ('transistor','2N4125',  'PNP',           15,  15, 'TO-92', 'PNP silicon, general purpose', ARRAY['2n4125','2N4125']),
  ('transistor','2N1308',  'Germanium PNP', 16,  13, 'TO-18', 'PNP germanium, used in vintage fuzz face-style circuits; dark, warm character', ARRAY['2n1308','2N1308']),
  ('transistor','2N2222',  'NPN',           17,  12, 'TO-92', 'NPN silicon, extremely common general-purpose transistor', ARRAY['2n2222','2N2222','2N2222A']),
  ('transistor','BC549',   'NPN',           18,  12, 'TO-92', 'NPN silicon, low noise; standard-grade (non-selected) version of BC549C', ARRAY['bc549','BC549','BC 549']),
  ('transistor','PF5102',  'JFET N-channel',19,  11, 'TO-92', 'N-channel JFET, low-noise audio applications', ARRAY['pf5102','PF5102']),
  ('transistor','2N5485',  'JFET N-channel',20,   9, 'TO-92', 'N-channel JFET, general purpose audio', ARRAY['2n5485','2N5485']),
  ('transistor','OC71',    'Germanium PNP', 21,   9, 'TO-1',  'PNP germanium, classic British fuzz transistor (metal can); found in early Tone Benders', ARRAY['oc71','OC71']),
  ('transistor','2N5087',  'PNP',           22,   8, 'TO-92', 'PNP silicon, high hFE complement to 2N5088', ARRAY['2n5087','2N5087']),
  ('transistor','2N5133',  'Germanium PNP', 23,   8, 'TO-18', 'PNP germanium, used in fuzz face-style circuits', ARRAY['2n5133','2N5133']),
  ('transistor','2N5458',  'JFET N-channel',24,   8, 'TO-92', 'N-channel JFET, similar to 2N5457', ARRAY['2n5458','2N5458']),
  ('transistor','BC109C',  'NPN',           25,   7, 'TO-18', 'NPN silicon, vintage metal-can; used in classic British pedals like the Tone Bender', ARRAY['bc109c','BC109C','BC 109C']);

-- ─── DIODES ──────────────────────────────────────────────────────
INSERT INTO public.component_reference
    (component_type, value, subcategory, frequency_rank, frequency_count, package, description, aliases)
VALUES
  ('diode','1N5817',  'Schottky',   1, 513, 'DO-41', 'Schottky rectifier, 1A 20V; primary reverse-polarity protection diode in pedal power supplies', ARRAY['1n5817','1N5817']),
  ('diode','1N4148',  'Signal',     2, 449, 'DO-35', 'Silicon signal diode; the most common clipping diode in overdrive and distortion circuits', ARRAY['1n4148','1N4148','IN4148']),
  ('diode','1N914',   'Signal',     3, 188, 'DO-35', 'Silicon signal diode, functionally identical to 1N4148; classic vintage equivalent', ARRAY['1n914','1N914','IN914']),
  ('diode','1N34A',   'Germanium',  4,  70, 'DO-7',  'Germanium diode; asymmetric clipping with soft warm character; classic fuzz and overdrive', ARRAY['1n34a','1N34A','1N34']),
  ('diode','1N4001',  'Rectifier',  5,  53, 'DO-41', 'Silicon rectifier, 1A 50V; used for power supply rectification and reverse polarity protection', ARRAY['1n4001','1N4001']),
  ('diode','BAT41',   'Schottky',   6,  25, 'DO-35', 'Small-signal Schottky; lower forward voltage than 1N4148, softer clipping character', ARRAY['bat41','BAT41']),
  ('diode','9V1',     'Zener',      7,  24, 'DO-35', 'Zener diode 9.1V; used for voltage regulation and clipping at 9.1V', ARRAY['9V1','9v1','9.1V Zener','ZD9V1']),
  ('diode','BAT46',   'Schottky',   8,  18, 'DO-35', 'Small-signal Schottky, 100V; used in signal path for soft asymmetric clipping', ARRAY['bat46','BAT46']),
  ('diode','MA856',   'Germanium',  9,  12, 'DO-35', 'Japanese germanium diode; warm clipping character, similar to 1N34A', ARRAY['ma856','MA856']),
  ('diode','1N270',   'Germanium', 10,  11, 'DO-7',  'Germanium signal diode; vintage clipping diode with soft knee', ARRAY['1n270','1N270']),
  ('diode','BAT42',   'Schottky',  11,  10, 'DO-35', 'Small-signal Schottky, 30V; similar to BAT41', ARRAY['bat42','BAT42']),
  ('diode','1N4739',  'Zener',     12,   9, 'DO-41', 'Zener diode 9.1V, 1W; higher power version of 9V1 zener', ARRAY['1n4739','1N4739']),
  ('diode','1N916A',  'Signal',    13,   7, 'DO-35', 'Silicon signal diode, faster switching than 1N4148', ARRAY['1n916a','1N916A']),
  ('diode','BA282',   'Schottky',  14,   7, 'DO-35', 'Schottky signal diode; used for asymmetric clipping', ARRAY['ba282','BA282']),
  ('diode','1N916',   'Signal',    15,   6, 'DO-35', 'Silicon signal diode, equivalent to 1N916A', ARRAY['1n916','1N916']),
  ('diode','1N4007',  'Rectifier', 16,   6, 'DO-41', 'Silicon rectifier, 1A 1000V; heavy-duty reverse polarity protection', ARRAY['1n4007','1N4007']),
  ('diode','1N4742',  'Zener',     17,   5, 'DO-41', 'Zener diode 12V; voltage regulation at 12V', ARRAY['1n4742','1N4742']),
  ('diode','1N456A',  'Signal',    18,   4, 'DO-35', 'Silicon signal diode', ARRAY['1n456a','1N456A']),
  ('diode','1N4005',  'Rectifier', 19,   4, 'DO-41', 'Silicon rectifier, 1A 600V', ARRAY['1n4005','1N4005']),
  ('diode','SH270',   'Germanium', 20,   4, 'DO-7',  'Germanium diode, similar character to 1N270', ARRAY['sh270','SH270']),
  ('diode','1S1588',  'Signal',    21,   4, 'DO-35', 'Japanese silicon signal diode; functionally equivalent to 1N4148', ARRAY['1s1588','1S1588']),
  ('diode','8V2',     'Zener',     22,   3, 'DO-35', 'Zener diode 8.2V; voltage regulation and clipping at 8.2V', ARRAY['8V2','8v2','8.2V Zener','ZD8V2']),
  ('diode','BAT48',   'Schottky',  23,   3, 'DO-35', 'Schottky signal diode', ARRAY['bat48','BAT48']),
  ('diode','1N4678',  'Zener',     24,   4, 'DO-41', 'Zener diode', ARRAY['1n4678','1N4678']),
  ('diode','1N4005',  'Rectifier', 19,   4, 'DO-41', 'Silicon rectifier, 1A 600V', ARRAY['1n4005'])
ON CONFLICT (component_type, value) DO NOTHING;

-- ─── ICs ─────────────────────────────────────────────────────────
INSERT INTO public.component_reference
    (component_type, value, subcategory, frequency_rank, frequency_count, package, description, aliases)
VALUES
  ('ic','TL072',    'Op-Amp',        1, 257, 'DIP-8',  'Dual JFET-input op-amp; the most common op-amp in pedal circuits — low noise, low distortion', ARRAY['tl072','TL072','TL072CP']),
  ('ic','JRC4558',  'Op-Amp',        2,  56, 'DIP-8',  'Dual bipolar op-amp; famous for its use in the original Ibanez Tube Screamer', ARRAY['jrc4558','JRC4558','4558','RC4558','NJM4558']),
  ('ic','TC1044',   'Charge Pump',   3,  47, 'DIP-8',  'Switched-capacitor voltage converter; generates negative or doubled voltage from 9V', ARRAY['tc1044','TC1044','TC1044S','ICL7660']),
  ('ic','L78L33',   'Regulator',     4,  28, 'TO-92',  '3.3V linear voltage regulator, 100mA; used in digital/DSP pedal circuits', ARRAY['l78l33','L78L33','78L33']),
  ('ic','TL074',    'Op-Amp',        5,  24, 'DIP-14', 'Quad JFET-input op-amp; four op-amps in one package, used in complex multi-stage circuits', ARRAY['tl074','TL074','TL074CN']),
  ('ic','FV1',      'DSP',           6,  23, 'DIP-28', 'Spin Semiconductor FV1 reverb/delay DSP chip; used in many boutique digital reverb pedals', ARRAY['fv1','FV1','FV-1','SpinFV1']),
  ('ic','24LC32A',  'EEPROM',        7,  20, 'DIP-8',  'I2C EEPROM 32Kbit; stores patch data for FV1-based DSP pedals', ARRAY['24lc32a','24LC32A','24LC32']),
  ('ic','LM833',    'Op-Amp',        8,  19, 'DIP-8',  'Dual low-noise op-amp; lower noise than TL072, used in high-fidelity preamp stages', ARRAY['lm833','LM833','LM833N']),
  ('ic','RC4558P',  'Op-Amp',        9,  14, 'DIP-8',  'Dual bipolar op-amp; equivalent to JRC4558, used as Tube Screamer replacement', ARRAY['rc4558p','RC4558P','RC4558','4558P']),
  ('ic','OPA2134',  'Op-Amp',       10,  14, 'DIP-8',  'Dual high-performance FET op-amp (Burr-Brown/TI); premium tone, very low noise and distortion', ARRAY['opa2134','OPA2134','OPA2134PA']),
  ('ic','LM308',    'Op-Amp',       11,  11, 'DIP-8',  'Single precision op-amp; used in the original ProCo Rat distortion circuit', ARRAY['lm308','LM308','LM308N']),
  ('ic','NE5532',   'Op-Amp',       12,  10, 'DIP-8',  'Dual low-noise bipolar op-amp; studio-grade, used in high-quality audio circuits', ARRAY['ne5532','NE5532','NE5532P']),
  ('ic','L78L05',   'Regulator',    13,  10, 'TO-92',  '5V linear voltage regulator, 100mA; used in digital pedal power supply stages', ARRAY['l78l05','L78L05','78L05']),
  ('ic','PT2399',   'Delay',        14,   9, 'DIP-16', 'Echo processor IC; the most popular chip for analog-voiced digital delay pedals', ARRAY['pt2399','PT2399']),
  ('ic','CD4049UBE','Logic',        15,   9, 'DIP-16', 'Hex unbuffered CMOS inverter; used in oscillator and fuzz circuits (Bazz Fuss, etc.)', ARRAY['cd4049ube','CD4049UBE','CD4049','4049']),
  ('ic','LF353N',   'Op-Amp',       16,   9, 'DIP-8',  'Dual JFET-input op-amp; very similar to TL072, slightly different character', ARRAY['lf353n','LF353N','LF353']),
  ('ic','LM386',    'Power Amp',    17,   9, 'DIP-8',  'Audio power amplifier, 250–700mW; used in small speaker drives and some lo-fi fuzz circuits', ARRAY['lm386','LM386','LM386N']),
  ('ic','LT1054',   'Charge Pump',  18,   9, 'DIP-8',  'Switched-capacitor voltage converter, similar to TC1044 but with improved regulation', ARRAY['lt1054','LT1054']),
  ('ic','MC1458',   'Op-Amp',       19,   9, 'DIP-8',  'Dual bipolar op-amp (Motorola); equivalent to LM358/RC4558', ARRAY['mc1458','MC1458','MC1458P']),
  ('ic','JRC4580',  'Op-Amp',       20,   8, 'DIP-8',  'Dual bipolar op-amp; used in Boss pedals (SD-1, BD-2)', ARRAY['jrc4580','JRC4580','4580','NJM4580']),
  ('ic','LM741',    'Op-Amp',       21,   8, 'DIP-8',  'Classic single op-amp; used in vintage circuits, limited bandwidth vs modern alternatives', ARRAY['lm741','LM741','LM741CN','741']),
  ('ic','TL071',    'Op-Amp',       22,   7, 'DIP-8',  'Single JFET-input op-amp; single-channel version of TL072', ARRAY['tl071','TL071','TL071CP']),
  ('ic','CD4017BM', 'Logic',        23,   6, 'DIP-16', 'CMOS decade counter/divider; used in sequencer and rhythmic effect circuits', ARRAY['cd4017bm','CD4017BM','CD4017','4017']),
  ('ic','CD4024BE', 'Logic',        24,   6, 'DIP-14', '7-stage ripple binary counter; used in clock/divider circuits', ARRAY['cd4024be','CD4024BE','CD4024','4024']),
  ('ic','CD4046N',  'Logic',        25,   6, 'DIP-16', 'CMOS PLL; used in pitch-shifting and modulation circuits', ARRAY['cd4046n','CD4046N','CD4046','4046']);

-- ─── RESISTORS ───────────────────────────────────────────────────
INSERT INTO public.component_reference
    (component_type, value, subcategory, frequency_rank, frequency_count, package, description, aliases)
VALUES
  ('resistor','10K',  NULL, 1, 1546, '1/4W axial', 'Most common resistor value in pedal circuits', ARRAY['10k','10K','10KΩ','10 kohm','10000R','10000Ω']),
  ('resistor','4K7',  NULL, 2,  823, '1/4W axial', '4.7kΩ; very common in gain stages and filters', ARRAY['4k7','4K7','4.7K','4.7k','4.7kΩ','4700R']),
  ('resistor','1M',   NULL, 3,  807, '1/4W axial', '1MΩ; common in input impedance and bias circuits', ARRAY['1m','1M','1MΩ','1meg','1000K','1000k']),
  ('resistor','1K',   NULL, 4,  721, '1/4W axial', '1kΩ; very common in gain stages and current limiting', ARRAY['1k','1K','1KΩ','1000R','1000Ω']),
  ('resistor','100K', NULL, 5,  663, '1/4W axial', '100kΩ; common in bias, feedback, and filter networks', ARRAY['100k','100K','100KΩ','100kohm']),
  ('resistor','22K',  NULL, 6,  425, '1/4W axial', '22kΩ; common in tone and bias circuits', ARRAY['22k','22K','22KΩ','22000R']),
  ('resistor','470K', NULL, 7,  359, '1/4W axial', '470kΩ; common in high-impedance input and bias circuits', ARRAY['470k','470K','470KΩ']),
  ('resistor','47K',  NULL, 8,  331, '1/4W axial', '47kΩ; common in feedback and tone networks', ARRAY['47k','47K','47KΩ','47000R']),
  ('resistor','2K2',  NULL, 9,  223, '1/4W axial', '2.2kΩ; common in emitter and source resistors', ARRAY['2k2','2K2','2.2K','2.2k','2.2kΩ','2200R']),
  ('resistor','15K',  NULL,10,  213, '1/4W axial', '15kΩ; common in filter and bias networks', ARRAY['15k','15K','15KΩ','15000R']),
  ('resistor','33K',  NULL,11,  189, '1/4W axial', '33kΩ; common in tone and feedback circuits', ARRAY['33k','33K','33KΩ']),
  ('resistor','220K', NULL,12,  184, '1/4W axial', '220kΩ; common in high-impedance bias circuits', ARRAY['220k','220K','220KΩ']),
  ('resistor','100R', NULL,13,  172, '1/4W axial', '100Ω; common in output and emitter degeneration', ARRAY['100r','100R','100Ω','100 ohm']),
  ('resistor','3K3',  NULL,14,  136, '1/4W axial', '3.3kΩ; common in bias and filter stages', ARRAY['3k3','3K3','3.3K','3.3k','3300R']),
  ('resistor','470R', NULL,15,  122, '1/4W axial', '470Ω; common in LED current limiting and output stages', ARRAY['470r','470R','470Ω','470 ohm']),
  ('resistor','2M2',  NULL,16,  110, '1/4W axial', '2.2MΩ; used in very high-impedance input circuits', ARRAY['2m2','2M2','2.2M','2.2MΩ','2200K']),
  ('resistor','12K',  NULL,17,   92, '1/4W axial', '12kΩ; common in bias and filter networks', ARRAY['12k','12K','12KΩ','12000R']),
  ('resistor','1K5',  NULL,18,   89, '1/4W axial', '1.5kΩ; common in bias and emitter resistors', ARRAY['1k5','1K5','1.5K','1.5k','1500R']),
  ('resistor','68K',  NULL,19,   81, '1/4W axial', '68kΩ; common in tone stacks and bias networks', ARRAY['68k','68K','68KΩ']),
  ('resistor','220R', NULL,20,   74, '1/4W axial', '220Ω; common in LED current limiting and output stages', ARRAY['220r','220R','220Ω']),
  ('resistor','27K',  NULL,21,   73, '1/4W axial', '27kΩ; common in bias and filter networks', ARRAY['27k','27K','27KΩ']),
  ('resistor','20K',  NULL,22,   72, '1/4W axial', '20kΩ; common in feedback and tone circuits', ARRAY['20k','20K','20KΩ','20000R']),
  ('resistor','8K2',  NULL,23,   71, '1/4W axial', '8.2kΩ; common in bias and filter stages', ARRAY['8k2','8K2','8.2K','8.2k','8200R']),
  ('resistor','39K',  NULL,24,   71, '1/4W axial', '39kΩ; common in tone and bias networks', ARRAY['39k','39K','39KΩ']),
  ('resistor','56K',  NULL,25,   69, '1/4W axial', '56kΩ; common in filter and bias circuits', ARRAY['56k','56K','56KΩ']);

-- ─── CAPACITORS ──────────────────────────────────────────────────
INSERT INTO public.component_reference
    (component_type, value, subcategory, frequency_rank, frequency_count, package, description, aliases)
VALUES
  ('capacitor','100nF', 'Film',        1,  949, 'Disc/Box', '0.1µF; most common bypass/coupling cap in pedal circuits', ARRAY['100nf','100NF','0.1uF','0.1µF','100n','.1uF','.1µF','104']),
  ('capacitor','1µF',   'Electrolytic',2,  742, 'Radial',   '1µF; coupling and filter cap, audio frequency range', ARRAY['1uf','1uF','1µF','1000nF','1000n']),
  ('capacitor','10µF',  'Electrolytic',3,  568, 'Radial',   '10µF; power supply bypass and low-frequency coupling', ARRAY['10uf','10uF','10µF','10000nF']),
  ('capacitor','100µF', 'Electrolytic',4,  395, 'Radial',   '100µF; bulk power supply bypass cap, main filter cap', ARRAY['100uf','100uF','100µF']),
  ('capacitor','22nF',  'Film',        5,  372, 'Disc/Box', '0.022µF; tone-shaping and treble-cut filter cap', ARRAY['22nf','22NF','22n','0.022uF','0.022µF','.022uF','223']),
  ('capacitor','10nF',  'Film',        6,  364, 'Disc/Box', '0.01µF; high-frequency filtering and tone circuits', ARRAY['10nf','10NF','10n','0.01uF','0.01µF','.01uF','103']),
  ('capacitor','47nF',  'Film',        7,  314, 'Disc/Box', '0.047µF; mid-frequency coupling and tone shaping', ARRAY['47nf','47NF','47n','0.047uF','0.047µF','.047uF','473']),
  ('capacitor','47µF',  'Electrolytic',8,  302, 'Radial',   '47µF; power supply filter and low-frequency coupling', ARRAY['47uf','47uF','47µF']),
  ('capacitor','1nF',   'Film',        9,  253, 'Disc/Box', '1000pF; high-frequency parasitic suppression and treble roll-off', ARRAY['1nf','1NF','1n','1000pF','1000p','102']),
  ('capacitor','220nF', 'Film',       10,  241, 'Disc/Box', '0.22µF; coupling and tone filter in mid-bass range', ARRAY['220nf','220NF','220n','0.22uF','0.22µF','.22uF','224']),
  ('capacitor','100pF', 'Ceramic',    11,  188, 'Disc',     '100pF; very high frequency compensation and RF bypass', ARRAY['100pf','100PF','100p','101']),
  ('capacitor','2.2nF', 'Film',       12,  168, 'Disc/Box', '2200pF; high frequency tone shaping', ARRAY['2nf2','2.2nf','2.2NF','2.2n','2200pF','2200p','222']),
  ('capacitor','470pF', 'Ceramic',    13,  157, 'Disc',     '470pF; high frequency roll-off in tone circuits', ARRAY['470pf','470PF','470p','471']),
  ('capacitor','4.7µF', 'Electrolytic',14, 136, 'Radial',   '4.7µF; coupling cap for bass frequencies', ARRAY['4uf7','4.7uf','4.7uF','4.7µF','4u7']),
  ('capacitor','22µF',  'Electrolytic',15, 134, 'Radial',   '22µF; power supply bypass and coupling cap', ARRAY['22uf','22uF','22µF']),
  ('capacitor','4.7nF', 'Film',       16,  115, 'Disc/Box', '4700pF; treble-cut and tone-shaping cap', ARRAY['4nf7','4.7nf','4.7NF','4.7n','4700pF','4700p','472']),
  ('capacitor','47pF',  'Ceramic',    17,  108, 'Disc',     '47pF; very high frequency compensation', ARRAY['47pf','47PF','47p','470']),
  ('capacitor','220pF', 'Ceramic',    18,  108, 'Disc',     '220pF; high frequency compensation and RF bypass', ARRAY['220pf','220PF','220p','221']),
  ('capacitor','2.2µF', 'Electrolytic',19, 104, 'Radial',   '2.2µF; coupling cap', ARRAY['2uf2','2.2uf','2.2uF','2.2µF','2u2']),
  ('capacitor','470nF', 'Film',       20,   86, 'Disc/Box', '0.47µF; coupling cap in bass-heavy circuits', ARRAY['470nf','470NF','470n','0.47uF','0.47µF','.47uF','474']),
  ('capacitor','3.3nF', 'Film',       21,   67, 'Disc/Box', '3300pF; tone shaping', ARRAY['3nf3','3.3nf','3.3NF','3.3n','3300pF','3300p','332']),
  ('capacitor','220µF', 'Electrolytic',22,  63, 'Radial',   '220µF; main power supply filter cap in larger circuits', ARRAY['220uf','220uF','220µF']),
  ('capacitor','120pF', 'Ceramic',    23,   59, 'Disc',     '120pF; high frequency compensation', ARRAY['120pf','120PF','120p','121']),
  ('capacitor','6.8nF', 'Film',       24,   57, 'Disc/Box', '6800pF; tone shaping cap', ARRAY['6nf8','6.8nf','6.8NF','6.8n','6800pF','6800p','682']),
  ('capacitor','33nF',  'Film',       25,   54, 'Disc/Box', '0.033µF; tone and filter cap', ARRAY['33nf','33NF','33n','0.033uF','0.033µF','.033uF','333']);

-- ─── POTENTIOMETERS ──────────────────────────────────────────────
INSERT INTO public.component_reference
    (component_type, value, subcategory, frequency_rank, frequency_count, package, description, aliases)
VALUES
  ('potentiometer','B100K', 'Linear',      1, 358, '9mm/16mm Alpha', 'Linear 100kΩ pot; most common volume and gain control in pedal circuits', ARRAY['b100k','B100K','100K Lin','100k Linear']),
  ('potentiometer','A100K', 'Audio/Log',   2, 264, '9mm/16mm Alpha', 'Audio taper 100kΩ; used for volume controls where log response feels natural', ARRAY['a100k','A100K','100K Log','100k Audio','100K Audio']),
  ('potentiometer','B50K',  'Linear',      3, 135, '9mm/16mm Alpha', 'Linear 50kΩ; common in tone and gain circuits', ARRAY['b50k','B50K','50K Lin','50k Linear']),
  ('potentiometer','B10K',  'Linear',      4, 123, '9mm/16mm Alpha', 'Linear 10kΩ; common in bias and tone controls', ARRAY['b10k','B10K','10K Lin','10k Linear']),
  ('potentiometer','B25K',  'Linear',      5,  88, '9mm/16mm Alpha', 'Linear 25kΩ; tone and blending circuits', ARRAY['b25k','B25K','25K Lin','25k Linear']),
  ('potentiometer','A50K',  'Audio/Log',   6,  81, '9mm/16mm Alpha', 'Audio taper 50kΩ; volume and tone controls', ARRAY['a50k','A50K','50K Log','50k Audio']),
  ('potentiometer','A1M',   'Audio/Log',   7,  71, '9mm/16mm Alpha', 'Audio taper 1MΩ; common in tube-amp-style high-impedance tone controls', ARRAY['a1m','A1M','1M Log','1M Audio']),
  ('potentiometer','A10K',  'Audio/Log',   8,  65, '9mm/16mm Alpha', 'Audio taper 10kΩ; gain and volume controls', ARRAY['a10k','A10K','10K Log','10k Audio']),
  ('potentiometer','A500K', 'Audio/Log',   9,  55, '9mm/16mm Alpha', 'Audio taper 500kΩ; very common in treble and presence controls', ARRAY['a500k','A500K','500K Log','500k Audio']),
  ('potentiometer','C100K', 'Reverse Log', 10, 45, '9mm/16mm Alpha', 'Reverse audio taper 100kΩ; used where reverse-log response is needed', ARRAY['c100k','C100K','100K Rev','100k Reverse']),
  ('potentiometer','C10K',  'Reverse Log', 11, 42, '9mm/16mm Alpha', 'Reverse audio taper 10kΩ', ARRAY['c10k','C10K','10K Rev']),
  ('potentiometer','B5K',   'Linear',      12, 40, '9mm/16mm Alpha', 'Linear 5kΩ; used in bass and mid controls', ARRAY['b5k','B5K','5K Lin']),
  ('potentiometer','B1M',   'Linear',      13, 39, '9mm/16mm Alpha', 'Linear 1MΩ; high-impedance volume and tone controls', ARRAY['b1m','B1M','1M Lin']),
  ('potentiometer','B250K', 'Linear',      14, 36, '9mm/16mm Alpha', 'Linear 250kΩ; tone controls in many circuits', ARRAY['b250k','B250K','250K Lin']),
  ('potentiometer','B500K', 'Linear',      15, 33, '9mm/16mm Alpha', 'Linear 500kΩ; tone and treble controls', ARRAY['b500k','B500K','500K Lin']),
  ('potentiometer','A250K', 'Audio/Log',   16, 31, '9mm/16mm Alpha', 'Audio taper 250kΩ; very common in guitar volume and tone circuits', ARRAY['a250k','A250K','250K Log','250k Audio']),
  ('potentiometer','B1K',   'Linear',      17, 28, '9mm/16mm Alpha', 'Linear 1kΩ; low-value control for output and feedback', ARRAY['b1k','B1K','1K Lin']),
  ('potentiometer','C50K',  'Reverse Log', 18, 18, '9mm/16mm Alpha', 'Reverse audio taper 50kΩ', ARRAY['c50k','C50K','50K Rev']),
  ('potentiometer','B20K',  'Linear',      19, 17, '9mm/16mm Alpha', 'Linear 20kΩ', ARRAY['b20k','B20K','20K Lin']),
  ('potentiometer','W20K',  'Linear',      20, 13, '9mm/16mm Alpha', 'Linear 20kΩ (W-taper variant)', ARRAY['w20k','W20K']),
  ('potentiometer','A25K',  'Audio/Log',   21, 12, '9mm/16mm Alpha', 'Audio taper 25kΩ', ARRAY['a25k','A25K','25K Log']),
  ('potentiometer','C5K',   'Reverse Log', 22, 12, '9mm/16mm Alpha', 'Reverse audio taper 5kΩ', ARRAY['c5k','C5K']),
  ('potentiometer','B2K',   'Linear',      23, 11, '9mm/16mm Alpha', 'Linear 2kΩ', ARRAY['b2k','B2K','2K Lin']),
  ('potentiometer','C500K', 'Reverse Log', 24, 11, '9mm/16mm Alpha', 'Reverse audio taper 500kΩ', ARRAY['c500k','C500K']),
  ('potentiometer','C1M',   'Reverse Log', 25,  8, '9mm/16mm Alpha', 'Reverse audio taper 1MΩ', ARRAY['c1m','C1M']);

-- ─── TRIMMERS ────────────────────────────────────────────────────
INSERT INTO public.component_reference
    (component_type, value, subcategory, frequency_rank, frequency_count, package, description, aliases)
VALUES
  ('trimmer','100K', NULL, 1, 62, 'Cermet 3296', '100kΩ trimmer; bias adjustment in transistor and op-amp circuits', ARRAY['100k','100K trim']),
  ('trimmer','10K',  NULL, 2, 30, 'Cermet 3296', '10kΩ trimmer; gain and bias adjustment', ARRAY['10k','10K trim']),
  ('trimmer','50K',  NULL, 3, 29, 'Cermet 3296', '50kΩ trimmer; bias and tone adjustment', ARRAY['50k','50K trim']),
  ('trimmer','1K',   NULL, 4, 22, 'Cermet 3296', '1kΩ trimmer; output level and fine-tune adjustment', ARRAY['1k','1K trim']),
  ('trimmer','5K',   NULL, 5, 15, 'Cermet 3296', '5kΩ trimmer; bias and level adjustment', ARRAY['5k','5K trim']),
  ('trimmer','500R', NULL, 6,  5, 'Cermet 3296', '500Ω trimmer; low-value fine adjustment', ARRAY['500r','500R trim','500 ohm']),
  ('trimmer','150K', NULL, 7,  4, 'Cermet 3296', '150kΩ trimmer', ARRAY['150k','150K trim']),
  ('trimmer','500K', NULL, 8,  4, 'Cermet 3296', '500kΩ trimmer; high-impedance bias adjustment', ARRAY['500k','500K trim']),
  ('trimmer','1M',   NULL, 9,  3, 'Cermet 3296', '1MΩ trimmer', ARRAY['1m','1M trim']),
  ('trimmer','2K',   NULL,10,  2, 'Cermet 3296', '2kΩ trimmer', ARRAY['2k','2K trim']),
  ('trimmer','25K',  NULL,11,  1, 'Cermet 3296', '25kΩ trimmer', ARRAY['25k','25K trim']);


-- ═══════════════════════════════════════════════════════════════════
-- ENCLOSURE REFERENCE
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO public.enclosure_reference
    (size, common_name, internal_w_mm, internal_h_mm, internal_d_mm, typical_knob_count, max_pcb_mm, notes)
VALUES
  ('1590A',  'Hammond 1590A — Nano',    36.0,  58.0, 31.0, 1,  '30×50mm',   'Extremely small; fits 1 knob + footswitch. Single-transistor boosts and simple fuzzes only.'),
  ('1590B',  'Hammond 1590B — MXR',     61.0, 112.0, 31.0, 3,  '54×105mm',  'Standard small pedal enclosure. Named after MXR-style boxes. Fits 2–4 knobs + 9V jack + jacks. Most common DIY size.'),
  ('1590BB', 'Hammond 1590BB — 125B cousin', 75.0, 120.0, 32.0, 5,  '68×112mm',  'Medium enclosure. Fits 4–6 knobs comfortably. Good for multi-control pedals like overdrives and delays.'),
  ('125B',   'Hammond 125B — Tall Box', 63.0, 119.0, 39.0, 4,  '56×112mm',  'Tall version of standard size; extra depth for taller components or stacked PCBs. Very popular for boutique builds.'),
  ('1590N1', 'Hammond 1590N1 — Medium', 80.0, 119.0, 53.0, 5,  '73×112mm',  'Wider and deeper than 125B; good for multi-knob analog delays and complex circuits.'),
  ('1590XX', 'Hammond 1590XX — Large',  95.0, 145.0, 34.0, 8,  '88×138mm',  'Large enclosure; fits 6–9 knobs. Used for multi-effect, chorus/flanger, and complex delay units.'),
  ('1590LB', 'Hammond 1590LB — 2x MXR',121.0,122.0, 33.0, 8,  '114×115mm', 'Double-wide MXR size; fits 8+ knobs. Used for larger effect circuits.'),
  ('1590DD', 'Hammond 1590DD — Maxi',  111.0, 213.0, 32.0, 12, '104×206mm', 'Very large; fits 10–12 knobs. Used for multi-channel, amp-in-a-box, and complex multi-effect builds.');
