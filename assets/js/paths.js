/* =========================================================
   Летящие линии на фоне секций.
   Два встречных пучка кривых, по которым бежит штрих.
   Разметка создаётся лениво — только когда секция впервые
   показалась на экране; вне экрана анимация стоит на паузе.
   ========================================================= */
(function () {
  'use strict';

  var COUNT = 30;          // кривых в одном пучке
  var VIEWBOX = '0 0 696 316';

  /* Формула кривых повторяет компонент background-paths:
     координаты намеренно выходят далеко за viewBox, поэтому
     в кадр попадает только середина — линии влетают и вылетают. */
  function bundle(position) {
    var out = '';
    for (var i = 0; i < COUNT; i++) {
      var x1 = 380 - i * 5 * position;
      var y1 = 189 + i * 6;
      var x2 = 312 - i * 5 * position;
      var y2 = 216 - i * 6;
      var x3 = 152 - i * 5 * position;
      var y3 = 343 - i * 6;
      var x4 = 616 - i * 5 * position;
      var y4 = 470 - i * 6;
      var x5 = 684 - i * 5 * position;
      var y5 = 875 - i * 6;

      var d = 'M-' + x1 + ' -' + y1 +
              'C-' + x1 + ' -' + y1 + ' -' + x2 + ' ' + y2 + ' ' + x3 + ' ' + y3 +
              'C' + x4 + ' ' + y4 + ' ' + x5 + ' ' + y5 + ' ' + x5 + ' ' + y5;

      var width = (0.4 + i * 0.022).toFixed(2);
      var op = (0.012 + i * 0.0026).toFixed(4);   // фон не должен спорить с текстом
      var dur = (22 + (i % 7) * 2.5).toFixed(1);   // разброс задан один раз, не случайно каждый кадр

      out += '<path pathLength="1" d="' + d + '" stroke-width="' + width +
             '" style="--op:' + op + ';--dur:' + dur + 's"/>';
    }
    return out;
  }

  function build(host) {
    if (host.dataset.built) return;
    host.dataset.built = '1';
    host.innerHTML =
      '<svg viewBox="' + VIEWBOX + '" preserveAspectRatio="xMidYMid meet" focusable="false">' +
      bundle(1) + bundle(-1) +
      '</svg>';
  }

  function init() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll('[data-paths]'));
    if (!hosts.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!('IntersectionObserver' in window)) {
      hosts.forEach(function (host) {
        build(host);
        if (!reduced) host.classList.add('is-running');
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var host = entry.target;
        if (entry.isIntersecting) {
          build(host);
          if (!reduced) host.classList.add('is-running');
        } else {
          host.classList.remove('is-running');   // вне экрана не тратим кадры
        }
      });
    }, { rootMargin: '25% 0px' });

    hosts.forEach(function (host) { io.observe(host); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
