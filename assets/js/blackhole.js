/* =========================================================
   Чёрная дыра: трассировка лучей с гравитационным искривлением.
   Диск вращается вокруг оси Y, внутренние слои быстрее внешних.
   Если WebGL недоступен — на месте остаётся запасная картинка.
   ========================================================= */
(function () {
  'use strict';

  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  var FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uSpin;
uniform float uGain;
uniform int   uSteps;
uniform vec2  uCam;   /* поворот камеры: рыскание и наклон */

float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }

float noise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 3; i++){ s += a * noise(p); p *= 2.07; a *= 0.5; }
  return s;
}

/* Свечение диска в точке пересечения луча с плоскостью y = 0 */
vec3 disk(vec3 hit, float rr){
  float ang = atan(hit.z, hit.x);

  /* Вращение вокруг оси Y. Внутренние слои быстрее внешних — как в реальном диске */
  float w = uTime * uSpin * 1.15 / pow(rr, 1.5);
  vec2  s = vec2(cos(ang + w), sin(ang + w));

  /* Угловая координата меняется медленно, радиальная быстро —
     шум вытягивается в волокна вдоль орбиты */
  float n = fbm(vec3(s * 1.45, rr * 1.9));
  float gas = n * n * 1.35;
  gas *= 0.7 + 0.5 * sin(rr * 3.4 + n * 9.0);

  float inner = smoothstep(2.55, 3.5, rr);
  float outer = 1.0 - smoothstep(7.5, 12.0, rr);
  float dens  = inner * outer * gas;

  dens *= 9.0 / (1.0 + 0.09 * rr * rr);

  /* Релятивистское усиление: приближающаяся сторона ярче */
  dens *= 1.0 + 1.05 * sin(ang);

  return vec3(dens);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  /* Камера летает по сфере вокруг дыры: мышь задаёт угол, радиус постоянен */
  float cy = cos(uCam.x), sy = sin(uCam.x);
  float cp = cos(uCam.y), sp = sin(uCam.y);
  vec3 ro = 15.08 * vec3(sy * cp, sp, -cy * cp);

  vec3 ww = normalize(-ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.15 * ww);

  vec3 pos = ro, vel = rd, col = vec3(0.0);
  vec3 L = cross(pos, vel);
  float h2 = dot(L, L);
  /* Длина пути держится постоянной: меньше шагов — крупнее шаг.
     Иначе при снижении качества луч не доходит до дыры и картинка ломается. */
  float dt = 21.5 / float(uSteps);

  for (int i = 0; i < 220; i++){
    if (i >= uSteps) break;
    float r = length(pos);
    if (r < 1.02) break;
    if (r > 34.0) break;

    float r2 = r * r;
    vec3 acc  = -1.5 * h2 * pos / (r2 * r2 * r);   /* дешевле, чем pow(r,5) */
    vec3 npos = pos + vel * dt + 0.5 * acc * dt * dt;
    vel += acc * dt;

    if (pos.y * npos.y < 0.0){
      float t   = -pos.y / (npos.y - pos.y);
      vec3  hit = mix(pos, npos, t);
      float rr  = length(hit.xz);
      if (rr > 2.5 && rr < 12.0) col += disk(hit, rr) * uGain;
    }
    pos = npos;
  }

  col = max(col, 0.0);
  col += pow(col, vec3(2.2)) * 0.5;
  col = col / (1.0 + col);
  col = pow(col, vec3(0.85));
  gl_FragColor = vec4(col, 1.0);
}
`;

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Шейдер не собрался:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  /* WEBGL_debug_renderer_info доступен не везде; когда его нет,
     считаем рендерер аппаратным и полагаемся на подстройку качества. */
  function isSoftware(gl) {
    try {
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (!ext) return false;
      var name = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
      return /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/.test(name);
    } catch (e) { return false; }
  }

  function init() {
    var host = document.getElementById('bhStage');
    if (!host) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var canvas = document.createElement('canvas');
    canvas.className = 'bh-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    var opts = { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' };
    var gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) return;

    /* Если у браузера нет аппаратного ускорения, шейдер считает процессор.
       Трассировка лучей в софте роняет страницу до 5-7 кадров в секунду,
       поэтому в этом случае честнее оставить запасную картинку. */
    if (isSoftware(gl)) {
      var loseEarly = gl.getExtension('WEBGL_lose_context');
      if (loseEarly) loseEarly.loseContext();   // не держим контекст впустую
      return;
    }

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aLoc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

    var uRes   = gl.getUniformLocation(prog, 'uRes');
    var uTime  = gl.getUniformLocation(prog, 'uTime');
    var uSpin  = gl.getUniformLocation(prog, 'uSpin');
    var uGain  = gl.getUniformLocation(prog, 'uGain');
    var uSteps = gl.getUniformLocation(prog, 'uSteps');
    var uCam   = gl.getUniformLocation(prog, 'uCam');

    host.appendChild(canvas);
    host.classList.add('is-live');           // прячет запасную картинку

    /* Считаем в пониженном разрешении: свечение мягкое, апскейл незаметен,
       зато кадр дешевле в несколько раз */
    /* На телефонах считаем грубее: экран меньше, а видеоядро слабее */
    var small = window.innerWidth < 760 || window.matchMedia('(hover: none)').matches;
    var scale = small ? 0.38 : 0.5;
    var steps = small ? 64 : 72;
    var w = 0, h = 0;

    function resize() {
      var r = host.getBoundingClientRect();
      var nw = Math.max(2, Math.round(r.width * scale));
      var nh = Math.max(2, Math.round(r.height * scale));
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }

    /* ---------- ВРАЩЕНИЕ МЫШКОЙ ----------
       Камера крутится вокруг дыры: тянем — она облетает.
       Целевые углы двигает мышь, текущие догоняют их плавно. */
    var BASE_PITCH = 0.1031;                 // исходный наклон камеры
    var MAX_PITCH  = 0.95;                   // дальше камера смотрит в полюс и картинка ломается
    var yaw = 0, yawT = 0;
    var pitch = BASE_PITCH, pitchT = BASE_PITCH;
    var dragging = false, lastX = 0, lastY = 0;

    function clampPitch(v) { return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, v)); }

    if (!reduced) {
      canvas.classList.add('is-grabbable');

      canvas.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch') return;   // на телефоне палец должен прокручивать страницу
        dragging = true;
        lastX = e.clientX; lastY = e.clientY;
        canvas.classList.add('is-grabbing');
        if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      });

      canvas.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        yawT   += (e.clientX - lastX) * 0.005;
        pitchT  = clampPitch(pitchT + (e.clientY - lastY) * 0.004);
        lastX = e.clientX; lastY = e.clientY;
      });

      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        canvas.classList.remove('is-grabbing');
        if (canvas.releasePointerCapture && e.pointerId != null) {
          try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
        }
      }
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);
      canvas.addEventListener('lostpointercapture', endDrag);
    }

    var spin = 1, spinTarget = 1;
    var hero = host.closest('.hero');
    if (hero && !reduced && !window.matchMedia('(hover: none)').matches) {
      hero.addEventListener('mouseenter', function () { spinTarget = 4.5; hero.classList.add('is-spinning'); });
      hero.addEventListener('mouseleave', function () { spinTarget = 1;   hero.classList.remove('is-spinning'); });
    }

    var t0 = performance.now(), slow = 0, prev = 0, avg = 0;
    var lastFrame = 0;
    var MIN_GAP = 42;        /* 24 кадра в секунду: диск вращается медленно,
                                разницы с 60 не видно, а работы втрое меньше */

    function draw(timeSec) {
      resize();
      spin += (spinTarget - spin) * 0.05;
      yaw   += (yawT - yaw) * 0.12;
      pitch += (pitchT - pitch) * 0.12;
      gl.uniform2f(uCam, yaw, pitch);
      gl.uniform1f(uTime, timeSec);
      gl.uniform1f(uSpin, spin);
      /* Сверху диск виден целиком и заливает кадр светом — под белым
         заголовком героя это мешает читать. Приглушаем на крутых углах. */
      var lean = Math.min(1, Math.abs(pitch) / MAX_PITCH);
      gl.uniform1f(uGain, 0.55 * (1 - 0.45 * lean));
      gl.uniform1i(uSteps, steps);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (reduced) {           // без движения — один статичный кадр
      draw(6);
      window.addEventListener('resize', function () { draw(6); });
      return;
    }

    /* Последняя ступень: слабое видеоядро не вытягивает даже минимальное
       качество. Возвращаем статичный кадр — он всегда лучше рывков. */
    var alive = true;
    function giveUp() {
      alive = false;
      host.classList.remove('is-live');
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }

    function frame(now) {
      if (!alive) return;
      requestAnimationFrame(frame);
      var gap = dragging ? 20 : MIN_GAP;   /* при перетаскивании нужна плавность */
      if (now - lastFrame < gap) return;
      lastFrame = now;

      var box = host.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) { prev = 0; return; }  // вне экрана не считаем

      draw((now - t0) / 1000);

      /* Мерим промежуток между кадрами, а не время вызова отрисовки:
         drawArrays возвращается сразу, работа уходит на видеокарту асинхронно,
         поэтому по нему нагрузку не увидеть. */
      if (prev) {
        var delta = now - prev;
        avg = avg ? avg * 0.9 + delta * 0.1 : delta;
        if (avg > MIN_GAP * 1.4) {   /* ниже ~17 кадров в секунду движение уже читается как рывки */
          if (++slow > 8) {
            slow = 0;
            if (steps > 36) steps -= 12;
            else if (scale > 0.24) { scale -= 0.07; w = 0; }
            else { giveUp(); return; }   // запас качества исчерпан, а плавности нет
            avg = MIN_GAP;
          }
        } else slow = 0;
      }
      prev = now;
    }

    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
