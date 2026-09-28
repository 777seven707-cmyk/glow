"""Assembles ../index.html (standalone, local fonts) from page.html."""
import os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.join(HERE,'..')
frag=open(os.path.join(HERE,'page.html')).read()
faces=[('Montserrat','normal',600,'Montserrat-600'),('Montserrat','normal',700,'Montserrat-700'),('Montserrat','normal',800,'Montserrat-800'),
       ('Montserrat','italic',800,'Montserrat-800italic'),('Oswald','normal',600,'Oswald-600'),('Oswald','normal',700,'Oswald-700'),
       ('Noto Sans','normal',400,'NotoSans-400'),('Noto Sans','normal',600,'NotoSans-600'),('Noto Sans','normal',700,'NotoSans-700')]
ff='<style>'+''.join(f'@font-face{{font-family:"{f}";font-style:{st};font-weight:{w};font-display:swap;src:url(fonts/{n}.ttf) format("truetype")}}' for f,st,w,n in faces)+'</style>\n'
head,body=frag.split('<main',1)
doc=('<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
     '<meta name="robots" content="noindex">\n<link rel="icon" href="logo/svg/volterra_mark_yellow.svg">\n'+ff+head+'</head>\n<body>\n<main'+body+'</body>\n</html>\n')
open(os.path.join(ROOT,'index.html'),'w').write(doc)
print('index.html', len(doc))
