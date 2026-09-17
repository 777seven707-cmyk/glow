/* =========================================================
   ITALIA — движение
   Побуквенный вход заголовка, построчное появление
   подзаголовков, наклон карточек под курсором, отрисовка
   карты, фокус в ленте истории, параллакс фотографий,
   полоса прогресса и активный пункт меню.
   Всё уважает prefers-reduced-motion и переключатель фона.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. РАЗБИВКА ТЕКСТА ---------- */
  /* строки оборачиваем в маску, слова — в подвижные span.
     Текст для скринридера остаётся целым через aria-label. */
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
      /* вложенный элемент (подсветка .hl, акцент em) сохраняем как обёртку */
      var cls = node.getAttribute && node.getAttribute('class') ? node.getAttribute('class') : '';
      if (node.tagName === 'EM') cls = (cls + ' mv__accent').trim();
      html += '<span class="' + cls + '">' + words(node.textContent || '') + '</span>';
    });

    el.innerHTML = '<span class="mv" aria-hidden="true">' + html + '</span>';
    el.setAttribute('aria-label', label);
    el.dataset.split = mode;

    /* задержки по порядку: буквы быстрее, слова медленнее */
    var items = $$('.mv__i', el);
    var stepMs = mode === 'char' ? 22 : 55;
    items.forEach(function (it, i) { it.style.transitionDelay = (i * stepMs) + 'ms'; });
    return items.length;
  }

  function initSplit() {
    /* заголовок первого экрана — по буквам, сразу после загрузки */
    $$('.hero__line').forEach(function (line) {
      splitWords(line, 'char');
      line.classList.add('mv-host');
    });
    requestAnimationFrame(function () {
      $$('.hero__line').forEach(function (l) { l.classList.add('is-shown'); });
    });

    /* заголовки секций — по словам, при появлении */
    var titles = $$('.sec-title').concat($$('.footer__big'));
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

  /* ---------- 2. НАКЛОН КАРТОЧЕК ПОД КУРСОРОМ ---------- */
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

  /* ---------- 3. КАРТА ПРОЯВЛЯЕТСЯ ПО РЕГИОНАМ ---------- */
  function initMapDraw() {
    var svg = $('#itMap');
    if (!svg) return;
    var paths = $$('path[id]', svg);
    if (!paths.length) return;
    if (reduced || !('IntersectionObserver' in window)) { svg.classList.add('is-drawn'); return; }

    /* порядок — с севера на юг: карта «прорастает» вдоль сапога */
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

  /* ---------- 4. ФОКУС В ЛЕНТЕ ИСТОРИИ ---------- */
  function initTimelineFocus() {
    var track = $('#tlTrack');
    if (!track || reduced) return;
    var ticking = false;
    function update() {
      var r = track.getBoundingClientRect();
      var mid = r.left + r.width / 2;
      $$('.tl__item', track).forEach(function (card) {
        var c = card.getBoundingClientRect();
        var d = Math.abs((c.left + c.width / 2) - mid) / r.width;
        var k = Math.max(0, 1 - d * 1.9);
        card.style.setProperty('--focus', k.toFixed(3));
      });
      ticking = false;
    }
    track.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    setTimeout(update, 400);
  }

  /* ---------- 5. ПАРАЛЛАКС ФОТОГРАФИЙ ---------- */
  function initPhotoParallax() {
    if (reduced) return;
    var frames = $$('.ph__box, .card__photo');
    if (!frames.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      frames.forEach(function (f) {
        var r = f.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;      /* -0.5…0.5 */
        f.style.setProperty('--pary', (p * -16).toFixed(1) + 'px');
      });
      ticking = false;
    }
    addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- 6. ПОЛОСА ПРОГРЕССА ---------- */
  function initProgress() {
    var bar = $('#progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.pageYOffset / max, 1) : 0) + ')';
      ticking = false;
    }
    addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- 7. АКТИВНЫЙ ПУНКТ МЕНЮ ---------- */
  function initSpy() {
    var links = $$('.nav__links a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1), sec = document.getElementById(id);
      if (sec) map[id] = a;
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
    initSplit();
    initTilt();
    initMapDraw();
    initTimelineFocus();
    initPhotoParallax();
    initProgress();
    initSpy();
  }

  /* карта и лента рисуются скриптами main.js/map.js, поэтому ждём их */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
