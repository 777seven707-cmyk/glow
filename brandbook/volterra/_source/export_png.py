"""Rasterises every SVG in ../logo/svg to ../logo/png with Chromium (Playwright)."""
import os, re, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(HERE, '..', 'logo', 'svg'); PNG = os.path.join(HERE, '..', 'logo', 'png')
os.makedirs(PNG, exist_ok=True)
CANVAS = {'square_1x1': (2000, 2000), 'landscape_16x9': (3840, 2160), 'story_9x16': (2160, 3840), '_1x1': (2000, 2000)}
exe = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=exe)
    for f in sorted(os.listdir(SVG)):
        src = open(os.path.join(SVG, f)).read()
        vw, vh = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src).groups())
        size = next((v for k, v in CANVAS.items() if k in f), None)
        if size is None:
            W = 4000 if vw >= vh else round(4000 * vw / vh); H = round(W * vh / vw)
        else:
            W, H = size
        pg = b.new_page(viewport={'width': W, 'height': H})
        pg.set_content(f'<html><body style="margin:0;background:transparent">'
                       f'<img src="data:image/svg+xml;base64,{__import__("base64").b64encode(src.encode()).decode()}" '
                       f'style="display:block;width:{W}px;height:{H}px"></body></html>')
        pg.screenshot(path=os.path.join(PNG, f[:-4] + '.png'), omit_background=True)
        pg.close()
    b.close()
print(len(os.listdir(PNG)), 'png')
