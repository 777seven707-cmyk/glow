/* ============================================================
   wave.js — лёгкая Canvas2D-анимация «волны» для #waveStage.
   Заменяет прежнюю WebGL-чёрную дыру: несколько наложенных
   синусоидальных лент, которые медленно текут и дышат.
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('waveStage');
  if (!stage) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'wave-canvas';
  stage.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  var RIBBONS = [
    { amp: 0.10, freq: 1.6, speed: 0.35, phase: 0,   y: 0.32, width: 1.4, alpha: 0.55 },
    { amp: 0.14, freq: 1.1, speed: 0.22, phase: 1.4, y: 0.48, width: 1.6, alpha: 0.75 },
    { amp: 0.09, freq: 2.1, speed: 0.30, phase: 2.8, y: 0.58, width: 1.1, alpha: 0.4 },
    { amp: 0.16, freq: 0.9, speed: 0.18, phase: 4.2, y: 0.68, width: 1.8, alpha: 0.9 },
    { amp: 0.07, freq: 2.6, speed: 0.40, phase: 5.6, y: 0.40, width: 1, alpha: 0.3 },
  ];

  function resize() {
    var rect = stage.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function drawRibbon(r, t) {
    var steps = 90;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var nx = i / steps;
      var x = nx * W;
      var y =
        H * r.y +
        Math.sin(nx * Math.PI * 2 * r.freq + t * r.speed + r.phase) * H * r.amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,' + r.alpha + ')';
    ctx.lineWidth = r.width;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,255,255,.35)';
    ctx.shadowBlur = 6;
    ctx.stroke();
  }

  function frame(ts) {
    if (document.hidden) {
      raf = requestAnimationFrame(frame);
      return;
    }
    var t = ts / 1000;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < RIBBONS.length; i++) drawRibbon(RIBBONS[i], t);
    raf = requestAnimationFrame(frame);
  }

  var raf = null;

  function start() {
    resize();
    if (reduceMotion) {
      drawStatic();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < RIBBONS.length; i++) drawRibbon(RIBBONS[i], 0);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduceMotion) drawStatic();
    }, 150);
  });

  start();
  stage.classList.add('is-live');
})();
