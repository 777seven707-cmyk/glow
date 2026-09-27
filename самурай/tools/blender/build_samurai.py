"""Самурай в Blender — сборка модели по референс-листу и экспорт в GLB.

Запуск (Blender как модуль Python, `pip install bpy`):
    python3 build_samurai.py [путь/к/samurai.glb]
или из Blender:
    blender -b -P build_samurai.py -- [путь/к/samurai.glb]

Система координат Blender: Z вверх, самурай смотрит в -Y, его левая рука — +X.
Экспортёр glTF переводит это в Y-up, фигура смотрит в +Z, как ждёт сайт.

Именованные узлы для анимации на сайте:
Samurai › hips › torso › head › kabuto › kuwagata
                     › armL/armR › forearmL/R › handL/R › katana
                     › sodeL/sodeR, kamon
"""
import bpy, bmesh, math, os, sys, tempfile
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import textures  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
OUT = os.path.abspath(argv[0]) if argv else os.path.abspath(os.path.join(HERE, '..', '..', 'assets', 'models', 'samurai.glb'))
TEX = os.path.join(tempfile.gettempdir(), 'samurai_tex')
TAU = math.pi * 2

bpy.ops.wm.read_factory_settings(use_empty=True)
textures.make_all(TEX)
COLL = bpy.context.scene.collection


# =========================================================
# МАТЕРИАЛЫ
# =========================================================
IMAGES = {}


def image(name, data=False):
    if name not in IMAGES:
        im = bpy.data.images.load(os.path.join(TEX, name))
        if data:
            im.colorspace_settings.name = 'Non-Color'
        IMAGES[name] = im
    return IMAGES[name]


def material(name, color=(0.1, 0.1, 0.1), rough=0.5, metal=0.0, col=None, nrm=None, mr=None,
             coat=0.0, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if col:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image(col)
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if mr:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image(mr, True)
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Green'], b.inputs['Roughness'])
        nt.links.new(sep.outputs['Blue'], b.inputs['Metallic'])
    if nrm:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image(nrm, True)
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.25
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    m.use_backface_culling = False
    return m


M = {
    'lame':    material('odoshi-lame', col='lame_color.jpg', nrm='lame_normal.jpg', mr='lame_mr.jpg', coat=0.12),
    'lacquer': material('urushi-black', col='lacquer_color.jpg', nrm='lacquer_normal.jpg', mr='lacquer_mr.jpg', coat=0.25),
    'iron':    material('iron', col='lacquer_color.jpg', nrm='lacquer_normal.jpg', rough=0.45, metal=0.75),
    'gold':    material('gold', col='brass_color.jpg', mr='brass_mr.jpg'),
    'lace':    material('odoshi-lace', color=(0.16, 0.014, 0.014), rough=0.75),
    'cloth':   material('hakama-cloth', col='cloth_color.jpg', rough=0.95),
    'mail':    material('kusari-mail', col='mail_color.jpg', nrm='mail_normal.jpg', rough=0.55, metal=0.6),
    'leather': material('leather', color=(0.03, 0.025, 0.025), rough=0.7),
    'straw':   material('waraji-straw', color=(0.3, 0.24, 0.14), rough=1.0),
    'tsuka':   material('tsuka-ito', col='tsuka_color.jpg', rough=0.8),
    'steel':   material('blade-steel', col='blade_color.jpg', rough=0.12, metal=1.0),
    'saya':    material('saya-lacquer', col='saya_color.jpg', rough=0.25, coat=1.0),
    'teeth':   material('teeth', color=(0.06, 0.055, 0.05), rough=0.5, metal=0.0),
    'void':    material('face-void', color=(0.01, 0.008, 0.008), rough=1.0),
    'eyes':    material('eyes', color=(0.05, 0.0, 0.0), emit=(1.0, 0.3, 0.1), strength=1.5),
}


# =========================================================
# ПОМОЩНИКИ ГЕОМЕТРИИ
# =========================================================
def empty(name, parent=None, loc=(0, 0, 0), rot=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    o.empty_display_size = 0.05
    COLL.objects.link(o)
    o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    return o


def from_bm(name, bm, mat, parent, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), smooth=True, sharp=0.75):
    """bmesh → объект. Гладкое затенение, рёбра острее `sharp` рад — жёсткие."""
    bm.normal_update()
    for f in bm.faces:
        f.smooth = smooth
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0) > sharp:
            e.smooth = False
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    COLL.objects.link(o)
    me.materials.append(mat)
    o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    o.scale = scale
    return o


def surface(name, f, nu, nv, mat, parent, uv=None, skip=None, **kw):
    """Параметрическая поверхность f(u, v) → Vector на сетке nu×nv."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    V = [[bm.verts.new(f(i / nu, j / nv)) for j in range(nv + 1)] for i in range(nu + 1)]
    for i in range(nu):
        for j in range(nv):
            if skip and skip((i + 0.5) / nu, (j + 0.5) / nv):
                continue
            quad = ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))
            face = bm.faces.new([V[a][b] for a, b in quad])
            for loop, (a, b) in zip(face.loops, quad):
                loop[uvl].uv = uv(a / nu, b / nv) if uv else (a / nu, b / nv)
    for v in [v for v in bm.verts if not v.link_faces]:
        bm.verts.remove(v)
    return from_bm(name, bm, mat, parent, **kw)


def modifier(o, kind, **props):
    m = o.modifiers.new(kind.lower(), kind)
    for k, v in props.items():
        setattr(m, k, v)
    return o


def band(name, mat, parent, r0, r1, h, a0, a1, z=0.0, sy=1.0, cy=0.0, tile=0.25, thick=0.006, **kw):
    """Ламель — полоса на конусе. Угол a от фронта (-Y) к левому боку (+X).
    r0 — радиус сверху, r1 — снизу. UV: u вдоль пластины (тайл), v снизу вверх."""
    seg = max(3, int(abs(a1 - a0) * max(r0, r1) / 0.018))
    L = abs(a1 - a0) * (r0 + r1) / 2

    def f(u, v):
        a = a0 + (a1 - a0) * u
        r = r1 + (r0 - r1) * v
        return Vector((r * math.sin(a), cy - r * math.cos(a) * sy, z - h / 2 + h * v))
    o = surface(name, f, seg, 1, mat, parent, uv=lambda u, v: (u * L / tile, v), **kw)
    if thick:
        modifier(o, 'SOLIDIFY', thickness=thick, offset=-1)
    return o


def tube(name, mat, parent, r0, r1, h, z0=0.0, seg=24, uv=(1, 1), sx=1.0, sy=1.0, **kw):
    """Труба вдоль Z от z0 до z0+h (r0 — низ, r1 — верх), без торцов."""
    def f(u, v):
        a = u * TAU
        r = r0 + (r1 - r0) * v
        return Vector((r * math.sin(a) * sx, -r * math.cos(a) * sy, z0 + h * v))
    return surface(name, f, seg, max(1, int(h / 0.04)), mat, parent, uv=lambda u, v: (u * uv[0], v * uv[1]), **kw)


def torus(name, mat, parent, R, r, a0=0.0, a1=TAU, sy=1.0, seg=48, tseg=8, **kw):
    """Тор в плоскости XY (кольцо вокруг Z), можно дугой a0..a1."""
    def f(u, v):
        a = a0 + (a1 - a0) * u
        b = v * TAU
        rr = R + r * math.cos(b)
        return Vector((rr * math.sin(a), -rr * math.cos(a) * sy, r * math.sin(b)))
    return surface(name, f, max(8, int(seg * (a1 - a0) / TAU)), tseg, mat, parent, **kw)


def box(name, mat, parent, size, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.002, round_=0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, calc_uvs=True)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    o = from_bm(name, bm, mat, parent, loc, rot, smooth=bool(round_))
    if round_:
        modifier(o, 'SUBSURF', levels=round_, render_levels=round_)
    elif bevel:
        modifier(o, 'BEVEL', width=bevel, segments=2, limit_method='ANGLE')
    return o


def disc(name, mat, parent, r, h, loc=(0, 0, 0), rot=(math.pi / 2, 0, 0), seg=32, scale=(1, 1, 1)):
    """Диск; по умолчанию смотрит вперёд (-Y)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=h, calc_uvs=True)
    return from_bm(name, bm, mat, parent, loc, rot, scale)


def sphere(name, mat, parent, r, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), seg=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(6, seg // 2), radius=r, calc_uvs=True)
    return from_bm(name, bm, mat, parent, loc, rot, scale)


def flat_shape(name, mat, parent, pts, depth, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0015):
    """Плоская фигура по контуру (x, z) толщиной depth вдоль Y."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    front = [bm.verts.new((x, -depth / 2, z)) for x, z in pts]
    back = [bm.verts.new((x, depth / 2, z)) for x, z in pts]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[j], front[i], back[i], back[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        for loop in f.loops:
            loop[uvl].uv = (loop.vert.co.x * 10 + 0.5, loop.vert.co.z * 10)
    o = from_bm(name, bm, mat, parent, loc, rot, smooth=False)
    if bevel:
        modifier(o, 'BEVEL', width=bevel, segments=2, limit_method='ANGLE')
    return o


def aim(obj, axis, direction):
    """Поворачивает объект так, чтобы его локальная ось axis смотрела в мировом направлении."""
    bpy.context.view_layer.update()
    loc = obj.matrix_world.to_translation()
    q = Vector(axis).rotation_difference(Vector(direction).normalized())
    obj.matrix_world = Matrix.Translation(loc) @ q.to_matrix().to_4x4()


def gauss(x):
    return math.exp(-x * x)


def mon(name, parent, r, loc, rot=(0, 0, 0)):
    """Золотой герб-розетка: диск, кольцо, лепестки, шишка в центре. Смотрит в -Y."""
    g = empty(name, parent, loc, rot)
    disc(name + '_d', M['gold'], g, r, 0.006)
    torus(name + '_r', M['gold'], g, r * 0.95, r * 0.12, rot=(math.pi / 2, 0, 0), seg=32, tseg=6)
    for k in range(12):
        a = k * TAU / 12
        sphere(name + f'_p{k}', M['gold'], g, r * 0.2, loc=(math.cos(a) * r * 0.62, -0.004, math.sin(a) * r * 0.62), scale=(1, 0.5, 1), seg=8)
    sphere(name + '_c', M['gold'], g, r * 0.3, loc=(0, -0.006, 0), scale=(1, 0.6, 1), seg=12)
    return g


# =========================================================
# СБОРКА
# =========================================================
root = empty('Samurai')
hips = empty('hips', root, (0, 0, 1.0))

# ---------- ноги: хакама, сунэатэ, сандалии ----------
for s, nm in ((-1, 'legR'), (1, 'legL')):
    leg = empty(nm, hips, (0.12 * s, 0, -0.02), (0, -0.07 * s, 0))

    def hakama(u, v):
        a = u * TAU
        t = v
        if t < 0.74:
            r = 0.13 + 0.11 * math.sin(t / 0.74 * math.pi / 2) ** 0.8
        else:
            k = (t - 0.74) / 0.26
            r = 0.24 - 0.16 * (k * k * (3 - 2 * k))
        r *= 1 + (0.05 + 0.06 * t) * abs(math.cos(a * 7)) ** 3
        return Vector((r * math.sin(a), -r * math.cos(a) * 0.92, -t * 0.7))
    o = surface(nm + '_hakama', hakama, 56, 22, M['cloth'], leg, uv=lambda u, v: (u * 3, v * 2.5))
    modifier(o, 'SUBSURF', levels=1, render_levels=1)

    # сунэатэ — поножи из вертикальных пластин
    tube(nm + '_calf', M['cloth'], leg, 0.058, 0.074, 0.28, z0=-0.92, uv=(2, 1.2))
    for k in range(5):
        a = (k - 2) * 0.42
        r = 0.079
        box(nm + f'_shino{k}', M['lacquer'], leg, (0.024, 0.008, 0.24), loc=(r * math.sin(a), -r * math.cos(a), -0.78), rot=(0, 0, a))
        box(nm + f'_shinocap{k}', M['gold'], leg, (0.026, 0.01, 0.014), loc=(r * math.sin(a), -r * math.cos(a) - 0.001, -0.655), rot=(0, 0, a))
    for z in (-0.69, -0.8, -0.89):
        torus(nm + f'_tie{z}', M['lace'], leg, 0.081, 0.0045, loc=(0, 0, z), seg=32, tseg=6)
    # таби и варадзи
    box(nm + '_tabi', M['leather'], leg, (0.095, 0.21, 0.07), loc=(0, -0.045, -0.935), round_=2)
    box(nm + '_sole', M['straw'], leg, (0.108, 0.25, 0.018), loc=(0, -0.05, -0.972), bevel=0.004)
    box(nm + '_strap', M['lace'], leg, (0.1, 0.012, 0.03), loc=(0, -0.1, -0.95), bevel=0.002)

# ---------- кусадзури — юбка из восьми панелей ----------
PANELS, ROWS = 7, 6
pw = TAU / PANELS - 0.13
for k in range(PANELS):
    c = k * TAU / PANELS
    a0, a1 = c - pw / 2, c + pw / 2
    for row in range(ROWS):
        r0 = 0.3 + row * 0.03
        band(f'kz{k}_{row}', M['lame'], hips, r0, r0 + 0.026, 0.074, a0, a1, z=-0.06 - row * 0.066, sy=0.84)
    rb = 0.3 + ROWS * 0.03
    band(f'kz{k}_fringe', M['lace'], hips, rb, rb + 0.004, 0.016, a0, a1, z=-0.06 - (ROWS - 1) * 0.066 - 0.043, sy=0.84, thick=0.004)
    band(f'kz{k}_cord', M['lace'], hips, 0.292, 0.3, 0.035, a0 + 0.04, a1 - 0.04, z=-0.012, sy=0.84, thick=0.004)

# оби и шнур
band('obi', M['cloth'], hips, 0.285, 0.29, 0.07, -math.pi, math.pi, z=0.005, sy=0.8, tile=0.5, thick=0.012)
for z in (0.036, -0.026):
    torus(f'obi_cord{z}', M['lace'], hips, 0.291, 0.006, sy=0.8, loc=(0, 0, z), seg=64, tseg=6)

# ---------- ножны катаны и вакидзаси слева ----------
saya = empty('saya', hips, (0.235, -0.2, -0.005))
tube('saya_body', M['saya'], saya, 0.017, 0.02, 0.78, z0=-0.78, seg=16, uv=(1, 1), sx=1.0, sy=0.8)
torus('saya_koiguchi', M['gold'], saya, 0.02, 0.004, sy=0.8, loc=(0, 0, -0.004), seg=24, tseg=6)
sphere('saya_kojiri', M['gold'], saya, 0.018, loc=(0, 0, -0.78), scale=(1, 0.8, 1.4), seg=12)
box('saya_kurigata', M['gold'], saya, (0.012, 0.012, 0.03), loc=(-0.02, 0, -0.1))
torus('saya_sageo', M['lace'], saya, 0.03, 0.004, loc=(-0.03, 0, -0.14), rot=(0, math.pi / 2, 0), seg=24, tseg=6)

waki = empty('wakizashi', hips, (0.19, -0.225, 0.04))
tube('waki_saya', M['saya'], waki, 0.015, 0.017, 0.46, z0=-0.46, seg=16, sy=0.8)
sphere('waki_kojiri', M['gold'], waki, 0.016, loc=(0, 0, -0.46), scale=(1, 0.8, 1.3), seg=12)
disc('waki_tsuba', M['iron'], waki, 0.032, 0.006, loc=(0, 0, 0.012), rot=(0, 0, 0), scale=(1, 0.85, 1))
torus('waki_tsuba_rim', M['gold'], waki, 0.032, 0.003, sy=0.85, loc=(0, 0, 0.012), seg=32, tseg=5)
tube('waki_tsuka', M['tsuka'], waki, 0.014, 0.013, 0.16, z0=0.016, seg=12, uv=(1, 1.3), sy=0.78)
sphere('waki_kashira', M['gold'], waki, 0.016, loc=(0, 0, 0.18), scale=(1, 0.8, 0.7), seg=12)

# ---------- торс: до ----------
torso = empty('torso', hips, (0, 0, 0))


def do_r(z):
    return 0.27 + 0.04 * math.sin(max(0.0, min(1.0, z / 0.3)) * math.pi / 2)


for row in range(6):
    z = 0.04 + row * 0.062
    band(f'do{row}', M['lame'], torso, do_r(z + 0.035), do_r(z - 0.035) + 0.008, 0.07, -math.pi, math.pi, z=z, sy=0.74)
band('do_mune', M['lacquer'], torso, 0.3, 0.315, 0.1, -math.pi, math.pi, z=0.42, sy=0.74, tile=0.6)
torus('do_mune_rim', M['gold'], torso, 0.3, 0.005, sy=0.74, loc=(0, 0, 0.47), seg=64, tseg=6)
# плечевая площадка: почти плоское кольцо от края кирасы к вороту
surface('do_kata', lambda u, v: Vector(((0.3 - 0.19 * v) * math.sin(u * TAU), -(0.3 - 0.19 * v) * math.cos(u * TAU) * (0.74 + 0.12 * v), 0.47 + 0.035 * v)),
        64, 3, M['lacquer'], torso, uv=lambda u, v: (u * 3, v))
kamon = empty('kamon', torso, (0, -0.236, 0.42))
mon('kamon_mon', kamon, 0.026, (0, 0, 0))
# красный бант агэмаки на животе
bow = empty('agemaki', torso, (0, -0.232, 0.12))
for s in (-1, 1):
    torus(f'bow_loop{s}', M['lace'], bow, 0.028, 0.008, loc=(0.03 * s, 0, 0.01), rot=(math.pi / 2, 0.35 * s, 0), sy=0.6, seg=24, tseg=6)
    tube(f'bow_tail{s}', M['lace'], bow, 0.006, 0.006, 0.14, z0=-0.14, seg=8, loc=(0.012 * s, 0, 0), rot=(0, 0.25 * s, 0))
sphere('bow_knot', M['lace'], bow, 0.014, scale=(1, 0.7, 1), seg=12)
# ватагами — наплечные ремни
for s in (-1, 1):
    mon(f'watagami_mon{s}', torso, 0.016, (0.13 * s, -0.232, 0.45), (0, 0, 0))
# воротник
tube('eri', M['lacquer'], torso, 0.12, 0.085, 0.07, z0=0.5, seg=24)
torus('eri_lace', M['lace'], torso, 0.087, 0.006, loc=(0, 0, 0.57), seg=32, tseg=6)

# ---------- содэ — большие наплечники ----------
for s, nm in ((1, 'sodeL'), (-1, 'sodeR')):
    sode = empty(nm, torso, (0.37 * s, -0.03, 0.5), (0, 0, s * (math.pi / 2 - 0.55)))
    Rs = 0.24
    for row in range(7):
        out = row * 0.01
        z = -0.035 - row * 0.054
        band(f'{nm}_{row}', M['lame'], sode, Rs, Rs, 0.058, -0.6, 0.6, z=z, cy=Rs - 0.035 - out)
    band(f'{nm}_kanmuri', M['lacquer'], sode, Rs, Rs, 0.05, -0.62, 0.62, z=0.01, cy=Rs - 0.04, tile=0.6)
    torus(f'{nm}_rim', M['gold'], sode, Rs, 0.005, a0=-0.62, a1=0.62, loc=(0, Rs - 0.04, 0.036), tseg=6)
    mon(f'{nm}_mon', sode, 0.02, (0, -0.05, 0.01))
    band(f'{nm}_fringe', M['lace'], sode, Rs, Rs, 0.014, -0.6, 0.6, z=-0.035 - 6 * 0.054 - 0.034, cy=Rs - 0.035 - 0.06, thick=0.004)

# ---------- руки: котэ и перчатки ----------
ARMS = {}
for s, nm in ((1, 'L'), (-1, 'R')):
    arm = empty('arm' + nm, torso, (0.33 * s, 0, 0.43))
    sphere(f'arm{nm}_shoulder', M['mail'], arm, 0.072, seg=16)
    tube(f'arm{nm}_upper', M['mail'], arm, 0.058, 0.068, 0.3, z0=-0.3, uv=(3, 2))
    for i in range(3):
        for j in (-1, 1):
            box(f'arm{nm}_ikada{i}{j}', M['lacquer'], arm, (0.012, 0.042, 0.05), loc=(0.064 * s, 0.024 * j, -0.08 - i * 0.065))
    disc(f'arm{nm}_hiji', M['lacquer'], arm, 0.036, 0.01, loc=(0.062 * s, 0, -0.3), rot=(0, math.pi / 2, 0))
    torus(f'arm{nm}_hijirim', M['gold'], arm, 0.036, 0.004, loc=(0.067 * s, 0, -0.3), rot=(0, math.pi / 2, 0), seg=24, tseg=5)
    fore = empty('forearm' + nm, arm, (0, 0, -0.3))
    sphere(f'fore{nm}_elbow', M['mail'], fore, 0.061, seg=14)
    tube(f'fore{nm}_mail', M['mail'], fore, 0.047, 0.058, 0.28, z0=-0.28, uv=(3, 2))
    for phi in (-0.55, 0.0, 0.55):
        d = Vector((s * math.cos(phi), math.sin(phi)))
        th = math.atan2(d.x, -d.y)
        box(f'fore{nm}_shino{phi}', M['lacquer'], fore, (0.02, 0.008, 0.22), loc=(0.057 * d.x, 0.057 * d.y, -0.14), rot=(0, 0, th))
    torus(f'fore{nm}_tie1', M['lace'], fore, 0.06, 0.004, loc=(0, 0, -0.06), seg=24, tseg=5)
    torus(f'fore{nm}_tie2', M['lace'], fore, 0.051, 0.005, loc=(0, 0, -0.24), seg=24, tseg=5)
    torus(f'fore{nm}_cuff', M['gold'], fore, 0.049, 0.005, loc=(0, 0, -0.275), seg=24, tseg=5)
    hand = empty('hand' + nm, fore, (0, 0, -0.29))
    box(f'hand{nm}_palm', M['leather'], hand, (0.058, 0.085, 0.085), loc=(0, 0, -0.035), round_=2)
    tube(f'hand{nm}_fingers', M['leather'], hand, 0.024, 0.024, 0.085, z0=-0.0425, seg=12,
         loc=(-0.02 * s, 0, -0.075), rot=(math.pi / 2, 0, 0))
    tube(f'hand{nm}_thumb', M['leather'], hand, 0.013, 0.012, 0.05, z0=0, seg=10,
         loc=(-0.02 * s, -0.04, -0.03), rot=(0.9, 0, 0))
    box(f'hand{nm}_tekko', M['lacquer'], hand, (0.012, 0.075, 0.07), loc=(0.032 * s, 0, -0.03))
    ARMS[nm] = (arm, fore, hand)

# поза: левая рука у рукояти вакидзаси, правая держит катану
ARMS['L'][0].rotation_euler = (-0.22, -0.08, 0)
ARMS['L'][1].rotation_euler = (-0.95, 0.0, -0.55)
ARMS['R'][0].rotation_euler = (-0.15, 0.2, 0)
ARMS['R'][1].rotation_euler = (-0.5, 0.0, -0.1)

# ---------- катана ----------
katana = empty('katana', ARMS['R'][2], (0, 0, -0.045))


def blade_mesh():
    """Клинок с изгибом сори, ребром синоги и наклонным остриём. Ось — +Z."""
    L, N = 0.76, 40
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    rings = []
    for i in range(N + 1):
        t = i / N
        w = 0.03 - 0.008 * t
        th = 0.007 - 0.002 * t
        if t > 0.92:                          # киссаки — остриё
            k = (t - 0.92) / 0.08
            w *= 1 - k * 0.97
            th *= 1 - k * 0.8
        bend = 0.03 * t * t                    # изгиб к обуху
        z = t * L
        sec = [(w / 2, 0, 0.0), (-w * 0.1, th / 2, 0.35), (-w / 2, th * 0.3, 0.9),
               (-w / 2, -th * 0.3, 0.9), (-w * 0.1, -th / 2, 0.35)]
        rings.append([bm.verts.new((x - bend, y, z)) for x, y, _ in sec])
        rings[-1] = (rings[-1], [v for _, _, v in sec], t)
    for i in range(N):
        (a, va, ta), (b, vb, tb) = rings[i], rings[i + 1]
        for j in range(5):
            jn = (j + 1) % 5
            f = bm.faces.new((a[j], a[jn], b[jn], b[j]))
            vv = (va[j], va[jn] if jn else 1.0, vb[jn] if jn else 1.0, vb[j])
            for loop, u, v in zip(f.loops, (ta, ta, tb, tb), vv):
                loop[uvl].uv = (u, 1 - v)
    bm.faces.new(rings[0][0])
    bm.faces.new(list(reversed(rings[-1][0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


from_bm('katana_blade', blade_mesh(), M['steel'], katana, loc=(0, 0, 0.075), sharp=0.5)
box('katana_habaki', M['gold'], katana, (0.034, 0.012, 0.03), loc=(0.0, 0, 0.078))
disc('katana_tsuba', M['iron'], katana, 0.042, 0.007, loc=(0, 0, 0.06), rot=(0, 0, 0), scale=(1, 0.85, 1))
torus('katana_tsuba_rim', M['gold'], katana, 0.042, 0.004, sy=0.85, loc=(0, 0, 0.06), seg=40, tseg=6)
for k in range(8):
    a = k * TAU / 8
    sphere(f'katana_tsuba_orn{k}', M['gold'], katana, 0.006, loc=(math.sin(a) * 0.03, -math.cos(a) * 0.025, 0.064), scale=(1, 1, 0.4), seg=8)
tube('katana_tsuka', M['tsuka'], katana, 0.0155, 0.0145, 0.25, z0=-0.195, seg=14, uv=(1, 2), sy=0.78)
sphere('katana_kashira', M['gold'], katana, 0.017, loc=(0, 0, -0.197), scale=(1, 0.8, 0.6), seg=12)
box('katana_menuki', M['gold'], katana, (0.006, 0.012, 0.03), loc=(0.015, 0, -0.07), round_=1)

# ---------- голова: мэмпо, кабуто, кувагата ----------
head = empty('head', torso, (0, 0.005, 0.54))
tube('neck', M['cloth'], head, 0.055, 0.055, 0.1, z0=-0.02, seg=16)
for k in range(3):
    band(f'yodare{k}', M['lame'], head, 0.084 + k * 0.018, 0.1 + k * 0.018, 0.034, -1.4, 1.4,
         z=0.045 - k * 0.028, cy=0.0, tile=0.2)


def menpo(u, w):
    """Маска: полусфера, деформированная под нос, скулы, морщины и оскал."""
    uu = u * 2 - 1
    th = uu * 1.3
    zc = 0.145
    z = zc - 0.09 + 0.125 * w
    R = 0.09 * (1 - 0.32 * (1 - w) ** 2)
    e = math.sqrt((uu / 0.42) ** 2 + ((w - 0.36) / 0.13) ** 2)
    d = (0.032 * gauss(uu / 0.13) * gauss((w - 0.8) / 0.17)                      # нос
         - 0.006 * gauss((abs(uu) - 0.08) / 0.04) * gauss((w - 0.72) / 0.05)    # ноздри
         + 0.013 * gauss((abs(uu) - 0.45) / 0.16) * gauss((w - 0.64) / 0.2)     # скулы
         + 0.004 * math.sin(50 * (abs(uu) * 0.8 + w * 0.6)) * min(1.0, max(0.0, (abs(uu) - 0.18) * 5)) * (w > 0.45)
         + 0.009 * gauss(uu / 0.3) * gauss((w - 0.04) / 0.1)                    # подбородок
         + 0.008 * math.exp(-((e - 1) / 0.18) ** 2))                            # губы
    n = Vector((math.sin(th), -math.cos(th) * 1.1, 0)).normalized()
    return Vector((R * math.sin(th), -R * math.cos(th) * 1.1, z)) + n * d


mask = surface('menpo', menpo, 48, 28, M['iron'], head,
               skip=lambda u, w: math.sqrt(((u * 2 - 1) / 0.42) ** 2 + ((w - 0.36) / 0.13) ** 2) < 0.92)
modifier(mask, 'SOLIDIFY', thickness=0.004, offset=-1)
modifier(mask, 'SUBSURF', levels=1, render_levels=1)
sphere('mouth_void', M['void'], head, 0.07, loc=(0, 0.01, 0.1), scale=(1, 0.9, 0.7), seg=16)
for row, (w, zoff) in enumerate(((0.47, 0.0), (0.26, 0.0))):
    for k in range(8):
        uu = (k - 3.5) / 3.5 * 0.33
        th = uu * 1.3
        z = 0.145 - 0.09 + 0.125 * w
        R = 0.09 * (1 - 0.32 * (1 - w) ** 2) - 0.004
        box(f'tooth{row}{k}', M['teeth'], head, (0.011, 0.008, 0.016 if row == 0 else 0.013),
            loc=(R * math.sin(th), -R * math.cos(th) * 1.1, z - (0.006 if row == 0 else -0.006)), rot=(0, 0, th), bevel=0.002)
for s in (-1, 1):
    torus(f'menpo_cord{s}', M['lace'], head, 0.012, 0.004, loc=(0.078 * s, -0.035, 0.07), rot=(0, math.pi / 2, 0), seg=16, tseg=5)
    tube(f'menpo_cordtail{s}', M['lace'], head, 0.004, 0.004, 0.09, z0=-0.09, seg=6, loc=(0.075 * s, -0.045, 0.065), rot=(0.2, 0.3 * s, 0))
# лицо в тени и глаза
sphere('face_void', M['void'], head, 0.08, loc=(0, 0.012, 0.185), scale=(1, 1, 1.05), seg=20)
for s in (-1, 1):
    sphere(f'eye{s}', M['eyes'], head, 0.009, loc=(0.031 * s, -0.068, 0.198), scale=(1.8, 0.6, 0.65), rot=(0, -0.25 * s, 0), seg=10)

# кабуто
kabuto = empty('kabuto', head, (0, 0.01, 0.235))


def hachi(u, v):
    a = u * TAU
    phi = v * math.pi / 2
    rib = 1 + 0.02 * abs(math.cos(a * 14)) ** 8
    r = 0.172 * rib
    return Vector((r * math.cos(phi) * math.sin(a), -r * math.cos(phi) * math.cos(a) * 1.06, r * math.sin(phi) * 0.9))


surface('hachi', hachi, 112, 14, M['iron'], kabuto, uv=lambda u, v: (u * 4, v))
torus('tehen', M['gold'], kabuto, 0.024, 0.007, loc=(0, 0, 0.152), seg=24, tseg=6)
torus('koshimaki', M['gold'], kabuto, 0.173, 0.006, sy=1.06, loc=(0, 0, 0.004), seg=80, tseg=6)
band('haraidate', M['gold'], kabuto, 0.176, 0.177, 0.028, -0.65, 0.65, z=0.024, sy=1.06, thick=0.004)
band('mabizashi', M['lacquer'], kabuto, 0.174, 0.215, 0.04, -1.15, 1.15, z=-0.014, sy=1.06, tile=0.6)
torus('mabizashi_rim', M['gold'], kabuto, 0.215, 0.004, a0=-1.15, a1=1.15, sy=1.06, loc=(0, 0, -0.034), tseg=6)
for k in range(5):
    r0 = 0.172 + k * 0.036
    band(f'shikoro{k}', M['lame'], kabuto, r0, r0 + 0.046, 0.054, 0.95 - k * 0.02, TAU - 0.95 + k * 0.02,
         z=-0.03 - k * 0.046, sy=1.03, tile=0.22)
band('shikoro_fringe', M['lace'], kabuto, 0.35, 0.354, 0.014, 0.87, TAU - 0.87, z=-0.03 - 4 * 0.046 - 0.033, sy=1.03, thick=0.004)
for s in (-1, 1):
    th = s * 0.72
    fk = empty(f'fukigaeshi{s}', kabuto, (0.2 * s, -0.135, -0.05), (0, 0, th))
    box(f'fuki{s}_plate', M['lame'], fk, (0.1, 0.012, 0.085))
    box(f'fuki{s}_rim', M['gold'], fk, (0.106, 0.008, 0.091), loc=(0, 0.004, 0))
    mon(f'fuki{s}_mon', fk, 0.026, (0, -0.009, 0))

# кувагата — золотые рога и герб-маэдатэ
kuwa = empty('kuwagata', kabuto, (0, -0.175, 0.04), (-0.16, 0, 0))
for s in (-1, 1):
    outer = [(0.03, 0.0), (0.075, 0.04), (0.12, 0.12), (0.145, 0.23), (0.158, 0.34), (0.172, 0.42)]
    inner = [(0.13, 0.415), (0.122, 0.33), (0.108, 0.22), (0.085, 0.13), (0.05, 0.065), (0.012, 0.03)]
    pts = [(x * s, z) for x, z in outer + inner]
    if s < 0:
        pts.reverse()
    flat_shape(f'kuwagata{s}', M['gold'], kuwa, pts, 0.007)
mon('maedate', kuwa, 0.044, (0, -0.008, 0.035))

# ---------- направляем клинок и ножны ----------
aim(katana, (0, 0, 1), (-0.3, -0.52, -0.8))       # остриё вниз-вперёд
aim(saya, (0, 0, -1), (0.35, 0.86, -0.38))         # ножны уходят назад
aim(waki, (0, 0, -1), (0.42, 0.86, -0.3))


# =========================================================
# ЗАПЕКАНИЕ МОДИФИКАТОРОВ И СКЛЕЙКА ПО МАТЕРИАЛАМ
# =========================================================
def bake_and_join():
    dg = bpy.context.evaluated_depsgraph_get()
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:
        if o.modifiers:
            me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
            o.modifiers.clear()
            o.data = me
    groups = {}
    for o in meshes:
        groups.setdefault((o.parent.name, o.data.materials[0].name), []).append(o)
    for (parent, mat), objs in groups.items():
        if len(objs) > 1:
            with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
                bpy.ops.object.join()
        objs[0].name = f'{parent}_{mat}'


bake_and_join()

tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
nmesh = sum(1 for o in bpy.data.objects if o.type == 'MESH')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB', export_apply=True, export_yup=True,
    export_texcoords=True, export_normals=True, export_materials='EXPORT',
    export_image_format='AUTO', export_cameras=False, export_lights=False,
    export_animations=False, export_extras=False,
)
print(f'samurai.glb: {os.path.getsize(OUT) / 1024:.0f} КБ, мешей {nmesh}, треугольников {tris} → {OUT}')


def glb_to_embedded_json(glb_path):
    """Та же модель одним JSON-файлом с данными в base64 — для хостингов без .glb."""
    import base64, json, struct
    data = open(glb_path, 'rb').read()
    jlen = struct.unpack('<I', data[12:16])[0]
    gltf = json.loads(data[20:20 + jlen])
    boff = 20 + jlen
    blen = struct.unpack('<I', data[boff:boff + 4])[0]
    binary = data[boff + 8:boff + 8 + blen]
    gltf['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binary).decode()
    out = glb_path[:-4] + '.gltf.json'
    with open(out, 'w') as f:
        json.dump(gltf, f, separators=(',', ':'))
    print(f'{os.path.basename(out)}: {os.path.getsize(out) / 1024:.0f} КБ')


glb_to_embedded_json(OUT)
