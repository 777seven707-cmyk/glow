/* =========================================================
   ITALIA — интерактивная карта 20 регионов
   Контуры лежат статикой в разметке (SVG), здесь — поведение:
   подсветка, карточка региона, фильтры, заливка по показателю.
   ========================================================= */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var nf = new Intl.NumberFormat('ru-RU');

  var CITIES = [
    { n: 'Рим',        x: 298, y: 368, cap: true },
    { n: 'Милан',      x: 134, y: 123 },
    { n: 'Неаполь',    x: 387, y: 441, a: 'end' },
    { minor: true, n: 'Турин',      x: 57,  y: 147 },
    { n: 'Венеция',    x: 293, y: 128 },
    { minor: true, n: 'Флоренция',  x: 237, y: 240 },
    { minor: true, n: 'Болонья',    x: 242, y: 191 },
    { minor: true, n: 'Генуя',      x: 120, y: 194 },
    { minor: true, n: 'Бари',       x: 519, y: 426 },
    { n: 'Палермо',    x: 339, y: 624 },
    { minor: true, n: 'Кальяри',    x: 125, y: 544 }
  ];
  var VOLCANOES = [
    { n: 'Этна · 3403 м',   x: 421, y: 651, dy: 0 },
    { n: 'Везувий · 1281 м', x: 397, y: 445, dy: 18 }
  ];

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function boot() {
    var svg = document.getElementById('itMap');
    var panel = document.getElementById('mapPanel');
    if (!svg || !window.ITALIA) return;

    var data = {};
    window.ITALIA.REGIONS.forEach(function (r) { data[r.id] = r; });

    var paths = Array.prototype.slice.call(svg.querySelectorAll('path[id]'));
    var metric = 'pop';
    var current = 'lazio';

    /* --- заливка по показателю --- */
    function value(r) {
      return metric === 'pop' ? r.pop : metric === 'area' ? r.area : Math.round(r.pop / r.area);
    }
    function paint() {
      var vals = window.ITALIA.REGIONS.map(value);
      var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      paths.forEach(function (p) {
        var r = data[p.id]; if (!r) return;
        var t = (Math.log(value(r)) - Math.log(min)) / (Math.log(max) - Math.log(min) || 1);
        p.style.setProperty('--t', t.toFixed(3));
      });
      var lg = document.getElementById('mapLegendVals');
      if (lg) {
        lg.innerHTML = '<span>' + nf.format(min) + '</span><span>' + nf.format(max) + '</span>';
      }
      var unit = document.getElementById('mapLegendUnit');
      if (unit) unit.textContent = metric === 'pop' ? 'жителей' : metric === 'area' ? 'км²' : 'человек на км²';
    }

    /* --- карточка региона --- */
    function zoneName(z) {
      return { nord: 'Север', centro: 'Центр', sud: 'Юг', isole: 'Острова' }[z] || '';
    }
    function show(id) {
      var r = data[id]; if (!r || !panel) return;
      current = id;
      panel.innerHTML =
        '<div class="rpanel__top">' +
          '<div><h3>' + r.ru + '</h3><p class="rpanel__it">' + r.it + ' · ' + zoneName(r.zone) + '</p></div>' +
          '<span class="rpanel__cap">' + r.cap + '</span>' +
        '</div>' +
        '<div class="rpanel__nums">' +
          '<div><b>' + nf.format(r.pop) + '</b><span>жителей</span></div>' +
          '<div><b>' + nf.format(r.area) + '</b><span>км²</span></div>' +
          '<div><b>' + nf.format(Math.round(r.pop / r.area)) + '</b><span>чел./км²</span></div>' +
          '<div><b>≈' + r.unesco + '</b><span>объектов ЮНЕСКО</span></div>' +
        '</div>' +
        '<p class="rpanel__about">' + r.about + '</p>' +
        '<dl class="rpanel__dl">' +
          '<div><dt>На тарелке</dt><dd>' + r.dish + '</dd></div>' +
          '<div><dt>В бокале</dt><dd>' + r.wine + '</dd></div>' +
          '<div><dt>Деталь</dt><dd>' + r.fact + '</dd></div>' +
        '</dl>';
      panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
      paths.forEach(function (p) { p.classList.toggle('is-on', p.id === id); });
      var list = document.getElementById('mapList');
      if (list) Array.prototype.forEach.call(list.querySelectorAll('button'), function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-id') === id);
      });
    }

    /* --- подписи регионов и поведение путей --- */
    var tip = document.getElementById('mapTip');
    paths.forEach(function (p) {
      var r = data[p.id];
      if (!r) return;
      p.setAttribute('tabindex', '0');
      p.setAttribute('role', 'button');
      p.setAttribute('aria-label', r.ru);
      p.setAttribute('data-zone', r.zone);
      el('title', null, p).textContent = r.ru + ' — ' + r.cap;

      p.addEventListener('click', function () { show(p.id); });
      p.addEventListener('focus', function () { show(p.id); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p.id); } });
      p.addEventListener('pointerenter', function (e) {
        p.classList.add('is-hover');
        if (!tip) return;
        tip.textContent = r.ru;
        tip.classList.add('is-on');
        moveTip(e);
      });
      p.addEventListener('pointermove', moveTip);
      p.addEventListener('pointerleave', function () {
        p.classList.remove('is-hover');
        if (tip) tip.classList.remove('is-on');
      });
    });
    function moveTip(e) {
      if (!tip) return;
      var host = svg.parentElement.getBoundingClientRect();
      tip.style.transform = 'translate(' + (e.clientX - host.left) + 'px,' + (e.clientY - host.top) + 'px)';
    }

    /* --- города и вулканы --- */
    var marks = el('g', { class: 'map-marks', 'aria-hidden': 'true' }, svg);
    CITIES.forEach(function (c) {
      var g = el('g', { class: 'map-city' + (c.cap ? ' map-city--cap' : '') + (c.minor ? ' map-city--minor' : '') }, marks);
      el('circle', { cx: c.x, cy: c.y, r: c.cap ? 5 : 3.4, class: 'map-dot' }, g);
      if (c.cap) el('circle', { cx: c.x, cy: c.y, r: 11, class: 'map-dot-ring' }, g);
      var t = el('text', {
        x: c.a === 'end' ? c.x - 9 : c.x + 9, y: c.y + 4 + (c.dy || 0),
        class: 'map-city__t', 'text-anchor': c.a === 'end' ? 'end' : 'start'
      }, g);
      t.textContent = c.n;
    });
    VOLCANOES.forEach(function (v) {
      var g = el('g', { class: 'map-volcano' }, marks);
      el('path', { d: 'M' + (v.x - 7) + ' ' + (v.y + 6) + ' L' + v.x + ' ' + (v.y - 7) + ' L' + (v.x + 7) + ' ' + (v.y + 6) + ' Z', class: 'map-volcano__i' }, g);
      el('text', { x: v.x + 11, y: v.y + 6 + (v.dy || 0), class: 'map-city__t map-city__t--vol' }, g).textContent = v.n;
    });

    /* --- список регионов рядом с картой --- */
    var list = document.getElementById('mapList');
    if (list) {
      list.innerHTML = window.ITALIA.REGIONS
        .slice().sort(function (a, b) { return a.ru.localeCompare(b.ru, 'ru'); })
        .map(function (r) {
          return '<li><button type="button" data-id="' + r.id + '" data-zone="' + r.zone + '">' + r.ru + '</button></li>';
        }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () { show(b.getAttribute('data-id')); });
        b.addEventListener('pointerenter', function () {
          var p = document.getElementById(b.getAttribute('data-id'));
          if (p) p.classList.add('is-hover');
        });
        b.addEventListener('pointerleave', function () {
          var p = document.getElementById(b.getAttribute('data-id'));
          if (p) p.classList.remove('is-hover');
        });
      });
    }

    /* --- фильтр по части страны --- */
    Array.prototype.forEach.call(document.querySelectorAll('[data-zone-filter]'), function (btn) {
      btn.addEventListener('click', function () {
        var z = btn.getAttribute('data-zone-filter');
        Array.prototype.forEach.call(document.querySelectorAll('[data-zone-filter]'), function (b) {
          b.classList.toggle('is-on', b === btn);
        });
        svg.setAttribute('data-filter', z);
        if (list) Array.prototype.forEach.call(list.querySelectorAll('button'), function (b) {
          b.parentNode.hidden = !(z === 'all' || b.getAttribute('data-zone') === z);
        });
      });
    });

    /* --- переключатель показателя --- */
    Array.prototype.forEach.call(document.querySelectorAll('[data-metric]'), function (btn) {
      btn.addEventListener('click', function () {
        metric = btn.getAttribute('data-metric');
        Array.prototype.forEach.call(document.querySelectorAll('[data-metric]'), function (b) {
          b.classList.toggle('is-on', b === btn);
        });
        paint();
      });
    });

    paint();
    show(current);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
