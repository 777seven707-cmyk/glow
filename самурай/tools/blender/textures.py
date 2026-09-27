"""Процедурные текстуры для самурая (numpy + Pillow).
Всё рисуется кодом: шнуровка одоси, потёртый лак, латунь, ткань хакама,
кольчуга, оплётка рукояти, клинок с хамоном, ножны с золотым орнаментом.
Запуск отдельно не нужен — build_samurai.py вызывает make_all(out_dir)."""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RNG = np.random.default_rng(7)


def noise(w, h, scale, octaves=4, seed=0):
    """Фрактальный value-noise 0..1, бесшовный по X и Y."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        cw, ch = max(2, int(w / scale * 2 ** o)), max(2, int(h / scale * 2 ** o))
        grid = rng.random((ch, cw)).astype(np.float32)
        # бесшовность: повторяем первую строку/столбец и растягиваем
        grid = np.vstack([grid, grid[:1]])
        grid = np.hstack([grid, grid[:, :1]])
        img = Image.fromarray((grid * 255).astype(np.uint8)).resize((w + w // cw, h + h // ch), Image.BICUBIC)
        a = np.asarray(img, np.float32)[:h, :w] / 255
        out += a * amp
        total += amp
        amp *= 0.5
    return out / total


def normal_from_height(hgt, strength=4.0):
    gy, gx = np.gradient(hgt)
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(hgt)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    n = np.stack([nx / l, ny / l, nz / l], -1)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8))


def save(img, path, q=88):
    if path.endswith('.jpg'):
        img.convert('RGB').save(path, quality=q, optimize=True)
    else:
        img.save(path, optimize=True)


def lame(out):
    """Ламель: чёрный лак с частой красной шнуровкой кэбики-одоси.
    U — вдоль пластины (тайл), V — поперёк (одна пластина по высоте)."""
    W, H = 512, 256
    g = noise(W, H, 64, 5, seed=1)
    fine = noise(W, H, 8, 3, seed=2)
    base = np.zeros((H, W, 3), np.float32)
    lac = np.array([0.085, 0.075, 0.075])
    base[:] = lac * (0.75 + 0.5 * g[..., None]) + 0.03 * fine[..., None]
    # потёртости по краям пластины — проступает коричневая основа
    v = np.linspace(0, 1, H)[:, None]
    edge = np.clip(1 - np.minimum(v, 1 - v) / 0.08, 0, 1) * (g > 0.55)
    base += edge[..., None] * np.array([0.09, 0.06, 0.04])
    hgt = 0.35 + 0.1 * g
    hgt -= np.clip(1 - v / 0.05, 0, 1) * 0.3          # фаска сверху
    hgt -= np.clip(1 - (1 - v) / 0.05, 0, 1) * 0.3    # фаска снизу
    rough = np.full((H, W), 0.55) + 0.18 * g
    img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
    hi = Image.fromarray((np.clip(hgt, 0, 1) * 255).astype(np.uint8))
    ro = Image.fromarray((np.clip(rough, 0, 1) * 255).astype(np.uint8))
    d, dh, dr = ImageDraw.Draw(img), ImageDraw.Draw(hi), ImageDraw.Draw(ro)
    red, red_hi = (104, 20, 18), (150, 38, 30)
    step = 32
    for x in range(8, W, step):
        # пара коротких стежков: шнур выходит из пластины выше
        for dx in (0, 12):
            x0 = x + dx
            d.rounded_rectangle([x0, 30, x0 + 5, 78], 2, fill=red)
            d.line([x0 + 1, 34, x0 + 1, 72], fill=red_hi, width=1)
            dh.rounded_rectangle([x0, 30, x0 + 5, 78], 2, fill=235)
            dr.rounded_rectangle([x0, 30, x0 + 5, 78], 2, fill=215)
        # отверстия ряда ниже
        d.ellipse([x + 2, 176, x + 8, 182], fill=(20, 12, 12))
        d.ellipse([x + 13, 176, x + 19, 182], fill=(20, 12, 12))
        dh.ellipse([x + 2, 176, x + 8, 182], fill=40)
        dh.ellipse([x + 13, 176, x + 19, 182], fill=40)
    # поперечный шнур, связывающий ряды
    d.rectangle([0, 84, W, 88], fill=(70, 14, 12))
    dh.rectangle([0, 84, W, 88], fill=200)
    dr.rectangle([0, 84, W, 88], fill=210)
    hi = hi.filter(ImageFilter.GaussianBlur(1.6))
    save(img, f'{out}/lame_color.jpg')
    save(normal_from_height(np.asarray(hi, np.float32) / 255, 5), f'{out}/lame_normal.jpg')
    mr = np.zeros((H, W, 3), np.uint8)
    mr[..., 1] = np.asarray(ro)
    mr[..., 2] = 40                                  # металличность лака мала
    save(Image.fromarray(mr), f'{out}/lame_mr.jpg')


def lacquer(out):
    """Гладкий чёрный лак/тёмное железо с износом (тайл 512)."""
    S = 512
    g = noise(S, S, 96, 5, seed=3)
    scratches = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(scratches)
    for _ in range(140):
        x, y = RNG.integers(0, S, 2)
        a = RNG.random() * math.pi
        l = RNG.integers(6, 40)
        d.line([x, y, x + math.cos(a) * l, y + math.sin(a) * l], fill=int(RNG.integers(60, 160)), width=1)
    sc = np.asarray(scratches, np.float32) / 255
    col = np.array([0.08, 0.072, 0.072]) * (0.7 + 0.6 * g[..., None]) + sc[..., None] * np.array([0.12, 0.1, 0.09])
    save(Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)), f'{out}/lacquer_color.jpg')
    mr = np.zeros((S, S, 3), np.uint8)
    mr[..., 1] = np.clip((0.38 + 0.25 * g + 0.3 * sc) * 255, 0, 255)
    mr[..., 2] = np.clip((0.35 + 0.3 * sc) * 255, 0, 255)
    save(Image.fromarray(mr), f'{out}/lacquer_mr.jpg')
    save(normal_from_height(g * 0.6 - sc * 0.4, 3), f'{out}/lacquer_normal.jpg')


def brass(out):
    """Старая латунь: золото с потемнением в углублениях."""
    S = 256
    g = noise(S, S, 48, 5, seed=4)
    gold = np.array([0.72, 0.55, 0.26])
    col = gold * (0.6 + 0.5 * g[..., None]) * (1 - 0.35 * np.clip((0.4 - g[..., None]) * 4, 0, 1))
    save(Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)), f'{out}/brass_color.jpg')
    mr = np.zeros((S, S, 3), np.uint8)
    mr[..., 1] = np.clip((0.25 + 0.4 * (1 - g)) * 255, 0, 255)
    mr[..., 2] = 235
    save(Image.fromarray(mr), f'{out}/brass_mr.jpg')


def cloth(out):
    """Хакама: тёмная ткань с едва заметным узором асаноха."""
    S = 512
    g = noise(S, S, 32, 4, seed=5)
    img = Image.new('RGB', (S, S))
    arr = (np.array([0.12, 0.11, 0.115]) * (0.8 + 0.4 * g[..., None]))
    img = Image.fromarray((arr * 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    c = (58, 52, 56)
    cell = 64
    for cy in range(0, S + cell, cell):
        for cx in range(0, S + cell, cell):
            ox = cx + (cell // 2 if (cy // cell) % 2 else 0)
            for k in range(6):
                a = k * math.pi / 3
                d.line([ox, cy, ox + math.cos(a) * cell / 2, cy + math.sin(a) * cell / 2], fill=c, width=2)
            d.regular_polygon((ox, cy, cell / 2), 6, outline=c)
    # переплетение нитей
    wv = (np.sin(np.arange(S) * 1.4)[None, :] * np.sin(np.arange(S) * 1.4)[:, None]) * 6
    a = np.asarray(img, np.float32) + wv[..., None]
    save(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), f'{out}/cloth_color.jpg')


def mail(out):
    """Кусари — кольчуга японского плетения на тёмной ткани."""
    S = 256
    img = Image.new('RGB', (S, S), (18, 16, 18))
    hi = Image.new('L', (S, S), 60)
    d, dh = ImageDraw.Draw(img), ImageDraw.Draw(hi)
    st = 16
    for y in range(0, S + st, st):
        for x in range(0, S + st, st):
            for (ox, oy) in ((0, 0), (st // 2, st // 2)):
                bb = [x + ox - 6, y + oy - 6, x + ox + 6, y + oy + 6]
                d.ellipse(bb, outline=(70, 66, 64), width=2)
                dh.ellipse(bb, outline=230, width=3)
    save(img, f'{out}/mail_color.jpg')
    save(normal_from_height(np.asarray(hi.filter(ImageFilter.GaussianBlur(1)), np.float32) / 255, 4), f'{out}/mail_normal.jpg')


def tsuka(out):
    """Рукоять: чёрная шёлковая оплётка ромбами поверх кожи ската."""
    W, H = 128, 512
    img = Image.new('RGB', (W, H), (40, 36, 34))
    d = ImageDraw.Draw(img)
    # скат — зернистый светлый фон в ромбах
    g = noise(W, H, 4, 2, seed=6)
    same = Image.fromarray((np.stack([g * 0.35 + 0.35] * 3, -1) * np.array([1, 0.95, 0.85]) * 255).astype(np.uint8))
    mask = Image.new('L', (W, H), 0)
    dm = ImageDraw.Draw(mask)
    step = 64
    for y in range(-step, H + step, step):
        dm.polygon([(W / 2, y + 8), (W - 18, y + step / 2), (W / 2, y + step - 8), (18, y + step / 2)], fill=255)
    img.paste(same, (0, 0), mask)
    for y in range(-step, H + step, step):
        d.line([(0, y), (W, y + step)], fill=(14, 12, 12), width=26)
        d.line([(W, y), (0, y + step)], fill=(22, 20, 20), width=26)
    save(img, f'{out}/tsuka_color.jpg')


def blade(out):
    """Клинок: зеркальная сталь, у лезвия — волнистый хамон."""
    W, H = 512, 64
    y = np.linspace(0, 1, H)[:, None]
    x = np.arange(W)[None, :]
    ham = 0.62 + 0.08 * np.sin(x / 13) + 0.04 * np.sin(x / 5.3)
    hamon = np.clip((y - ham) * 18, 0, 1)
    g = noise(W, H, 16, 3, seed=8)
    col = np.stack([0.62 + 0.25 * hamon + 0.06 * g] * 3, -1) * np.array([0.97, 0.99, 1.0])
    save(Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)), f'{out}/blade_color.jpg')


def saya(out):
    """Ножны: глубокий чёрный лак с золотым орнаментом облаков."""
    W, H = 1024, 128
    g = noise(W, H, 64, 4, seed=9)
    arr = np.array([0.05, 0.045, 0.048]) * (0.8 + 0.4 * g[..., None])
    img = Image.fromarray((arr * 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    gold = (176, 138, 70)
    for cx in (200, 520, 820):
        for k in range(5):
            r = 22 + k * 3
            d.arc([cx - r + k * 30, 40 - r / 2, cx + r + k * 30, 40 + r / 2], 180, 360, fill=gold, width=3)
            d.arc([cx - r + k * 30 + 15, 70 - r / 2, cx + r + k * 30 + 15, 70 + r / 2], 0, 180, fill=gold, width=3)
    save(img, f'{out}/saya_color.jpg')


def make_all(out):
    os.makedirs(out, exist_ok=True)
    for f in (lame, lacquer, brass, cloth, mail, tsuka, blade, saya):
        f(out)


if __name__ == '__main__':
    import sys
    make_all(sys.argv[1] if len(sys.argv) > 1 else 'tex')
