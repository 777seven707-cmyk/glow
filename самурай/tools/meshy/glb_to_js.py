"""Кладёт GLB в обычный скрипт (base64), чтобы модель грузилась откуда угодно:
с диска (file://), из артефакта claude.ai и с любого хостинга.

    python3 glb_to_js.py ../../assets/models/samurai.glb   → samurai.glb.js рядом
"""
import base64, os, sys

src = sys.argv[1]
out = src + '.js'
data = base64.b64encode(open(src, 'rb').read()).decode()
with open(out, 'w') as f:
    f.write('/* Модель самурая (samurai.glb) в base64 — для открытия сайта с диска. */\n')
    f.write('window.SAMURAI_GLB = "' + data + '";\n')
print(f'{out}: {os.path.getsize(out) / 1024:.0f} КБ')
