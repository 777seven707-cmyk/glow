#!/bin/sh
# Полная сборка модели: 3MF → GLB (цвета, позa, голова) → Blender (затенение) → GLB + .glb.js
set -e
cd "$(dirname "$0")"
python3 import_3mf.py samurai-sheet.3mf /tmp/samurai-raw.glb
python3 refine_blender.py /tmp/samurai-raw.glb ../../assets/models/samurai.glb
python3 glb_to_js.py ../../assets/models/samurai.glb
