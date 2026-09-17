/* =========================================================
   ITALIA — Колизей
   1) Фасад на первом экране: строится процедурно, 80 арок,
      перспектива по эллипсу, смена времени суток, подсветка арок.
   2) Разрез с подписанными слоями в секции «Колизей».
   Ванильный JS, SVG собирается в рантайме.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) {
    return [0, 1, 2].map(function (i) { return Math.round(lerp(c1[i], c2[i], t)); });
  }
  function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

  /* =======================================================
     1. ФАСАД НА ПЕРВОМ ЭКРАНЕ
     ======================================================= */

  var W = 1200, H = 620;            // система координат SVG
  var CX = 600;                     // центр эллипса
  var A = 452;                      // большая полуось в пикселях
  var TILT = 40;                    // насколько «проседает» ближняя часть кольца
  var BASE = 470;                   // линия земли у краёв
  var HGT = 292;                    // высота внешней стены
  var N = 26;                       // видимых пролётов на переднем полукольце
  var TH = [0.235, 0.245, 0.235, 0.285];  // доли высоты: 3 яруса + аттик
  var SPAN = 1.36;                  // до какого угла показываем кольцо (рад)

  function bayX(i) { return CX + A * Math.sin(-SPAN + (2 * SPAN * i) / N); }
  function bayY(i) { return BASE + TILT * Math.cos(-SPAN + (2 * SPAN * i) / N); }

  /* кривая низа/верха кольца: путь по сэмплам угла */
  function ringPath(offsetTop, offsetBottom, from, to) {
    var d = '', i, x, y;
    for (i = from; i <= to; i++) { x = bayX(i); y = bayY(i) - offsetTop; d += (i === from ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1); }
    for (i = to; i >= from; i--) { x = bayX(i); y = bayY(i) - offsetBottom; d += 'L' + x.toFixed(1) + ' ' + y.toFixed(1); }
    return d + 'Z';
  }

  var facadeSeq = 0;

  function buildFacade(svg, uid) {
    var defs = el('defs', null, svg);

    var sky = el('linearGradient', { id: 'cs-sky-' + uid, gradientUnits: 'userSpaceOnUse', x1: 0, y1: -380, x2: 0, y2: 560 }, defs);
    el('stop', { offset: '0', 'stop-color': 'var(--sky-1)' }, sky);
    el('stop', { offset: '0.55', 'stop-color': 'var(--sky-2)' }, sky);
    el('stop', { offset: '1', 'stop-color': 'var(--sky-3)' }, sky);

    var stone = el('linearGradient', { id: 'cs-stone-' + uid, x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': 'var(--stone-hi)' }, stone);
    el('stop', { offset: '1', 'stop-color': 'var(--stone-lo)' }, stone);

    var sunGlow = el('radialGradient', { id: 'cs-sunglow-' + uid }, defs);
    el('stop', { offset: '0', 'stop-color': 'var(--sun)', 'stop-opacity': '.85' }, sunGlow);
    el('stop', { offset: '1', 'stop-color': 'var(--sun)', 'stop-opacity': '0' }, sunGlow);

    var archGrad = el('linearGradient', { id: 'cs-arch-' + uid, x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': 'var(--arch-lo)' }, archGrad);
    el('stop', { offset: '1', 'stop-color': 'var(--arch-hi)' }, archGrad);

    /* небо и светило */
    el('rect', { x: -900, y: -2400, width: W + 1800, height: H + 2400, fill: 'url(#cs-sky-' + uid + ')' }, svg);

    var stars = el('g', { class: 'cs-stars' }, svg);
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var s = 0; s < 190; s++) {
      el('circle', { cx: (rnd() * (W + 600) - 300).toFixed(1), cy: (rnd() * 1500 - 1180).toFixed(1), r: (rnd() * 1.3 + .3).toFixed(2), fill: '#fff', opacity: (rnd() * .7 + .2).toFixed(2) }, stars);
    }

    var lightG = el('g', { class: 'cs-light' }, svg);
    el('circle', { class: 'cs-halo', cx: 0, cy: 0, r: 190, fill: 'url(#cs-sunglow-' + uid + ')' }, lightG);
    el('circle', { class: 'cs-disc', cx: 0, cy: 0, r: 34, fill: 'var(--sun)' }, lightG);

    /* дальние холмы */
    var hills = el('g', { class: 'cs-hills' }, svg);
    el('path', { d: 'M0 452 C 120 420 210 438 300 430 C 420 420 470 402 600 408 C 740 414 820 428 940 424 C 1060 420 1140 436 1200 430 L1200 620 L0 620 Z', fill: 'var(--hill-far)' }, hills);
    el('path', { d: 'M0 486 C 160 470 260 482 380 476 C 520 469 640 456 760 464 C 900 473 1060 486 1200 478 L1200 620 L0 620 Z', fill: 'var(--hill-near)' }, hills);

    /* тень под зданием */
    el('ellipse', { class: 'cs-shadow', cx: CX, cy: BASE + TILT + 16, rx: A + 30, ry: 26 }, svg);

    var ruinFrom = Math.round(N * 0.56);   // отсюда внешнее кольцо обрушено

    /* --- внутреннее кольцо (видно за обрушенной частью) --- */
    var inner = el('g', { class: 'cs-inner' }, svg);
    var innerH = HGT * 0.54;
    el('path', { d: ringPath(innerH, -6, ruinFrom - 2, N), fill: 'var(--stone-shadow)' }, inner);
    for (var b = ruinFrom - 2; b < N; b++) {
      var x0 = bayX(b), x1 = bayX(b + 1), w = x1 - x0;
      if (w < 7) continue;
      var yb = bayY(b) - 6, r = (w - 8) / 2;
      if (r < 3) continue;
      el('path', {
        d: 'M' + (x0 + 4) + ' ' + yb + ' L' + (x0 + 4) + ' ' + (yb - innerH * 0.46) +
           ' A' + r + ' ' + r + ' 0 0 1 ' + (x1 - 4) + ' ' + (yb - innerH * 0.46) +
           ' L' + (x1 - 4) + ' ' + yb + ' Z',
        fill: 'var(--arch-deep)', opacity: '.8'
      }, inner);
      /* щербатый верх внутренней стены */
      el('rect', { x: (x0 + 3).toFixed(1), y: (bayY(b) - innerH - (b % 3) * 5 - 4).toFixed(1),
                   width: Math.max(2, w - 6).toFixed(1), height: ((b % 3) * 5 + 8).toFixed(1),
                   fill: 'var(--stone-shadow)' }, inner);
    }

    /* --- внешнее кольцо --- */
    var outer = el('g', { class: 'cs-outer' }, svg);
    var tiers = [], acc = 0, t;
    for (t = 0; t < 4; t++) { tiers.push({ from: acc, to: acc + TH[t] * HGT }); acc += TH[t] * HGT; }
    /* уцелевшая часть: чем выше ярус, тем раньше он обрывается — так читается руина */
    var tierEnd = [Math.min(N, ruinFrom + 3), Math.min(N, ruinFrom + 2), Math.min(N, ruinFrom + 1), ruinFrom];

    for (t = 0; t < 4; t++) {
      el('path', {
        class: 'cs-band cs-band--' + (t + 1),
        d: ringPath(tiers[t].to, tiers[t].from - (t === 0 ? 4 : 0), 0, tierEnd[t]),
        fill: 'url(#cs-stone-' + uid + ')'
      }, outer);
      el('path', { class: 'cs-cornice', d: ringPath(tiers[t].to, tiers[t].to - 7, 0, tierEnd[t]), fill: 'var(--stone-edge)' }, outer);
    }

    /* арки и колонны */
    var arches = el('g', { class: 'cs-arches' }, outer);
    for (var i = 0; i < N; i++) {
      var ax0 = bayX(i), ax1 = bayX(i + 1), bw = ax1 - ax0;
      if (bw < 5) continue;
      var bay = el('g', { class: 'cs-bay', 'data-bay': i }, arches);
      var pad = Math.min(9, bw * 0.19);
      for (t = 0; t < 3; t++) {
        if (i >= tierEnd[t]) continue;
        var yBot = bayY(i) - tiers[t].from - (t === 0 ? 2 : 0);
        var yTop = bayY(i) - tiers[t].to + 12;
        var aw = bw - pad * 2, ar = aw / 2;
        if (ar < 2.5) continue;
        var spring = yTop + ar * 0.55;
        el('path', {
          class: 'cs-archway',
          d: 'M' + (ax0 + pad).toFixed(1) + ' ' + yBot.toFixed(1) +
             ' L' + (ax0 + pad).toFixed(1) + ' ' + spring.toFixed(1) +
             ' A' + ar.toFixed(1) + ' ' + ar.toFixed(1) + ' 0 0 1 ' + (ax1 - pad).toFixed(1) + ' ' + spring.toFixed(1) +
             ' L' + (ax1 - pad).toFixed(1) + ' ' + yBot.toFixed(1) + ' Z'
        }, bay);
        if (bw > 16) {
          el('rect', {
            class: 'cs-column', x: (ax1 - pad * 0.62).toFixed(1), y: (bayY(i) - tiers[t].to + 10).toFixed(1),
            width: Math.max(1.6, pad * 0.34).toFixed(1), height: (tiers[t].to - tiers[t].from - 12).toFixed(1)
          }, bay);
        }
      }
      /* аттик: окна через пролёт и пилястры */
      if (i < tierEnd[3] && bw > 12) {
        var atY = bayY(i) - tiers[3].to + 10, atH = tiers[3].to - tiers[3].from - 16;
        if (i % 2 === 0) {
          el('rect', { class: 'cs-window', x: (ax0 + bw * 0.34).toFixed(1), y: (atY + atH * 0.22).toFixed(1), width: (bw * 0.3).toFixed(1), height: (atH * 0.42).toFixed(1) }, bay);
        }
        el('rect', { class: 'cs-pilaster', x: (ax1 - 2).toFixed(1), y: atY.toFixed(1), width: '2.4', height: atH.toFixed(1) }, bay);
      }
    }

    /* основание — ступени по периметру */
    el('path', { class: 'cs-base', d: ringPath(-2, -12, 0, N), fill: 'var(--stone-lo)', opacity: '.85' }, outer);

    /* птицы */
    var birds = el('g', { class: 'cs-birds' }, svg);
    [[180, 150, 1], [230, 128, .8], [286, 162, .62], [980, 118, .9], [1030, 142, .7]].forEach(function (b) {
      el('path', { d: 'M0 0 q 7 -6 13 0 q 6 -6 13 0', transform: 'translate(' + b[0] + ',' + b[1] + ') scale(' + b[2] + ')', fill: 'none', stroke: 'var(--bird)', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, birds);
    });

    return { ruinFrom: ruinFrom };
  }

  /* --- палитра времени суток --- */
  var SKY_KEYS = [
    { t: 0,  a: [8, 10, 24],   b: [14, 16, 34],  c: [26, 24, 44],  sun: [214, 226, 255], stoneHi: [92, 86, 96],  stoneLo: [44, 42, 54],  night: 1 },
    { t: 5,  a: [22, 24, 54],  b: [62, 44, 74],  c: [122, 74, 78], sun: [255, 196, 150], stoneHi: [128, 108, 104], stoneLo: [62, 56, 62], night: .55 },
    { t: 7,  a: [76, 106, 168],b: [190, 146, 128],c: [236, 186, 142], sun: [255, 214, 158], stoneHi: [214, 178, 140], stoneLo: [126, 102, 84], night: .12 },
    { t: 12, a: [74, 134, 196],b: [146, 186, 224],c: [214, 226, 232], sun: [255, 248, 224], stoneHi: [238, 222, 192], stoneLo: [150, 132, 108], night: 0 },
    { t: 17, a: [86, 128, 186],b: [206, 158, 126],c: [238, 178, 128], sun: [255, 206, 146], stoneHi: [230, 190, 146], stoneLo: [136, 108, 86], night: .08 },
    { t: 19, a: [40, 52, 104], b: [146, 78, 88],  c: [214, 122, 92], sun: [255, 166, 116], stoneHi: [176, 132, 108], stoneLo: [84, 68, 70], night: .45 },
    { t: 21, a: [12, 16, 40],  b: [30, 28, 58],   c: [58, 42, 62],  sun: [226, 232, 255], stoneHi: [104, 92, 94],  stoneLo: [48, 44, 54], night: .92 },
    { t: 24, a: [8, 10, 24],   b: [14, 16, 34],   c: [26, 24, 44],  sun: [214, 226, 255], stoneHi: [92, 86, 96],  stoneLo: [44, 42, 54],  night: 1 }
  ];

  function skyAt(time) {
    var i = 0;
    while (i < SKY_KEYS.length - 2 && time > SKY_KEYS[i + 1].t) i++;
    var k1 = SKY_KEYS[i], k2 = SKY_KEYS[i + 1];
    var p = (time - k1.t) / (k2.t - k1.t);
    return {
      a: mix(k1.a, k2.a, p), b: mix(k1.b, k2.b, p), c: mix(k1.c, k2.c, p),
      sun: mix(k1.sun, k2.sun, p),
      stoneHi: mix(k1.stoneHi, k2.stoneHi, p), stoneLo: mix(k1.stoneLo, k2.stoneLo, p),
      night: lerp(k1.night, k2.night, p)
    };
  }

  function initFacade(host, opts) {
    if (!host) return;
    opts = opts || {};

    var uid = 'f' + (++facadeSeq);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMax slice', class: 'cs-svg', 'aria-hidden': 'true', focusable: 'false' }, host);
    /* на вертикальном экране здание не обрезаем, а вписываем целиком */
    var portrait = window.matchMedia('(max-aspect-ratio: 1/1)');
    function fitMode() { svg.setAttribute('preserveAspectRatio', portrait.matches ? 'xMidYMax meet' : 'xMidYMax slice'); }
    fitMode();
    if (portrait.addEventListener) portrait.addEventListener('change', fitMode);
    else if (portrait.addListener) portrait.addListener(fitMode);
    var built = buildFacade(svg, uid);

    var disc = svg.querySelector('.cs-disc'), halo = svg.querySelector('.cs-halo');
    var slider = opts.slider ? document.querySelector(opts.slider) : null;
    var label = opts.label ? document.querySelector(opts.label) : null;
    var time = typeof opts.time === 'number' ? opts.time : 9.2;
    var auto = !reduced && opts.auto === true, lastTs = 0;

    function paint(tm) {
      var s = skyAt(tm);
      host.style.setProperty('--sky-1', rgb(s.a));
      host.style.setProperty('--sky-2', rgb(s.b));
      host.style.setProperty('--sky-3', rgb(s.c));
      host.style.setProperty('--sun', rgb(s.sun));
      host.style.setProperty('--stone-hi', rgb(s.stoneHi));
      host.style.setProperty('--stone-lo', rgb(s.stoneLo));
      host.style.setProperty('--stone-mid', rgb(mix(s.stoneHi, s.stoneLo, .5)));
      host.style.setProperty('--stone-edge', rgb(mix(s.stoneHi, [255, 255, 255], .18)));
      host.style.setProperty('--stone-shadow', rgb(mix(s.stoneLo, [6, 6, 9], .5)));
      /* ночью проёмы теплеют: как подсветка изнутри */
      host.style.setProperty('--arch-deep', rgb(mix(mix(s.stoneLo, [8, 7, 10], .72), [92, 52, 18], s.night * .55)));
      host.style.setProperty('--arch-lo', rgb(mix(s.stoneLo, [8, 7, 10], .6)));
      host.style.setProperty('--arch-hi', rgb(mix(s.stoneLo, [8, 7, 10], .85)));
      host.style.setProperty('--hill-far', rgb(mix(s.b, [52, 47, 58], .58)));
      host.style.setProperty('--hill-near', rgb(mix(s.c, [34, 30, 38], .62)));
      host.style.setProperty('--bird', rgb(mix(s.stoneLo, [10, 10, 12], .5)));
      host.style.setProperty('--night', s.night.toFixed(3));

      /* положение светила: 6:00 — восход слева, 18:00 — закат справа */
      var day = tm >= 6 && tm <= 18;
      var p = day ? (tm - 6) / 12 : ((tm > 18 ? tm - 18 : tm + 6) / 12);
      var x = 90 + p * (W - 180);
      var y = 372 - Math.sin(p * Math.PI) * 316;
      disc.setAttribute('cx', x.toFixed(1)); disc.setAttribute('cy', y.toFixed(1));
      disc.setAttribute('r', day ? 34 : 22);
      halo.setAttribute('cx', x.toFixed(1)); halo.setAttribute('cy', y.toFixed(1));
      halo.setAttribute('r', day ? 190 : 120);

      if (label) {
        var hh = Math.floor(tm) % 24, mm = Math.floor((tm % 1) * 60);
        label.textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
      }
    }

    paint(time);
    if (slider) {
      slider.value = time;
      slider.addEventListener('input', function () { auto = false; time = parseFloat(slider.value); paint(time); });
    }

    /* сутки примерно за минуту, пока пользователь не взялся за ползунок */
    if (!reduced && opts.auto === true) {
      (function loop(ts) {
        if (auto && lastTs) {
          time = (time + (ts - lastTs) / 1000 * 0.42) % 24;
          paint(time);
          if (slider) slider.value = time;
        }
        lastTs = ts;
        requestAnimationFrame(loop);
      })(0);
    }

    /* параллакс и подсветка арок под курсором */
    if (!reduced && !window.matchMedia('(hover: none)').matches) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        host.style.setProperty('--par-x', (dx * 26).toFixed(2) + 'px');
        host.style.setProperty('--par-y', (dy * 12).toFixed(2) + 'px');
        host.style.setProperty('--par-sky-x', (dx * -10).toFixed(2) + 'px');
      });
      host.addEventListener('pointerleave', function () {
        host.style.setProperty('--par-x', '0px'); host.style.setProperty('--par-y', '0px'); host.style.setProperty('--par-sky-x', '0px');
      });
    }

    /* постройка: арки проявляются волной */
    if (!reduced) {
      var bays = svg.querySelectorAll('.cs-bay');
      Array.prototype.forEach.call(bays, function (b, i) { b.style.setProperty('--d', (i * 34 + 220) + 'ms'); });
      requestAnimationFrame(function () { svg.classList.add('is-built'); });
    } else {
      svg.classList.add('is-built');
    }

    return built;
  }

  /* =======================================================
     2. РАЗРЕЗ
     ======================================================= */

  function initSection() {
    var host = document.getElementById('csCut');
    if (!host || !window.ITALIA) return;
    var data = window.ITALIA.COLOSSEUM;

    var VW = 940, VH = 482, cx = VW / 2, ground = 372, arenaHalf = 118, wallHalf = 430, wallTop = 92;

    var svg = el('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 'cut-svg', role: 'img', 'aria-label': 'Разрез Колизея: веларий, аттик, ярусы трибун, арена и подземелья' }, host);
    var defs = el('defs', null, svg);
    var g1 = el('linearGradient', { id: 'cut-stone', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#eadfcc' }, g1);
    el('stop', { offset: 1, 'stop-color': '#c4b096' }, g1);

    /* веларий */
    var vel = el('g', { class: 'cut-layer', 'data-layer': 'velarium' }, svg);
    el('path', { d: 'M' + (cx - wallHalf) + ' ' + wallTop + ' Q ' + cx + ' ' + (wallTop - 62) + ' ' + (cx + wallHalf) + ' ' + wallTop, class: 'cut-velarium' }, vel);
    for (var m = 0; m <= 16; m++) {
      var mx = cx - wallHalf + (m / 16) * wallHalf * 2;
      var my = wallTop - 62 * (1 - Math.pow((m / 16 - .5) * 2, 2)) * .75;
      el('line', { x1: mx, y1: wallTop, x2: mx, y2: my, class: 'cut-mast' }, vel);
    }

    /* внешние стены с четырьмя ярусами */
    [-1, 1].forEach(function (side) {
      var x = cx + side * wallHalf;
      var wall = el('g', { class: 'cut-layer', 'data-layer': side < 0 ? 'orders' : 'attic' }, svg);
      el('path', {
        d: 'M' + x + ' ' + ground + ' L' + x + ' ' + wallTop + ' L' + (x - side * 34) + ' ' + wallTop + ' L' + (x - side * 30) + ' ' + ground + ' Z',
        fill: 'url(#cut-stone)', class: 'cut-wall'
      }, wall);
      [0, 1, 2, 3].forEach(function (t) {
        var y = wallTop + (ground - wallTop) * (t / 4);
        el('line', { x1: x, y1: y, x2: x - side * 34, y2: y, class: 'cut-hair' }, wall);
      });
      for (var t2 = 1; t2 < 4; t2++) {
        var yy = wallTop + (ground - wallTop) * (t2 / 4) + 16;
        el('rect', { x: Math.min(x, x - side * 26), y: yy, width: 26, height: 30, rx: 13, class: 'cut-archhole' }, wall);
      }
    });

    /* трибуны: ступени от арены к стене */
    var seats = el('g', { class: 'cut-layer', 'data-layer': 'seats' }, svg);
    var steps = 15;
    [-1, 1].forEach(function (side) {
      var d = 'M' + (cx + side * arenaHalf) + ' ' + ground;
      for (var i = 0; i < steps; i++) {
        var x0 = cx + side * (arenaHalf + (wallHalf - arenaHalf - 34) * (i / steps));
        var x1 = cx + side * (arenaHalf + (wallHalf - arenaHalf - 34) * ((i + 1) / steps));
        var y0 = ground - (ground - wallTop - 30) * (i / steps);
        var y1 = ground - (ground - wallTop - 30) * ((i + 1) / steps);
        d += 'L' + x0.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x1.toFixed(1) + ' ' + y1.toFixed(1);
        void y0;
      }
      d += 'L' + (cx + side * (wallHalf - 30)) + ' ' + ground + 'Z';
      el('path', { d: d, class: 'cut-seats' }, seats);
    });

    /* подписи сословий */
    [['подиум · сенаторы', cx - arenaHalf - 10, ground - 14],
     ['всадники', cx - arenaHalf - 74, ground - 72],
     ['граждане', cx - arenaHalf - 140, ground - 130],
     ['дерево · бедняки', cx - arenaHalf - 200, ground - 188]].forEach(function (lb) {
      el('text', { x: lb[1], y: lb[2], class: 'cut-tag', 'text-anchor': 'end' }, seats).textContent = lb[0];
    });

    /* арена */
    var arena = el('g', { class: 'cut-layer', 'data-layer': 'arena' }, svg);
    el('rect', { x: cx - arenaHalf, y: ground - 8, width: arenaHalf * 2, height: 8, class: 'cut-arena' }, arena);
    for (var s2 = 0; s2 < 26; s2++) {
      el('line', { x1: cx - arenaHalf + s2 * 9.2, y1: ground - 8, x2: cx - arenaHalf + s2 * 9.2 + 5, y2: ground, class: 'cut-sand' }, arena);
    }

    /* субструкция: сплошное основание под трибунами */
    el('rect', { x: cx - wallHalf, y: ground, width: wallHalf * 2, height: 86, class: 'cut-substr' }, svg);

    /* гипогей */
    var hypo = el('g', { class: 'cut-layer', 'data-layer': 'hypogeum' }, svg);
    el('rect', { x: cx - arenaHalf - 6, y: ground, width: (arenaHalf + 6) * 2, height: 86, class: 'cut-hypo' }, hypo);
    for (var c = 0; c < 9; c++) {
      var hx = cx - arenaHalf + 12 + c * 26;
      el('rect', { x: hx, y: ground + 10, width: 14, height: 30, class: 'cut-cell' }, hypo);
      el('rect', { x: hx, y: ground + 48, width: 14, height: 26, class: 'cut-cell' }, hypo);
    }
    el('line', { x1: cx - arenaHalf - 6, y1: ground + 44, x2: cx + arenaHalf + 6, y2: ground + 44, class: 'cut-hair' }, hypo);
    [-70, 0, 70].forEach(function (off) {
      el('path', { d: 'M' + (cx + off) + ' ' + (ground + 40) + ' L' + (cx + off) + ' ' + (ground - 6), class: 'cut-lift' }, hypo);
      el('path', { d: 'M' + (cx + off - 7) + ' ' + (ground - 6) + ' l7 -9 l7 9 Z', class: 'cut-liftcap' }, hypo);
    });

    /* земля */
    el('line', { x1: 20, y1: ground + 86, x2: VW - 20, y2: ground + 86, class: 'cut-ground' }, svg);
    el('rect', { x: cx - wallHalf - 30, y: ground, width: 30, height: 86, class: 'cut-soil' }, svg);
    el('rect', { x: cx + wallHalf, y: ground, width: 30, height: 86, class: 'cut-soil' }, svg);

    /* точки-хотспоты */
    var spots = {
      velarium: [cx, wallTop - 46], attic: [cx + wallHalf - 18, wallTop + 26], orders: [cx - wallHalf + 18, ground - 70],
      seats: [cx - 250, ground - 110], arena: [cx + 46, ground - 22], hypogeum: [cx - 40, ground + 56],
      gates: [cx + wallHalf - 18, ground - 40], stone: [cx - wallHalf + 18, wallTop + 26]
    };
    var hot = el('g', { class: 'cut-hotspots' }, svg);
    data.forEach(function (item) {
      var p = spots[item.id]; if (!p) return;
      var g = el('g', { class: 'cut-spot', 'data-id': item.id, tabindex: '0', role: 'button', 'aria-label': item.title }, hot);
      el('circle', { cx: p[0], cy: p[1], r: 15, class: 'cut-spot__ring' }, g);
      el('circle', { cx: p[0], cy: p[1], r: 15, class: 'cut-spot__pulse' }, g);
      el('text', { x: p[0], y: p[1] + 4, class: 'cut-spot__n', 'text-anchor': 'middle' }, g).textContent = item.n;
    });

    /* панель с текстом */
    var panel = document.getElementById('csPanel');
    var list = document.getElementById('csList');
    function show(id) {
      var item = data.filter(function (d) { return d.id === id; })[0];
      if (!item || !panel) return;
      panel.innerHTML = '<span class="cut-panel__n">' + item.n + '</span><h3>' + item.title + '</h3><p>' + item.text + '</p>';
      panel.classList.remove('is-swap');
      void panel.offsetWidth;
      panel.classList.add('is-swap');
      Array.prototype.forEach.call(svg.querySelectorAll('.cut-spot'), function (s) { s.classList.toggle('is-on', s.getAttribute('data-id') === id); });
      Array.prototype.forEach.call(svg.querySelectorAll('.cut-layer'), function (l) { l.classList.toggle('is-on', l.getAttribute('data-layer') === id); });
      if (list) Array.prototype.forEach.call(list.children, function (li) { li.classList.toggle('is-on', li.getAttribute('data-id') === id); });
    }

    Array.prototype.forEach.call(svg.querySelectorAll('.cut-spot'), function (s) {
      s.addEventListener('click', function () { show(s.getAttribute('data-id')); });
      s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(s.getAttribute('data-id')); } });
      s.addEventListener('mouseenter', function () { show(s.getAttribute('data-id')); });
    });

    /* дублирующий список — он же навигация с клавиатуры */
    if (list) {
      list.innerHTML = data.map(function (d) {
        return '<li data-id="' + d.id + '"><button type="button"><em>' + d.n + '</em> ' + d.title + '</button></li>';
      }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () { show(b.parentNode.getAttribute('data-id')); });
      });
    }

    show('arena');
  }

  function boot() {
    /* запасной вид в медиа-карточке: утренний свет, без автосмены */
    initFacade(document.getElementById('csHero'), { time: 9.2, auto: false });
    /* интерактивный блок в секции про Колизей */
    initFacade(document.getElementById('csDay'), { time: 8.4, auto: true, slider: '#csTime', label: '#csTimeLabel' });
    initSection();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
