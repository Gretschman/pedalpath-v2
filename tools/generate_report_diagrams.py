"""
generate_report_diagrams.py
Generates two PNG diagrams for the Launch Roadmap Report.

Diagram A: Phase Roadmap (1400×560px)
Diagram B: Architecture Before/After (1400×700px)

Output: /mnt/c/Users/Rob/Dropbox/!PedalPath/_OUTPUT/
"""

from pathlib import Path
from datetime import datetime

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print('[FAIL]  Pillow not installed. Run: pip install Pillow')
    import sys; sys.exit(1)

OUTPUT_DIR = Path('/mnt/c/Users/Rob/Dropbox/!PedalPath/_OUTPUT')
DATE_STR = '2026-03-24'

# ── Color palette ──────────────────────────────────────────────────────────────
WHITE    = (255, 255, 255)
BLACK    = (30,  30,  30)
GREY_BG  = (245, 245, 245)
GREY_MED = (180, 180, 180)
GREY_DRK = (120, 120, 120)
GREY_TXT = (100, 100, 100)

ORANGE   = (230, 120,  20)
ORANGE_L = (255, 220, 150)
RED      = (200,  40,  40)
RED_L    = (255, 200, 200)
BLUE     = ( 46, 117, 182)
BLUE_L   = (189, 215, 238)
GREEN    = ( 32, 128,  80)
GREEN_L  = (198, 239, 206)
YELLOW   = (255, 230,  80)
YELLOW_L = (255, 245, 180)
NAVY     = ( 31,  56, 100)


def load_font(size: int, bold: bool = False):
    """Try to load Arial, fall back to default."""
    candidates_bold = [
        '/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/liberation/LiberationSans-Bold.ttf',
        '/mnt/c/Windows/Fonts/arialbd.ttf',
    ]
    candidates_regular = [
        '/usr/share/fonts/truetype/msttcorefonts/Arial.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/liberation/LiberationSans-Regular.ttf',
        '/mnt/c/Windows/Fonts/arial.ttf',
    ]
    candidates = candidates_bold if bold else candidates_regular
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_rounded_rect(draw, x0, y0, x1, y1, radius, fill, outline=None, outline_width=2):
    """Draw a rounded rectangle."""
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill,
                           outline=outline, width=outline_width)


def draw_arrow(draw, x0, y0, x1, y1, color, width=3, head_size=12):
    """Draw a simple arrow from (x0,y0) to (x1,y1) — vertical only for now."""
    draw.line([(x0, y0), (x1, y1)], fill=color, width=width)
    # Arrowhead pointing down
    draw.polygon([(x1, y1), (x1 - head_size, y1 - head_size), (x1 + head_size, y1 - head_size)],
                 fill=color)


def centered_text(draw, text, x, y, font, color, max_width=None):
    """Draw text centered at x,y."""
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text((x - w // 2, y), text, font=font, fill=color)


def wrapped_text(draw, text, x, y, font, color, max_width, line_spacing=4):
    """Draw word-wrapped text left-aligned at (x,y)."""
    words = text.split()
    lines = []
    current = []
    for word in words:
        test = ' '.join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_width and current:
            lines.append(' '.join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(' '.join(current))
    line_h = font.size + line_spacing
    for i, line in enumerate(lines):
        draw.text((x, y + i * line_h), line, font=font, fill=color)
    return len(lines) * line_h


# ── Diagram A: Phase Roadmap ────────────────────────────────────────────────────

def make_phase_roadmap():
    W, H = 1400, 620
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)

    # Background
    draw.rectangle([0, 0, W, H], fill=GREY_BG)

    # Title bar
    draw.rectangle([0, 0, W, 58], fill=NAVY)
    f_title = load_font(24, bold=True)
    centered_text(draw, 'PedalPath v2 — Phase Roadmap', W // 2, 14, f_title, WHITE)
    f_sub = load_font(14)
    centered_text(draw, 'Visual BOM Engine → Stripe Revenue → Layout Library', W // 2, 42, f_sub, (180, 200, 230))

    # ── Phase boxes ────────────────────────────────────────────────────────────

    f_phase = load_font(18, bold=True)
    f_label = load_font(13, bold=True)
    f_small = load_font(12)
    f_note  = load_font(11)

    # Phase 1 — large box with 3×3 step grid
    p1_x, p1_y, p1_w, p1_h = 40, 80, 580, 420
    draw_rounded_rect(draw, p1_x, p1_y, p1_x + p1_w, p1_y + p1_h,
                      12, fill=(255, 245, 225), outline=ORANGE, outline_width=4)

    # Phase 1 header
    draw.rectangle([p1_x, p1_y, p1_x + p1_w, p1_y + 42], fill=ORANGE)
    # Round the top corners manually
    centered_text(draw, 'PHASE 1: Visual BOM Engine', p1_x + p1_w // 2, p1_y + 10, f_phase, WHITE)
    centered_text(draw, '9 steps  ·  ~4 sessions  ·  GATES STRIPE', p1_x + p1_w // 2, p1_y + 32, f_note, (255, 230, 180))

    # "BLOCKING" badge
    draw_rounded_rect(draw, p1_x + 440, p1_y + 8, p1_x + 570, p1_y + 36,
                      6, fill=RED, outline=None)
    centered_text(draw, 'BLOCKING', p1_x + 505, p1_y + 14, f_small, WHITE)

    # 3×3 step grid
    steps = [
        ('1', 'taxonomy DB',   'CLAUDE', BLUE_L,   BLUE),
        ('2', 'catalog DB',    'CLAUDE', BLUE_L,   BLUE),
        ('3', '30 images',     'ROB',    YELLOW_L, ORANGE),
        ('4', 'prompt rewrite','CLAUDE', BLUE_L,   BLUE),
        ('5', 'resolve fn',    'CLAUDE', BLUE_L,   BLUE),
        ('6', 'assembly svc',  'CLAUDE', BLUE_L,   BLUE),
        ('7', 'visual BOM',    'CLAUDE', BLUE_L,   BLUE),
        ('8', 'PDF export',    'CLAUDE', BLUE_L,   BLUE),
        ('9', 'QA  90%+',      'BOTH',   GREEN_L,  GREEN),
    ]

    grid_ox, grid_oy = p1_x + 20, p1_y + 60
    cell_w, cell_h, gap = 172, 100, 10

    for i, (num, name, who, fill, border) in enumerate(steps):
        col = i % 3
        row = i // 3
        cx = grid_ox + col * (cell_w + gap)
        cy = grid_oy + row * (cell_h + gap)
        draw_rounded_rect(draw, cx, cy, cx + cell_w, cy + cell_h,
                          8, fill=fill, outline=border, outline_width=2)
        # Step number
        f_num = load_font(28, bold=True)
        draw.text((cx + 10, cy + 8), num, font=f_num, fill=border)
        # Step name
        centered_text(draw, name, cx + cell_w // 2, cy + 42, f_label, BLACK)
        # Who badge
        badge_color = ORANGE if who == 'ROB' else (BLUE if who == 'CLAUDE' else GREEN)
        bw = 70
        bx = cx + (cell_w - bw) // 2
        draw_rounded_rect(draw, bx, cy + 68, bx + bw, cy + 88, 4, fill=badge_color)
        centered_text(draw, who, bx + bw // 2, cy + 71, f_note, WHITE)

    # ── Arrow down ─────────────────────────────────────────────────────────────
    arr_x = 330
    draw_arrow(draw, arr_x, p1_y + p1_h, arr_x, p1_y + p1_h + 45, ORANGE, width=4)

    # Phase 2 box
    p2_x, p2_y, p2_w, p2_h = 40, 520, 580, 80
    draw_rounded_rect(draw, p2_x, p2_y, p2_x + p2_w, p2_y + p2_h,
                      10, fill=RED_L, outline=RED, outline_width=3)
    centered_text(draw, 'PHASE 2: Stripe + Payments', p2_x + p2_w // 2, p2_y + 12, f_phase, RED)
    centered_text(draw, '~1 session  ·  needs Rob actions  ·  REVENUE', p2_x + p2_w // 2, p2_y + 38, f_small, RED)
    centered_text(draw, 'WAITING ON PHASE 1', p2_x + p2_w // 2, p2_y + 58, f_note, RED)

    # ── Right column: Phase 3 + 4 ──────────────────────────────────────────────
    rhs_x = 680

    # Phase 3
    p3_x, p3_y, p3_w, p3_h = rhs_x, 80, 340, 160
    draw_rounded_rect(draw, p3_x, p3_y, p3_x + p3_w, p3_y + p3_h,
                      10, fill=(230, 230, 230), outline=GREY_MED, outline_width=2)
    centered_text(draw, 'PHASE 3: Layout Library', p3_x + p3_w // 2, p3_y + 14, f_label, GREY_DRK)
    centered_text(draw, '2–3 sessions · after Stripe', p3_x + p3_w // 2, p3_y + 38, f_note, GREY_DRK)
    centered_text(draw, '- vero-p2p curated layouts', p3_x + 20, p3_y + 62, f_note, GREY_DRK)
    centered_text(draw, '- circuit identification', p3_x + 20, p3_y + 80, f_note, GREY_DRK)
    centered_text(draw, '- license verification', p3_x + 20, p3_y + 98, f_note, GREY_DRK)
    draw_rounded_rect(draw, p3_x + 190, p3_y + 8, p3_x + 330, p3_y + 32,
                      6, fill=GREY_MED)
    centered_text(draw, 'DEFERRED', p3_x + 260, p3_y + 13, f_small, WHITE)

    # Arrow between Phase 3 and 4
    draw_arrow(draw, rhs_x + 170, p3_y + p3_h, rhs_x + 170, p3_y + p3_h + 30, GREY_MED, width=3)

    # Phase 4
    p4_y = p3_y + p3_h + 48
    draw_rounded_rect(draw, rhs_x, p4_y, rhs_x + p3_w, p4_y + 120,
                      10, fill=(220, 220, 220), outline=GREY_MED, outline_width=2)
    centered_text(draw, 'PHASE 4: AI Layout Generation', rhs_x + p3_w // 2, p4_y + 14, f_label, GREY_DRK)
    centered_text(draw, 'Long-term R&D · not on roadmap', rhs_x + p3_w // 2, p4_y + 38, f_note, GREY_DRK)
    centered_text(draw, '- generate novel layouts from BOM', rhs_x + 20, p4_y + 62, f_note, GREY_DRK)
    centered_text(draw, '- no estimated timeline', rhs_x + 20, p4_y + 80, f_note, GREY_DRK)

    # Legend box
    leg_x, leg_y = rhs_x, 430
    draw_rounded_rect(draw, leg_x, leg_y, leg_x + p3_w, leg_y + 160,
                      8, fill=WHITE, outline=GREY_MED, outline_width=1)
    f_leg = load_font(13, bold=True)
    draw.text((leg_x + 14, leg_y + 10), 'Legend', font=f_leg, fill=BLACK)

    legend_items = [
        (ORANGE, ORANGE,   'Phase 1 (blocking now)'),
        (RED,    RED,      'Phase 2 (waiting on Phase 1)'),
        (GREY_MED, GREY_MED, 'Phases 3–4 (deferred)'),
        (YELLOW_L, ORANGE, 'ROB must do this'),
        (BLUE_L,   BLUE,   'CLAUDE handles this'),
        (GREEN_L,  GREEN,  'BOTH work together'),
    ]
    for i, (fill, border, label) in enumerate(legend_items):
        lx = leg_x + 14
        ly = leg_y + 36 + i * 20
        draw.rectangle([lx, ly, lx + 20, ly + 14], fill=fill, outline=border)
        draw.text((lx + 28, ly), label, font=f_note, fill=BLACK)

    # Save
    out_path = OUTPUT_DIR / f'PedalPath_PhaseRoadmap_{DATE_STR}.png'
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    img.save(str(out_path), 'PNG')
    print(f'[OK]  Diagram A saved: {out_path}')
    return out_path


# ── Diagram B: Architecture Before/After ──────────────────────────────────────

def make_architecture_diagram():
    W, H = 1400, 720
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, H], fill=GREY_BG)

    # Title bar
    draw.rectangle([0, 0, W, 58], fill=NAVY)
    f_title = load_font(24, bold=True)
    centered_text(draw, 'PedalPath v2 — Architecture Before / After', W // 2, 14, f_title, WHITE)
    f_sub = load_font(14)
    centered_text(draw, 'The gap we are closing in Phase 1', W // 2, 42, f_sub, (180, 200, 230))

    f_hdr   = load_font(20, bold=True)
    f_box   = load_font(14, bold=True)
    f_small = load_font(12)
    f_note  = load_font(11)
    f_arrow = load_font(13)

    # ── Dividing line ──────────────────────────────────────────────────────────
    mid = W // 2
    draw.line([(mid, 70), (mid, H - 20)], fill=GREY_MED, width=2)
    # Divider label
    div_lbl = 'THE GAP WE ARE CLOSING'
    bbox = draw.textbbox((0, 0), div_lbl, font=f_arrow)
    lw = bbox[2] - bbox[0]
    draw.rectangle([mid - lw // 2 - 8, H // 2 - 14, mid + lw // 2 + 8, H // 2 + 14],
                   fill=NAVY)
    draw.text((mid - lw // 2, H // 2 - 10), div_lbl, font=f_arrow, fill=WHITE)

    # ── LEFT: BEFORE (Broken) ─────────────────────────────────────────────────
    col_l = 40
    col_w = mid - col_l - 30

    # Column header
    draw_rounded_rect(draw, col_l, 72, col_l + col_w, 112, 6, fill=RED, outline=None)
    centered_text(draw, 'BEFORE (BROKEN)', col_l + col_w // 2, 82, f_hdr, WHITE)
    centered_text(draw, 'current production state', col_l + col_w // 2, 104, f_note, (255, 200, 200))

    before_steps = [
        ('Upload Schematic',       WHITE,     BLACK,    'User drops PNG/PDF/DOCX'),
        ('Claude Vision',          BLUE_L,    BLUE,     'Extracts component list as text strings'),
        ('Text Strings Only',      RED_L,     RED,      '"100nF ceramic cap" — no image mapping'),
        ('ComponentVisualEngine',  RED_L,     RED,      'Draws shapes at runtime from text'),
        ('Runtime SVG Generation', RED_L,     RED,      'Fragile · slow · inconsistent'),
        ('THEATER',                (80,0,0),  WHITE,    'Looks like a product. Is not.'),
    ]

    by = 130
    bh = 68
    bg = 12
    for i, (label, fill, text_color, desc) in enumerate(before_steps):
        y0 = by + i * (bh + bg)
        draw_rounded_rect(draw, col_l, y0, col_l + col_w, y0 + bh,
                          8, fill=fill,
                          outline=RED if fill == RED_L else (GREY_MED if fill == WHITE else None),
                          outline_width=2)
        centered_text(draw, label, col_l + col_w // 2, y0 + 10, f_box, text_color)
        centered_text(draw, desc,  col_l + col_w // 2, y0 + 36, f_note, GREY_DRK if fill == WHITE else text_color)
        # Arrow down (not after last)
        if i < len(before_steps) - 1:
            ax = col_l + col_w // 2
            ay0 = y0 + bh
            ay1 = y0 + bh + bg
            draw.line([(ax, ay0), (ax, ay1)], fill=RED, width=2)
            draw.polygon([(ax, ay1), (ax - 6, ay1 - 8), (ax + 6, ay1 - 8)], fill=RED)

    # ── RIGHT: AFTER (Correct) ────────────────────────────────────────────────
    col_r = mid + 30
    col_rw = W - col_r - 40

    draw_rounded_rect(draw, col_r, 72, col_r + col_rw, 112, 6, fill=GREEN, outline=None)
    centered_text(draw, 'AFTER (CORRECT)', col_r + col_rw // 2, 82, f_hdr, WHITE)
    centered_text(draw, 'what we are building in Phase 1', col_r + col_rw // 2, 104, f_note, (180, 240, 200))

    after_steps = [
        ('Upload Schematic',               WHITE,    BLACK,  'User drops PNG/PDF/DOCX'),
        ('Claude / Gemini Extract',         BLUE_L,   BLUE,   'Returns JSON array with taxonomy_class field'),
        ('Resolution Edge Function (4-step)',GREEN_L,  GREEN,  'Exact → Fuzzy → Silhouette → Unknown flag'),
        ('component_taxonomy Lookup',       GREEN_L,  GREEN,  '30 physical classes · Supabase Storage images'),
        ('BOM Assembly Service',            GREEN_L,  GREEN,  'Pure data · no rendering · fully testable'),
        ('Visual BOM + PDF Export',         (0,80,20),WHITE,  '<img src={url}> · LEGO manual style · paid PDF'),
    ]

    for i, (label, fill, text_color, desc) in enumerate(after_steps):
        y0 = by + i * (bh + bg)
        draw_rounded_rect(draw, col_r, y0, col_r + col_rw, y0 + bh,
                          8, fill=fill,
                          outline=GREEN if fill == GREEN_L else (GREY_MED if fill == WHITE else None),
                          outline_width=2)
        centered_text(draw, label, col_r + col_rw // 2, y0 + 10, f_box, text_color)
        centered_text(draw, desc,  col_r + col_rw // 2, y0 + 36, f_note, GREY_DRK if fill == WHITE else text_color)
        if i < len(after_steps) - 1:
            ax = col_r + col_rw // 2
            ay0 = y0 + bh
            ay1 = y0 + bh + bg
            draw.line([(ax, ay0), (ax, ay1)], fill=GREEN, width=2)
            draw.polygon([(ax, ay1), (ax - 6, ay1 - 8), (ax + 6, ay1 - 8)], fill=GREEN)

    # ── DB Schema inset (bottom center) ───────────────────────────────────────
    schema_y = by + len(before_steps) * (bh + bg) + 20
    schema_h = H - schema_y - 20
    if schema_h > 60:
        draw_rounded_rect(draw, 40, schema_y, W - 40, H - 16,
                          8, fill=WHITE, outline=NAVY, outline_width=2)
        f_schema_hdr = load_font(13, bold=True)
        centered_text(draw, 'New DB Tables', W // 2, schema_y + 10, f_schema_hdr, NAVY)
        schema_text = (
            'component_taxonomy (30 rows):  id · category · package_class · image_url · silhouette_url · aliases[] · value_unit · sort_order'
            '       |       '
            'component_catalog (200 rows):  id · canonical_name · value · unit · aliases[] · part_numbers[] · taxonomy_fk · tayda_url · mouser_url'
        )
        centered_text(draw, schema_text, W // 2, schema_y + 36, f_note, GREY_DRK)

    # Save
    out_path = OUTPUT_DIR / f'PedalPath_Architecture_BeforeAfter_{DATE_STR}.png'
    img.save(str(out_path), 'PNG')
    print(f'[OK]  Diagram B saved: {out_path}')
    return out_path


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print()
    print('=' * 60)
    print('  PedalPath v2 — Generate Report Diagrams')
    print('=' * 60)
    print()

    path_a = make_phase_roadmap()
    path_b = make_architecture_diagram()

    print()
    print('[DONE] Both diagrams written.')
    print(f'  A: {path_a}')
    print(f'  B: {path_b}')
    print()
