/* =========================================================
   Языки и валюты.
   Русский лежит прямо в разметке — при первом запуске скрипт
   запоминает исходный текст каждого помеченного узла. В словарях
   ниже только английский и казахский.

   Цены не пересчитываются по курсу: в каждой валюте они заданы
   вручную и округлены до «красивых». Править — в таблице PRICES.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- ЦЕНЫ ----------
     Метки вида {small} в текстах заменяются на значения отсюда.
     Курс заложен примерный: $1 ≈ 92 ₽ ≈ 540 ₸. Если он уйдёт —
     поменяйте числа здесь, больше нигде трогать не нужно. */
  var PRICES = {
    usd: {
      sign: '$', suffix: false,
      plan: { small: 70, mid: 200, big: 500 },
      small: '$70', mid: '$200', big: '$500',
      logo: '+$60', page: '+$25', textpg: '+$20', move: '+$30',
      support: '$40', domain: '$10–15', hosting: '$3'
    },
    rub: {
      sign: '₽', suffix: true,
      plan: { small: 6500, mid: 18500, big: 46000 },
      small: '6 500 ₽', mid: '18 500 ₽', big: '46 000 ₽',
      logo: '+5 500 ₽', page: '+2 300 ₽', textpg: '+1 900 ₽', move: '+2 800 ₽',
      support: '3 700 ₽', domain: '900–1 400 ₽', hosting: '300 ₽'
    },
    kzt: {
      sign: '₸', suffix: true,
      plan: { small: 38000, mid: 108000, big: 270000 },
      small: '38 000 ₸', mid: '108 000 ₸', big: '270 000 ₸',
      logo: '+32 000 ₸', page: '+13 500 ₸', textpg: '+11 000 ₸', move: '+16 000 ₸',
      support: '21 000 ₸', domain: '5 000–7 500 ₸', hosting: '1 600 ₸'
    }
  };

  /* Названия тарифов для письма из формы */
  var PLAN_NAMES = {
    ru: { small: 'Малый', mid: 'Средний', big: 'Большой', none: 'Пока не знаю' },
    en: { small: 'Small', mid: 'Medium', big: 'Large', none: 'Not sure yet' },
    kk: { small: 'Шағын', mid: 'Орташа', big: 'Үлкен', none: 'Әзірге білмеймін' }
  };

  var TITLES = {
    ru: 'На твоё усмотрение — студия разработки сайтов',
    en: 'Na Tvoyo Usmotrenie — website design studio',
    kk: 'На твоё усмотрение — сайт жасау студиясы'
  };

  var LANGS = ['ru', 'en', 'kk'];
  var CURS  = ['usd', 'rub', 'kzt'];
  var HTML_LANG = { ru: 'ru', en: 'en', kk: 'kk' };

  var DICT = window.__DICT__ || {};        // en и kk подставляются ниже
  var source = {};                          // исходный русский из разметки
  var lang = 'ru', cur = 'usd';

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  /* Подставляем цены вместо меток */
  function money(text) {
    var table = PRICES[cur];
    return text.replace(/\{(\w+)\}/g, function (all, name) {
      return table[name] != null ? table[name] : all;
    });
  }

  function nbsp(n) {
    /* Разряды разделяем неразрывным пробелом, иначе число ломается на две строки */
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function apply() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-i18n');
      if (source[key] == null) source[key] = el.innerHTML;          // первый запуск
      var text = (DICT[lang] && DICT[lang][key]) || source[key];
      el.innerHTML = money(text);
    }

    /* Подсказки в полях формы */
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var q = 0; q < phs.length; q++) {
      var pk = phs[q].getAttribute('data-i18n-ph');
      if (source[pk] == null) source[pk] = phs[q].getAttribute('placeholder');
      phs[q].setAttribute('placeholder', (DICT[lang] && DICT[lang][pk]) || source[pk]);
    }

    /* Цены в карточках тарифов: символ и само число */
    var table = PRICES[cur];
    var prices = document.querySelectorAll('[data-price]');
    for (var j = 0; j < prices.length; j++) {
      var box = prices[j];
      var value = table.plan[box.getAttribute('data-price')];
      var sign = box.querySelector('.cur');
      var num  = box.querySelector('.count');
      if (sign) sign.textContent = table.sign;
      if (num) { num.setAttribute('data-to', value); num.textContent = nbsp(value); }
      box.classList.toggle('is-suffix', !!table.suffix);            // ₽ и ₸ ставим после числа
    }

    /* Значение для письма из формы */
    var radios = document.querySelectorAll('[data-plan]');
    for (var r = 0; r < radios.length; r++) {
      var plan = radios[r].getAttribute('data-plan');
      var name = PLAN_NAMES[lang][plan];
      /* Точка-разделитель, а не тире: тире уже стоит в теме письма */
      radios[r].value = plan === 'none' ? name : name + ' · ' + table[plan];
    }

    document.documentElement.setAttribute('lang', HTML_LANG[lang]);
    document.title = TITLES[lang];

    /* Год в подвале мы только что затёрли переводом — ставим заново */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    /* Кнопки переключателей */
    mark('lang', lang);
    mark('cur', cur);

    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: lang, cur: cur } }));
  }

  function mark(kind, value) {
    var btns = document.querySelectorAll('[data-switch="' + kind + '"] button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-val') === value));
    }
  }

  function guess() {
    /* Первый заход: берём язык браузера, валюту — по языку */
    var nav = (navigator.language || 'ru').toLowerCase();
    if (nav.indexOf('kk') === 0) return ['kk', 'kzt'];
    if (nav.indexOf('ru') === 0) return ['ru', 'rub'];
    if (nav.indexOf('en') === 0) return ['en', 'usd'];
    return ['ru', 'usd'];
  }

  function init() {
    var savedLang = read('lang'), savedCur = read('cur');
    var auto = guess();
    lang = LANGS.indexOf(savedLang) >= 0 ? savedLang : auto[0];
    cur  = CURS.indexOf(savedCur) >= 0 ? savedCur : auto[1];

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-switch] button') : null;
      if (!btn) return;
      var kind = btn.closest('[data-switch]').getAttribute('data-switch');
      var val = btn.getAttribute('data-val');
      if (kind === 'lang') { lang = val; write('lang', val); }
      else { cur = val; write('cur', val); }
      apply();
    });

    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
