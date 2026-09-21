/* ============================================================
   stars.js — фоновая звёздная плоскость на всю страницу.
   Canvas фиксирован (position:fixed, z-index:-1), поэтому
   виден только там, где секции не задают собственный фон
   (обычный .section — прозрачный, .section--dark — нет).
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.id = 'starsCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;display:block';
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var stars = [];

  function rand(seedObj) {
    seedObj.s = (seedObj.s * 9301 + 49297) % 233280;
    return seedObj.s / 233280;
  }

  function build() {
    var seed = { s: 42 };
    var count = Math.round((W * H) / 9000);
    count = Math.max(70, Math.min(220, count));
    stars = [];
    for (var i = 0; i < count; i++) {
      var r = rand(seed);
      var size = r < 0.6 ? 1 : r < 0.88 ? 1.6 : r < 0.97 ? 2.2 : 3;
      stars.push({
        x: rand(seed) * W,
        y: rand(seed) * H,
        size: size,
        baseAlpha: 0.15 + rand(seed) * 0.25,
        amp: 0.35 + rand(seed) * 0.45,
        speed: 0.4 + rand(seed) * 1.1,
        phase: rand(seed) * Math.PI * 2,
        glow: size >= 2.2,
      });
    }
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var alpha = reduceMotion
        ? s.baseAlpha + s.amp * 0.3
        : s.baseAlpha + s.amp * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
      if (s.glow) {
        ctx.shadowColor = 'rgba(255,255,255,.5)';
        ctx.shadowBlur = s.size * 2.5;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
  }

  var raf = null;
  function loop(ts) {
    if (!document.hidden) drawFrame(ts);
    raf = requestAnimationFrame(loop);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
  if (reduceMotion) {
    drawFrame(0);
  } else {
    raf = requestAnimationFrame(loop);
  }
})();
