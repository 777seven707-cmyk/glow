/* =========================================================
   Самурай — 3D-сцена
   Загружает assets/models/samurai.glb (если не вышло —
   собирает ту же модель из примитивов), ставит свет,
   солнце и сакуру и оживляет фигуру:
   - голова и глаза следят за курсором, торс доворачивается;
   - тёплый фонарь-свет ходит за курсором по лаку доспеха;
   - дыхание, флаг сасимоно на ветру, лепестки;
   - по клику — удар мечом.
   Камерой управляет main.js через объект rig: он задаёт цель,
   сцена плавно догоняет её каждый кадр.
   ========================================================= */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// GLB — основной файл; .gltf.json — та же модель текстом для хостингов,
// которые не отдают .glb (например, артефакты claude.ai)
const MODEL_URLS = ['../assets/models/samurai.glb', '../assets/models/samurai.gltf.json']
  .map((p) => new URL(p, import.meta.url).href);

export async function createScene(canvas, { onProgress = () => {} } = {}) {
  /* ---------- рендерер ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // программный рендерер (SwiftShader и т.п.) — снижаем разрешение сразу
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  const software = /swiftshader|llvmpipe|software/i.test(gpu) && !new URLSearchParams(location.search).has('hq');
  let pixelRatio = software ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.75);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);

  // отражения для лака и золота; на программном рендерере PMREM слишком дорог
  if (!software) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }

  /* ---------- свет ---------- */
  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x2a1a18, 0.7));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.3);
  key.position.set(-2.5, 4, 3.5);
  const rimRed = new THREE.DirectionalLight(0xff4a2a, 3.4);
  rimRed.position.set(2.6, 2.4, -3);
  const rimBlue = new THREE.DirectionalLight(0x9fb4ff, 1.1);
  rimBlue.position.set(-3, 2, -2.5);
  const lantern = new THREE.PointLight(0xffc98a, 5, 5, 1.6);   // свет за курсором
  lantern.position.set(0, 1.4, 1.6);
  scene.add(key, rimRed, rimBlue, lantern);

  /* ---------- красное солнце за спиной ---------- */
  const sunGroup = new THREE.Group();
  sunGroup.position.set(0, 1.6, -2.6);
  const SUN_NOON = new THREE.Color(0xc73a2b), SUN_DAWN = new THREE.Color(0xe0612f);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xc73a2b, transparent: true, toneMapped: false, depthWrite: false });
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.25, 96), sunMat);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xc73a2b, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.42, 1.435, 128), haloMat);
  sunGroup.add(sun, halo);
  scene.add(sunGroup);

  /* ---------- тень на земле ---------- */
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(18,16,17,.55)');
    g.addColorStop(0.5, 'rgba(18,16,17,.22)');
    g.addColorStop(1, 'rgba(18,16,17,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.5),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.003;
  scene.add(ground);

  /* ---------- модель ---------- */
  let model;
  for (const url of MODEL_URLS) {
    try {
      const gltf = await new GLTFLoader().loadAsync(url, (e) => {
        if (e.total) onProgress(e.loaded / e.total);
      });
      model = gltf.scene.getObjectByName('Samurai') || gltf.scene;
      break;
    } catch (err) {
      console.warn('Модель не загрузилась:', url, err);
    }
  }
  if (!model) {
    // последний запасной вариант — упрощённая фигура из примитивов
    const { buildSamurai } = await import('./samurai-model.js');
    model = buildSamurai(THREE);
  }
  onProgress(1);
  scene.add(model);

  const find = (root, prefix) => {
    let hit = null;
    root.traverse((o) => { if (!hit && o.name && o.name.startsWith(prefix)) hit = o; });
    return hit;
  };
  const parts = {
    hips: find(model, 'hips'),
    torso: find(model, 'torso'),
    head: find(model, 'head'),
    kabuto: find(model, 'kabuto'),
    armR: find(model, 'armR'),
    armL: find(model, 'armL'),
    sodeL: find(model, 'sodeL'),
    katana: find(model, 'katana'),
    banner: find(model, 'banner'),
    kamon: find(model, 'kamon')
  };
  parts.foreR = find(parts.armR, 'forearm');

  let eyesMat = null, steelMat = null;
  model.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    m.envMapIntensity = m.name === 'gold' || m.name === 'blade-steel' ? 1.0 : 0.6;
    if (m.name === 'eyes') eyesMat = m;
    if (m.name === 'blade-steel') steelMat = m;
  });

  // флаг: ткань с иероглифами, рисуется на холсте после загрузки шрифта
  const bannerBase = parts.banner ? parts.banner.geometry.attributes.position.array.slice() : null;
  if (parts.banner) {
    const paint = () => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 680;
      const x = c.getContext('2d');
      x.fillStyle = '#efe7d6'; x.fillRect(0, 0, 256, 680);
      x.fillStyle = '#c73a2b';
      x.beginPath(); x.arc(128, 150, 78, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#141213';
      x.font = '800 118px "Shippori Mincho B1", serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      ['武', '士', '道'].forEach((ch, i) => x.fillText(ch, 128, 330 + i * 120));
      x.strokeStyle = 'rgba(20,18,19,.25)'; x.lineWidth = 6; x.strokeRect(10, 10, 236, 660);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      parts.banner.material = parts.banner.material.clone();
      parts.banner.material.map = tex;
      parts.banner.material.color.set(0xffffff);
      parts.banner.material.needsUpdate = true;
    };
    (document.fonts ? document.fonts.load('800 118px "Shippori Mincho B1"', '武士道').catch(() => {}) : Promise.resolve()).then(paint);
  }

  /* ---------- свечение глаз ---------- */
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,140,80,1)');
    g.addColorStop(0.3, 'rgba(255,70,30,.55)');
    g.addColorStop(1, 'rgba(255,40,10,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 });
  // ореол ставим туда, где в модели глаза (меш с материалом eyes)
  if (parts.head) {
    let eyes = null;
    parts.head.traverse((o) => { if (!eyes && o.isMesh && o.material.name === 'eyes') eyes = o; });
    const box = new THREE.Box3();
    if (eyes) {
      eyes.geometry.computeBoundingBox();
      box.copy(eyes.geometry.boundingBox).applyMatrix4(eyes.matrix);
    } else {
      box.set(new THREE.Vector3(-0.05, 0.12, 0.08), new THREE.Vector3(0.05, 0.14, 0.1));
    }
    const c = box.getCenter(new THREE.Vector3());
    const half = (box.max.x - box.min.x) / 2;
    [-1, 1].forEach((s) => {
      const sp = new THREE.Sprite(glowMat);
      sp.scale.setScalar(0.05);
      sp.position.set(c.x + s * half * 0.7, c.y, box.max.z + 0.01);
      parts.head.add(sp);
    });
  }

  /* ---------- сакура ---------- */
  const PETALS = software ? 60 : 140;
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, -0.03);
  petalShape.bezierCurveTo(-0.028, -0.012, -0.024, 0.022, -0.008, 0.026);
  petalShape.lineTo(0, 0.019);
  petalShape.lineTo(0.008, 0.026);
  petalShape.bezierCurveTo(0.024, 0.022, 0.028, -0.012, 0, -0.03);
  const petals = new THREE.InstancedMesh(
    new THREE.ShapeGeometry(petalShape, 6),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.95, toneMapped: false }),
    PETALS
  );
  const petalData = [];
  const pinks = [0xf6d6d9, 0xefb7bf, 0xf9e6e4, 0xe89aa6, 0xc73a2b];
  const tmpColor = new THREE.Color();
  for (let i = 0; i < PETALS; i++) {
    petalData.push({
      p: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 3.6, (Math.random() - 0.5) * 4 - 0.3),
      v: 0.12 + Math.random() * 0.22,
      ph: Math.random() * Math.PI * 2,
      spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(2.2),
      s: 0.7 + Math.random() * 0.9
    });
    tmpColor.set(pinks[i % 13 === 0 ? 4 : i % 4]);
    petals.setColorAt(i, tmpColor);
  }
  scene.add(petals);
  const dummy = new THREE.Object3D();

  /* ---------- rig: цели, которые задаёт main.js ---------- */
  const rig = {
    cam: new THREE.Vector3(0, 1.2, 6.4),
    look: new THREE.Vector3(0, 1.12, 0),
    shiftX: 0, shiftY: 0,      // сдвиг картинки в долях экрана (для композиции)
    rot: 0,                    // поворот модели
    sun: 1, petals: 1, visible: 1,
    sunY: 1.6, warm: 1,        // высота солнца и насколько оно рассветно-оранжевое
    track: 1                   // насколько сильно фигура следит за курсором
  };
  const cur = {
    cam: rig.cam.clone(), look: rig.look.clone(),
    shiftX: 0, shiftY: 0, rot: 0, sun: 1, petals: 1, visible: 1, track: 1, sunY: 1.6, warm: 1
  };

  // кадры для раздела «Доспех» — считаются по реальному положению деталей
  const focus = (obj, fallback) => {
    if (!obj) return fallback.clone();
    return new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  };
  model.updateMatrixWorld(true);
  const shots = {};
  const makeShots = () => {
    const kab = focus(parts.kabuto, new THREE.Vector3(0, 1.95, 0));
    const face = parts.head ? parts.head.localToWorld(new THREE.Vector3(0, 0.1, 0.08)) : new THREE.Vector3(0, 1.75, 0.1);
    const chest = focus(parts.kamon, new THREE.Vector3(0, 1.3, 0.2));
    const sode = focus(parts.sodeL, new THREE.Vector3(0.45, 1.3, 0));
    const blade = focus(parts.katana, new THREE.Vector3(-0.4, 0.8, 0.3));
    Object.assign(shots, {
      hero:     { cam: [0, 1.2, 6.4], look: [0, 1.12, 0], rot: 0 },
      manifest: { cam: [0.3, 1.45, 5.6], look: [0, 1.3, 0], rot: -0.55 },
      kabuto:   { cam: [kab.x + 0.5, kab.y + 0.1, kab.z + 2.4], look: [kab.x, kab.y + 0.02, kab.z], rot: 0 },
      menpo:    { cam: [face.x + 0.22, face.y - 0.04, face.z + 1.45], look: face.toArray(), rot: 0 },
      do:       { cam: [chest.x - 0.95, chest.y + 0.2, chest.z + 2.5], look: [chest.x, chest.y - 0.05, chest.z - 0.2], rot: 0 },
      sode:     { cam: [sode.x + 1.9, sode.y + 0.25, sode.z + 1.8], look: [sode.x, sode.y - 0.08, sode.z], rot: 0 },
      katana:   { cam: [blade.x - 1.5, blade.y + 0.45, blade.z + 2.3], look: blade.toArray(), rot: 0 }
    });
  };
  makeShots();

  const setShot = (name, extra = {}) => {
    const s = shots[name];
    if (!s) return;
    rig.cam.fromArray(s.cam);
    rig.look.fromArray(s.look);
    rig.rot = s.rot;
    Object.assign(rig, extra);
  };

  /* ---------- курсор ---------- */
  const pointer = new THREE.Vector2(0, 0);       // NDC
  const pointerSmooth = new THREE.Vector2(0, 0);
  let lastMove = -10, wind = 0;
  const onMove = (x, y) => {
    const nx = (x / window.innerWidth) * 2 - 1;
    const ny = -(y / window.innerHeight) * 2 + 1;
    wind += (nx - pointer.x) * 6;
    pointer.set(nx, ny);
    lastMove = clock.getElapsed();
  };
  window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });

  /* ---------- удар мечом ---------- */
  let slashing = false;
  const slash = (gsap) => {
    if (slashing || !parts.armR || !gsap) return;
    slashing = true;
    const a = parts.armR.rotation, f = parts.foreR ? parts.foreR.rotation : new THREE.Euler();
    const a0 = { x: a.x, y: a.y, z: a.z }, f0 = { x: f.x, y: f.y, z: f.z };
    const glint = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { slashing = false; } });
    // замах и удар — смещения от позы покоя, чтобы работать с любой моделью
    tl.to(a, { x: a0.x - 2.45, z: a0.z - 0.37, duration: 0.32, ease: 'power2.out' })
      .to(f, { x: f0.x - 0.4, duration: 0.32, ease: 'power2.out' }, 0)
      .to(a, { x: a0.x + 0.5, z: a0.z + 0.28, duration: 0.16, ease: 'power4.in' })
      .to(f, { x: f0.x + 0.45, duration: 0.16, ease: 'power4.in' }, '<')
      .to(glint, { v: 1, duration: 0.08, yoyo: true, repeat: 1 }, '<0.08')
      .add(() => { wind += 9; shake = 0.06; }, '<0.12')
      .to(a, { ...a0, duration: 0.9, ease: 'elastic.out(1, 0.6)' }, '+=0.12')
      .to(f, { ...f0, duration: 0.9, ease: 'elastic.out(1, 0.6)' }, '<');
    tl.eventCallback('onUpdate', () => {
      if (steelMat) { steelMat.emissive.setRGB(glint.v, glint.v * 0.85, glint.v * 0.7); }
    });
    return tl;
  };
  let shake = 0;

  /* ---------- размер ---------- */
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 42 : 30;   // на узком экране — шире угол, фигура целиком
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  /* ---------- цикл ---------- */
  const clock = new THREE.Timer();
  clock.connect(document);
  const headNDC = new THREE.Vector3();
  const headWorld = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let running = true, slowFrames = 0;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!running) return;
    clock.update(now);
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.getElapsed();

    // плавно догоняем цели rig
    cur.cam.lerp(rig.cam, 1 - Math.exp(-2.6 * dt));
    cur.look.lerp(rig.look, 1 - Math.exp(-2.6 * dt));
    ['shiftX', 'shiftY', 'rot', 'sun', 'petals', 'track'].forEach((k) => { cur[k] = damp(cur[k], rig[k], 3, dt); });
    cur.sunY = damp(cur.sunY, rig.sunY, 0.9, dt);   // солнце поднимается медленно
    cur.warm = damp(cur.warm, rig.warm, 0.9, dt);
    cur.visible = damp(cur.visible, rig.visible, 5, dt);
    canvas.style.opacity = cur.visible.toFixed(3);
    if (cur.visible < 0.01 && rig.visible === 0) return;   // сцена скрыта — не рисуем

    // бездействие: взгляд медленно блуждает
    const idle = t - lastMove > 4;
    const target = idle
      ? tmp.set(Math.sin(t * 0.4) * 0.5, Math.sin(t * 0.27) * 0.25 + 0.15, 0)
      : tmp.set(pointer.x, pointer.y, 0);
    pointerSmooth.x = damp(pointerSmooth.x, target.x, idle ? 1.2 : 6, dt);
    pointerSmooth.y = damp(pointerSmooth.y, target.y, idle ? 1.2 : 6, dt);

    // камера с лёгким параллаксом от курсора и встряской после удара
    shake = Math.max(0, shake - dt * 0.25);
    camera.position.copy(cur.cam);
    camera.position.x += pointerSmooth.x * 0.18 * cur.track + (Math.random() - 0.5) * shake;
    camera.position.y += pointerSmooth.y * 0.08 * cur.track + (Math.random() - 0.5) * shake;
    camera.lookAt(cur.look);
    const w = window.innerWidth, h = window.innerHeight;
    camera.setViewOffset(w, h, -cur.shiftX * w, -cur.shiftY * h, w, h);

    // модель: поворот, дыхание
    model.rotation.y = cur.rot + Math.sin(t * 0.35) * 0.03;
    if (parts.torso) {
      parts.torso.scale.y = 1 + Math.sin(t * 1.6) * 0.006;
      parts.torso.position.y = Math.sin(t * 1.6) * 0.004;
    }

    // голова и торс смотрят на курсор (считаем от экранного положения головы)
    if (parts.head) {
      parts.head.getWorldPosition(headWorld);
      headNDC.copy(headWorld).project(camera);
      const dx = (pointerSmooth.x - headNDC.x) * camera.aspect;
      const dy = pointerSmooth.y - headNDC.y;
      const yaw = THREE.MathUtils.clamp(Math.atan(dx * 0.9), -0.75, 0.75) * cur.track;
      const pitch = THREE.MathUtils.clamp(-Math.atan(dy * 0.8), -0.35, 0.45) * cur.track;
      parts.head.rotation.y = damp(parts.head.rotation.y, yaw - cur.rot * 0.3, 7, dt);
      parts.head.rotation.x = damp(parts.head.rotation.x, pitch, 7, dt);
      if (parts.torso) parts.torso.rotation.y = damp(parts.torso.rotation.y, yaw * 0.28, 3, dt);
      // глаза вспыхивают, когда курсор рядом с лицом
      const near = 1 - Math.min(1, Math.hypot(dx, dy) * 1.6);
      if (eyesMat) eyesMat.emissiveIntensity = 1.6 + near * 3 + Math.sin(t * 3) * 0.2;
      glowMat.opacity = 0.45 + near * 0.55;
    }

    // фонарь за курсором
    tmp.set(pointerSmooth.x, pointerSmooth.y, 0.5).unproject(camera).sub(camera.position).normalize();
    lantern.position.copy(camera.position).addScaledVector(tmp, cur.cam.distanceTo(cur.look) * 0.72);

    // солнце и тень
    sunMat.opacity = cur.sun;
    haloMat.opacity = cur.sun * 0.35;
    sunGroup.scale.setScalar(0.6 + cur.sun * 0.4);
    sunGroup.position.y = cur.sunY;
    sunMat.color.copy(SUN_NOON).lerp(SUN_DAWN, cur.warm);
    haloMat.color.copy(sunMat.color);
    sunGroup.rotation.z = t * 0.02;
    sunGroup.visible = cur.sun > 0.01;

    // флаг на ветру
    wind *= Math.exp(-1.5 * dt);
    if (parts.banner && bannerBase) {
      const pos = parts.banner.geometry.attributes.position;
      const amp = 0.03 + Math.min(0.06, Math.abs(wind) * 0.01);
      for (let i = 0; i < pos.count; i++) {
        const bx = bannerBase[i * 3], by = bannerBase[i * 3 + 1];
        const k = Math.max(0, bx - 0.01) / 0.34;
        pos.setZ(i, bannerBase[i * 3 + 2] + Math.sin(bx * 14 - t * 3.2 + by * 3) * amp * k);
      }
      pos.needsUpdate = true;
      parts.banner.geometry.computeVertexNormals();
    }

    // лепестки
    petals.visible = cur.petals > 0.02;
    if (petals.visible) {
      petals.material.opacity = cur.petals * 0.95;
      for (let i = 0; i < PETALS; i++) {
        const d = petalData[i];
        d.p.y -= d.v * dt;
        d.p.x += (Math.sin(t * 0.8 + d.ph) * 0.12 + 0.08 + wind * 0.06) * dt;
        if (d.p.y < -0.05 || d.p.x > 3.2 || d.p.x < -3.2) {
          d.p.set((Math.random() - 0.5) * 6 - 0.6, 3.4 + Math.random() * 0.4, (Math.random() - 0.5) * 4 - 0.3);
        }
        dummy.position.copy(d.p);
        dummy.rotation.set(t * d.spin.x + d.ph, t * d.spin.y, t * d.spin.z);
        dummy.scale.setScalar(d.s);
        dummy.updateMatrix();
        petals.setMatrixAt(i, dummy.matrix);
      }
      petals.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);

    // адаптивное качество: если кадры долгие — снижаем разрешение
    if (dt > 0.034) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && pixelRatio > 0.6) {
      pixelRatio = Math.max(0.6, pixelRatio - 0.25);
      slowFrames = 0;
      resize();
    }
  };
  requestAnimationFrame(frame);

  return {
    rig, shots, setShot, parts, camera, renderer,
    slash,
    intro(gsap) {
      // въезд камеры после вступления
      cur.cam.set(0, 0.6, 10.5);
      cur.look.set(0, 1.4, 0);
      cur.sun = 0;
      rig.sun = 1;
      cur.sunY = 0.1;       // восход: солнце поднимается из-за гор
      cur.warm = 1;
      if (gsap) gsap.fromTo(model.position, { y: -0.25 }, { y: 0, duration: 2.2, ease: 'expo.out' });
    }
  };
}
