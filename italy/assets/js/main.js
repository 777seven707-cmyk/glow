/* =========================================================
   ITALIA — интерактив
   Выезжающее меню, появление блоков, счётчики, лента истории,
   карточки, разговорник с озвучкой и викторина.
   Ванильный JS, без зависимостей.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var D  = window.ITALIA || {};

  /* ---------- 1. ВЫЕЗЖАЮЩЕЕ МЕНЮ ---------- */
  function initNavSheet() {
    var btn = $('#navToggle'), sheet = $('#navSheet');
    var panel = sheet ? $('.navsheet__panel', sheet) : null;
    if (!btn || !sheet || !panel) return;
    var isOpen = false;

    /* панель прижата к правому краю и уже 460px: на широком экране
       кнопка может остаться на белом фоне — меряем, а не угадываем */
    function syncBurgerContrast() {
      var panelLeft = window.innerWidth - panel.getBoundingClientRect().width;
      var onPanel = btn.getBoundingClientRect().right > panelLeft + 4;
      btn.classList.toggle('burger--on-panel', onPanel);
    }

    function setOpen(next) {
      if (next === isOpen) return;
      isOpen = next;
      if (isOpen) syncBurgerContrast();
      sheet.classList.toggle('is-open', isOpen);
      btn.classList.toggle('is-active', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      if (window.ITALIA_LENIS) { if (isOpen) window.ITALIA_LENIS.stop(); else window.ITALIA_LENIS.start(); }
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      if (isOpen) sheet.removeAttribute('inert');
      else sheet.setAttribute('inert', '');
    }

    btn.addEventListener('click', function () { setOpen(!isOpen); });
    sheet.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-nav-close') || e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Esc') { setOpen(false); btn.focus(); }
    });
    window.addEventListener('resize', function () { if (isOpen) syncBurgerContrast(); });
  }

  /* ---------- 2. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ---------- */
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

  /* ---------- 3. СЧЁТЧИКИ ---------- */
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
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. ЛЕНТА ВРЕМЕНИ ---------- */
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
      var w = card ? card.getBoundingClientRect().width + 16 : 320;
      track.scrollBy({ left: dir * w * 2, behavior: reduced ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      var max = track.scrollWidth - track.clientWidth;
      if ((track.scrollLeft <= 0 && e.deltaY < 0) || (track.scrollLeft >= max - 1 && e.deltaY > 0)) return;
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }, { passive: false });

    progress();
  }

  /* ---------- 5. КАРТОЧКИ И СПИСКИ ---------- */
  function fill(id, html) { var n = document.getElementById(id); if (n) n.innerHTML = html; }

  function photoBox(wiki, alt) {
    if (!wiki) return '';
    return '<div class="card__photo" data-photo="' + wiki + '" data-photo-alt="' + alt + '"></div>';
  }

  function initContent() {
    if (D.CITIES) fill('cityGrid', D.CITIES.map(function (c, i) {
      return '<article class="card" data-reveal>' +
        photoBox(c.wiki, c.name) +
        '<div class="card__body">' +
          '<span class="card__kicker">' + String(i + 1).padStart(2, '0') + ' · ' + c.it + '</span>' +
          '<h3>' + c.name + '</h3>' +
          '<p class="card__meta">' + c.pop + '</p>' +
          '<p>' + c.text + '</p>' +
          '<span class="card__credit" data-photo-credit></span>' +
        '</div>' +
      '</article>';
    }).join(''));

    if (D.ART) fill('artGrid', D.ART.map(function (a) {
      return '<article class="card" data-reveal>' +
        photoBox(a.wiki, a.t.replace(/[«»]/g, '')) +
        '<div class="card__body">' +
          '<span class="card__kicker">' + a.a + '</span>' +
          '<h3>' + a.t + '</h3>' +
          '<p class="card__meta">' + a.p + '</p>' +
          '<p>' + a.d + '</p>' +
          '<span class="card__credit" data-photo-credit></span>' +
        '</div>' +
      '</article>';
    }).join(''));

    if (D.TRAVEL) fill('travelGrid', D.TRAVEL.map(function (t) {
      return '<article class="card" data-reveal><div class="card__body"><h3>' + t.t + '</h3><p>' + t.d + '</p></div></article>';
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

    if (D.FAQ) fill('faqList', D.FAQ.map(function (f) {
      return '<details class="faq" data-reveal><summary>' + f.q + '<i aria-hidden="true"></i></summary><div class="faq__a"><p>' + f.a + '</p></div></details>';
    }).join(''));

    if (D.PHRASES) fill('phraseGrid', D.PHRASES.map(function (p) {
      return '<li class="phrase" data-reveal>' +
        '<button class="phrase__say" type="button" data-say="' + p.it.replace(/"/g, '&quot;') + '" aria-label="Произнести: ' + p.it + '">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<b>' + p.it + '</b>' +
        '<span class="phrase__tr">[' + p.tr + ']</span>' +
        '<span class="phrase__ru">' + p.ru + '</span>' +
        (p.note ? '<span class="phrase__note">' + p.note + '</span>' : '') +
      '</li>';
    }).join(''));
  }

  /* нарисованные значки форм пасты */
  function pastaIcon(i) {
    var s = '<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6">';
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

  /* ---------- 6. ОЗВУЧКА ФРАЗ ---------- */
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
      var it = speechSynthesis.getVoices().filter(function (v) { return /^it/i.test(v.lang); })[0];
      if (it) u.voice = it;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      btn.classList.add('is-playing');
      setTimeout(function () { btn.classList.remove('is-playing'); }, 1200);
    });
  }

  /* ---------- 7. ВИКТОРИНА ---------- */
  function initQuiz() {
    var host = $('#quizBox');
    if (!host || !D.QUIZ) return;
    var q = D.QUIZ, step = 0, score = 0, locked = false;
    var board = $('#quizScore');
    var marks = [];                       /* null — не отвечен, true/false — итог */

    function renderBoard() {
      if (!board) return;
      board.innerHTML =
        '<p class="score__lab">Ваш счёт</p>' +
        '<p class="score__num"><b>' + score + '</b><span>из ' + q.length + '</span></p>' +
        '<ol class="score__list">' + q.map(function (_, i) {
          var st = marks[i] === true ? ' is-right' : marks[i] === false ? ' is-wrong' : (i === step ? ' is-now' : '');
          return '<li class="score__cell' + st + '"><span>' + String(i + 1).padStart(2, '0') + '</span></li>';
        }).join('') + '</ol>' +
        '<p class="score__hint">' + (step >= q.length ? 'Можно пройти ещё раз' : 'Разбор появляется сразу после ответа') + '</p>';
    }

    function render() {
      if (step >= q.length) return finish();
      var item = q[step];
      host.innerHTML =
        '<div class="quiz__head"><span>Вопрос ' + (step + 1) + ' / ' + q.length + '</span>' +
        '<span>Верно: ' + score + '</span></div>' +
        '<div class="quiz__bar"><i style="transform:scaleX(' + (step / q.length) + ')"></i></div>' +
        '<h3 class="quiz__q">' + item.q + '</h3>' +
        '<div class="quiz__opts">' + item.a.map(function (a, i) {
          return '<button class="quiz__opt" type="button" data-i="' + i + '">' + a + '</button>';
        }).join('') + '</div>' +
        '<p class="quiz__exp" hidden></p>';
      locked = false;
      renderBoard();
    }

    function finish() {
      var verdict = score === q.length ? 'Идеально. Вам пора вести экскурсии.'
        : score >= 8 ? 'Отличный результат — вы явно там были.'
        : score >= 5 ? 'Крепкая база. Остальное доберёте на месте.'
        : 'Начало положено — прокрутите страницу вверх.';
      host.innerHTML =
        '<div class="quiz__done">' +
          '<div class="quiz__head" style="justify-content:center">Итог</div>' +
          '<p class="quiz__res"><b>' + score + '</b> из ' + q.length + '</p>' +
          '<p class="quiz__verdict">' + verdict + '</p>' +
          '<button class="btn" type="button" id="quizAgain">Ещё раз</button>' +
        '</div>';
      renderBoard();
      $('#quizAgain').addEventListener('click', function () {
        step = 0; score = 0; marks = [];
        render();
      });
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
      marks[step] = pick === right;
      if (pick === right) score++;
      var exp = $('.quiz__exp', host);
      exp.textContent = item.e; exp.hidden = false;
      renderBoard();
      setTimeout(function () { step++; render(); }, 1750);
    });

    render();
  }

  /* ---------- 8. ПАРАЛЛАКС В МЕДИА-КАРТОЧКЕ ---------- */
  function initHeroParallax() {
    var host = $('#csHero');
    if (!host || reduced || window.matchMedia('(hover: none)').matches) return;
    var card = host.closest('.hero__media');
    if (!card) return;
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      host.style.setProperty('--par-x', (((e.clientX - r.left) / r.width - .5) * 22).toFixed(2) + 'px');
      host.style.setProperty('--par-y', (((e.clientY - r.top) / r.height - .5) * 10).toFixed(2) + 'px');
    });
    card.addEventListener('pointerleave', function () {
      host.style.setProperty('--par-x', '0px');
      host.style.setProperty('--par-y', '0px');
    });
  }

  /* ---------- 9. ФОН РЕАГИРУЕТ НА СКРОЛЛ ---------- */
  function initBackground() {
    var bg = $('#bg');
    if (!bg || reduced) return;
    var ticking = false;
    function update() {
      /* пятна отстают от страницы — получается глубина без тяжёлых слоёв */
      bg.style.setProperty('--bg-y', (-window.pageYOffset * 0.06).toFixed(1) + 'px');
      pickMood();
      ticking = false;
    }

    /* настроение берём у секции, которая ближе всего к середине экрана:
       наблюдатель здесь давал бы разный результат в зависимости от порядка событий */
    var moodEls = $$('[data-mood]'), mood = '';
    function pickMood() {
      var mid = window.innerHeight / 2, best = null, bestD = Infinity;
      for (var i = 0; i < moodEls.length; i++) {
        var r = moodEls[i].getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        var d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < bestD) { bestD = d; best = moodEls[i]; }
      }
      var next = best ? best.getAttribute('data-mood') : 'roma';
      if (next !== mood) { mood = next; bg.setAttribute('data-mood', mood); }
    }
    addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- 10. СТАРТ ---------- */
  function boot() {
    initContent();
    initTimeline();
    initNavSheet();
    initCounters();
    initQuiz();
    initSpeech();
    initHeroParallax();
    initBackground();
    initReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
