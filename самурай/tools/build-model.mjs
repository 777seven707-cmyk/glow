/* Экспорт процедурной модели в ../assets/models/samurai.glb
   Запуск:  cd самурай/tools && npm install && npm run build:model */
import { writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildSamurai } from '../js/samurai-model.js';

// GLTFExporter в бинарном режиме читает Blob через FileReader — в Node его нет
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => { this.result = buf; this.onloadend?.(); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type};base64,` + Buffer.from(buf).toString('base64');
      this.onloadend?.();
    });
  }
};

const scene = new THREE.Scene();
scene.add(buildSamurai(THREE));

// текстур нет — UV нужны только флагу; общие вершины склеиваем в индекс
scene.traverse((o) => {
  if (!o.isMesh) return;
  if (o.name !== 'banner') o.geometry.deleteAttribute('uv');
  o.geometry = mergeVertices(o.geometry, 1e-4);
});

const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
const out = new URL('../assets/models/samurai.glb', import.meta.url);
await writeFile(out, Buffer.from(glb));

let meshes = 0, tris = 0;
scene.traverse((o) => {
  if (o.isMesh) { meshes++; tris += o.geometry.index.count / 3; }
});
console.log(`samurai.glb: ${(glb.byteLength / 1024).toFixed(0)} КБ, мешей ${meshes}, треугольников ${Math.round(tris)}`);
