/* =========================================================
   Интерактивная волна на первом экране.
   Сетка в перспективе: точки считаются в нормальных координатах
   и делятся на глубину — дальние ряды сходятся к горизонту
   и бледнеют. Рисуется линиями, а не заливками: на тёмном фоне
   это читается как графика и стоит дешевле любого размытия.

   Волну можно двигать мышкой: курсор ведёт её мягко,
   перетаскивание — сильно и с инерцией.
   ========================================================= */
(function () {
  'use strict';

  var ROWS = 26;
  var COLS = 34;
  var MIN_GAP = 33;        // 30 кадров в секунду: волна движется медленно, разницы не видно

  function init() {
    var host = document.getElementById('waveStage');
    if (!host) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouch = window.matchMedia('(hover: none)').matches;

    var canvas = document.createElement('canvas');
    canvas.className = 'wave-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    host.appendChild(canvas);

    var w = 0, h = 0, dpr = 1;

    /* На телефоне экран узкий: сетка проходит прямо по тексту.
       Там она заметно бледнее и реже, иначе абзац не читается. */
    var soft = isTouch ? 0.5 : 1;
    var step = isTouch ? 4 : 3;

    function resize() {
      var r = host.getBoundingClientRect();
      var nw = Math.max(1, r.width);
      var nh = Math.max(1, r.height);
      var ndpr = Math.min(window.devicePixelRatio || 1, 2);
      if (nw === w && nh === h && ndpr === dpr) return;
      w = nw; h = nh; dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ---------- УПРАВЛЕНИЕ ----------
       aim  — куда смотрит курсор, 0..1 по экрану;
       push — сдвиг от перетаскивания, копится и гасится сам. */
    var aimX = 0.5, aimY = 0.5, curX = 0.5, curY = 0.5;
    var pushX = 0, pushY = 0, curPushX = 0, curPushY = 0;
    var velX = 0, velY = 0;
    var dragging = false, lastX = 0, lastY = 0;
    var lift = 0, liftTarget = 0;     // оживление, пока курсор над первым экраном

    var hero = host.closest('.hero');

    if (!isTouch && !reduced) {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        aimX = e.clientX / window.innerWidth;
        aimY = e.clientY / window.innerHeight;
      }, { passive: true });

      if (hero) {
        hero.addEventListener('mouseenter', function () { liftTarget = 1; hero.classList.add('is-awake'); });
        hero.addEventListener('mouseleave', function () { liftTarget = 0; hero.classList.remove('is-awake'); });
      }

      /* Тянуть можно за любое свободное место первого экрана.
         Слушать сам холст бесполезно: поверх него лежит слой с текстом
         и перехватывает мышь почти на всей площади. */
      var surface = hero || canvas;
      surface.classList.add('is-grabbable');

      /* Ссылки, кнопки и поля должны работать как обычно */
      function isControl(el) {
        return !!(el && el.closest && el.closest('a,button,input,textarea,select,label,summary,details'));
      }

      surface.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch' || isControl(e.target)) return;
        dragging = true;
        lastX = e.clientX; lastY = e.clientY;
        velX = velY = 0;
        surface.classList.add('is-grabbing');
        if (surface.setPointerCapture) surface.setPointerCapture(e.pointerId);
        e.preventDefault();
      });

      surface.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        velX = (e.clientX - lastX) / Math.max(1, w);
        velY = (e.clientY - lastY) / Math.max(1, h);
        pushX = Math.max(-1, Math.min(1, pushX + velX * 1.6));
        pushY = Math.max(-1, Math.min(1, pushY + velY * 1.6));
        lastX = e.clientX; lastY = e.clientY;
      });

      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        surface.classList.remove('is-grabbing');
        if (surface.releasePointerCapture && e && e.pointerId != null) {
          try { surface.releasePointerCapture(e.pointerId); } catch (err) {}
        }
      }
      surface.addEventListener('pointerup', endDrag);
      surface.addEventListener('pointercancel', endDrag);
      surface.addEventListener('lostpointercapture', endDrag);
    }

    /* Проекция узла сетки: depth растёт вглубь, координаты делятся на него */
    function project(u, v, t) {
      var depth = 0.55 + v * 2.6;
      var sway = (curX - 0.5) * 0.5 + curPushX * 0.55;
      var amp = 1 + lift * 0.55;                    // над первым экраном волна выше
      var wave =
        Math.sin(u * 3.1 + t * 0.00028 + v * 2.2) * 0.06 * amp +
        Math.cos(v * 5.5 - t * 0.00045) * 0.035 * amp +
        ((curY - 0.5) * 0.06 + curPushY * 0.13) * (1 - v);

      return {
        x: w * (0.5 + ((u - 0.5) * 1.45 + sway * (1 - v)) / depth),
        y: h * (0.46 + (wave - v * 0.2) / (depth * 0.5)),
        fade: Math.max(0, 1 - v * 1.15)
      };
    }

    function draw(t) {
      resize();
      if (w < 2 || h < 2) return;

      curX += (aimX - curX) * 0.03;
      curY += (aimY - curY) * 0.03;
      curPushX += (pushX - curPushX) * 0.06;
      curPushY += (pushY - curPushY) * 0.06;
      lift += (liftTarget - lift) * 0.04;

      /* Отпустили — волна не застывает, а медленно возвращается к покою */
      if (!dragging) { pushX *= 0.992; pushY *= 0.992; }

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;

      var r, c, u, v, p;

      // Поперечные линии — гребни волны
      for (r = 0; r < ROWS; r++) {
        v = r / (ROWS - 1);
        ctx.beginPath();
        for (c = 0; c < COLS; c++) {
          p = project(c / (COLS - 1), v, t);
          if (c === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,' + ((0.06 + (1 - v) * 0.5 * (1 + lift * 0.3)) * soft).toFixed(3) + ')';
        ctx.stroke();
      }

      // Продольные — задают перспективу и глубину кадра
      for (c = 0; c < COLS; c += step) {
        u = c / (COLS - 1);
        ctx.beginPath();
        for (r = 0; r < ROWS; r++) {
          p = project(u, r / (ROWS - 1), t);
          if (r === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.18 * soft).toFixed(3) + ')';
        ctx.stroke();
      }

      // Узлы на ближних рядах — акцент, который ловит глаз
      for (r = 0; r < ROWS; r += 3) {
        v = r / (ROWS - 1);
        for (c = 0; c < COLS; c += step) {
          p = project(c / (COLS - 1), v, t);
          if (p.fade <= 0.05) continue;
          ctx.fillStyle = 'rgba(255,255,255,' + (p.fade * 0.7 * soft).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2 * p.fade + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (reduced) {                     // без движения — один статичный кадр
      draw(0);
      window.addEventListener('resize', function () { draw(0); });
      return;
    }

    var last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      var gap = dragging ? 16 : MIN_GAP;
      if (now - last < gap) return;
      last = now;

      var box = host.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;   // вне экрана не считаем
      draw(now);
    }
    requestAnimationFrame(frame);

    window.addEventListener('resize', resize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
