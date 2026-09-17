/* ============================================================
   Катана — настоящая трёхмерная модель (three.js), пролетающая
   через заголовок: клинок с изгибом сори, линия закалки хамон,
   хабаки, цуба и оплётка рукояти. На пролёте «разрезает» текст.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("katana");
  var cut = document.getElementById("heroCut");
  if (!canvas || !window.THREE) return;
  var THREE = window.THREE;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 1, 6000);
  camera.position.set(0, 0, 900);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  /* ---------- окружение для отражений в стали ---------- */
  function environmentMap() {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.42, "#ffe3ec");
    g.addColorStop(0.55, "#f7b9cd");
    g.addColorStop(1, "#6d4550");
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.fillStyle = "rgba(255,255,255,.85)";
    x.beginPath(); x.arc(360, 70, 34, 0, 7); x.fill();
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose(); tex.dispose();
    return env;
  }
  scene.environment = environmentMap();

  scene.add(new THREE.AmbientLight(0xffe9f0, 0.5));
  var spot = new THREE.DirectionalLight(0xffffff, 2.6);
  spot.position.set(-260, 380, 520);
  scene.add(spot);
  var back = new THREE.DirectionalLight(0xffd6e2, 1.1);
  back.position.set(320, -180, -260);
  scene.add(back);

  /* ---------- материалы ---------- */
  var steel = new THREE.MeshPhysicalMaterial({
    color: 0xdfe6ef, metalness: 1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08
  });
  var hamonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.55 });
  var brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.95, roughness: 0.28 });
  var iron = new THREE.MeshStandardMaterial({ color: 0x3b2f33, metalness: 0.85, roughness: 0.45 });
  var wrap = new THREE.MeshStandardMaterial({ color: 0x53303a, roughness: 0.85 });
  var ito = new THREE.MeshStandardMaterial({ color: 0xf3dbe2, roughness: 0.7 });

  var katana = new THREE.Group();
  window.__katana = katana;
  katana.visible = false;   // до первого взмаха меча в кадре нет
  scene.add(katana);

  /* ---------- клинок: профиль синоги-дзукури вдоль дуги сори ---------- */
  var BLADE = 720;                     // длина клинка
  var profile = new THREE.Shape();     // сечение: остриё слева, обух справа
  profile.moveTo(-15, 0);              // лезвие
  profile.lineTo(0, 4.4);              // синоги — рёбра жёсткости
  profile.lineTo(13, 3.2);
  profile.lineTo(15, 0);               // обух
  profile.lineTo(13, -3.2);
  profile.lineTo(0, -4.4);
  profile.closePath();

  var sori = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(BLADE * 0.3, 14, 0),
    new THREE.Vector3(BLADE * 0.62, 34, 0),
    new THREE.Vector3(BLADE * 0.86, 62, 0),
    new THREE.Vector3(BLADE, 84, 0)
  ]);

  var bladeGeo = new THREE.ExtrudeGeometry(profile, {
    steps: 160, bevelEnabled: false, extrudePath: sori
  });
  var blade = new THREE.Mesh(bladeGeo, steel);
  katana.add(blade);

  // киссаки: остриё срезано наискось
  var tip = new THREE.Mesh(new THREE.ConeGeometry(15, 54, 4), steel);
  tip.position.set(BLADE + 16, 92, 0);
  tip.rotation.z = -Math.PI / 2 + 0.24;
  tip.rotation.x = Math.PI / 4;
  katana.add(tip);

  // хамон — светлая линия закалки вдоль лезвия
  var hamon = new THREE.Mesh(
    new THREE.TubeGeometry(sori, 120, 1.6, 6, false),
    hamonMat
  );
  hamon.position.y = -7.2;
  katana.add(hamon);

  /* ---------- хабаки, цуба, рукоять ---------- */
  var habaki = new THREE.Mesh(new THREE.BoxGeometry(26, 26, 13), brass);
  habaki.position.set(-6, 0, 0);
  katana.add(habaki);

  var tsuba = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 5, 40), iron);
  tsuba.rotation.z = Math.PI / 2;
  tsuba.position.set(-26, 0, 0);
  katana.add(tsuba);
  var tsubaRing = new THREE.Mesh(new THREE.TorusGeometry(42, 3, 10, 40), brass);
  tsubaRing.rotation.y = Math.PI / 2;
  tsubaRing.position.set(-26, 0, 0);
  katana.add(tsubaRing);

  var tsuka = new THREE.Mesh(new THREE.BoxGeometry(250, 25, 15), wrap);
  tsuka.position.set(-156, -8, 0);
  tsuka.rotation.z = 0.05;
  katana.add(tsuka);

  // оплётка: ромбы ито по всей рукояти
  for (var i = 0; i < 11; i++) {
    var band = new THREE.Mesh(new THREE.BoxGeometry(9, 27, 17), ito);
    band.position.set(-48 - i * 21, -8 - i * 0.55, 0);
    band.rotation.z = 0.05 + (i % 2 ? 0.5 : -0.5);
    katana.add(band);
  }

  var kashira = new THREE.Mesh(new THREE.SphereGeometry(13, 18, 14), brass);
  kashira.position.set(-278, -21, 0);
  katana.add(kashira);


  /* ---------- пролёт ---------- */
  var DURATION = 2400;       // длительность взмаха
  var IDLE = 11000;          // пауза между взмахами
  var startedAt = performance.now() + 1400;
  var cutFired = false;
  var W = 0, H = 0, halfW = 0, halfH = 0;

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    // видимый прямоугольник в мировых единицах на плоскости z = 0
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    halfW = halfH * camera.aspect;
    katana.scale.setScalar(Math.min(1.05, (halfW * 2) / 1050));
  }
  window.addEventListener("resize", resize);
  resize();

  // быстрый вход и выход, замедление в середине — чтобы клинок было видно
  function sweep(u) { return u + 0.1 * Math.sin(2 * Math.PI * u); }

  function fireCut() {
    if (!cut || cutFired) return;
    cutFired = true;
    cut.classList.add("is-cut");
    window.setTimeout(function () { cut.classList.remove("is-cut"); }, 1100);
  }

  function frame(now) {
    window.requestAnimationFrame(frame);
    if (!W || !H) { resize(); return; }

    if (window.location.hash === "#katana-debug") {
      katana.visible = true;
      katana.position.set(0, 0, 0);
      katana.rotation.set(0.25, 0.4, -0.3);
      renderer.render(scene, camera);
      return;
    }

    var elapsed = now - startedAt;
    if (elapsed < 0) { renderer.render(scene, camera); return; }

    var cycle = elapsed % (DURATION + IDLE);
    var flying = cycle < DURATION;
    var t = flying ? sweep(cycle / DURATION) : 1;

    // путь: снизу слева за кадром — наверх направо за кадр
    var x = (-1.6 + 3.2 * t) * halfW;
    var y = (-1.0 + 2.0 * t) * halfH * 0.85;

    katana.visible = flying;
    katana.position.set(x, y, 0);
    katana.rotation.set(0.32 - t * 0.2, 0.28 + t * 0.5, -0.62 + t * 0.34);

    if (flying) {
      if (cycle / DURATION > 0.46) fireCut();
    } else {
      cutFired = false;
    }

    renderer.render(scene, camera);
  }
  window.requestAnimationFrame(frame);
})();
