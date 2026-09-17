/* =========================================================
   ITALIA — фон на WebGL
   Текучий градиент: фрактальный шум (fBm) с деформацией
   координат — та же схема, по которой сделан фон Stripe.
   Палитра меняется по секциям, свет тянется за курсором,
   поле уплывает при прокрутке. Нет WebGL — остаются
   градиенты на CSS, страница ничего не теряет.
   ========================================================= */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 a_pos;',
    'void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  u_res;',
    'uniform float u_time;',
    'uniform vec2  u_mouse;',
    'uniform float u_scroll;',
    'uniform vec3  u_c1;',
    'uniform vec3  u_c2;',
    'uniform vec3  u_c3;',
    'uniform vec3  u_paper;',
    'uniform float u_mix;',
    'uniform float u_detail;',

    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',

    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',

    /* две октавы на деформацию и три на само поле: компромисс цены и вида */
    'float fbm2(vec2 p){',
    '  float s = 0.5 * vnoise(p);',
    '  p = p * 2.03 + vec2(3.1, 1.7);',
    '  return s + 0.25 * vnoise(p);',
    '}',
    'float fbm(vec2 p){',
    '  float a = 0.5, s = 0.0;',
    '  for (int i = 0; i < 3; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(3.1, 1.7); a *= 0.5; }',
    '  return s;',
    '}',

    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res;',
    '  float ar = u_res.x / max(u_res.y, 1.0);',
    '  vec2 p = vec2(uv.x * ar, uv.y + u_scroll);',
    '  float t = u_time * 0.028;',

    /* деформация координат: поле течёт само по себе */
    '  vec2 q = vec2(fbm2(p * 1.5 + vec2(0.0, t)), fbm2(p * 1.5 + vec2(5.2, 1.3 - t)));',
    '  vec2 r = vec2(fbm2(p * 2.0 + 3.4 * q + vec2(1.7, 9.2) + t * 0.8),',
    '                fbm2(p * 2.0 + 3.4 * q + vec2(8.3, 2.8) - t * 0.7));',
    '  float f = fbm(p * 1.25 + 2.2 * r);',
    '  float band = smoothstep(0.30, 0.72, f + 0.18 * sin(p.x * 2.0 + t * 1.6));',

    '  vec3 col = mix(u_c1, u_c2, clamp(f * 1.6, 0.0, 1.0));',
    '  col = mix(col, u_c3, clamp(band * 0.95, 0.0, 1.0));',
    /* держим фон светлым: под текстом должен оставаться воздух */
    '  col = mix(u_paper, col, u_mix);',

    /* светлые прожилки по гребням шума — как свет сквозь жидкость */
    '  float ridge = 1.0 - abs(f * 2.0 - 1.0);',
    '  col += 0.085 * pow(ridge, 3.0);',

    /* медленный блик проходит по полю — как свет по мокрому мрамору */
    '  float sweep = sin((uv.x + uv.y) * 2.2 - u_time * 0.12);',
    '  col += 0.05 * pow(max(sweep, 0.0), 8.0);',

    /* тонкие прожилки: травертин, из которого сложен Колизей */
    '  if (u_detail > 0.5) {',
    '    float vein = 1.0 - abs(fbm2(p * 5.5 + r * 1.6) * 2.0 - 1.0);',
    '    col -= 0.045 * pow(vein, 7.0);',
    '  }',

    /* верх чуть холоднее, низ теплее — так поле не выглядит плоским */
    '  col += vec3(0.02, 0.006, -0.012) * (uv.y - 0.5);',

    /* мягкий свет сверху, лёгкая виньетка и тёплое свечение за курсором */
    '  col += 0.05 * pow(1.0 - uv.y, 2.2);',
    '  col *= 1.0 - 0.1 * pow(length(uv - 0.5) * 1.25, 2.0);',
    '  float d = distance(vec2(uv.x * ar, uv.y), vec2(u_mouse.x * ar, u_mouse.y));',
    '  col += 0.055 * exp(-d * 3.2);',

    /* зерно прямо в шейдере — иначе градиент выглядит пластиковым */
    '  float g = hash(gl_FragCoord.xy + fract(u_time) * 17.0);',
    '  col += (g - 0.5) * 0.032;',

    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* палитры настроений: мягкие, чтобы текст оставался читаемым */
  var MOODS = {
    roma:  { c1: [0.76, 0.30, 0.19], c2: [0.93, 0.68, 0.38], c3: [0.99, 0.95, 0.89], mix: 0.62 },
    oro:   { c1: [0.82, 0.56, 0.17], c2: [0.97, 0.86, 0.58], c3: [1.00, 0.98, 0.92], mix: 0.60 },
    verde: { c1: [0.11, 0.47, 0.31], c2: [0.70, 0.83, 0.56], c3: [0.98, 0.99, 0.94], mix: 0.5 },
    mare:  { c1: [0.16, 0.44, 0.63], c2: [0.66, 0.85, 0.93], c3: [0.96, 0.99, 1.00], mix: 0.5 },
    notte: { c1: [0.33, 0.25, 0.60], c2: [0.70, 0.58, 0.85], c3: [0.98, 0.96, 1.00], mix: 0.5 }
  };
  var PAPER = [0.980, 0.965, 0.937];

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (window.console) console.warn('backdrop:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  /* одно поле = один холст со своей программой; кадр у всех общий */
  function createField(host, opts) {
    if (!host) return null;
    opts = opts || {};

    var canvas = document.createElement('canvas');
    canvas.className = 'bg__gl';
    canvas.setAttribute('aria-hidden', 'true');

    var gl = null;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' })
        || canvas.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) return null;                  /* остаётся запасной фон на CSS */

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['u_res', 'u_time', 'u_mouse', 'u_scroll', 'u_c1', 'u_c2', 'u_c3', 'u_paper', 'u_mix', 'u_detail']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform3fv(U.u_paper, PAPER);

    host.insertBefore(canvas, host.firstChild);
    host.classList.add('is-gl');

    /* --- состояние поля --- */
    var boost = opts.mixBoost || 0;
    var field = {
      host: host, gl: gl, U: U, canvas: canvas,
      cur: { c1: MOODS.roma.c1.slice(), c2: MOODS.roma.c2.slice(), c3: MOODS.roma.c3.slice(), mix: MOODS.roma.mix + boost },
      boost: boost,
      w: 0, h: 0
    };

    field.resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, opts.dprCap || 1.3) * (window.ITALIA_BG_QUALITY || 1);
      var r = host.getBoundingClientRect();
      var cw = opts.fixed ? window.innerWidth : (r.width || window.innerWidth);
      var ch = opts.fixed ? window.innerHeight : (r.height || 320);
      field.w = Math.max(1, Math.round(cw * dpr));
      field.h = Math.max(1, Math.round(ch * dpr));
      canvas.width = field.w; canvas.height = field.h;
      canvas.style.width = '100%'; canvas.style.height = '100%';
      gl.viewport(0, 0, field.w, field.h);
      gl.useProgram(prog);
      gl.uniform2f(U.u_res, field.w, field.h);
    };

    field.draw = function (state) {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(U.u_time, state.time + (opts.timeOffset || 0));
      gl.uniform2f(U.u_mouse, state.mouse[0], state.mouse[1]);
      gl.uniform1f(U.u_scroll, state.scroll * (opts.scrollScale === undefined ? 1 : opts.scrollScale));
      gl.uniform3fv(U.u_c1, field.cur.c1);
      gl.uniform3fv(U.u_c2, field.cur.c2);
      gl.uniform3fv(U.u_c3, field.cur.c3);
      gl.uniform1f(U.u_mix, field.cur.mix);
      gl.uniform1f(U.u_detail, (window.ITALIA_BG_QUALITY || 1) > 0.7 ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    field.resize();
    return field;
  }

  function boot() {
    var fields = [];
    var main = createField(document.getElementById('bg'), { fixed: true, mixBoost: -0.1, dprCap: 0.62 });
    if (!main) return;
    fields.push(main);

    /* «окно» в фон: тот же шейдер, но в полную силу, обрезанный аркадой */
    Array.prototype.forEach.call(document.querySelectorAll('.window__stage'), function (el) {
      var f = createField(el, { mixBoost: 0.36, dprCap: 0.9, timeOffset: 40, scrollScale: 0.4 });
      if (f) fields.push(f);
    });

    /* --- общее состояние --- */
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stored = null;
    try { stored = localStorage.getItem('italia-motion'); } catch (e) {}
    var motion = stored ? stored === 'on' : !reduced;

    var btnRef = null;
    var target = MOODS.roma;
    var state = { time: 0, mouse: [0.5, 0.45], scroll: 0 };
    var mouseTarget = [0.5, 0.45], scrollTarget = 0;
    var last = 0, raf = 0, hidden = false;
    var lastDraw = 0, fpsCap = 30;
    /* самонастройка: если кадры тяжёлые, снижаем разрешение поля и частоту */
    var slow = 0, quality = 1;

    function drawAll() { for (var i = 0; i < fields.length; i++) fields[i].draw(state); }

    function moving() {
      if (Math.abs(scrollTarget - state.scroll) > 0.0004) return true;
      if (Math.abs(mouseTarget[0] - state.mouse[0]) > 0.002 || Math.abs(mouseTarget[1] - state.mouse[1]) > 0.002) return true;
      for (var i = 0; i < fields.length; i++) {
        var c = fields[i].cur;
        if (Math.abs(target.mix + fields[i].boost - c.mix) > 0.002) return true;
        for (var j = 0; j < 3; j++) if (Math.abs(target.c1[j] - c.c1[j]) > 0.004) return true;
      }
      return false;
    }

    function step(ts) {
      raf = 0;
      var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      if (motion) state.time += dt;

      /* кадр дешевле, чем кажется: рисуем не чаще fpsCap */
      if (ts - lastDraw < 1000 / fpsCap - 1) {
        if (!hidden && (motion || moving())) raf = requestAnimationFrame(step);
        return;
      }


      /* палитра переливается к целевой, а не переключается рывком */
      var k = 1 - Math.pow(0.001, dt);
      fields.forEach(function (f) {
        ['c1', 'c2', 'c3'].forEach(function (key) {
          for (var i = 0; i < 3; i++) f.cur[key][i] += (target[key][i] - f.cur[key][i]) * k * 1.2;
        });
        f.cur.mix += (target.mix + f.boost - f.cur.mix) * k * 1.2;
      });
      state.mouse[0] += (mouseTarget[0] - state.mouse[0]) * k * 2.2;
      state.mouse[1] += (mouseTarget[1] - state.mouse[1]) * k * 2.2;
      state.scroll += (scrollTarget - state.scroll) * k * 2.2;

      var interval = lastDraw ? ts - lastDraw : 0;
      drawAll();
      lastDraw = ts;

      /* смотрим на интервал между кадрами: вызовы WebGL асинхронные,
         поэтому время самой отрисовки ничего не показывает */
      if (interval > 1000 / fpsCap + 22) slow++; else slow = Math.max(0, slow - 1);
      if (slow > 5) {
        slow = 0;
        if (quality > 0.5) {
          quality = quality > 0.7 ? 0.66 : 0.5;
          fpsCap = quality < 0.6 ? 20 : 24;
          window.ITALIA_BG_QUALITY = quality;
          fields.forEach(function (f) { f.resize(); });
        } else if (interval > 95) {
          /* машина не тянет даже минимум: оставляем красивый статичный кадр */
          motion = false;
          main.host.classList.add('is-static');
          if (btnRef) btnRef.hidden = true;
          return;
        }
      }

      if (!hidden && (motion || moving())) raf = requestAnimationFrame(step);
    }

    function kick() { if (!raf && !hidden) { last = 0; raf = requestAnimationFrame(step); } }

    drawAll();
    kick();

    window.addEventListener('resize', function () {
      fields.forEach(function (f) { f.resize(); });
      kick();
    }, { passive: true });
    window.addEventListener('scroll', function () {
      scrollTarget = window.pageYOffset * 0.00022;
      kick();
    }, { passive: true });
    window.addEventListener('pointermove', function (e) {
      mouseTarget[0] = e.clientX / window.innerWidth;
      mouseTarget[1] = 1 - e.clientY / window.innerHeight;
      kick();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (hidden) { cancelAnimationFrame(raf); raf = 0; } else kick();
    });

    /* --- смена настроения по секциям --- */
    var moodEls = Array.prototype.slice.call(document.querySelectorAll('[data-mood]'));
    var currentMood = '';
    function pickMood() {
      var mid = window.innerHeight / 2, best = null, bestD = Infinity;
      for (var i = 0; i < moodEls.length; i++) {
        var r = moodEls[i].getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        var d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < bestD) { bestD = d; best = moodEls[i]; }
      }
      var name = best ? best.getAttribute('data-mood') : 'roma';
      if (name !== currentMood && MOODS[name]) {
        currentMood = name;
        target = MOODS[name];
        main.host.setAttribute('data-mood', name);
        kick();
      }
    }
    pickMood();
    window.addEventListener('scroll', pickMood, { passive: true });
    window.addEventListener('resize', pickMood, { passive: true });

    /* --- переключатель движения: длинную фоновую анимацию нужно уметь выключить --- */
    var btn = btnRef = document.getElementById('motionToggle');
    if (btn) {
      var sync = function () {
        btn.setAttribute('aria-pressed', motion ? 'true' : 'false');
        btn.textContent = motion ? 'Фон: движение включено' : 'Фон: движение выключено';
        document.documentElement.classList.toggle('no-motion', !motion);
      };
      sync();
      btn.hidden = false;
      btn.addEventListener('click', function () {
        motion = !motion;
        try { localStorage.setItem('italia-motion', motion ? 'on' : 'off'); } catch (e) {}
        sync();
        kick();
      });
    }
    if (!motion) document.documentElement.classList.add('no-motion');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
