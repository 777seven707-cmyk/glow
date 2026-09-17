/* =========================================================
   ITALIA — движение
   Плавный скролл (Lenis), кинематографический первый экран,
   закреплённая галерея городов, курсор с подписями, занавес,
   разбивка текста, наклон карточек, раскрытие фотографий,
   скос по скорости, полоса прогресса и активный пункт меню.
   Всё уважает prefers-reduced-motion и переключатель движения.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lenis = null;

  /* ---------- 1. ПЛАВНЫЙ СКРОЛЛ ---------- */
  function initLenis() {
    if (reduced || !window.Lenis) return;
    lenis = new window.Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },  /* expo out */
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.7,
      lerp: null
    });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    window.ITALIA_LENIS = lenis;

    /* ссылки-якоря ведёт тот же скролл, иначе прыжок выбивается из общего ритма */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -10, duration: 1.4 });
    });
  }

  /* ---------- 2. ЗАНАВЕС ---------- */
  function initCurtain() {
    var c = $('#curtain');
    if (!c) return;
    if (reduced) { c.classList.add('is-gone'); return; }
    if (lenis) lenis.stop();
    var done = function () {
      c.classList.add('is-done');
      if (lenis) lenis.start();
      setTimeout(function () { c.classList.add('is-gone'); }, 1300);
      document.documentElement.classList.add('is-revealed');
    };
    var t = setTimeout(done, 1050);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { clearTimeout(t); setTimeout(done, 380); });
    }
  }

  /* ---------- 3. РАЗБИВКА ТЕКСТА ---------- */
  function splitWords(el, mode) {
    if (el.dataset.split) return;
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var html = '';

    function words(text) {
      var out = '';
      text.split(/(\s+)/).forEach(function (w) {
        if (!w.trim()) { out += w.replace(/\s/g, ' '); return; }
        if (mode === 'char') {
          out += '<span class="mv__w">' + w.split('').map(function (ch) {
            return '<span class="mv__i">' + ch + '</span>';
          }).join('') + '</span>';
        } else {
          out += '<span class="mv__w"><span class="mv__i">' + w + '</span></span>';
        }
      });
      return out;
    }

    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) { html += words(node.textContent || ''); return; }
      var cls = node.getAttribute && node.getAttribute('class') ? node.getAttribute('class') : '';
      if (node.tagName === 'EM') cls = (cls + ' mv__accent').trim();
      html += '<span class="' + cls + '">' + words(node.textContent || '') + '</span>';
    });

    el.innerHTML = '<span class="mv" aria-hidden="true">' + html + '</span>';
    el.setAttribute('aria-label', label);
    el.dataset.split = mode;

    var stepMs = mode === 'char' ? 24 : 58;
    $$('.mv__i', el).forEach(function (it, i) { it.style.transitionDelay = (i * stepMs) + 'ms'; });
  }

  function initSplit() {
    $$('.hero__line').forEach(function (line) { splitWords(line, 'char'); line.classList.add('mv-host'); });
    /* заголовок ждёт, пока уйдёт занавес */
    setTimeout(function () {
      $$('.hero__line').forEach(function (l) { l.classList.add('is-shown'); });
    }, reduced ? 0 : 900);

    var titles = $$('.sec-title').concat($$('.footer__big')).concat($$('.hero__over-t'));
    titles.forEach(function (t) { splitWords(t, 'word'); t.classList.add('mv-host'); });

    if (!('IntersectionObserver' in window) || reduced) {
      titles.forEach(function (t) { t.classList.add('is-shown'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-shown');
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    titles.forEach(function (t) { io.observe(t); });
  }

  /* ---------- 4. ПЕРВЫЙ ЭКРАН: РАСКРЫТИЕ КАДРА ---------- */
  function initHeroScrub() {
    var rig = $('#heroRig'), hero = $('.hero');
    if (!rig || !hero) return;
    var narrow = window.matchMedia('(max-width: 768px)');
    var ticking = false;

    function update() {
      ticking = false;
      if (narrow.matches) { hero.style.setProperty('--exp', '1'); return; }
      var r = rig.getBoundingClientRect();
      var span = rig.offsetHeight - window.innerHeight;
      var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
      /* кадр раскрывается на первых двух третях пути, дальше просто держится */
      hero.style.setProperty('--exp', Math.pow(clamp(p / 0.66, 0, 1), 0.85).toFixed(4));
    }
    addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- 5. ЗАКРЕПЛЁННАЯ ГАЛЕРЕЯ ---------- */
  function initPin() {
    var rig = $('#citiesRig');
    if (!rig) return;
    var row = $('.pin__row', rig), view = $('.pin__viewport', rig);
    if (!row || !view) return;
    var wide = window.matchMedia('(min-width: 901px)');
    var ticking = false;

    function update() {
      ticking = false;
      if (!wide.matches) { row.style.setProperty('--px', '0px'); return; }
      var r = rig.getBoundingClientRect();
      var span = rig.offsetHeight - window.innerHeight;
      var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
      var max = Math.max(0, row.scrollWidth - view.clientWidth);
      row.style.setProperty('--px', (p * max).toFixed(1) + 'px');
    }
    addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    setTimeout(update, 300);
    update();
  }

  /* ---------- 6. КУРСОР С ПОДПИСЬЮ ---------- */
  function initCursor() {
    var cur = $('#cursor');
    if (!cur || !fine || reduced) return;
    var ring = $('.cursor__ring', cur), dot = $('.cursor__dot', cur), label = $('.cursor__label', cur);
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf = 0;

    function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px) translate(-50%,-50%)';
      label.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px) translate(-50%,-50%)';
      if (Math.abs(mx - rx) > 0.2 || Math.abs(my - ry) > 0.2) raf = requestAnimationFrame(loop);
      else raf = 0;
    }

    document.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      cur.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });

    var hoverables = 'a, button, summary, input, .quiz__opt, .chip, .pasta, .phrase, #itMap path[id], .cut-spot';
    document.addEventListener('pointerover', function (e) {
      var labelled = e.target.closest('[data-cursor]');
      if (labelled) {
        label.textContent = labelled.getAttribute('data-cursor');
        cur.classList.add('is-label');
      } else {
        cur.classList.remove('is-label');
      }
      cur.classList.toggle('is-hover', !!e.target.closest(hoverables) && !labelled);
    }, { passive: true });
  }

  /* ---------- 7. НАКЛОН КАРТОЧЕК ---------- */
  function initTilt() {
    if (!fine || reduced) return;
    var sel = '.card, .tl__item, .pasta, .phrase, .coffee, .fact, .cs-facts div, .num';
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest(sel);
      if (!el) return;
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--tilt-x', (y * -4).toFixed(2) + 'deg');
      el.style.setProperty('--tilt-y', (x * 5).toFixed(2) + 'deg');
      el.style.setProperty('--mx', ((x + .5) * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((y + .5) * 100).toFixed(1) + '%');
      el.classList.add('is-tilt');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var el = e.target.closest(sel);
      if (!el) return;
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.classList.remove('is-tilt');
    }, { passive: true });
  }

  /* ---------- 8. КАРТА ПРОРАСТАЕТ ---------- */
  function initMapDraw() {
    var svg = $('#itMap');
    if (!svg) return;
    var paths = $$('path[id]', svg);
    if (!paths.length) return;
    if (reduced || !('IntersectionObserver' in window)) { svg.classList.add('is-drawn'); return; }
    paths.map(function (p) {
      var b = p.getBBox();
      return { el: p, y: b.y + b.height / 2 };
    }).sort(function (a, b) { return a.y - b.y; })
      .forEach(function (item, i) { item.el.style.transitionDelay = (i * 55) + 'ms'; });

    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        svg.classList.add('is-drawn');
        obs.disconnect();
      });
    }, { threshold: 0.15 }).observe(svg);
  }

  /* ---------- 9. ФОКУС В ЛЕНТЕ ИСТОРИИ ---------- */
  function initTimelineFocus() {
    var track = $('#tlTrack');
    if (!track || reduced) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = track.getBoundingClientRect(), mid = r.left + r.width / 2;
      $$('.tl__item', track).forEach(function (card) {
        var c = card.getBoundingClientRect();
        var d = Math.abs((c.left + c.width / 2) - mid) / r.width;
        card.style.setProperty('--focus', Math.max(0, 1 - d * 1.9).toFixed(3));
      });
    }
    track.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    setTimeout(update, 400);
  }

  /* ---------- 10. ФОТО: РАСКРЫТИЕ И ПАРАЛЛАКС ---------- */
  function initPhotos() {
    var figs = $$('.ph');
    if (figs.length) {
      if (reduced || !('IntersectionObserver' in window)) {
        figs.forEach(function (f) { f.classList.add('is-in'); });
      } else {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        figs.forEach(function (f) { io.observe(f); });
      }
    }

    if (reduced) return;
    var frames = $$('.ph__box, .card__photo');
    if (!frames.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      frames.forEach(function (f) {
        var r = f.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        f.style.setProperty('--pary', (p * -16).toFixed(1) + 'px');
      });
    }
    addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- 11. СКОС ПО СКОРОСТИ ПРОКРУТКИ ---------- */
  function initSkew() {
    if (reduced) return;
    var last = window.pageYOffset, skew = 0, raf = 0;
    function loop() {
      raf = 0;
      var y = window.pageYOffset;
      var target = clamp((y - last) * 0.035, -0.7, 0.7);
      last = y;
      skew += (target - skew) * 0.18;
      document.documentElement.style.setProperty('--skew', skew.toFixed(3) + 'deg');
      if (Math.abs(skew) > 0.004 || Math.abs(target) > 0.004) raf = requestAnimationFrame(loop);
    }
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  }

  /* ---------- 12. ПОЛОСА ПРОГРЕССА ---------- */
  function initProgress() {
    var bar = $('#progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.pageYOffset / max, 1) : 0) + ')';
    }
    addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- 13. АКТИВНЫЙ ПУНКТ МЕНЮ ---------- */
  function initSpy() {
    var links = $$('.nav__links a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) map[sec.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        if (map[e.target.id]) map[e.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  function boot() {
    initLenis();
    initCurtain();
    initSplit();
    initHeroScrub();
    initPin();
    initCursor();
    initTilt();
    initMapDraw();
    initTimelineFocus();
    initPhotos();
    initSkew();
    initProgress();
    initSpy();
  }

  /* карточки и лента рисуются в main.js, поэтому ждём конец разбора документа */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
