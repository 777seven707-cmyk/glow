"""Импорт самурая из 3MF (Bambu Lab MakerLab «Image to 3D») в GLB для сайта.

В 3MF лежит весь референс-лист: пять фигур в разных ракурсах, мечи, детали.
Берём фронтальную фигуру, переводим покраску под 10 пластиков в цвета,
делим на материалы (лак, ткань, золото, красная шнуровка), опускаем руки
из позы «А» и выделяем голову отдельным узлом, чтобы она следила за курсором.

    python3 import_3mf.py путь/к/model.3mf [выход.glb] [--arms УГОЛ]
"""
import re, sys, json, zipfile, argparse
import numpy as np
import trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('out', nargs='?', default='samurai.glb')
ap.add_argument('--arms', type=float, default=0.55, help='на сколько радиан опустить руки')
ap.add_argument('--figure', type=int, default=0, help='какую фигуру брать: 0 — самая большая (вид спереди)')
args = ap.parse_args()

# ---------- чтение 3MF ----------
z = zipfile.ZipFile(args.src)
name = next(n for n in z.namelist() if n.startswith('3D/Objects/') and n.endswith('.model'))
xml = z.read(name).decode()
V = np.array(re.findall(r'<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"', xml), np.float64)
tri = re.findall(r'<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"(?: paint_color="([^"]*)")?', xml)
F = np.array([[int(a), int(b), int(c)] for a, b, c, _ in tri], np.int64)


def paint_state(code):
    """Кодировка покраски PrusaSlicer/Bambu: 4 → пластик 1, 8 → 2, xC → 3 + x.
    У разбитых треугольников берём состояние последнего листа."""
    if not code:
        return 1
    if code[-1] == '4':
        return 1
    if code[-1] == '8':
        return 2
    if code[-1] == 'C' and len(code) >= 2:
        return 3 + int(code[-2], 16)
    return 1


state = np.array([paint_state(p) for *_, p in tri])

# ---------- выбираем фигуру ----------
n = len(V)
e = np.concatenate([F[:, [0, 1]], F[:, [1, 2]]])
g = coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n))
_, lab = connected_components(g, directed=False)
flab = lab[F[:, 0]]
comp = np.argsort(-np.bincount(flab))[args.figure]
mask = flab == comp
f = F[mask]
st = state[mask]
idx, inv = np.unique(f, return_inverse=True)
f = inv.reshape(-1, 3)
v = V[idx]
# 3MF: Z вверх, Y вглубь → glTF: Y вверх, лицом к +Z; высота 2 м, ступни на нуле
v = np.stack([v[:, 0], v[:, 2], -v[:, 1]], 1)
v -= [(v[:, 0].min() + v[:, 0].max()) / 2, v[:, 1].min(), (v[:, 2].min() + v[:, 2].max()) / 2]
v *= 2.0 / v[:, 1].max()

# ---------- опускаем руки из позы «А» ----------
if args.arms:
    for s in (1, -1):
        px, py = 0.27 * s, 1.42
        ax = np.clip((v[:, 0] * s - 0.24) / 0.14, 0, 1)          # дальше от оси тела — сильнее
        ay = np.clip((v[:, 1] - 1.0) / 0.12, 0, 1)                # поясница и ниже не трогаем
        w = ax * ay * (v[:, 0] * s > 0)
        w = w * w * (3 - 2 * w)
        ang = -s * args.arms * w
        dx, dy = v[:, 0] - px, v[:, 1] - py
        c, sn = np.cos(ang), np.sin(ang)
        v[:, 0] = np.where(w > 0, px + dx * c - dy * sn, v[:, 0])
        v[:, 1] = np.where(w > 0, py + dx * sn + dy * c, v[:, 1])

# ---------- цвета и материалы ----------
# пластики 1..10 → цвет и группа материала
# серые пластики на лаке — это потёртости, их приглушаем, чтобы не было пятен
PALETTE = {
    1: ('#0d0b0c', 'lacquer'), 2: ('#2a1316', 'lacquer'), 3: ('#1f1c1c', 'cloth'),
    4: ('#4a3828', 'cloth'), 5: ('#393533', 'iron'), 6: ('#6e1a18', 'lace'),
    7: ('#8a6a35', 'gold'), 8: ('#c09a52', 'gold'), 9: ('#48443f', 'iron'), 10: ('#d6b565', 'gold'),
}
# лак, ткань, железо и шнуровку держим одним материалом, чтобы цвета перетекали
# без резких треугольных пятен; золото — отдельно, металлом
MATS = {
    'armor': dict(roughness=0.6, metallic=0.12),
    'gold':  dict(roughness=0.3, metallic=1.0),
}


def lin(hexcol):
    c = np.array([int(hexcol[i:i + 2], 16) for i in (1, 3, 5)]) / 255
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


base = trimesh.Trimesh(v, f, process=False)
vn = base.vertex_normals.copy()
group_of = np.array(['gold' if PALETTE[s][1] == 'gold' else 'armor' for s in range(1, 11)])

# цвет вершины: среднее по всем её треугольникам + одно сглаживание по соседям
face_rgb = np.array([lin(PALETTE[s][0]) for s in range(1, 11)])[st - 1]
vcol = np.zeros((len(v), 3)); vcnt = np.zeros(len(v))
for k in range(3):
    np.add.at(vcol, f[:, k], face_rgb)
    np.add.at(vcnt, f[:, k], 1)
vcol /= np.maximum(vcnt, 1)[:, None]
edges = base.edges_unique
nb = np.zeros_like(vcol); nbc = np.zeros(len(v))
np.add.at(nb, edges[:, 0], vcol[edges[:, 1]]); np.add.at(nbc, edges[:, 0], 1)
np.add.at(nb, edges[:, 1], vcol[edges[:, 0]]); np.add.at(nbc, edges[:, 1], 1)
vcol = 0.5 * vcol + 0.5 * nb / np.maximum(nbc, 1)[:, None]

# голова — всё выше шеи и у оси тела; отдельный узел с опорой на шее
NECK = np.array([0.0, 1.58, -0.02])
cent = v[f].mean(1)
is_head = (cent[:, 1] > NECK[1]) & (np.abs(cent[:, 0]) < 0.24)

scene = trimesh.Scene()
root = 'Samurai'
scene.graph.update(frame_to=root, frame_from=scene.graph.base_frame)
scene.graph.update(frame_to='head', frame_from=root, matrix=trimesh.transformations.translation_matrix(NECK))
stats = {}
for part, sel in (('body', ~is_head), ('head', is_head)):
    for grp in MATS:
        m = sel & (group_of[st - 1] == grp)
        if not m.any():
            continue
        ff = f[m]
        used, ii = np.unique(ff, return_inverse=True)
        vv = v[used] - (NECK if part == 'head' else 0)
        if grp == 'gold':   # у золота свой ровный цвет, без примеси соседнего лака
            gc = np.array([lin(PALETTE[s][0]) for s in st[m]])
            acc = np.zeros((len(used), 3)); cnt = np.zeros(len(used))
            for k in range(3):
                np.add.at(acc, ii.reshape(-1, 3)[:, k], gc)
                np.add.at(cnt, ii.reshape(-1, 3)[:, k], 1)
            rgb = acc / cnt[:, None]
        else:
            rgb = vcol[used]
        vc = np.concatenate([rgb, np.ones((len(used), 1))], 1)
        mesh = trimesh.Trimesh(vv, ii.reshape(-1, 3), vertex_normals=vn[used], process=False)
        mesh.visual = trimesh.visual.ColorVisuals(mesh, vertex_colors=(np.clip(vc, 0, 1) * 255).astype(np.uint8))
        node = f'{part}_{grp}'
        scene.add_geometry(mesh, node_name=node, geom_name=node, parent_node_name=('head' if part == 'head' else root))
        stats[node] = len(ii) // 3

glb = trimesh.exchange.gltf.export_glb(scene, include_normals=True)


def set_materials(glb):
    """trimesh пишет цвет вершин без своих материалов — дописываем PBR по имени меша."""
    import struct
    jlen = struct.unpack('<I', glb[12:16])[0]
    gl = json.loads(glb[20:20 + jlen])
    rest = glb[20 + jlen:]
    gl['materials'] = [dict(name='meshy-' + k, doubleSided=True,
                            pbrMetallicRoughness=dict(baseColorFactor=[1, 1, 1, 1],
                                                      metallicFactor=m['metallic'], roughnessFactor=m['roughness']))
                       for k, m in MATS.items()]
    keys = list(MATS)
    for mesh in gl['meshes']:
        grp = mesh.get('name', '').split('_')[-1]
        for prim in mesh['primitives']:
            if grp in keys:
                prim['material'] = keys.index(grp)
    js = json.dumps(gl, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    body = struct.pack('<II', len(js), 0x4E4F534A) + js + rest
    return struct.pack('<III', 0x46546C67, 2, 12 + len(body)) + body


glb = set_materials(glb)
open(args.out, 'wb').write(glb)
print(f'{args.out}: {len(glb) / 1024:.0f} КБ', json.dumps(stats, ensure_ascii=False))
