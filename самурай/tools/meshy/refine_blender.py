"""Доводка модели самурая в Blender: запекание затенения в складках (AO)
в цвет вершин. Без этого фигура выглядит плоско раскрашенной.

    python3 refine_blender.py вход.glb выход.glb [--samples 64] [--strength 0.85]
Нужен Blender как модуль Python: pip install bpy
"""
import sys, argparse
import bpy

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--distance', type=float, default=0.25, help='радиус затенения, м')
ap.add_argument('--strength', type=float, default=0.85)
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args.src)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = args.samples
world = bpy.data.worlds.new('w')
scene.world = world
world.light_settings.distance = args.distance

meshes = [o for o in scene.objects if o.type == 'MESH']
bases = {}
for o in meshes:
    me = o.data
    base = me.color_attributes[0]
    bases[o.name] = base.name
    ao = me.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT')
    me.color_attributes.active_color = ao

bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')

# цвет × затенение; дальше AO-слой не нужен
for o in meshes:
    me = o.data
    base = me.color_attributes[bases[o.name]]
    ao = me.color_attributes['AO']
    k = args.strength
    if base.domain == 'CORNER':
        for li, loop in enumerate(me.loops):
            a = ao.data[loop.vertex_index].color[0]
            f = 1 - k + k * a
            c = base.data[li].color
            base.data[li].color = (c[0] * f, c[1] * f, c[2] * f, c[3])
    else:
        for vi in range(len(me.vertices)):
            a = ao.data[vi].color[0]
            f = 1 - k + k * a
            c = base.data[vi].color
            base.data[vi].color = (c[0] * f, c[1] * f, c[2] * f, c[3])
    me.color_attributes.remove(ao)
    me.color_attributes.active_color = base
    me.color_attributes.render_color_index = me.color_attributes.find(base.name)

bpy.ops.export_scene.gltf(filepath=args.out, export_format='GLB', export_yup=True,
                          export_vertex_color='ACTIVE', export_normals=True,
                          export_texcoords=False, export_cameras=False, export_lights=False,
                          export_extras=False)
print('готово:', args.out)
