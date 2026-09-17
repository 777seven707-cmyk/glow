/* =========================================================
   ITALIA — интерактив и анимации
   Ванильный JS, без зависимостей.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var D  = window.ITALIA || {};
  var nf = new Intl.NumberFormat('ru-RU');

  /* ---------- 1. ПРЕЛОАДЕР ---------- */
  function initLoader() {
    var loader = $('#loader'), bar = $('#loaderBar'), num = $('#loaderNum');
    if (!loader) return;
    document.body.classList.add('is-locked');

    var value = 0;
    function finish() {
      loader.classList.add('is-done');
      document.body.classList.remove('is-locked');
      document.documentElement.classList.add('is-loaded');
      setTimeout(function () { loader.style.display = 'none'; }, 1100);
    }
    if (reduced) { finish(); return; }

    var timer = setInterval(function () {
      value += Math.random() * 15 + 6;
      if (value >= 100) { value = 100; clearInterval(timer); setTimeout(finish, 340); }
      bar.style.width = value + '%';
      num.textContent = Math.round(value);
    }, 105);
    setTimeout(function () { clearInterval(timer); finish(); }, 4000);
  }

  /* ---------- 2. КУРСОР ---------- */
  function initCursor() {
    if (isTouch || reduced) return;
    var cur = $('#cursor'); if (!cur) return;
    var dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur);
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      cur.classList.add('is-on');
    });
    document.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    var hoverables = 'a, button, summary, input, [data-magnetic], .rcard, .quiz__opt, .phrase, .pasta';
    document.addEventListener('mouseover', function (e) { if (e.target.closest(hoverables)) cur.classList.add('is-hover'); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest(hoverables)) cur.classList.remove('is-hover'); });
  }

  /* ---------- 3. МАГНИТНЫЕ КНОПКИ ---------- */
  function initMagnetic() {
    if (isTouch || reduced) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .28) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28) + 'px)';
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
    var items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var sib = el.parentElement ? $$('[data-reveal]', el.parentElement) : [];
        var idx = sib.indexOf(el);
        el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 0.06 : 0) + 's';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. СЧЁТЧИКИ ---------- */
  function initCounters() {
    var counters = $$('.count');
    if (!counters.length) return;
    function render(el, v) {
      var dec = parseInt(el.dataset.dec || '0', 10);
      el.textContent = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: dec, maximumFractionDigits: dec,
        useGrouping: el.dataset.sep !== '0'   /* годы — без разделителя разрядов */
      }).format(v);
    }
    if (!('IntersectionObserver' in window) || reduced) {
      counters.forEach(function (el) { render(el, parseFloat(el.dataset.to)); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target, to = parseFloat(el.dataset.to) || 0, start = null, dur = 1500;
        (function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          render(el, to * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. ШАПКА И ПРОГРЕСС ---------- */
  function initHeader() {
    var header = $('#header'), bar = $('#scrollBar');
    var last = pageYOffset, ticking = false;
    function update() {
      var y = pageYOffset, max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      if (header) {
        header.classList.toggle('is-stuck', y > 8);
        var open = document.body.classList.contains('is-locked');
        if (!open && y > 340 && y > last) header.classList.add('is-hidden'); else header.classList.remove('is-hidden');
      }
      last = y; ticking = false;
    }
    addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ---------- 7. АКТИВНЫЙ ПУНКТ МЕНЮ ---------- */
  function initSpy() {
    var links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) {
      var sec = document.getElementById(l.getAttribute('href').slice(1));
      if (sec) map[sec.id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        if (map[e.target.id]) map[e.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------- 8. МОБИЛЬНОЕ МЕНЮ ---------- */
  function initMenu() {
    var burger = $('#burger'), menu = $('#mobileMenu');
    if (!burger || !menu) return;
    function close() {
      burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
    }
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- 9. ЛЕНТА ВРЕМЕНИ ---------- */
  function initTimeline() {
    var track = $('#tlTrack');
    if (!track || !D.TIMELINE) return;
    track.innerHTML = D.TIMELINE.map(function (e, i) {
      return '<li class="tl__item" data-reveal>' +
        '<span class="tl__year">' + e.year + '</span>' +
        '<span class="tl__dot" aria-hidden="true"></span>' +
        '<h3 class="tl__title">' + e.title + '</h3>' +
        '<p class="tl__text">' + e.text + '</p>' +
        '<span class="tl__n" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
      '</li>';
    }).join('');

    var bar = $('#tlBar'), prev = $('#tlPrev'), next = $('#tlNext');
    function progress() {
      var max = track.scrollWidth - track.clientWidth;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? track.scrollLeft / max : 1) + ')';
      if (prev) prev.disabled = track.scrollLeft < 8;
      if (next) next.disabled = track.scrollLeft > max - 8;
    }
    track.addEventListener('scroll', function () { requestAnimationFrame(progress); }, { passive: true });
    function step(dir) {
      var card = track.querySelector('.tl__item');
      var w = card ? card.getBoundingClientRect().width + 20 : 320;
      track.scrollBy({ left: dir * w * 2, behavior: reduced ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    /* колесо мыши прокручивает ленту по горизонтали */
    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      var max = track.scrollWidth - track.clientWidth;
      var atStart = track.scrollLeft <= 0 && e.deltaY < 0;
      var atEnd = track.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }, { passive: false });

    progress();
  }

  /* ---------- 10. ГОРОДА, КУХНЯ, ИСКУССТВО, ПРАКТИКА ---------- */
  function fill(id, html) { var n = document.getElementById(id); if (n) n.innerHTML = html; }

  function initContent() {
    if (D.CITIES) fill('cityGrid', D.CITIES.map(function (c, i) {
      return '<article class="city" data-reveal>' +
        '<span class="city__n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3>' + c.name + ' <em>' + c.it + '</em></h3>' +
        '<p class="city__pop">' + c.pop + '</p>' +
        '<p>' + c.text + '</p>' +
      '</article>';
    }).join(''));

    if (D.PASTA) fill('pastaGrid', D.PASTA.map(function (p, i) {
      return '<li class="pasta" data-reveal tabindex="0">' +
        '<span class="pasta__ico" aria-hidden="true">' + pastaIcon(i) + '</span>' +
        '<b>' + p.name + '</b><em>' + p.it + '</em>' +
        '<span class="pasta__meta">' + p.from + '</span>' +
        '<span class="pasta__with">' + p.with + '</span>' +
      '</li>';
    }).join(''));

    if (D.COFFEE) fill('coffeeList', D.COFFEE.map(function (c) {
      return '<div class="coffee" data-reveal><b>' + c.name + '</b><p>' + c.text + '</p></div>';
    }).join(''));

    if (D.FOOD_RULES) fill('foodRules', D.FOOD_RULES.map(function (r, i) {
      return '<li data-reveal><em>' + String(i + 1).padStart(2, '0') + '</em>' + r + '</li>';
    }).join(''));

    if (D.ART) fill('artGrid', D.ART.map(function (a) {
      return '<article class="art" data-reveal>' +
        '<h3>' + a.t + '</h3><p class="art__a">' + a.a + '</p>' +
        '<p class="art__p">' + a.p + '</p><p>' + a.d + '</p>' +
      '</article>';
    }).join(''));

    if (D.TRAVEL) fill('travelGrid', D.TRAVEL.map(function (t) {
      return '<article class="travel" data-reveal><h3>' + t.t + '</h3><p>' + t.d + '</p></article>';
    }).join(''));

    if (D.FAQ) fill('faqList', D.FAQ.map(function (f) {
      return '<details class="faq" data-reveal><summary>' + f.q + '<i aria-hidden="true"></i></summary><div class="faq__a"><p>' + f.a + '</p></div></details>';
    }).join(''));
  }

  /* простые рисованные значки паст */
  function pastaIcon(i) {
    var s = '<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6">';
    switch (i % 10) {
      case 0: return s + '<path d="M12 6v36M18 6v36M24 6v36M30 6v36M36 6v36"/></svg>';
      case 1: return s + '<path d="M8 30c8-14 24-14 32 0"/><path d="M8 36c8-14 24-14 32 0"/><path d="M8 24c8-14 24-14 32 0"/></svg>';
      case 2: return s + '<path d="M14 14l20 4v16l-20-4z"/><path d="M18 17v16M24 18v16M30 20v15"/></svg>';
      case 3: return s + '<path d="M24 6c8 4-8 8 0 12s-8 8 0 12-8 8 0 12"/><path d="M18 9c6 3-6 6 0 9"/></svg>';
      case 4: return s + '<path d="M22 24L8 14v20zM26 24l14-10v20z"/><circle cx="24" cy="24" r="3"/></svg>';
      case 5: return s + '<path d="M10 28a14 10 0 0 1 28 0"/><path d="M14 28a10 7 0 0 1 20 0"/><path d="M10 28h28"/></svg>';
      case 6: return s + '<rect x="14" y="12" width="20" height="24" rx="3"/><path d="M19 12v24M24 12v24M29 12v24"/></svg>';
      case 7: return s + '<path d="M24 10l12 8-6 16H18l-6-16z"/><path d="M18 18c4 4 8 4 12 0"/></svg>';
      case 8: return s + '<path d="M16 6v36M32 6v36"/><path d="M16 14h16M16 24h16M16 34h16"/></svg>';
      default: return s + '<path d="M14 36c4-8 4-16 10-24"/><path d="M22 38c4-8 4-16 10-24"/><path d="M30 38c3-6 3-12 6-18"/></svg>';
    }
  }

  /* ---------- 11. РАЗГОВОРНИК С ОЗВУЧКОЙ ---------- */
  function initPhrases() {
    var host = $('#phraseGrid');
    if (!host || !D.PHRASES) return;
    host.innerHTML = D.PHRASES.map(function (p, i) {
      return '<li class="phrase" data-reveal>' +
        '<button class="phrase__say" type="button" data-say="' + p.it.replace(/"/g, '&quot;') + '" aria-label="Произнести: ' + p.it + '">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<b>' + p.it + '</b>' +
        '<span class="phrase__tr">[' + p.tr + ']</span>' +
        '<span class="phrase__ru">' + p.ru + '</span>' +
        (p.note ? '<span class="phrase__note">' + p.note + '</span>' : '') +
      '</li>';
    }).join('');
  }

  function initSpeech() {
    var supported = 'speechSynthesis' in window;
    var note = $('#speechNote');
    if (!supported && note) note.hidden = false;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-say]');
      if (!btn) return;
      if (!supported) { btn.classList.add('is-off'); return; }
      var u = new SpeechSynthesisUtterance(btn.getAttribute('data-say'));
      u.lang = 'it-IT'; u.rate = .92;
      var voices = speechSynthesis.getVoices();
      var it = voices.filter(function (v) { return /^it/i.test(v.lang); })[0];
      if (it) u.voice = it;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      btn.classList.add('is-playing');
      setTimeout(function () { btn.classList.remove('is-playing'); }, 1200);
    });
  }

  /* ---------- 12. ВИКТОРИНА ---------- */
  function initQuiz() {
    var host = $('#quizBox');
    if (!host || !D.QUIZ) return;
    var q = D.QUIZ, step = 0, score = 0, locked = false;

    function render() {
      if (step >= q.length) return finish();
      var item = q[step];
      host.innerHTML =
        '<div class="quiz__head"><span class="quiz__step">Вопрос ' + (step + 1) + ' / ' + q.length + '</span>' +
        '<span class="quiz__score">Верно: ' + score + '</span></div>' +
        '<div class="quiz__bar"><i style="transform:scaleX(' + (step / q.length) + ')"></i></div>' +
        '<h3 class="quiz__q">' + item.q + '</h3>' +
        '<div class="quiz__opts">' + item.a.map(function (a, i) {
          return '<button class="quiz__opt" type="button" data-i="' + i + '">' + a + '</button>';
        }).join('') + '</div>' +
        '<p class="quiz__exp" hidden></p>';
      locked = false;
    }

    function finish() {
      var verdict = score === q.length ? 'Идеально. Вам пора вести экскурсии.'
        : score >= 8 ? 'Отличный результат — вы явно там были.'
        : score >= 5 ? 'Крепкая база. Остальное доберёте на месте.'
        : 'Начало положено — прокрутите страницу вверх.';
      host.innerHTML =
        '<div class="quiz__done">' +
          '<span class="quiz__step">Итог</span>' +
          '<p class="quiz__res"><b>' + score + '</b> из ' + q.length + '</p>' +
          '<p class="quiz__verdict">' + verdict + '</p>' +
          '<button class="btn btn--sm" type="button" id="quizAgain"><span>Ещё раз</span></button>' +
        '</div>';
      $('#quizAgain').addEventListener('click', function () { step = 0; score = 0; render(); });
    }

    host.addEventListener('click', function (e) {
      var btn = e.target.closest('.quiz__opt');
      if (!btn || locked) return;
      locked = true;
      var item = q[step], pick = parseInt(btn.dataset.i, 10), right = item.c;
      $$('.quiz__opt', host).forEach(function (b, i) {
        b.classList.toggle('is-right', i === right);
        b.classList.toggle('is-wrong', i === pick && pick !== right);
        b.disabled = true;
      });
      if (pick === right) score++;
      var exp = $('.quiz__exp', host);
      exp.textContent = item.e; exp.hidden = false;
      setTimeout(function () { step++; render(); }, 1750);
    });

    render();
  }

  /* ---------- 13. АТМОСФЕРА: ПЫЛЬ НА CANVAS ---------- */
  function initDust() {
    var cv = $('#dust');
    if (!cv || reduced) return;
    var ctx = cv.getContext('2d'), w = 0, h = 0, dots = [], raf = 0, visible = true;

    function size() {
      var r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      var n = Math.min(90, Math.round(w * h / 16000));
      for (var i = 0; i < n; i++) {
        dots.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.7 + .4,
                    vx: (Math.random() - .5) * .16, vy: -Math.random() * .22 - .05, a: Math.random() * .5 + .12 });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if (d.y < -6) { d.y = h + 6; d.x = Math.random() * w; }
        if (d.x < -6) d.x = w + 6; else if (d.x > w + 6) d.x = -6;
        ctx.globalAlpha = d.a;
        ctx.fillStyle = '#e8c98f';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    size(); frame();
    addEventListener('resize', function () { cancelAnimationFrame(raf); size(); frame(); }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !visible) { visible = true; frame(); }
          else if (!e.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
        });
      }, { threshold: 0 }).observe(cv);
    }
  }

  /* ---------- 14. ПАРАЛЛАКС ПО ДАННЫМ ---------- */
  function initParallax() {
    var items = $$('[data-par]');
    if (!items.length || reduced) return;
    var ticking = false;
    function update() {
      var vh = innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (p * parseFloat(el.dataset.par)).toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ---------- 15. СТАРТ ---------- */
  function boot() {
    initContent();
    initPhrases();
    initTimeline();
    initLoader();
    initCursor();
    initMagnetic();
    initCounters();
    initHeader();
    initSpy();
    initMenu();
    initQuiz();
    initSpeech();
    initDust();
    initParallax();
    initReveal();
    void nf;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
