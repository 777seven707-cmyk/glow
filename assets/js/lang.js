/* ============================================================
   lang.js — переключатель языка (RU/EN/KZ) и валюты ($/₽/₸)
   Курс на 21.09.2026: 1 USD ≈ 84.1 ₽, 1 USD ≈ 447.6 ₸
   (использован для пересчёта фиксированных цен студии).
   ============================================================ */
(function () {
  'use strict';

  var LANGS = ['ru', 'en', 'kk'];
  var CURS = ['usd', 'rub', 'kzt'];

  // Фиксированные цены по каждой валюте (округлены до красивых чисел).
  // Используются для подстановки {token} в переводах.
  var PRICES = {
    small:  { usd: '$70',    rub: '5 890 ₽',   kzt: '31 300 ₸' },
    mid:    { usd: '$200',   rub: '16 800 ₽',  kzt: '89 500 ₸' },
    big:    { usd: '$500',   rub: '42 000 ₽',  kzt: '223 800 ₸' },
    logo:   { usd: '+$60',   rub: '+5 050 ₽',  kzt: '+26 900 ₸' },
    page:   { usd: '+$25',   rub: '+2 100 ₽',  kzt: '+11 200 ₸' },
    textpg: { usd: '+$20',   rub: '+1 680 ₽',  kzt: '+8 950 ₸' },
    move:   { usd: '+$30',   rub: '+2 520 ₽',  kzt: '+13 400 ₸' },
    support:{ usd: '$40',    rub: '3 370 ₽',   kzt: '17 900 ₸' },
    domain: { usd: '$10–15', rub: '840–1 260 ₽', kzt: '4 500–6 700 ₸' },
    hosting:{ usd: '$3',     rub: '250 ₽',     kzt: '1 300 ₸' },
  };

  // То же самое, но разложено на символ + число — для больших
  // анимированных цифр в карточках тарифов (.plan__price[data-price]),
  // которые собраны из <span class="cur"> + <b class="count" data-to>.
  var PLAN_NUMBERS = {
    small: { usd: { sym: '$', val: 70, pos: 'prefix' },  rub: { sym: '₽', val: 5890, pos: 'suffix' },  kzt: { sym: '₸', val: 31300, pos: 'suffix' } },
    mid:   { usd: { sym: '$', val: 200, pos: 'prefix' }, rub: { sym: '₽', val: 16800, pos: 'suffix' }, kzt: { sym: '₸', val: 89500, pos: 'suffix' } },
    big:   { usd: { sym: '$', val: 500, pos: 'prefix' }, rub: { sym: '₽', val: 42000, pos: 'suffix' }, kzt: { sym: '₸', val: 223800, pos: 'suffix' } },
  };

  function formatThousands(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function getStored(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }
  function setStored(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }

  var state = {
    lang: LANGS.indexOf(getStored('lang', 'ru')) > -1 ? getStored('lang', 'ru') : 'ru',
    cur: CURS.indexOf(getStored('cur', 'usd')) > -1 ? getStored('cur', 'usd') : 'usd',
  };

  // Подставляет {token} в уже переведённый текст текущей валютой
  // и обновляет большие цифры тарифов.
  window.applyPrices = function () {
    var cur = state.cur;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var re = /\{(small|mid|big|logo|page|textpg|move|support|domain|hosting)\}/g;
    var node;
    while ((node = walker.nextNode())) {
      if (re.test(node.nodeValue)) {
        re.lastIndex = 0;
        node.nodeValue = node.nodeValue.replace(re, function (_, key) {
          var p = PRICES[key];
          return p ? p[cur] : '';
        });
      }
    }

    document.querySelectorAll('.plan__price[data-price]').forEach(function (el) {
      var key = el.getAttribute('data-price');
      var n = PLAN_NUMBERS[key] && PLAN_NUMBERS[key][cur];
      if (!n) return;
      var curEl = el.querySelector('.cur');
      var countEl = el.querySelector('.count');
      if (curEl) curEl.textContent = n.sym;
      if (countEl) {
        countEl.setAttribute('data-to', n.val);
        countEl.textContent = formatThousands(n.val);
      }
      el.classList.toggle('plan__price--long', n.val >= 1000);
      el.classList.toggle('plan__price--suffix', n.pos === 'suffix');
    });
  };

  function setActive(groupSelector, val) {
    document.querySelectorAll(groupSelector + ' button').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-val') === val);
    });
  }

  function updateActiveStates() {
    setActive('[data-switch="lang"]', state.lang);
    setActive('[data-switch="cur"]', state.cur);
  }

  // И смена языка, и смена валюты идут через applyI18n: он сперва
  // восстанавливает сырые {token}-плейсхолдеры в переводе текущего
  // языка, а в конце сам вызывает applyPrices() с актуальной валютой.
  // Без этого повторное переключение валюты не находило бы {token} —
  // они уже были бы заменены числами на предыдущем шаге.
  function setLang(lang) {
    state.lang = lang;
    setStored('lang', lang);
    if (typeof window.applyI18n === 'function') window.applyI18n(lang);
    else window.applyPrices();
    updateActiveStates();
  }

  function setCur(cur) {
    state.cur = cur;
    setStored('cur', cur);
    if (typeof window.applyI18n === 'function') window.applyI18n(state.lang);
    else window.applyPrices();
    updateActiveStates();
  }

  function bindSwitch() {
    document.querySelectorAll('[data-switch="lang"] button').forEach(function (btn) {
      btn.addEventListener('click', function () { setLang(btn.getAttribute('data-val')); });
    });
    document.querySelectorAll('[data-switch="cur"] button').forEach(function (btn) {
      btn.addEventListener('click', function () { setCur(btn.getAttribute('data-val')); });
    });
  }

  function init() {
    bindSwitch();
    if (typeof window.applyI18n === 'function') {
      window.applyI18n(state.lang); // applyI18n сам вызовет applyPrices в конце
    } else {
      window.applyPrices();
    }
    updateActiveStates();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
