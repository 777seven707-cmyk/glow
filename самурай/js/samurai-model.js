/* =========================================================
   Самурай — процедурная 3D-модель
   Собирается из примитивов Three.js. Один и тот же код:
   - в браузере — запасной вариант, если samurai.glb не загрузился;
   - в tools/build-model.mjs — экспорт в assets/models/samurai.glb.

   THREE передаётся параметром, чтобы модуль не зависел
   от того, откуда подключена библиотека (CDN или node_modules).

   Именованные узлы для анимации:
   Samurai › hips › torso › head, armL, armR › …forearm › hand
   katana, sashimono › banner, eyes (материал)
   ========================================================= */

export function buildSamurai(THREE) {
  const TAU = Math.PI * 2;
  const DS = THREE.DoubleSide;

  /* ---------- материалы ---------- */
  const lacquer = (name, color, rough = 0.32) => new THREE.MeshPhysicalMaterial({
    name, color, roughness: rough, metalness: 0.15,
    clearcoat: 1, clearcoatRoughness: 0.12, side: DS
  });
  const M = {
    black:  lacquer('urushi-black', 0x141214, 0.35),
    red:    lacquer('urushi-red', 0x7c1612, 0.38),
    lace:   new THREE.MeshStandardMaterial({ name: 'odoshi-lace', color: 0x9a1812, roughness: 0.85, side: DS }),
    gold:   new THREE.MeshStandardMaterial({ name: 'gold', color: 0xd4a94f, roughness: 0.28, metalness: 1, side: DS }),
    cloth:  new THREE.MeshStandardMaterial({ name: 'hakama-indigo', color: 0x1c2233, roughness: 0.95, side: DS }),
    brocade:new THREE.MeshStandardMaterial({ name: 'kote-brocade', color: 0x2b2231, roughness: 0.8, side: DS }),
    steel:  new THREE.MeshStandardMaterial({ name: 'blade-steel', color: 0xe4e8ee, roughness: 0.1, metalness: 1, side: DS }),
    iron:   new THREE.MeshStandardMaterial({ name: 'iron', color: 0x2a2a2e, roughness: 0.45, metalness: 0.8, side: DS }),
    ivory:  new THREE.MeshStandardMaterial({ name: 'same-ivory', color: 0xe9e2d0, roughness: 0.7, side: DS }),
    tabi:   new THREE.MeshStandardMaterial({ name: 'tabi', color: 0x1a1718, roughness: 0.9, side: DS }),
    straw:  new THREE.MeshStandardMaterial({ name: 'waraji-straw', color: 0xb69a64, roughness: 1, side: DS }),
    void:   new THREE.MeshStandardMaterial({ name: 'face-void', color: 0x050405, roughness: 1, side: DS }),
    hair:   new THREE.MeshStandardMaterial({ name: 'mask-hair', color: 0xe8e2d6, roughness: 0.9, side: DS }),
    banner: new THREE.MeshStandardMaterial({ name: 'sashimono-banner', color: 0xeee6d4, roughness: 0.9, side: DS }),
    eyes:   new THREE.MeshStandardMaterial({ name: 'eyes', color: 0x220000, emissive: 0xff4a1c, emissiveIntensity: 2.2 })
  };

  /* ---------- помощники ---------- */
  const group = (parent, name, pos = [0, 0, 0], rot = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(...pos);
    g.rotation.set(...rot);
    parent.add(g);
    return g;
  };
  const part = (parent, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.set(...scl);
    parent.add(m);
    return m;
  };
  // открытый сегмент конуса: пластина ламели, выгнутая по окружности
  const arc = (rTop, rBot, h, start, len, seg = 24) =>
    new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, true, start, len);
  // кольцо-окантовка по эллипсу
  const ring = (r, tube, sz = 1) => {
    const g = new THREE.TorusGeometry(r, tube, 6, 64);
    g.rotateX(Math.PI / 2);
    g.scale(1, 1, sz);
    return g;
  };

  const root = new THREE.Group();
  root.name = 'Samurai';

  /* =========================================================
     НИЗ: хакама, поножи, сандалии
     ========================================================= */
  const hips = group(root, 'hips', [0, 1.0, 0]);

  // хакама — широкие штаны со складками
  const hakamaGeo = () => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const y = -t * 0.66;
      const r = 0.12 + 0.085 * Math.pow(t, 0.8) - (t > 0.9 ? (t - 0.9) * 0.7 : 0);
      pts.push(new THREE.Vector2(r, y));
    }
    const g = new THREE.LatheGeometry(pts, 48);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(x, z);
      const k = 1 + 0.07 * Math.pow(Math.abs(Math.cos(a * 6)), 3) * Math.min(1, -y * 3);
      p.setX(i, x * k); p.setZ(i, z * k * 0.9);
    }
    g.computeVertexNormals();
    return g;
  };
  [-1, 1].forEach((s) => {
    const leg = group(hips, s < 0 ? 'legR' : 'legL', [0.13 * s, -0.02, 0], [0, 0, 0.07 * s]);
    part(leg, hakamaGeo(), M.cloth);
    // сунэатэ — поножи
    const shin = group(leg, 'shin', [0, -0.62, 0.02]);
    part(shin, new THREE.CylinderGeometry(0.075, 0.062, 0.3, 16, 1, true), M.black, [0, -0.15, 0]);
    for (let k = -1; k <= 1; k++) {
      part(shin, new THREE.BoxGeometry(0.018, 0.28, 0.012), M.iron, [k * 0.035, -0.15, 0.072 - Math.abs(k) * 0.01], [0, k * 0.45, 0]);
    }
    part(shin, ring(0.078, 0.008), M.gold, [0, -0.005, 0]);
    part(shin, ring(0.064, 0.007), M.lace, [0, -0.29, 0]);
    // таби и варадзи
    part(shin, new THREE.BoxGeometry(0.095, 0.06, 0.2), M.tabi, [0, -0.34, 0.045]);
    part(shin, new THREE.BoxGeometry(0.11, 0.02, 0.25), M.straw, [0, -0.375, 0.05]);
  });

  // кусадзури — юбка из пластин
  const panels = 7, gap = 0.06;
  const pw = (TAU - 0.9) / panels;               // спереди — разрез
  for (let i = 0; i < panels; i++) {
    const start = 0.45 + i * pw + gap / 2;
    for (let row = 0; row < 5; row++) {
      const y = -0.03 - row * 0.068;
      const r = 0.3 + row * 0.028;
      part(hips, arc(r, r + 0.022, 0.062, start, pw - gap, 10), M.black, [0, y, 0], [0, 0, 0], [1, 1, 0.82]);
      part(hips, arc(r + 0.004, r + 0.01, 0.008, start, pw - gap, 10), M.lace, [0, y + 0.032, 0], [0, 0, 0], [1, 1, 0.82]);
    }
    part(hips, arc(0.44, 0.445, 0.012, start, pw - gap, 10), M.gold, [0, -0.33, 0], [0, 0, 0], [1, 1, 0.82]);
  }
  // передний фартук — хайдатэ
  for (let row = 0; row < 4; row++) {
    part(hips, arc(0.31 + row * 0.03, 0.33 + row * 0.03, 0.066, -0.42, 0.84, 12), M.black,
      [0, -0.05 - row * 0.072, 0.0], [0, 0, 0], [1, 1, 0.85]);
    part(hips, arc(0.314 + row * 0.03, 0.318 + row * 0.03, 0.008, -0.42, 0.84, 12), M.lace,
      [0, -0.016 - row * 0.072, 0.0], [0, 0, 0], [1, 1, 0.85]);
  }

  // оби
  part(hips, ring(0.285, 0.03, 0.8), M.brocade, [0, 0.01, 0]);

  // сая и вакидзаси за поясом слева
  const saya = group(hips, 'saya', [0.24, 0.0, 0.17]);
  part(saya, new THREE.CylinderGeometry(0.019, 0.016, 0.82, 12), M.black, [0, -0.33, 0]);
  part(saya, new THREE.CylinderGeometry(0.021, 0.021, 0.04, 12), M.gold, [0, 0.07, 0]);
  part(saya, new THREE.CylinderGeometry(0.018, 0.02, 0.03, 12), M.gold, [0, -0.75, 0]);
  const waki = group(hips, 'wakizashi', [0.19, 0.04, 0.21]);
  part(waki, new THREE.CylinderGeometry(0.016, 0.014, 0.48, 12), M.red, [0, -0.2, 0]);
  part(waki, new THREE.CylinderGeometry(0.03, 0.03, 0.006, 20), M.gold, [0, 0.05, 0]);
  part(waki, new THREE.CylinderGeometry(0.014, 0.015, 0.16, 12), M.ivory, [0, 0.13, 0]);
  part(waki, new THREE.SphereGeometry(0.016, 10, 8), M.gold, [0, 0.215, 0]);

  /* =========================================================
     ТОРС: до (кираса), содэ, руки
     ========================================================= */
  const torso = group(hips, 'torso', [0, 0.0, 0]);

  // до — бочкообразная кираса с ламелями
  const doGeo = (() => {
    const pts = [];
    const H = 0.5;
    for (let i = 0; i <= 60; i++) {
      const y = (i / 60) * H;
      const t = y / H;
      let r = 0.27 + 0.075 * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) - Math.pow(Math.max(0, t - 0.78) / 0.22, 2) * 0.12;
      if (t < 0.6) r += 0.012 * ((y / 0.062) % 1);   // ступеньки ламелей
      pts.push(new THREE.Vector2(r, y));
    }
    const g = new THREE.LatheGeometry(pts, 56);
    g.scale(1, 1, 0.78);
    return g;
  })();
  part(torso, doGeo, M.black);
  for (let i = 0; i < 5; i++) {
    const y = 0.058 + i * 0.062;
    const r = 0.27 + 0.075 * Math.sin(Math.min(1, (y / 0.5) * 1.25) * Math.PI * 0.62) + 0.012;
    part(torso, ring(r, 0.006, 0.78), i === 4 ? M.gold : M.lace, [0, y, 0]);
  }
  // мунэ-ита — нагрудная пластина с окантовкой
  part(torso, arc(0.29, 0.31, 0.09, -0.8, 1.6, 20), M.red, [0, 0.43, 0], [0, 0, 0], [1, 1, 0.84]);
  part(torso, arc(0.286, 0.286, 0.012, -0.8, 1.6, 20), M.gold, [0, 0.476, 0], [0, 0, 0], [1, 1, 0.84]);
  // герб-камон на груди
  const mon = group(torso, 'kamon', [0, 0.3, 0.272], [Math.PI / 2 - 0.12, 0, 0]);
  part(mon, new THREE.CylinderGeometry(0.052, 0.052, 0.008, 40), M.gold);
  part(mon, new THREE.CylinderGeometry(0.04, 0.04, 0.01, 40), M.red);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU;
    part(mon, new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16), M.gold, [Math.sin(a) * 0.022, 0, Math.cos(a) * 0.022]);
  }
  // ватагами — наплечные ремни
  [-1, 1].forEach((s) => {
    part(torso, new THREE.BoxGeometry(0.1, 0.03, 0.3), M.black, [0.17 * s, 0.505, -0.01], [0, 0, 0.18 * s]);
    part(torso, new THREE.BoxGeometry(0.1, 0.008, 0.3), M.gold, [0.17 * s, 0.522, -0.01], [0, 0, 0.18 * s]);
  });
  // нодова — горжет
  part(torso, new THREE.CylinderGeometry(0.07, 0.11, 0.12, 20), M.black, [0, 0.54, 0]);
  part(torso, arc(0.12, 0.2, 0.07, -1.2, 2.4, 16), M.black, [0, 0.52, 0.02]);
  part(torso, arc(0.2, 0.2, 0.008, -1.2, 2.4, 16), M.gold, [0, 0.485, 0.02]);

  // руки и содэ
  const buildArm = (s) => {
    const arm = group(torso, s > 0 ? 'armL' : 'armR', [0.34 * s, 0.44, 0]);
    part(arm, new THREE.SphereGeometry(0.075, 16, 12), M.brocade);
    part(arm, new THREE.CylinderGeometry(0.07, 0.062, 0.3, 16), M.brocade, [0, -0.16, 0]);
    // икада — мелкие пластинки на плече
    for (let k = 0; k < 3; k++) {
      part(arm, new THREE.BoxGeometry(0.05, 0.05, 0.012), M.black, [0.065 * s, -0.09 - k * 0.07, 0], [0, s * Math.PI / 2, 0]);
      part(arm, new THREE.BoxGeometry(0.056, 0.004, 0.014), M.gold, [0.066 * s, -0.064 - k * 0.07, 0], [0, s * Math.PI / 2, 0]);
    }
    const fore = group(arm, 'forearm', [0, -0.31, 0]);
    part(fore, new THREE.SphereGeometry(0.062, 14, 10), M.brocade);
    part(fore, new THREE.CylinderGeometry(0.06, 0.048, 0.27, 16), M.brocade, [0, -0.14, 0]);
    // котэ — пластины наруча
    part(fore, arc(0.065, 0.054, 0.22, -1.2, 2.4, 14), M.black, [0, -0.14, 0]);
    part(fore, arc(0.066, 0.066, 0.01, -1.2, 2.4, 14), M.gold, [0, -0.03, 0]);
    part(fore, arc(0.055, 0.055, 0.01, -1.2, 2.4, 14), M.gold, [0, -0.25, 0]);
    const hand = group(fore, 'hand', [0, -0.3, 0]);
    part(hand, new THREE.BoxGeometry(0.075, 0.09, 0.085), M.black, [0, -0.02, 0.01]);
    part(hand, new THREE.BoxGeometry(0.078, 0.02, 0.09), M.gold, [0, 0.025, 0.01]);

    // содэ — наплечники из шести ламелей, висят над плечом
    const sode = group(torso, s > 0 ? 'sodeL' : 'sodeR', [0.39 * s, 0.52, 0.02], [0, -0.45 * s, 0.26 * s]);
    part(sode, new THREE.BoxGeometry(0.03, 0.022, 0.26), M.gold, [0.02 * s, 0.0, 0]);
    for (let k = 0; k < 6; k++) {
      const y = -0.035 - k * 0.055;
      const out = 0.02 * s + k * 0.008 * s;
      part(sode, new THREE.BoxGeometry(0.02, 0.062, 0.27 + k * 0.008), M.black, [out, y, 0], [0, 0, 0.1 * s]);
      part(sode, new THREE.BoxGeometry(0.022, 0.008, 0.27 + k * 0.008), M.lace, [out + 0.001 * s, y + 0.02, 0], [0, 0, 0.1 * s]);
    }
    part(sode, new THREE.BoxGeometry(0.022, 0.01, 0.3), M.gold, [0.068 * s, -0.33, 0]);
    return { arm, fore, hand };
  };
  const L = buildArm(1);
  const R = buildArm(-1);

  // поза: левая рука на рукояти за поясом, правая держит катану
  L.arm.rotation.set(-0.35, 0, 0.22);
  L.fore.rotation.set(-1.25, 0, -0.35);
  R.arm.rotation.set(-0.15, 0, -0.18);
  R.fore.rotation.set(-0.55, 0, 0.1);

  /* ---------- катана в правой руке ---------- */
  const katana = group(R.hand, 'katana', [0, -0.02, 0.012], [Math.PI / 2 + 0.55, 0, 0]);
  // клинок: плоский профиль с изгибом-сори и наклонным остриём
  const blade = (() => {
    const len = 0.86, w0 = 0.032, w1 = 0.024, sori = 0.035;
    const spine = [], edge = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = t * len;
      const bend = sori * t * t;
      const w = w0 + (w1 - w0) * t;
      spine.push(new THREE.Vector2(-w / 2 - bend, y));
      edge.push(new THREE.Vector2(w / 2 - bend, y));
    }
    const shape = new THREE.Shape();
    shape.moveTo(edge[0].x, edge[0].y);
    edge.slice(0, 22).forEach((p) => shape.lineTo(p.x, p.y));
    const tip = spine[24];
    shape.quadraticCurveTo(edge[23].x, edge[23].y + 0.01, tip.x + 0.004, tip.y + 0.035);
    spine.slice().reverse().forEach((p) => shape.lineTo(p.x, p.y));
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0035, bevelSegments: 1, curveSegments: 8
    });
    g.translate(0, 0, -0.002);
    return g;
  })();
  part(katana, blade, M.steel, [0, 0.03, 0]);
  part(katana, new THREE.BoxGeometry(0.038, 0.032, 0.014), M.gold, [0, 0.02, 0]);           // хабаки
  part(katana, new THREE.CylinderGeometry(0.048, 0.048, 0.008, 32), M.iron, [0, 0.0, 0], [0, 0, 0], [1, 1, 0.8]); // цуба
  part(katana, ring(0.048, 0.003, 0.8), M.gold, [0, 0.0, 0]);
  part(katana, new THREE.CylinderGeometry(0.016, 0.015, 0.25, 12), M.ivory, [0, -0.13, 0], [0, 0, 0], [1, 1, 0.75]);
  for (let k = 0; k < 9; k++) {
    part(katana, new THREE.TorusGeometry(0.016, 0.004, 5, 14), M.black, [0, -0.02 - k * 0.026, 0], [Math.PI / 2, 0, k % 2 ? 0.5 : -0.5], [1, 0.78, 1]);
  }
  part(katana, new THREE.SphereGeometry(0.018, 12, 8, 0, TAU, 0, Math.PI / 2), M.gold, [0, -0.255, 0], [Math.PI, 0, 0], [1, 0.7, 0.78]);

  /* =========================================================
     ГОЛОВА: мэмпо, кабуто, кувагата
     ========================================================= */
  const head = group(torso, 'head', [0, 0.6, 0.015]);
  head.scale.setScalar(1.12);
  // лицо в тени и глаза
  part(head, new THREE.SphereGeometry(0.1, 24, 16), M.void, [0, 0.1, 0], [0, 0, 0], [0.95, 1.1, 1]);
  [-1, 1].forEach((s) => {
    part(head, new THREE.SphereGeometry(0.0125, 12, 8), M.eyes, [0.036 * s, 0.13, 0.086], [0, 0, 0.3 * s], [1.8, 0.65, 0.6]);
  });
  // мэмпо — полумаска с носом, усами и прорезью рта
  part(head, new THREE.SphereGeometry(0.106, 28, 16, Math.PI / 2 - 1.4, 2.8, 1.62, 1.0), M.red, [0, 0.105, 0.012], [0, 0, 0], [1, 1.05, 1.08]);
  part(head, new THREE.ConeGeometry(0.02, 0.05, 4), M.red, [0, 0.092, 0.112], [-0.3, Math.PI / 4, 0], [1, 1, 0.7]);
  part(head, new THREE.BoxGeometry(0.05, 0.006, 0.01), M.void, [0, 0.055, 0.104]);
  [-1, 1].forEach((s) => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.006 * s, 0.07, 0.113),
      new THREE.Vector3(0.035 * s, 0.072, 0.106),
      new THREE.Vector3(0.062 * s, 0.062, 0.088),
      new THREE.Vector3(0.078 * s, 0.04, 0.07)
    ]);
    part(head, new THREE.TubeGeometry(c, 16, 0.007, 6), M.hair);
  });
  // ёдарэ-какэ — горловая защита под маской
  for (let k = 0; k < 3; k++) {
    part(head, arc(0.085 + k * 0.016, 0.1 + k * 0.016, 0.028, -1.3, 2.6, 16), M.black, [0, 0.0 - k * 0.026, 0.015]);
    part(head, arc(0.086 + k * 0.016, 0.089 + k * 0.016, 0.005, -1.3, 2.6, 16), M.lace, [0, 0.013 - k * 0.026, 0.015]);
  }
  part(head, arc(0.132, 0.132, 0.005, -1.3, 2.6, 16), M.gold, [0, -0.066, 0.015]);

  // кабуто
  const kabuto = group(head, 'kabuto', [0, 0.172, -0.005]);
  part(kabuto, new THREE.SphereGeometry(0.155, 40, 16, 0, TAU, 0, Math.PI / 2), M.black, [0, 0, 0], [0, 0, 0], [1, 0.82, 1.05]);
  for (let k = 0; k < 16; k++) {
    const g = new THREE.TorusGeometry(0.156, 0.0028, 4, 24, Math.PI);
    part(kabuto, g, M.iron, [0, 0, 0], [0, (k / 16) * Math.PI, 0], [1, 0.82, 1.05]);
  }
  part(kabuto, ring(0.03, 0.007), M.gold, [0, 0.128, 0]);                 // тэхэн
  part(kabuto, ring(0.158, 0.009, 1.05), M.gold, [0, 0.004, 0]);          // косимаки
  // мабидзаси — козырёк
  part(kabuto, arc(0.158, 0.19, 0.028, -1.05, 2.1, 20), M.black, [0, -0.006, 0.012], [0.12, 0, 0], [1, 1, 1.02]);
  part(kabuto, arc(0.191, 0.191, 0.005, -1.05, 2.1, 20), M.gold, [0, -0.02, 0.016], [0.12, 0, 0]);
  // сикоро — ступенчатый назатыльник, раскрыт спереди
  for (let k = 0; k < 4; k++) {
    const r0 = 0.162 + k * 0.034, r1 = r0 + 0.045;
    const y = -0.03 - k * 0.042;
    part(kabuto, arc(r0, r1, 0.045, 1.0 - k * 0.04, TAU - 2.0 + k * 0.08, 36), M.black, [0, y, -0.01], [0, 0, 0], [1, 1, 0.98]);
    part(kabuto, arc(r0 + 0.002, r0 + 0.006, 0.007, 1.0 - k * 0.04, TAU - 2.0 + k * 0.08, 36), M.lace, [0, y + 0.02, -0.01]);
  }
  part(kabuto, arc(0.309, 0.309, 0.008, 0.88, TAU - 1.76, 36), M.gold, [0, -0.178, -0.01], [0, 0, 0], [1, 1, 0.98]);
  // фукигаэси — отвороты по бокам
  [-1, 1].forEach((s) => {
    const f = group(kabuto, 'fukigaeshi', [0.165 * s, -0.045, 0.1], [0, 0.95 * s, 0.1 * s]);
    part(f, new THREE.BoxGeometry(0.09, 0.075, 0.012), M.black);
    part(f, new THREE.BoxGeometry(0.094, 0.079, 0.006), M.gold, [0, 0, -0.004]);
    part(f, new THREE.CylinderGeometry(0.014, 0.014, 0.014, 16), M.gold, [0, 0, 0.006], [Math.PI / 2, 0, 0]);
  });
  // кувагата — золотые рога-гербы и маэдатэ
  const crest = group(kabuto, 'kuwagata', [0, 0.02, 0.15], [-0.22, 0, 0]);
  const horn = (s) => {
    const outer = [[0.02, 0], [0.07, 0.05], [0.13, 0.12], [0.18, 0.22], [0.21, 0.32], [0.22, 0.4]];
    const inner = [[0.2, 0.36], [0.185, 0.27], [0.145, 0.18], [0.095, 0.11], [0.045, 0.055], [0.006, 0.03]];
    const sh = new THREE.Shape();
    sh.moveTo(outer[0][0] * s, outer[0][1]);
    outer.slice(1).forEach(([x, y]) => sh.lineTo(x * s, y));
    inner.forEach(([x, y]) => sh.lineTo(x * s, y));
    sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 });
  };
  part(crest, horn(1), M.gold);
  part(crest, horn(-1), M.gold);
  part(crest, new THREE.BoxGeometry(0.07, 0.035, 0.012), M.gold, [0, 0.01, 0]);
  part(crest, new THREE.CylinderGeometry(0.046, 0.046, 0.01, 40), M.gold, [0, 0.085, 0.006], [Math.PI / 2, 0, 0]);
  part(crest, new THREE.CylinderGeometry(0.036, 0.036, 0.012, 40), M.lace, [0, 0.085, 0.008], [Math.PI / 2, 0, 0]);

  /* =========================================================
     САСИМОНО — флаг за спиной
     ========================================================= */
  const flag = group(torso, 'sashimono', [0, 0.1, -0.24], [-0.05, 0, 0]);
  part(flag, new THREE.CylinderGeometry(0.011, 0.011, 1.5, 8), M.black, [0.0, 0.55, 0]);
  part(flag, new THREE.CylinderGeometry(0.008, 0.008, 0.36, 8), M.black, [0.18, 1.28, 0], [0, 0, Math.PI / 2]);
  part(flag, new THREE.SphereGeometry(0.018, 10, 8), M.gold, [0, 1.31, 0]);
  const bannerGeo = new THREE.PlaneGeometry(0.34, 0.9, 12, 30);
  bannerGeo.translate(0.18, 0.82, 0);
  const banner = part(flag, bannerGeo, M.banner);
  banner.name = 'banner';

  /* ---------- направляем клинок и ножны в мировых координатах ---------- */
  root.updateMatrixWorld(true);
  const aim = (obj, axis, x, y, z) => {
    const pq = new THREE.Quaternion();
    obj.parent.getWorldQuaternion(pq);
    const q = new THREE.Quaternion().setFromUnitVectors(axis, new THREE.Vector3(x, y, z).normalize());
    obj.quaternion.copy(pq.invert().multiply(q));
  };
  const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
  aim(katana, UP, -0.32, -0.78, 0.5);          // остриё вниз и вперёд
  aim(saya, DOWN, 0.35, -0.38, -0.86);         // ножны уходят назад
  aim(waki, DOWN, 0.42, -0.3, -0.86);

  /* ---------- слияние статичных деталей по материалам ---------- */
  mergeChildren(THREE, root);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return root;
}

/* Внутри каждой группы склеивает меши одного материала в один:
   ~250 деталей превращаются в несколько десятков draw call'ов.
   Меш 'banner' не трогаем — его вершины анимируются. */
function mergeChildren(THREE, node) {
  node.children.filter((c) => !c.isMesh).forEach((c) => mergeChildren(THREE, c));
  const meshes = node.children.filter((c) => c.isMesh && c.name !== 'banner');
  const byMat = new Map();
  meshes.forEach((m) => {
    if (!byMat.has(m.material)) byMat.set(m.material, []);
    byMat.get(m.material).push(m);
  });
  byMat.forEach((list, mat) => {
    if (list.length < 2) return;
    const pos = [], nor = [], uv = [];
    list.forEach((m) => {
      m.updateMatrix();
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(m.matrix);
      pos.push(g.attributes.position.array);
      nor.push(g.attributes.normal.array);
      uv.push(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2));
      node.remove(m);
    });
    const cat = (arrs) => {
      const out = new Float32Array(arrs.reduce((n, a) => n + a.length, 0));
      let o = 0;
      arrs.forEach((a) => { out.set(a, o); o += a.length; });
      return out;
    };
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(cat(pos), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(cat(nor), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(cat(uv), 2));
    const merged = new THREE.Mesh(geo, mat);
    merged.name = node.name + '_' + mat.name;
    node.add(merged);
  });
}
