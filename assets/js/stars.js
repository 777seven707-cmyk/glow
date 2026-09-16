/* =========================================================
   Сияющие точки на фоне секций.
   Рисуются на одном холсте позади всей страницы: звёзды
   мерцают сами и медленно плывут вверх от прокрутки.
   Холст один на весь сайт — это дешевле, чем канвас в каждой секции.
   ========================================================= */
(function () {
  'use strict';

  var COUNT = 90;           // на широком экране; на телефоне меньше
  var MIN_GAP = 40;         // 25 кадров в секунду: мерцание медленное

  function init() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var canvas = document.createElement('canvas');
    canvas.className = 'stars';
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    document.body.appendChild(canvas);

    var small = window.innerWidth < 760;
    var count = small ? 45 : COUNT;
    var stars = [];
    var w = 0, h = 0, dpr = 1;

    /* Координаты звёзд в долях экрана: при смене размера окна
       пересчитывать их заново не нужно, картинка не перестраивается. */
    function seed() {
      stars.length = 0;
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.4 + Math.random() * 1.5,          // радиус в пикселях
          base: 0.15 + Math.random() * 0.5,      // своя яркость
          speed: 0.4 + Math.random() * 1.1,      // скорость мерцания
          phase: Math.random() * Math.PI * 2,
          drift: 0.15 + Math.random() * 0.5,     // насколько сильно тянется за прокруткой
          big: Math.random() > 0.9               // каждая десятая — с лучиками
        });
      }
    }

    function resize() {
      var nw = window.innerWidth;
      var nh = window.innerHeight;
      var ndpr = Math.min(window.devicePixelRatio || 1, 2);
      if (nw === w && nh === h && ndpr === dpr) return;
      w = nw; h = nh; dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      resize();
      ctx.clearRect(0, 0, w, h);
      var scroll = window.pageYOffset;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];

        /* Звезда уезжает вверх медленнее страницы и заворачивается
           по кругу — поле никогда не заканчивается. */
        var y = (s.y * h - scroll * s.drift * 0.25) % h;
        if (y < 0) y += h;
        var x = s.x * w;

        var blink = 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        var a = s.base * blink;
        if (a <= 0.02) continue;

        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
        ctx.fill();

        /* Крупные — с мягким ореолом и короткими лучиками */
        if (s.big) {
          var g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 9);
          g.addColorStop(0, 'rgba(255,255,255,' + (a * 0.5).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, s.r * 9, 0, Math.PI * 2);
          ctx.fill();

          var len = s.r * 5 * blink;
          ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.45).toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x - len, y); ctx.lineTo(x + len, y);
          ctx.moveTo(x, y - len); ctx.lineTo(x, y + len);
          ctx.stroke();
        }
      }
    }

    seed();
    resize();

    if (reduced) {                 // без мерцания — один статичный кадр
      draw(0);
      window.addEventListener('resize', function () { draw(0); });
      return;
    }

    var last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (now - last < MIN_GAP) return;
      last = now;
      draw(now);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
