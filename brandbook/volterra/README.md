# VOLTERRA — брендбук для рекламных агентств

Отдельный пакет фирменного стиля VOLTERRA (аккумуляторный центр, сеть
автомагазинов). Не связан с сайтом HAVN в корне репозитория.

| Что | Где |
|---|---|
| Брендбук (PDF, A4 альбомный, 18 стр.) | `VOLTERRA_Brandbook.pdf` |
| Брендбук (веб-версия) | `index.html` |
| Логотипы, вектор | `logo/svg/` |
| Логотипы, PNG 4000 px, прозрачный фон; готовые картинки на чёрном фоне | `logo/png/` |
| Цвета: Adobe-палитры (.ase), CSS, JSON, TXT | `colors/` |
| Шрифты Montserrat, Oswald, Noto Sans (SIL OFL) | `fonts/` |
| Утверждённые носители из основного брендбука | `img/` |

## Фирменные цвета

| Цвет | HEX | RGB | CMYK |
|---|---|---|---|
| Жёлтый | `#FFD600` | 255, 214, 0 | 0, 16, 100, 0 |
| Чёрный | `#000000` | 0, 0, 0 | 0, 0, 0, 100 |
| Синий | `#007BFF` | 0, 123, 255 | 100, 52, 0, 0 |
| Белый | `#FFFFFF` | 255, 255, 255 | 0, 0, 0, 0 |

## Как пересобрать

Исходники в `_source/`. Нужны Python 3, `fonttools`, `playwright` и Chromium.

```bash
python3 _source/build_logos.py   # logo/svg/*.svg из мастер-геометрии
python3 _source/export_png.py    # logo/png/*.png
python3 _source/build_colors.py  # colors/*
python3 _source/build_page.py    # index.html из _source/page.html
python3 _source/export_pdf.py    # VOLTERRA_Brandbook.pdf
```

Логотип векторизован по растровой странице утверждённого брендбука. Если есть
исходные `.ai` (Volterra_logo_white.ai и др.), мастером считаются они.
