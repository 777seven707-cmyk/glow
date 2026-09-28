"""Writes the colour files agencies need: ASE (Adobe), CSS, JSON, TXT."""
import os, json, struct
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'colors')
os.makedirs(OUT, exist_ok=True)
# name, hex, cmyk, pantone (nearest, verify on a physical guide), RAL (nearest), role
PALETTE = [
  ('Volterra Yellow', '#FFD600', (0,16,100,0),  'Pantone 109 C (≈)',   'RAL 1018 (≈)', 'Основной цвет бренда: знак, акценты, выделение, ключевые элементы'),
  ('Volterra Black',  '#000000', (0,0,0,100),   'Pantone Black 6 C (≈)', 'RAL 9005',   'Основной цвет фона и носителей: сила, надёжность, премиальность'),
  ('Volterra Blue',   '#007BFF', (100,52,0,0),  'Pantone 2727 C (≈)',  'RAL 5015 (≈)', 'Дополнительный: акценты, свечение, интерактив, цифровые носители'),
  ('Volterra White',  '#FFFFFF', (0,0,0,0),     '—',                   'RAL 9003',     'Вспомогательный: текст на тёмном, светлые фоны, контраст'),
]
SUPPORT = [
  ('Graphite',   '#111214', (70,60,55,90), 'Панели и подложки на чёрном'),
  ('Carbon',     '#1C1D20', (70,60,55,80), 'Карточки, плашки, второй уровень фона'),
  ('Steel',      '#2C2E33', (65,55,50,60), 'Линии, рамки, разделители'),
  ('Silver',     '#8B8F97', (45,35,30,5),  'Второстепенный текст на чёрном'),
  ('Mono Dark',  '#4D4D4D', (0,0,0,85),    'Монохромный логотип на белом'),
  ('Mono Light', '#BFBFBF', (0,0,0,30),    'Монохромный логотип на чёрном'),
]
RICH_BLACK = (60,40,40,100)
def rgb(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
def lum(h):
    c=[v/255 for v in rgb(h)]; c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def contrast(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True); return (la+0.05)/(lb+0.05)

# --- ASE (Adobe Swatch Exchange) ---
def ase_block_color(name, model, vals, kind=0):
    n = (name + '\0').encode('utf-16-be')
    body = struct.pack('>H', len(n)//2) + n + model + b''.join(struct.pack('>f', v) for v in vals) + struct.pack('>H', kind)
    return struct.pack('>HI', 0x0001, len(body)) + body
def ase_group(name, start=True):
    if not start: return struct.pack('>HI', 0xC002, 0)
    n=(name+'\0').encode('utf-16-be'); body=struct.pack('>H',len(n)//2)+n
    return struct.pack('>HI', 0xC001, len(body)) + body
def write_ase(fn, groups):
    blocks=[]
    for gname, items in groups:
        blocks.append(ase_group(gname))
        blocks += items
        blocks.append(ase_group('', False))
    data=b'ASEF'+struct.pack('>HHI',1,0,len(blocks))+b''.join(blocks)
    open(os.path.join(OUT,fn),'wb').write(data)
rgb_items=[ase_block_color(n,b'RGB ',[v/255 for v in rgb(h)],0) for n,h,*_ in PALETTE]
cmyk_items=[ase_block_color(n+' CMYK',b'CMYK',[v/100 for v in c],0) for n,h,c,*_ in PALETTE]
cmyk_items.append(ase_block_color('Rich Black CMYK (печать больших плашек)',b'CMYK',[v/100 for v in RICH_BLACK],0))
sup_items=[ase_block_color(n,b'RGB ',[v/255 for v in rgb(h)],0) for n,h,*_ in SUPPORT]
write_ase('volterra_colors_RGB.ase',[('VOLTERRA — RGB (экран)',rgb_items),('VOLTERRA — вспомогательные',sup_items)])
write_ase('volterra_colors_CMYK.ase',[('VOLTERRA — CMYK (печать)',cmyk_items)])

# --- CSS / JSON / TXT ---
slug=lambda n:n.lower().replace('volterra ','').replace(' ','-')
css=[':root {','  /* VOLTERRA — основные цвета */']
css+= [f'  --volterra-{slug(n)}: {h};  /* RGB {",".join(map(str,rgb(h)))} */' for n,h,*_ in PALETTE]
css+= ['  /* вспомогательные */'] + [f'  --volterra-{slug(n)}: {h};' for n,h,*_ in SUPPORT] + ['}']
open(os.path.join(OUT,'volterra_colors.css'),'w').write('\n'.join(css)+'\n')
js={'brand':'VOLTERRA','primary':[{'name':n,'hex':h,'rgb':rgb(h),'cmyk':c,'pantone':p,'ral':r,'use':u} for n,h,c,p,r,u in PALETTE],
    'support':[{'name':n,'hex':h,'rgb':rgb(h),'cmyk':c,'use':u} for n,h,c,u in SUPPORT],
    'print_rich_black_cmyk':RICH_BLACK,
    'proportions_percent':{'Black':60,'Yellow':25,'Blue':10,'White':5}}
open(os.path.join(OUT,'volterra_colors.json'),'w').write(json.dumps(js,ensure_ascii=False,indent=2)+'\n')
t=['VOLTERRA — ФИРМЕННЫЕ ЦВЕТА','='*40,'']
for n,h,c,p,r,u in PALETTE:
    t+=[n.upper(),f'  HEX   {h}',f'  RGB   {", ".join(map(str,rgb(h)))}',f'  CMYK  {", ".join(map(str,c))}',f'  Pantone {p}',f'  RAL   {r}',f'  Роль: {u}','']
t+=['ВСПОМОГАТЕЛЬНЫЕ (только для подложек, линий и второстепенного текста)']
t+=[f'  {n:<11} {h}   RGB {", ".join(map(str,rgb(h)))}   — {u}' for n,h,c,u in SUPPORT]
t+=['',f'Чёрные плашки большой площади в офсетной печати: Rich Black CMYK {", ".join(map(str,RICH_BLACK))}.',
    'Мелкий текст и тонкие линии — только 100 K (без Rich Black).',
    'Pantone и RAL указаны как ближайшие соответствия: перед тиражом сверяйте по физическому вееру и пробному оттиску.',
    '','Пропорции цветов в макете: чёрный 60 % · жёлтый 25 % · синий 10 % · белый 5 %.','',
    'КОНТРАСТ (WCAG)']
for a,b,an,bn in [('#FFD600','#000000','Жёлтый','чёрном'),('#FFFFFF','#000000','Белый','чёрном'),('#000000','#FFD600','Чёрный','жёлтом'),
                  ('#FFFFFF','#007BFF','Белый','синем'),('#000000','#007BFF','Чёрный','синем'),('#FFD600','#FFFFFF','Жёлтый','белом'),('#FFD600','#007BFF','Жёлтый','синем')]:
    t.append(f'  {an} на {bn}: {contrast(a,b):.2f}:1')
open(os.path.join(OUT,'volterra_colors.txt'),'w').write('\n'.join(t)+'\n')
print('\n'.join(t[-8:]))
