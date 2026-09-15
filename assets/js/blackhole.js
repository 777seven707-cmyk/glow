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
  for (int i = 0; i < 5; i++){ s += a * noise(p); p *= 2.07; a *= 0.5; }
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
  float n  = fbm(vec3(s * 1.45, rr * 1.9));
  float n2 = fbm(vec3(s * 3.1,  rr * 4.2 + 9.0));
  float gas = pow(n, 1.4) * (0.62 + 0.62 * n2);
  gas *= 0.84 + 0.16 * sin(rr * 2.6 + n * 8.0);

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

  vec3 ro = vec3(0.0, 1.55, -15.0);
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

    vec3 acc  = -1.5 * h2 * pos / pow(r, 5.0);
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

    host.appendChild(canvas);
    host.classList.add('is-live');           // прячет запасную картинку

    /* Считаем в пониженном разрешении: свечение мягкое, апскейл незаметен,
       зато кадр дешевле в несколько раз */
    /* На телефонах считаем грубее: экран меньше, а видеоядро слабее */
    var small = window.innerWidth < 760 || window.matchMedia('(hover: none)').matches;
    var scale = small ? 0.5 : 0.75;
    var steps = small ? 110 : 150;
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

    var spin = 1, spinTarget = 1;
    var hero = host.closest('.hero');
    if (hero && !reduced && !window.matchMedia('(hover: none)').matches) {
      hero.addEventListener('mouseenter', function () { spinTarget = 4.5; hero.classList.add('is-spinning'); });
      hero.addEventListener('mouseleave', function () { spinTarget = 1;   hero.classList.remove('is-spinning'); });
    }

    var t0 = performance.now(), slow = 0, drawn = false;

    function draw(timeSec) {
      resize();
      spin += (spinTarget - spin) * 0.05;
      gl.uniform1f(uTime, timeSec);
      gl.uniform1f(uSpin, spin);
      gl.uniform1f(uGain, 0.55);
      gl.uniform1i(uSteps, steps);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (reduced) {           // без движения — один статичный кадр
      draw(6);
      window.addEventListener('resize', function () { draw(6); });
      return;
    }

    function frame(now) {
      requestAnimationFrame(frame);
      var box = host.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;   // вне экрана не считаем

      var started = performance.now();
      draw((now - t0) / 1000);
      drawn = true;

      /* Кадр даётся тяжело — снижаем качество, чтобы не ронять частоту */
      var cost = performance.now() - started;
      if (cost > 22) {
        if (++slow > 12) {
          slow = 0;
          if (steps > 90) steps -= 25;
          else if (scale > 0.4) { scale -= 0.1; w = 0; }
        }
      } else slow = 0;
    }

    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
