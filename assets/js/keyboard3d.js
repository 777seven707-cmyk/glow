/* ============================================================
   Varmilo Sakura VA87M — трёхмерная модель на three.js
   Геометрия строится из раскладки, материалы и свет — физические,
   вращение мышкой, пальцем и стрелками.
   ============================================================ */
(function () {
  "use strict";

  var host = document.getElementById("scene3d");
  if (!host || !window.THREE) return;
  var THREE = window.THREE;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- размеры в миллиметрах ---------- */
  var PITCH = 19.05;        // шаг клавиш
  var CAP = 18;             // ширина колпачка 1u
  var CAP_H = 11;           // высота колпачка
  var CASE_W = 356, CASE_D = 134, CASE_H = 33;
  var PLATE_Y = CASE_H - 9; // на какой высоте стоят колпачки

  /* ---------- раскладка VA87M (ANSI, 87 клавиш) ---------- */
  var W = "white", P = "pink", A = "accent", ART = "art";
  var rows = [
    { y: 0, keys: [["Esc",1,A],[null,1],["F1",1,P],["F2",1,W],["F3",1,W],["F4",1,W],[null,.5],
                   ["F5",1,A],["F6",1,A],["F7",1,A],["F8",1,W],[null,.5],
                   ["F9",1,W],["F10",1,W],["F11",1,W],["F12",1,W]] },
    { y: 1.5, keys: [["~",1,W],["1",1,W],["2",1,W],["3",1,W],["4",1,W],["5",1,W],["6",1,W],["7",1,W],
                     ["8",1,W],["9",1,W],["0",1,W],["-",1,W],["=",1,W],["Back",2,P]] },
    { y: 2.5, keys: [["Tab",1.5,P],["Q",1,W],["W",1,W],["E",1,W],["R",1,W],["T",1,W],["Y",1,W],["U",1,W],
                     ["I",1,W],["O",1,W],["P",1,W],["[",1,W],["]",1,W],["\\",1.5,P]] },
    { y: 3.5, keys: [["Caps",1.75,P],["A",1,W],["S",1,W],["D",1,W],["F",1,W],["G",1,W],["H",1,W],["J",1,W],
                     ["K",1,W],["L",1,W],[";",1,W],["'",1,W],["Enter",2.25,P]] },
    { y: 4.5, keys: [["Shift",2.25,P],["Z",1,W],["X",1,W],["C",1,W],["V",1,W],["B",1,W],["N",1,W],["M",1,W],
                     [",",1,W],[".",1,W],["/",1,W],["Shift",2.75,P]] },
    { y: 5.5, keys: [["Ctrl",1.25,P],["❀",1.25,A],["Alt",1.25,W],["",6.25,ART],["Alt",1.25,W],
                     ["❀",1.25,A],["Fn",1.25,W],["Ctrl",1.25,P]] }
  ];
  var navRows = [
    { y: 0,   keys: [["Prt",1,W],["Scr",1,W],["Pau",1,W]] },
    { y: 1.5, keys: [["Ins",1,P],["Home",1,P],["PgUp",1,P]] },
    { y: 2.5, keys: [["Del",1,P],["End",1,P],["PgDn",1,P]] },
    { y: 4.5, keys: [[null,1],["↑",1,A],[null,1]] },
    { y: 5.5, keys: [["←",1,A],["↓",1,A],["→",1,A]] }
  ];

  /* ---------- сцена ---------- */
  var scene = new THREE.Scene();
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0xf3c8d8, 1800, 3600);

  var camera = new THREE.PerspectiveCamera(34, 1, 1, 4000);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  host.appendChild(renderer.domElement);

  /* ---------- свет ---------- */
  scene.add(new THREE.HemisphereLight(0xffeaf1, 0xe79db1, 0.38));

  var key = new THREE.DirectionalLight(0xfff6f8, 1.25);
  key.position.set(220, 420, 260);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0009;
  var cam = key.shadow.camera;
  cam.left = -320; cam.right = 320; cam.top = 280; cam.bottom = -280; cam.near = 50; cam.far = 1200;
  scene.add(key);

  var fill = new THREE.DirectionalLight(0xffd8e4, 0.5);
  fill.position.set(-300, 200, -220);
  scene.add(fill);

  var rim = new THREE.DirectionalLight(0xffffff, 0.45);
  rim.position.set(-80, 120, -420);
  scene.add(rim);

  /* ---------- пол ---------- */
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({ color: 0xe7a3b8, roughness: 0.95, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.4;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- материалы ---------- */
  var matCase = new THREE.MeshPhysicalMaterial({
    color: 0xe07f9b, roughness: 0.38, metalness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.3
  });
  var matPlate = new THREE.MeshStandardMaterial({ color: 0xb75f7c, roughness: 0.45, metalness: 0.3 });
  var matBottom = new THREE.MeshStandardMaterial({ color: 0xc2778e, roughness: 0.75 });
  var capMaterials = {
    white:  new THREE.MeshStandardMaterial({ color: 0xf7f1f2, roughness: 0.8 }),
    pink:   new THREE.MeshStandardMaterial({ color: 0xef92aa, roughness: 0.78 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xd63f66, roughness: 0.76 }),
    art:    new THREE.MeshStandardMaterial({ color: 0xfaf5f6, roughness: 0.78 })
  };

  var board = new THREE.Group();
  scene.add(board);

  /* ---------- корпус ---------- */
  function roundedShape(w, d, r) {
    var s = new THREE.Shape();
    var x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);      s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);      s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);          s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function extruded(shape, depth, bevel) {
    var g = new THREE.ExtrudeGeometry(shape, {
      depth: depth - bevel * 2, bevelEnabled: true,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 12
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bevel, 0);
    return g;
  }

  var caseMesh = new THREE.Mesh(extruded(roundedShape(CASE_W, CASE_D, 7), CASE_H, 1.4), matCase);
  caseMesh.castShadow = true; caseMesh.receiveShadow = true;
  board.add(caseMesh);

  var plate = new THREE.Mesh(extruded(roundedShape(CASE_W - 14, CASE_D - 14, 5), 2, 0.6), matPlate);
  plate.position.y = PLATE_Y - 2;
  plate.receiveShadow = true;
  board.add(plate);

  var feet = new THREE.Mesh(new THREE.BoxGeometry(CASE_W - 30, 3, 8), matBottom);
  feet.position.set(0, 1.5, -CASE_D / 2 + 14);
  board.add(feet);

  /* ---------- колпачки ---------- */
  var capCache = {};
  function capGeometry(units) {
    var k = units.toFixed(2);
    if (capCache[k]) return capCache[k];
    var w = units * PITCH - (PITCH - CAP);
    var g = extruded(roundedShape(w, CAP, 2.2), CAP_H, 0.9);
    // сужение кверху — профиль настоящего колпачка
    var pos = g.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var y = pos.getY(i);
      var f = 1 - 0.16 * Math.min(1, Math.max(0, y / CAP_H));
      pos.setX(i, pos.getX(i) * f);
      pos.setZ(i, pos.getZ(i) * f);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    capCache[k] = { geo: g, w: w };
    return capCache[k];
  }

  function labelTexture(text, tone) {
    var cw = 128, ch = 128;
    var c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    var x = c.getContext("2d");
    x.clearRect(0, 0, cw, ch);
    x.fillStyle = tone === "white" ? "#c2405f" : "#ffffff";
    x.font = "600 " + (text.length > 4 ? 30 : text.length > 2 ? 38 : 48) + "px Jost, Arial, sans-serif";
    x.textBaseline = "top";
    x.fillText(text, 14, 14);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function spacebarTexture() {
    var c = document.createElement("canvas");
    c.width = 1024; c.height = 160;
    var x = c.getContext("2d");
    x.clearRect(0, 0, 1024, 160);
    // солнце
    x.fillStyle = "#e8607f"; x.beginPath(); x.arc(690, 52, 30, 0, 7); x.fill();
    // гора Фудзи
    var grad = x.createLinearGradient(0, 40, 0, 160);
    grad.addColorStop(0, "#b9c6de"); grad.addColorStop(1, "#8fa0c0");
    x.fillStyle = grad;
    x.beginPath(); x.moveTo(300, 150); x.lineTo(430, 44); x.quadraticCurveTo(450, 30, 470, 44);
    x.lineTo(600, 150); x.closePath(); x.fill();
    x.fillStyle = "#ffffff";
    x.beginPath(); x.moveTo(410, 62); x.lineTo(450, 34); x.lineTo(490, 62);
    x.quadraticCurveTo(470, 54, 450, 66); x.quadraticCurveTo(430, 54, 410, 62); x.fill();
    // тории
    x.fillStyle = "#d84b6d";
    x.fillRect(742, 74, 86, 8); x.fillRect(748, 90, 74, 5);
    x.fillRect(756, 82, 8, 62); x.fillRect(806, 82, 8, 62);
    // вода
    x.strokeStyle = "rgba(200,120,150,.5)"; x.lineWidth = 3;
    for (var i = 0; i < 5; i++) {
      x.beginPath(); x.moveTo(120 + i * 170, 140); x.quadraticCurveTo(160 + i * 170, 130, 200 + i * 170, 140); x.stroke();
    }
    // лепестки
    x.fillStyle = "#ff9db6";
    for (var j = 0; j < 26; j++) {
      x.beginPath();
      x.ellipse(60 + Math.random() * 900, 20 + Math.random() * 120, 5, 3.4, Math.random() * 3, 0, 7);
      x.fill();
    }
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  var caps = [];
  function addKey(label, units, tone, cx, cz) {
    var info = capGeometry(units);
    var mesh = new THREE.Mesh(info.geo, capMaterials[tone]);
    mesh.position.set(cx, PLATE_Y, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    board.add(mesh);
    caps.push(mesh);

    var texture = tone === "art" ? spacebarTexture() : (label ? labelTexture(label, tone) : null);
    if (!texture) return;
    var lw = info.w * 0.84, ld = CAP * 0.84;
    var face = new THREE.Mesh(
      new THREE.PlaneGeometry(lw, ld),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.8, depthWrite: false })
    );
    face.rotation.x = -Math.PI / 2;
    face.position.set(cx, PLATE_Y + CAP_H + 0.12, cz);
    board.add(face);
  }

  function layoutBlock(blockRows, originX, originZ) {
    blockRows.forEach(function (row) {
      var x = originX;
      var z = originZ + row.y * PITCH + (row.y >= 1.5 ? 4 : 0);
      row.keys.forEach(function (k) {
        var units = k[1];
        if (k[0] === null) { x += units * PITCH; return; }
        var cx = x + (units * PITCH) / 2;
        addKey(k[0], units, k[2], cx, z + PITCH / 2);
        x += units * PITCH;
      });
    });
  }

  var LEFT = -CASE_W / 2 + 4.2;   // поля корпуса: 18,25u раскладки в 356 мм
  var TOP = -CASE_D / 2 + 9;
  layoutBlock(rows, LEFT, TOP);
  layoutBlock(navRows, LEFT + 15.25 * PITCH, TOP);

  /* ---------- лепестки в воздухе ---------- */
  var petals = null;
  if (!reduce) {
    var count = 220;
    var geo = new THREE.BufferGeometry();
    var arr = new Float32Array(count * 3);
    var speed = new Float32Array(count);
    for (var i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1400;
      arr[i * 3 + 1] = Math.random() * 700;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1000;
      speed[i] = 0.5 + Math.random() * 1.4;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    var pc = document.createElement("canvas");
    pc.width = pc.height = 64;
    var px = pc.getContext("2d");
    px.fillStyle = "#ff9dbb";
    px.beginPath(); px.ellipse(32, 32, 26, 16, 0.6, 0, 7); px.fill();
    var ptex = new THREE.CanvasTexture(pc);
    petals = new THREE.Points(geo, new THREE.PointsMaterial({
      map: ptex, size: 16, transparent: true, opacity: 0.9, depthWrite: false
    }));
    petals.userData.speed = speed;
    scene.add(petals);
  }

  function makeSkyTexture() {
    var c = document.createElement("canvas");
    c.width = 8; c.height = 256;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#ffeaf1");
    g.addColorStop(0.5, "#ffd0e0");
    g.addColorStop(1, "#eeadc3");
    x.fillStyle = g; x.fillRect(0, 0, 8, 256);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* ---------- камера: орбита ---------- */
  var target = new THREE.Vector3(0, 12, 0);
  var sph = { theta: -0.6, phi: 0.92, radius: 780 };
  var goal = { theta: -0.6, phi: 0.92, radius: 780 };
  var autoSpin = !reduce;
  var dragging = false, lastX = 0, lastY = 0;

  function applyCamera() {
    sph.theta += (goal.theta - sph.theta) * 0.12;
    sph.phi += (goal.phi - sph.phi) * 0.12;
    sph.radius += (goal.radius - sph.radius) * 0.12;
    var p = Math.min(1.45, Math.max(0.12, sph.phi));
    camera.position.set(
      target.x + sph.radius * Math.sin(p) * Math.sin(sph.theta),
      target.y + sph.radius * Math.cos(p),
      target.z + sph.radius * Math.sin(p) * Math.cos(sph.theta)
    );
    camera.lookAt(target);
  }

  var el = renderer.domElement;
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", function (e) {
    dragging = true; autoSpin = false;
    lastX = e.clientX; lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
    host.classList.add("is-grabbed");
  });
  el.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    goal.theta -= (e.clientX - lastX) * 0.006;
    goal.phi = Math.min(1.45, Math.max(0.12, goal.phi - (e.clientY - lastY) * 0.005));
    lastX = e.clientX; lastY = e.clientY;
  });
  function endDrag(e) {
    dragging = false;
    if (e && e.pointerId != null && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);
  el.addEventListener("wheel", function (e) {
    e.preventDefault();
    goal.radius = Math.min(1800, Math.max(260, goal.radius + e.deltaY * 0.6));
  }, { passive: false });

  host.setAttribute("tabindex", "0");
  host.addEventListener("keydown", function (e) {
    var step = e.shiftKey ? 0.32 : 0.12;
    if (e.key === "ArrowLeft") goal.theta += step;
    else if (e.key === "ArrowRight") goal.theta -= step;
    else if (e.key === "ArrowUp") goal.phi = Math.max(0.12, goal.phi - step * 0.6);
    else if (e.key === "ArrowDown") goal.phi = Math.min(1.45, goal.phi + step * 0.6);
    else if (e.key === "+" || e.key === "=") goal.radius = Math.max(260, goal.radius - 80);
    else if (e.key === "-") goal.radius = Math.min(1800, goal.radius + 80);
    else return;
    autoSpin = false;
    e.preventDefault();
  });

  /* ---------- виды ---------- */
  var VIEWS = {
    hero:  { theta: -0.6,  phi: 0.92, radius: 780 },
    top:   { theta: 0,     phi: 0.12, radius: 760 },
    side:  { theta: -1.57, phi: 1.32, radius: 780 },
    macro: { theta: -0.4,  phi: 1.05, radius: 360 }
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (btn) {
    btn.addEventListener("click", function () {
      var v = VIEWS[btn.getAttribute("data-view")];
      if (!v) return;
      goal.theta = v.theta; goal.phi = v.phi; goal.radius = v.radius;
      autoSpin = false;
      document.querySelectorAll("[data-view]").forEach(function (b) { b.classList.toggle("is-on", b === btn); });
    });
  });
  var spinBtn = document.getElementById("spinToggle");
  if (spinBtn) {
    spinBtn.addEventListener("click", function () {
      autoSpin = !autoSpin;
      spinBtn.classList.toggle("is-on", autoSpin);
      spinBtn.textContent = autoSpin ? "Остановить вращение" : "Включить вращение";
    });
    spinBtn.classList.toggle("is-on", autoSpin);
  }

  /* ---------- цикл ---------- */
  function resize() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  function frame() {
    if (autoSpin && !dragging) goal.theta -= 0.0022;
    applyCamera();
    if (petals) {
      var pos = petals.geometry.attributes.position;
      var sp = petals.userData.speed;
      for (var i = 0; i < pos.count; i++) {
        var y = pos.getY(i) - sp[i];
        var x = pos.getX(i) + Math.sin((y + i) / 90) * 0.6;
        if (y < -40) { y = 700; }
        pos.setY(i, y); pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }
    renderer.render(scene, camera);
    window.requestAnimationFrame(frame);
  }
  host.classList.add("is-ready");
  frame();
})();
