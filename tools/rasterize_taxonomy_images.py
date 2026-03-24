"""
rasterize_taxonomy_images.py
Converts component SVG sprites → 200×200 PNG taxonomy images.

For the 18 classes that have existing SVGs: rasterizes them via cairosvg.
For the 12 missing classes: generates clean vector-accurate SVGs on the fly,
then rasterizes those too. All 30 classes get consistent PNG output.

Output: docs/generated/taxonomy_images/  (30 PNGs, named by package_class slug)

Usage:
    python3 tools/rasterize_taxonomy_images.py
    python3 tools/rasterize_taxonomy_images.py --upload  (also push to Supabase Storage)
"""

import sys
import os
import argparse
from pathlib import Path

try:
    import cairosvg
except ImportError:
    print('[FAIL]  cairosvg not installed. Run: pip install cairosvg --break-system-packages')
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print('[FAIL]  Pillow not installed. Run: pip install Pillow')
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent
SVG_DIR   = REPO_ROOT / 'pedalpath-app' / 'src' / 'components' / 'visualizations' / 'components-svg'
OUT_DIR   = REPO_ROOT / 'docs' / 'generated' / 'taxonomy_images'
SIZE      = 200   # px each side

# ── Taxonomy map: slug → SVG filename (or None = generate) ────────────────────
#
# 30 physical appearance classes for through-hole guitar pedal components.
# slug must match the package_class field in the component_taxonomy DB table.

TAXONOMY = [
    # (slug,                       label,                         svg_file or None)
    ('axial_resistor',             'Axial Resistor',              'resistor-axial.svg'),
    ('metal_film_resistor',        'Metal Film Resistor',         None),
    ('ceramic_disc_cap',           'Ceramic Disc Capacitor',      'capacitor-ceramic-disc.svg'),
    ('monolithic_ceramic_cap',     'Monolithic Ceramic Cap',      None),
    ('film_cap',                   'Film Capacitor',              'capacitor-film.svg'),
    ('electrolytic_radial',        'Electrolytic Cap (Radial)',   'capacitor-electrolytic.svg'),
    ('electrolytic_axial',         'Electrolytic Cap (Axial)',    None),
    ('tantalum_cap',               'Tantalum Capacitor',          'capacitor-tantalum.svg'),
    ('to92_transistor',            'TO-92 Transistor',            'transistor-to92.svg'),
    ('to18_transistor',            'TO-18 Metal Can',             'transistor-to18.svg'),
    ('to220_transistor',           'TO-220 Transistor',           None),
    ('signal_diode_1n4148',        '1N4148 Signal Diode',         'diode-signal.svg'),
    ('rectifier_diode_1n4001',     '1N4001 Rectifier Diode',      None),
    ('germanium_diode',            'Germanium Diode',             None),
    ('zener_diode',                'Zener Diode',                 'diode-zener.svg'),
    ('led_5mm',                    'LED 5mm',                     'led-5mm.svg'),
    ('led_3mm',                    'LED 3mm',                     'led-3mm.svg'),
    ('dip8_ic',                    'DIP-8 IC',                    'ic-dip8.svg'),
    ('dip14_ic',                   'DIP-14 IC',                   'ic-dip14.svg'),
    ('dip16_ic',                   'DIP-16 IC',                   'ic-dip16.svg'),
    ('pot_16mm',                   'Potentiometer 16mm',          'pot-alpha-round.svg'),
    ('pot_9mm_trimmer',            'Trimmer Pot 9mm',             None),
    ('switch_spst_toggle',         'SPST Toggle Switch',          None),
    ('switch_dpdt_toggle',         'DPDT Toggle Switch',          None),
    ('footswitch_3pdt',            '3PDT Footswitch',             'switch-dpdt-stomp.svg'),
    ('dc_barrel_jack',             'DC Barrel Jack',              'jack-barrel.svg'),
    ('jack_mono_ts',               '1/4" Mono Jack (TS)',         'jack-mono-ts.svg'),
    ('jack_stereo_trs',            '1/4" Stereo Jack (TRS)',      None),
    ('electret_mic',               'Electret Mic Capsule',        None),
    ('crystal_hc49',               'Crystal Oscillator (HC-49)',  None),
]


# ── Generated SVGs for missing classes ────────────────────────────────────────
# All drawn on 200×200 viewBox with transparent background.
# Style: clean line art, consistent stroke weight, fills that photograph well.

def svg_wrap(content: str, bg: str = 'none') -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" '
        f'width="200" height="200">'
        f'<rect width="200" height="200" fill="{bg}"/>'
        f'{content}'
        f'</svg>'
    )


GENERATED_SVGS: dict[str, str] = {

    # Metal film resistor — blue body, axial leads
    'metal_film_resistor': svg_wrap(
        '<line x1="20" y1="100" x2="55" y2="100" stroke="#555" stroke-width="3"/>'
        '<rect x="55" y="78" width="90" height="44" rx="22" fill="#4A80C4" stroke="#2255AA" stroke-width="2.5"/>'
        '<line x1="145" y1="100" x2="180" y2="100" stroke="#555" stroke-width="3"/>'
        # Colour bands: tight tolerance metal film — 5 bands
        '<line x1="78" y1="78" x2="78" y2="122" stroke="#B8860B" stroke-width="4"/>'
        '<line x1="92" y1="78" x2="92" y2="122" stroke="#B8860B" stroke-width="4"/>'
        '<line x1="106" y1="78" x2="106" y2="122" stroke="#B8860B" stroke-width="4"/>'
        '<line x1="118" y1="78" x2="118" y2="122" stroke="#C00" stroke-width="4"/>'
        '<line x1="131" y1="78" x2="131" y2="122" stroke="#FFD700" stroke-width="4"/>'
        '<text x="100" y="164" font-family="Arial" font-size="13" fill="#444" text-anchor="middle">Metal Film</text>'
    ),

    # Monolithic ceramic cap — small brick, two bottom leads
    'monolithic_ceramic_cap': svg_wrap(
        '<line x1="84" y1="148" x2="84" y2="170" stroke="#555" stroke-width="3"/>'
        '<line x1="116" y1="148" x2="116" y2="170" stroke="#555" stroke-width="3"/>'
        '<rect x="62" y="72" width="76" height="76" rx="5" fill="#D4A96A" stroke="#A07840" stroke-width="2.5"/>'
        '<text x="100" y="115" font-family="Arial" font-size="11" fill="#7A5020" text-anchor="middle">104</text>'
        '<text x="100" y="175" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">Monolithic</text>'
    ),

    # Electrolytic axial — cylinder, leads from each end
    'electrolytic_axial': svg_wrap(
        '<line x1="20" y1="100" x2="55" y2="100" stroke="#555" stroke-width="3"/>'
        '<line x1="145" y1="100" x2="180" y2="100" stroke="#555" stroke-width="3"/>'
        '<ellipse cx="100" cy="100" rx="46" ry="30" fill="#888" stroke="#555" stroke-width="2.5"/>'
        '<rect x="54" y="70" width="92" height="60" fill="#888" stroke="#555" stroke-width="2.5"/>'
        '<ellipse cx="100" cy="130" rx="46" ry="30" fill="#999" stroke="#555" stroke-width="2.5"/>'
        '<line x1="54" y1="70" x2="54" y2="130" stroke="#555" stroke-width="2.5"/>'
        '<line x1="146" y1="70" x2="146" y2="130" stroke="#555" stroke-width="2.5"/>'
        # Stripe for polarity
        '<rect x="130" y="70" width="16" height="60" fill="#CCC" opacity="0.5"/>'
        '<text x="100" y="78" font-family="Arial" font-size="14" fill="#333" text-anchor="middle" font-weight="bold">+</text>'
        '<text x="100" y="174" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">Axial Electro</text>'
    ),

    # TO-220 — large, heatsink tab, three legs
    'to220_transistor': svg_wrap(
        # Tab
        '<rect x="60" y="40" width="80" height="16" rx="2" fill="#BBB" stroke="#777" stroke-width="2"/>'
        '<circle cx="100" cy="48" r="5" fill="#999" stroke="#666" stroke-width="1.5"/>'
        # Body
        '<rect x="52" y="56" width="96" height="72" rx="4" fill="#333" stroke="#111" stroke-width="2.5"/>'
        # Leads
        '<rect x="68" y="128" width="10" height="36" rx="2" fill="#AAA" stroke="#777" stroke-width="1.5"/>'
        '<rect x="95" y="128" width="10" height="36" rx="2" fill="#AAA" stroke="#777" stroke-width="1.5"/>'
        '<rect x="122" y="128" width="10" height="36" rx="2" fill="#AAA" stroke="#777" stroke-width="1.5"/>'
        '<text x="100" y="100" font-family="Arial" font-size="12" fill="#EEE" text-anchor="middle">TO-220</text>'
        '<text x="100" y="178" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">TO-220 Transistor</text>'
    ),

    # 1N4001 rectifier diode — larger glass tube, grey
    'rectifier_diode_1n4001': svg_wrap(
        '<line x1="20" y1="100" x2="58" y2="100" stroke="#555" stroke-width="3"/>'
        '<line x1="142" y1="100" x2="180" y2="100" stroke="#555" stroke-width="3"/>'
        '<rect x="58" y="84" width="84" height="32" rx="16" fill="#999" stroke="#666" stroke-width="2.5"/>'
        # Cathode band (grey, wide)
        '<rect x="124" y="84" width="18" height="32" rx="0" fill="#777" stroke="#555" stroke-width="1"/>'
        '<rect x="130" y="84" width="12" height="32" rx="0" fill="#666"/>'
        '<text x="100" y="154" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">1N4001</text>'
        '<text x="100" y="170" font-family="Arial" font-size="11" fill="#888" text-anchor="middle">Rectifier Diode</text>'
    ),

    # Germanium diode — glass tube, dark body
    'germanium_diode': svg_wrap(
        '<line x1="20" y1="100" x2="58" y2="100" stroke="#555" stroke-width="3"/>'
        '<line x1="142" y1="100" x2="180" y2="100" stroke="#555" stroke-width="3"/>'
        '<rect x="58" y="88" width="84" height="24" rx="12" fill="#C8A060" stroke="#8B6030" stroke-width="2.5"/>'
        # Dark cathode band
        '<rect x="126" y="88" width="16" height="24" rx="0" fill="#5B3A10" stroke="#3A2000" stroke-width="1"/>'
        '<text x="100" y="154" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">Ge Diode</text>'
        '<text x="100" y="170" font-family="Arial" font-size="11" fill="#888" text-anchor="middle">Germanium</text>'
    ),

    # Trimmer pot 9mm — small square, single-turn adjustment screw
    'pot_9mm_trimmer': svg_wrap(
        '<rect x="55" y="55" width="90" height="90" rx="6" fill="#E8D080" stroke="#B8A050" stroke-width="2.5"/>'
        # Adjustment screw slot
        '<circle cx="100" cy="100" r="22" fill="#CCC" stroke="#999" stroke-width="2"/>'
        '<line x1="84" y1="100" x2="116" y2="100" stroke="#666" stroke-width="4"/>'
        # Three leads bottom
        '<line x1="72" y1="145" x2="72" y2="168" stroke="#555" stroke-width="3"/>'
        '<line x1="100" y1="145" x2="100" y2="168" stroke="#555" stroke-width="3"/>'
        '<line x1="128" y1="145" x2="128" y2="168" stroke="#555" stroke-width="3"/>'
        '<text x="100" y="185" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">Trimmer 9mm</text>'
    ),

    # SPST toggle switch — simple lever
    'switch_spst_toggle': svg_wrap(
        # Body
        '<rect x="72" y="80" width="56" height="80" rx="6" fill="#888" stroke="#555" stroke-width="2.5"/>'
        # Actuator lever (up position)
        '<rect x="92" y="34" width="16" height="48" rx="8" fill="#CCC" stroke="#999" stroke-width="2"/>'
        # Two legs
        '<line x1="88" y1="160" x2="88" y2="180" stroke="#AAA" stroke-width="4"/>'
        '<line x1="112" y1="160" x2="112" y2="180" stroke="#AAA" stroke-width="4"/>'
        '<text x="100" y="195" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">SPST Toggle</text>'
    ),

    # DPDT toggle switch — wider body, 6-lug
    'switch_dpdt_toggle': svg_wrap(
        '<rect x="60" y="78" width="80" height="76" rx="6" fill="#888" stroke="#555" stroke-width="2.5"/>'
        '<rect x="88" y="28" width="24" height="52" rx="12" fill="#CCC" stroke="#999" stroke-width="2"/>'
        # 6 leads (2 rows × 3)
        '<line x1="75" y1="154" x2="75" y2="172" stroke="#AAA" stroke-width="3.5"/>'
        '<line x1="100" y1="154" x2="100" y2="172" stroke="#AAA" stroke-width="3.5"/>'
        '<line x1="125" y1="154" x2="125" y2="172" stroke="#AAA" stroke-width="3.5"/>'
        '<text x="100" y="188" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">DPDT Toggle</text>'
    ),

    # 1/4" stereo jack (TRS) — same shape as mono, add ring indicator
    'jack_stereo_trs': svg_wrap(
        # Body
        '<rect x="40" y="65" width="100" height="70" rx="8" fill="#888" stroke="#555" stroke-width="2.5"/>'
        # Socket mouth
        '<ellipse cx="148" cy="100" rx="18" ry="22" fill="#555" stroke="#333" stroke-width="2"/>'
        '<ellipse cx="150" cy="100" rx="9" ry="13" fill="#222"/>'
        # 3 lugs (T/R/S)
        '<line x1="52" y1="135" x2="52" y2="158" stroke="#AAA" stroke-width="3.5"/>'
        '<line x1="78" y1="135" x2="78" y2="158" stroke="#AAA" stroke-width="3.5"/>'
        '<line x1="104" y1="135" x2="104" y2="158" stroke="#AAA" stroke-width="3.5"/>'
        '<text x="52" y="171" font-family="Arial" font-size="10" fill="#666" text-anchor="middle">T</text>'
        '<text x="78" y="171" font-family="Arial" font-size="10" fill="#666" text-anchor="middle">R</text>'
        '<text x="104" y="171" font-family="Arial" font-size="10" fill="#666" text-anchor="middle">S</text>'
        '<text x="85" y="186" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">TRS Stereo Jack</text>'
    ),

    # Electret mic capsule — small disc
    'electret_mic': svg_wrap(
        '<circle cx="100" cy="90" r="54" fill="#333" stroke="#111" stroke-width="3"/>'
        '<circle cx="100" cy="90" r="38" fill="#555" stroke="#333" stroke-width="2"/>'
        # Mic holes pattern
        '<circle cx="100" cy="90" r="4" fill="#222"/>'
        '<circle cx="88"  cy="82" r="3" fill="#222"/>'
        '<circle cx="112" cy="82" r="3" fill="#222"/>'
        '<circle cx="88"  cy="98" r="3" fill="#222"/>'
        '<circle cx="112" cy="98" r="3" fill="#222"/>'
        # 2 pads
        '<line x1="82" y1="144" x2="82" y2="165" stroke="#AAA" stroke-width="3.5"/>'
        '<line x1="118" y1="144" x2="118" y2="165" stroke="#AAA" stroke-width="3.5"/>'
        '<text x="100" y="182" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">Electret Mic</text>'
    ),

    # Crystal oscillator HC-49 — rectangular metal package
    'crystal_hc49': svg_wrap(
        # Body — silver metal can
        '<rect x="58" y="52" width="84" height="90" rx="10" fill="#C0C0C0" stroke="#888" stroke-width="3"/>'
        '<rect x="64" y="58" width="72" height="78" rx="8" fill="#D8D8D8" stroke="#AAA" stroke-width="1.5"/>'
        # Center logo area
        '<rect x="74" y="74" width="52" height="36" rx="3" fill="#BBB" stroke="#999" stroke-width="1"/>'
        '<text x="100" y="97" font-family="Arial" font-size="10" fill="#666" text-anchor="middle">XTAL</text>'
        # 2 leads
        '<line x1="82" y1="142" x2="82" y2="166" stroke="#999" stroke-width="4"/>'
        '<line x1="118" y1="142" x2="118" y2="166" stroke="#999" stroke-width="4"/>'
        '<text x="100" y="182" font-family="Arial" font-size="12" fill="#444" text-anchor="middle">Crystal HC-49</text>'
    ),
}


# ── Rasterize one SVG ──────────────────────────────────────────────────────────

def resolve_css_vars(svg_text: str) -> str:
    """Replace var(--name, fallback) with the fallback value for cairosvg compatibility."""
    import re
    return re.sub(r'var\([^,)]+,\s*([^)]+)\)', r'\1', svg_text)


def rasterize_svg(svg_path_or_string: str | Path, out_path: Path, is_string=False):
    """Rasterize SVG (file path or string) → 200×200 PNG."""
    if is_string:
        svg_text = resolve_css_vars(svg_path_or_string)
        svg_bytes = svg_text.encode('utf-8')
    else:
        svg_text = Path(svg_path_or_string).read_text(encoding='utf-8')
        svg_text = resolve_css_vars(svg_text)
        svg_bytes = svg_text.encode('utf-8')
    cairosvg.svg2png(bytestring=svg_bytes, write_to=str(out_path),
                     output_width=SIZE, output_height=SIZE)

    # Verify output is valid
    img = Image.open(out_path)
    assert img.size == (SIZE, SIZE), f'Unexpected size: {img.size}'
    img.close()


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Rasterize taxonomy SVGs to 200×200 PNGs')
    parser.add_argument('--upload', action='store_true', help='Upload to Supabase Storage after rasterizing')
    args = parser.parse_args()

    print()
    print('=' * 60)
    print('  PedalPath v2 — Rasterize Taxonomy Images')
    print('=' * 60)
    print()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    results = {'ok': [], 'generated': [], 'fail': []}

    for slug, label, svg_file in TAXONOMY:
        out_path = OUT_DIR / f'{slug}.png'

        if svg_file is not None:
            # Use existing SVG sprite
            svg_full = SVG_DIR / svg_file
            if not svg_full.exists():
                print(f'  [WARN] SVG not found: {svg_file} (will use generated fallback)')
                svg_file = None  # fall through to generated

        if svg_file is not None:
            try:
                rasterize_svg(svg_full, out_path)
                print(f'  [OK]  {slug}.png  ← {svg_file}')
                results['ok'].append(slug)
            except Exception as e:
                print(f'  [FAIL] {slug}: {e}')
                results['fail'].append(slug)
        else:
            # Use generated SVG
            if slug in GENERATED_SVGS:
                try:
                    rasterize_svg(GENERATED_SVGS[slug], out_path, is_string=True)
                    print(f'  [GEN] {slug}.png  ← generated SVG')
                    results['generated'].append(slug)
                except Exception as e:
                    print(f'  [FAIL] {slug}: {e}')
                    results['fail'].append(slug)
            else:
                print(f'  [SKIP] {slug} — no SVG and no generated fallback defined')
                results['fail'].append(slug)

    # Summary
    print()
    print('─' * 60)
    total = len(results['ok']) + len(results['generated'])
    print(f'  Rasterized from existing SVGs : {len(results["ok"])}')
    print(f'  Generated (new SVGs)          : {len(results["generated"])}')
    print(f'  Failed                        : {len(results["fail"])}')
    print(f'  Total PNGs written            : {total} / 30')
    print(f'  Output directory              : {OUT_DIR}')
    print()

    if results['fail']:
        print(f'  FAILED slugs: {", ".join(results["fail"])}')
        print()

    if total == 30:
        print('  [PASS] All 30 taxonomy images ready.')
    else:
        print(f'  [WARN] Only {total}/30 complete. Check failures above.')

    print()

    # Optional upload
    if args.upload:
        upload_to_supabase(OUT_DIR)


def upload_to_supabase(img_dir: Path):
    """Upload all PNGs to Supabase Storage bucket: pedalpath-components."""
    try:
        from dotenv import load_dotenv
        load_dotenv('/home/rob/.pedalpath_env')
    except ImportError:
        print('[WARN] python-dotenv not available — set env vars manually')

    url  = os.environ.get('SUPABASE_URL')
    key  = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY')
    if not url or not key:
        print('[FAIL] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .pedalpath_env')
        print('       Run without --upload for now; upload manually via Supabase dashboard.')
        return

    try:
        from supabase import create_client
    except ImportError:
        print('[FAIL] supabase-py not installed. Run: pip install supabase --break-system-packages')
        return

    client = create_client(url, key)
    bucket = 'pedalpath-components'

    print(f'Uploading to Supabase Storage bucket: {bucket}')
    uploaded = 0
    for png in sorted(img_dir.glob('*.png')):
        dest = f'taxonomy/{png.name}'
        with open(png, 'rb') as f:
            try:
                client.storage.from_(bucket).upload(
                    dest, f.read(),
                    file_options={'content-type': 'image/png', 'upsert': 'true'}
                )
                print(f'  [UP] {dest}')
                uploaded += 1
            except Exception as e:
                print(f'  [FAIL] {dest}: {e}')

    print(f'Uploaded {uploaded} files to Supabase Storage.')


if __name__ == '__main__':
    main()
