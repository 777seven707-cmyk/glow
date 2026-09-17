/* =========================================================
   ITALIA — фотографии
   Снимки не лежат в репозитории: страница берёт их из
   Wikimedia Commons через API Википедии прямо в браузере.
   Один запрос за адресами, второй за авторами и лицензиями.
   Нет сети — остаётся нарисованная кодом подложка.
   ========================================================= */
(function () {
  'use strict';

  var API = window.ITALIA_WIKI_BASE || 'https://en.wikipedia.org/w/api.php';
  var WIDTH = 1600;
  var TIMEOUT = 9000;

  function get(url) {
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT);
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', mode: 'cors' })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function strip(html) {
    if (!html) return '';
    var d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function boot() {
    var slots = Array.prototype.slice.call(document.querySelectorAll('[data-photo]'));
    if (!slots.length || !('fetch' in window)) return;

    var titles = [];
    slots.forEach(function (el) {
      var t = el.getAttribute('data-photo');
      if (titles.indexOf(t) < 0) titles.push(t);
    });

    /* Википедия отдаёт максимум 50 заголовков за раз */
    var chunks = [];
    for (var i = 0; i < titles.length; i += 45) chunks.push(titles.slice(i, i + 45));

    Promise.all(chunks.map(function (chunk) {
      return get(API + '?action=query&format=json&origin=*&redirects=1&prop=pageimages' +
                 '&piprop=thumbnail|name&pithumbsize=' + WIDTH +
                 '&titles=' + encodeURIComponent(chunk.join('|')));
    })).then(function (parts) {
      var byTitle = {}, files = [];

      parts.forEach(function (data) {
        var pages = (data && data.query && data.query.pages) || {};
        var alias = {};
        ((data.query && data.query.normalized) || []).forEach(function (n) { alias[n.to] = n.from; });
        ((data.query && data.query.redirects) || []).forEach(function (n) { alias[n.to] = n.from; });

        Object.keys(pages).forEach(function (k) {
          var p = pages[k];
          if (!p || !p.thumbnail || !p.thumbnail.source) return;
          var name = p.title;
          /* возвращаем исходный заголовок, если сработал редирект или нормализация */
          var seen = {};
          while (alias[name] && !seen[name]) { seen[name] = 1; name = alias[name]; }
          byTitle[name] = { src: p.thumbnail.source, file: p.pageimage };
          if (p.pageimage) files.push('File:' + p.pageimage);
        });
      });

      apply(byTitle);
      if (files.length) credits(files, byTitle);
    }).catch(function () { /* без сети страница просто остаётся с подложкой */ });
  }

  function apply(byTitle) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-photo]'), function (el) {
      var info = byTitle[el.getAttribute('data-photo')];
      if (!info) return;

      if (el.hasAttribute('data-photo-var')) {
        /* фон для подсвеченного слова в заголовке */
        document.documentElement.style.setProperty(el.getAttribute('data-photo-var'), 'url("' + info.src + '")');
      }
      if (el.tagName === 'IMG') {
        el.addEventListener('load', function () { el.classList.add('is-ready'); });
        el.src = info.src;
        return;
      }
      var img = document.createElement('img');
      img.alt = el.getAttribute('data-photo-alt') || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('load', function () { el.classList.add('is-ready'); });
      img.src = info.src;
      el.insertBefore(img, el.firstChild);
    });
  }

  function credits(files, byTitle) {
    var uniq = files.filter(function (f, i) { return files.indexOf(f) === i; });
    var chunks = [];
    for (var i = 0; i < uniq.length; i += 40) chunks.push(uniq.slice(i, i + 40));

    Promise.all(chunks.map(function (chunk) {
      return get(API + '?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata|url' +
                 '&titles=' + encodeURIComponent(chunk.join('|')));
    })).then(function (parts) {
      var byFile = {};
      parts.forEach(function (data) {
        var pages = (data && data.query && data.query.pages) || {};
        Object.keys(pages).forEach(function (k) {
          var p = pages[k];
          var ii = p && p.imageinfo && p.imageinfo[0];
          if (!ii) return;
          var m = ii.extmetadata || {};
          byFile[p.title.replace(/^File:/, '')] = {
            author: strip(m.Artist && m.Artist.value) || 'Wikimedia Commons',
            license: strip(m.LicenseShortName && m.LicenseShortName.value) || '',
            page: ii.descriptionurl || ''
          };
        });
      });

      Array.prototype.forEach.call(document.querySelectorAll('[data-photo]'), function (el) {
        var info = byTitle[el.getAttribute('data-photo')];
        if (!info || !info.file) return;
        var c = byFile[info.file];
        if (!c) return;
        var host = el.parentNode.querySelector('[data-photo-credit]');
        var text = 'Фото: ' + c.author + (c.license ? ' · ' + c.license : '');
        if (host) {
          host.textContent = '';
          if (c.page) {
            var a = document.createElement('a');
            a.href = c.page; a.target = '_blank'; a.rel = 'noopener nofollow';
            a.textContent = text;
            host.appendChild(a);
          } else host.textContent = text;
        } else {
          var img = el.tagName === 'IMG' ? el : el.querySelector('img');
          if (img && !img.title) img.title = text;
        }
      });
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
