/* ============================================================
   Varmilo Sakura — общий фон, параллакс, лепестки, появление блоков
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };

  /* ---------------------------------------------------------
     1. Заголовок: подгонка по ширине и появление по буквам
     --------------------------------------------------------- */
  var titleEl = document.querySelector("[data-fit-title]");
  var lines = titleEl ? Array.prototype.slice.call(titleEl.querySelectorAll(".hero__line")) : [];
  var spans = [];

  lines.forEach(function (line) {
    var text = line.getAttribute("data-title") || line.textContent.trim();
    var chars = Array.from(text);
    line.textContent = "";
    chars.forEach(function (ch, i) {
      var sp = document.createElement("span");
      sp.setAttribute("aria-hidden", "true");
      sp.textContent = ch === " " ? " " : ch;
      sp.style.transitionDelay = (i * 45 + (line.dataset.delay ? +line.dataset.delay : 0)) + "ms";
      line.appendChild(sp);
      spans.push(sp);
    });
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    line.appendChild(sr);
  });

  var probe = null;
  function fitTitle() {
    if (!titleEl || !lines.length) return;
    var box = titleEl.clientWidth;
    if (!box) return;
    if (!probe) {
      probe = document.createElement("span");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;left:-9999px;top:0";
      titleEl.appendChild(probe);
    }
    var widest = 0;
    lines.forEach(function (line) {
      probe.textContent = line.getAttribute("data-title") || "";
      widest = Math.max(widest, probe.offsetWidth);
    });
    if (!widest) return;
    var byWidth = (box / widest) * 100;
    var byHeight = (window.innerHeight * 0.34) / (lines.length * 0.82);
    titleEl.style.fontSize = Math.min(byWidth, byHeight) + "px";
  }
  if (titleEl) {
    fitTitle();
    window.addEventListener("resize", fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
    window.requestAnimationFrame(function () {
      spans.forEach(function (sp) { sp.classList.add("is-in"); });
    });
  }

  /* ---------------------------------------------------------
     2. Параллакс фона: слои уезжают с разной скоростью
     --------------------------------------------------------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var scrolled = 0, wanted = 0, raf = 0;

  function paintParallax() {
    scrolled += (wanted - scrolled) * 0.12;
    if (Math.abs(wanted - scrolled) < 0.2) scrolled = wanted;
    layers.forEach(function (layer) {
      var k = parseFloat(layer.getAttribute("data-parallax")) || 0;
      layer.style.transform = "translate3d(0," + (-scrolled * k) + "px,0)";
    });
    raf = window.requestAnimationFrame(paintParallax);
  }

  if (layers.length && !reduce) {
    wanted = scrolled = window.scrollY;
    window.addEventListener("scroll", function () { wanted = window.scrollY; }, { passive: true });
    raf = window.requestAnimationFrame(paintParallax);
  }

  /* ---------------------------------------------------------
     3. Лепестки сакуры на общем фоне
     --------------------------------------------------------- */
  var canvas = document.getElementById("petals");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, petals = [];

    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -30,
        r: 5 + Math.random() * 9,
        sp: 0.4 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 0.8,
        ang: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.035,
        alpha: 0.35 + Math.random() * 0.5,
        hue: 335 + Math.random() * 16
      };
    }

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(90, Math.max(28, w / 18)));
      petals = [];
      for (var i = 0; i < count; i++) petals.push(spawn(true));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.y += p.sp;
        p.x += p.drift + Math.sin((p.y + p.ang * 40) / 90) * 0.55;
        p.ang += p.spin;
        if (p.y - p.r > h || p.x < -50 || p.x > w + 50) petals[i] = spawn(false);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ang);
        ctx.scale(1, 0.78 + Math.sin(p.ang * 1.3) * 0.26);
        ctx.fillStyle = "hsla(" + p.hue + ",80%,79%," + p.alpha + ")";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.r * 0.6, -p.r * 0.5, p.r * 1.1, p.r * 0.35, 0, p.r);
        ctx.bezierCurveTo(-p.r * 1.1, p.r * 0.35, -p.r * 0.6, -p.r * 0.5, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      window.requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------
     4. Появление блоков: своя задержка у каждого элемента
     --------------------------------------------------------- */
  var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  items.forEach(function (el) {
    var kids = el.querySelectorAll("[data-stagger]");
    Array.prototype.forEach.call(kids, function (kid, i) {
      kid.style.transitionDelay = (i * 90) + "ms";
    });
  });

  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -14% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------------------------------------------------
     5. Шапка: уплотняется после первого экрана
     --------------------------------------------------------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
