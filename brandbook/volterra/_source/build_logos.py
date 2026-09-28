"""Generates every VOLTERRA logo file (SVG) from the traced master geometry.

Master geometry was vectorised from the approved brand book (page "Основной
логотип"). Run:  python3 build_logos.py  -> writes ../logo/svg/*.svg
"""
import os, re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'logo', 'svg')
FONTS = os.path.join(HERE, '..', 'fonts')
os.makedirs(OUT, exist_ok=True)

YELLOW, BLACK, WHITE, BLUE = '#FFD600', '#000000', '#FFFFFF', '#007BFF'
GREY_ON_WHITE, GREY_ON_BLACK = '#4D4D4D', '#BFBFBF'

# ---- master geometry (source units) -------------------------------------
BOLT_L = [(330.75,464.62),(396.75,490.25),(420.62,532.50),(407.75,533.60),
          (431.62,576.25),(420.38,601.62),(410.75,592.75),(353.80,527.20),
          (367.00,526.00)]
BOLT_R = [(541.50,464.88),(476.12,489.12),(451.00,532.70),(463.50,533.60),
          (439.88,574.62),(425.75,607.12),(434.00,617.50),(440.12,612.75),
          (518.00,528.00),(505.00,525.60)]
WORD_D = open(os.path.join(HERE, 'wordmark.path')).read()
MARK_BOX = (330.75, 464.62, 541.50, 617.50)
WORD_BOX = (217.70, 630.43, 674.38, 674.26)
CAP = WORD_BOX[3] - WORD_BOX[1]          # 43.83 — the "X" of the clear-space rule

def fmt(v): return f'{v:.2f}'.rstrip('0').rstrip('.')

def shift_path(d, dx, dy, s=1.0):
    toks = re.findall(r'[MLCZ]|-?\d+\.?\d*', d)
    out, coord = [], 0
    for t in toks:
        if t in 'MLCZ': out.append(t); coord = 0; continue
        v = float(t)
        v = (v + dx) * s if coord % 2 == 0 else (v + dy) * s
        coord += 1
        out.append(fmt(v))
    s_ = ' '.join(out)
    return re.sub(r' ?([MLCZ]) ?', r'\1', s_)

def poly(pts, dx, dy, s=1.0):
    return 'M' + 'L'.join(f'{fmt((x+dx)*s)} {fmt((y+dy)*s)}' for x, y in pts) + 'Z'

def text_path(txt, font_file, size, letter_spacing_em=0.0):
    """Outline a string; returns (d, advance_width). Origin = baseline-left."""
    f = TTFont(os.path.join(FONTS, font_file))
    gs = f.getGlyphSet(); cmap = f.getBestCmap()
    upm = f['head'].unitsPerEm; k = size / upm
    x, parts = 0.0, []
    for ch in txt:
        g = cmap.get(ord(ch))
        if g is None: continue
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))
        parts.append(pen.getCommands())
        x += gs[g].width * k + letter_spacing_em * size
    return ''.join(parts), x - letter_spacing_em * size

# tagline
TAG_L, TAG_R = 'АККУМУЛЯТОРНЫЙ ЦЕНТР', 'СЕТЬ АВТОМАГАЗИНОВ'

def tagline(width, y_base, word_col, dot_col):
    size = 10.0
    dl, wl = text_path(TAG_L, 'Montserrat-600.ttf', size, 0.08)
    dr, wr = text_path(TAG_R, 'Montserrat-600.ttf', size, 0.08)
    gap = 26.0
    total = wl + gap + wr
    s = width / total
    size_s = size * s
    # rebuild at scale so the tagline spans exactly the wordmark width
    dl, wl = text_path(TAG_L, 'Montserrat-600.ttf', size_s, 0.08)
    dr, wr = text_path(TAG_R, 'Montserrat-600.ttf', size_s, 0.08)
    gap *= s
    cap = size_s * 0.70
    g1 = f'<path fill="{word_col}" transform="translate({fmt(0)} {fmt(y_base)})" d="{dl}"/>'
    g2 = f'<path fill="{word_col}" transform="translate({fmt(wl+gap)} {fmt(y_base)})" d="{dr}"/>'
    dot = f'<circle fill="{dot_col}" cx="{fmt(wl+gap/2)}" cy="{fmt(y_base-cap/2)}" r="{fmt(cap*0.30)}"/>'
    return g1 + dot + g2, cap

def svg(w, h, body, bg=None, title='VOLTERRA'):
    bgr = f'<rect width="{fmt(w)}" height="{fmt(h)}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" '
            f'width="{fmt(w*4)}" height="{fmt(h*4)}"><title>{title}</title>{bgr}{body}</svg>\n')

def mark_group(dx, dy, col, s=1.0):
    return f'<path fill="{col}" d="{poly(BOLT_L,dx,dy,s)}{poly(BOLT_R,dx,dy,s)}"/>'

def word_group(dx, dy, col, s=1.0):
    return f'<path fill="{col}" fill-rule="evenodd" d="{shift_path(WORD_D,dx,dy,s)}"/>'

# ---- lockups -------------------------------------------------------------
def vertical(mark_c, word_c, dot_c, with_tag):
    ww = WORD_BOX[2] - WORD_BOX[0]
    dx, dy = -WORD_BOX[0], -MARK_BOX[1]
    body = mark_group(dx, dy, mark_c) + word_group(dx, dy, word_c)
    h = WORD_BOX[3] - MARK_BOX[1]
    if with_tag:
        base = h + 25.0
        t, cap = tagline(ww, base, word_c, dot_c)
        body += t; h = base
    return ww, h, body

def horizontal(mark_c, word_c):
    s = (CAP * 1.55) / (MARK_BOX[3] - MARK_BOX[1])
    mw = (MARK_BOX[2] - MARK_BOX[0]) * s
    mh = (MARK_BOX[3] - MARK_BOX[1]) * s
    gap = CAP * 0.45
    ww = WORD_BOX[2] - WORD_BOX[0]
    h = mh
    body = mark_group(-MARK_BOX[0], -MARK_BOX[1], mark_c, s)
    body += word_group(-WORD_BOX[0] + (mw + gap), -WORD_BOX[1] + (h - CAP) / 2, word_c)
    return mw + gap + ww, h, body

def mark_only(c):
    return (MARK_BOX[2]-MARK_BOX[0], MARK_BOX[3]-MARK_BOX[1],
            mark_group(-MARK_BOX[0], -MARK_BOX[1], c))

def word_only(c):
    return (WORD_BOX[2]-WORD_BOX[0], CAP, word_group(-WORD_BOX[0], -WORD_BOX[1], c))

COLORWAYS = {  # name: (mark, word, dot)
    'color-onblack': (YELLOW, WHITE, YELLOW),
    'color-onwhite': (YELLOW, BLACK, YELLOW),
    'white':         (WHITE, WHITE, WHITE),
    'black':         (BLACK, BLACK, BLACK),
    'grey-onwhite':  (GREY_ON_WHITE, GREY_ON_WHITE, GREY_ON_WHITE),
    'grey-onblack':  (GREY_ON_BLACK, GREY_ON_BLACK, GREY_ON_BLACK),
}

def write(name, w, h, body, bg=None, pad=0.0):
    if pad:
        body = f'<g transform="translate({fmt(pad)} {fmt(pad)})">{body}</g>'
        w, h = w + 2*pad, h + 2*pad
    open(os.path.join(OUT, name + '.svg'), 'w').write(svg(w, h, body, bg))

for cw, (m, wc, dc) in COLORWAYS.items():
    write(f'volterra_logo_vertical_tagline_{cw}', *vertical(m, wc, dc, True))
    write(f'volterra_logo_vertical_{cw}', *vertical(m, wc, dc, False))
    write(f'volterra_logo_horizontal_{cw}', *horizontal(m, wc))
    if not cw.startswith('color'):
        write(f'volterra_wordmark_{cw}', *word_only(wc))
        write(f'volterra_mark_{cw}', *mark_only(m))

write('volterra_mark_yellow', *mark_only(YELLOW))

# ---- logo placed on a black canvas (ready-to-use) ------------------------
def centered_on(canvas_w, canvas_h, lock, frac, bg):
    w, h, body = lock
    s = min(canvas_w * frac / w, canvas_h * frac / h)
    ox, oy = (canvas_w - w*s) / 2, (canvas_h - h*s) / 2
    return canvas_w, canvas_h, f'<g transform="translate({fmt(ox)} {fmt(oy)}) scale({s:.5f})">{body}</g>', bg

for tag, lock in (('vertical_tagline', vertical(YELLOW, WHITE, YELLOW, True)),
                  ('vertical', vertical(YELLOW, WHITE, YELLOW, False))):
    for fmt_name, (cw_, ch_, fr) in {'square_1x1': (1000, 1000, .62),
                                     'landscape_16x9': (1600, 900, .50),
                                     'story_9x16': (900, 1600, .62)}.items():
        w, h, body, bg = centered_on(cw_, ch_, lock, fr, BLACK)
        open(os.path.join(OUT, f'volterra_{tag}_on-black-bg_{fmt_name}.svg'), 'w').write(svg(w, h, body, bg))
w, h, body, bg = centered_on(1000, 1000, mark_only(YELLOW), .56, BLACK)
open(os.path.join(OUT, 'volterra_avatar_mark_on-black-bg_1x1.svg'), 'w').write(svg(w, h, body, bg))

print('\n'.join(sorted(os.listdir(OUT))))
