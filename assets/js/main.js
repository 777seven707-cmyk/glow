/* =========================================================
   «На твоё усмотрение» — интерактив и анимации
   Ванильный JS, без зависимостей.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. ПРЕЛОАДЕР ---------- */
  function initLoader() {
    var loader = $('#loader'), bar = $('#loaderBar'), num = $('#loaderNum');
    if (!loader) return;
    document.body.classList.add('is-locked');

    var value = 0;
    var finish = function () {
      loader.classList.add('is-done');
      document.body.classList.remove('is-locked');
      document.documentElement.classList.add('is-loaded');
      setTimeout(function () { loader.style.display = 'none'; }, 1100);
    };

    if (reduced) { finish(); return; }

    var timer = setInterval(function () {
      value += Math.random() * 14 + 5;
      if (value >= 100) {
        value = 100;
        clearInterval(timer);
        setTimeout(finish, 380);
      }
      bar.style.width = value + '%';
      num.textContent = Math.round(value);
    }, 110);

    // страховка: не держим экран дольше 4 секунд
    setTimeout(function () { clearInterval(timer); finish(); }, 4000);
  }

  /* ---------- 2. КУРСОР ---------- */
  function initCursor() {
    if (isTouch || reduced) return;
    var cur = $('#cursor');
    if (!cur) return;
    var dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur);
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      cur.classList.add('is-on');
    });
    document.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    var hoverables = 'a, button, summary, [data-magnetic], .plan, .card, .work, .addons__list li';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverables)) cur.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverables)) cur.classList.remove('is-hover');
    });
  }

  /* ---------- 3. МАГНИТНЫЕ КНОПКИ ---------- */
  function initMagnetic() {
    if (isTouch || reduced) return;
    $$('[data-magnetic]').forEach(function (el) {
      var strength = 0.3;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 560);
      });
    });
  }

  /* ---------- 4. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ---------- */
  function initReveal() {
    var items = $$('[data-reveal]').concat($$('.footer__big'));
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? $$('[data-reveal]', el.parentElement) : [];
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 0.07 : 0) + 's';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. СЧЁТЧИКИ ---------- */
  function initCounters() {
    var counters = $$('.count');
    if (!counters.length) return;
    if (!('IntersectionObserver' in window) || reduced) {
      counters.forEach(function (el) { el.textContent = el.dataset.to; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var to = parseInt(el.dataset.to, 10) || 0;
        var start = null, dur = 1400;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(to * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. ШАПКА: ПРЯТАТЬ / ПОКАЗЫВАТЬ + ПРОГРЕСС ---------- */
  function initHeader() {
    var header = $('#header'), bar = $('#scrollBar');
    var last = window.pageYOffset, ticking = false;

    function update() {
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

      if (header) {
        header.classList.toggle('is-stuck', y > 8);
        var menuOpen = document.body.classList.contains('is-locked');
        if (!menuOpen && y > 320 && y > last) header.classList.add('is-hidden');
        else header.classList.remove('is-hidden');
      }
      last = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- 7. АКТИВНЫЙ ПУНКТ МЕНЮ ---------- */
  function initSpy() {
    var links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          if (map[e.target.id]) map[e.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------- 8. МОБИЛЬНОЕ МЕНЮ ---------- */
  function initMenu() {
    var burger = $('#burger'), menu = $('#mobileMenu');
    if (!burger || !menu) return;

    function close() {
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
    }
    function toggle() {
      var open = !menu.classList.contains('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
    }

    burger.addEventListener('click', toggle);
    $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- 9. ЛЁГКИЙ 3D-НАКЛОН КАРТОЧЕК ТАРИФОВ ---------- */
  function initTilt() {
    if (isTouch || reduced) return;
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 4) + 'deg) rotateY(' + (px * 4) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 10. FAQ: ОДИН ОТКРЫТЫЙ ПУНКТ ---------- */
  function initFaq() {
    var items = $$('.faq__item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }

  /* ---------- 11. ПЛАВНАЯ ПРОКРУТКА С УЧЁТОМ ШАПКИ ---------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = id === '#top' ? 0 : 60;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 12. ФОРМА ЗАЯВКИ ---------- */
  function initForm() {
    var form = $('#form');
    if (!form) return;
    var done = $('#formDone');
    var MAIL = 'hello@natvoeusmotrenie.studio';

    function setErr(field, on) { field.classList.toggle('is-err', on); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('input[required]', form).forEach(function (input) {
        var field = input.closest('.field');
        var bad = !input.value.trim();
        setErr(field, bad);
        if (bad) ok = false;
      });
      if (!ok) return;

      var data = new FormData(form);
      var plan = data.get('plan') || 'не выбран';
      var body =
        'Имя: ' + data.get('name') + '\n' +
        'Связь: ' + data.get('contact') + '\n' +
        'Тариф: ' + plan + '\n\n' +
        'О задаче:\n' + (data.get('message') || '—');

      window.location.href = 'mailto:' + MAIL +
        '?subject=' + encodeURIComponent('Заявка с сайта — ' + plan) +
        '&body=' + encodeURIComponent(body);

      if (done) done.hidden = false;
    });

    $$('input, textarea', form).forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field) setErr(field, false);
      });
    });
  }


  /* ---------- 13.5 ТЁМНАЯ ШАПКА НАД ГЕРОЕМ ---------- */
  function initHeroTheme() {
    var hero = $('.hero');
    var root = document.documentElement;
    if (!hero) return;
    var ticking = false;

    function update() {
      root.classList.toggle('at-hero', window.pageYOffset < hero.offsetHeight - 88);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 14. ПАРАЛЛАКС ФОНОВЫХ СЛОЁВ ---------- */
  function initParallax() {
    var items = $$('[data-par]');
    if (!items.length || reduced) return;
    var ticking = false;

    function update() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var progress = (r.top + r.height / 2 - vh / 2) / vh;
        var amount = parseFloat(el.dataset.par) || 0;
        el.style.setProperty('--par-y', (progress * amount).toFixed(2) + 'px');
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 15. СТЕКЛЯННЫЙ ГЛАЗ ---------- */
  function initGlassEye() {
    if (isTouch || reduced) return;
    var eye = $('#glassEye');
    var hero = $('.hero');
    if (!eye || !hero) return;

    var box = hero.getBoundingClientRect();

    // доли ширины/высоты героя: цель и текущее сглаженное положение
    var tx = 0.74, ty = 0.42, cx = tx, cy = ty;
    var following = false, phase = 0;

    hero.addEventListener('mousemove', function (e) {
      tx = (e.clientX - box.left) / box.width;
      ty = (e.clientY - box.top) / box.height;
      following = true;
      eye.classList.add('is-on');
    });
    hero.addEventListener('mouseleave', function () { following = false; });
    setTimeout(function () { eye.classList.add('is-on'); }, 1500);

    (function loop() {
      requestAnimationFrame(loop);
      box = hero.getBoundingClientRect();
      // герой ушёл из кадра — не тратим кадры на пересчёт
      if (box.bottom < 0 || box.top > window.innerHeight) return;

      phase += 0.005;
      var gx = following ? tx : 0.74 + Math.sin(phase) * 0.05;
      var gy = following ? ty : 0.42 + Math.cos(phase * 1.35) * 0.08;
      cx += (gx - cx) * 0.075;
      cy += (gy - cy) * 0.075;
      var size = eye.offsetWidth || 180;
      eye.style.transform = 'translate3d(' +
        (cx * box.width - size / 2).toFixed(1) + 'px,' +
        (cy * box.height - size / 2).toFixed(1) + 'px,0)';
    })();
  }

  /* ---------- 13. МЕЛОЧИ ---------- */
  function initMisc() {
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- СТАРТ ---------- */
  function init() {
    initLoader();
    initCursor();
    initMagnetic();
    initReveal();
    initCounters();
    initHeader();
    initSpy();
    initMenu();
    initTilt();
    initFaq();
    initAnchors();
    initForm();
    initHeroTheme();
    initParallax();
    initGlassEye();
    initMisc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
