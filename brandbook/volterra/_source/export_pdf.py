"""Renders ../index.html to ../VOLTERRA_Brandbook.pdf (A4 landscape, one spread per page)."""
import os
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..'))
exe=os.environ.get('CHROMIUM','/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=exe)
    pg=b.new_page(viewport={'width':1200,'height':848})
    pg.goto('file://'+os.path.join(ROOT,'index.html')); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(800)
    pg.emulate_media(media='print')
    over=pg.evaluate("""[...document.querySelectorAll('.page')].map(e=>[e.id,e.scrollHeight]).filter(x=>x[1]>849)""")
    print('overflowing spreads:', over)
    # shrink any spread taller than a sheet so it fits one A4-landscape page
    pg.evaluate("""()=>document.querySelectorAll('.page').forEach(e=>{
      const h=e.scrollHeight; if(h<=849) return; const k=848/h;
      e.style.width=(1200/k)+'px'; e.style.height=(848/k)+'px'; e.style.zoom=k; })""")
    pg.pdf(path=os.path.join(ROOT,'VOLTERRA_Brandbook.pdf'), width='1200px', height='848px', print_background=True, margin={'top':'0','right':'0','bottom':'0','left':'0'})
    b.close()
