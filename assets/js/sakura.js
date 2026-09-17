/* ============================================================
   SAKURA — сборка 3D-клавиатуры, лепестки, скролл-анимация постера
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };

  /* ---------------------------------------------------------
     1. Клавиатура: раскладка TKL, каждая клавиша — div в 3D-слое
     --------------------------------------------------------- */
  var K = function (label, w, cls) { return { label: label, w: w || 1, cls: cls || "" }; };
  var SP = function (w) { return { spacer: true, w: w }; };
  var P = "key--pink";
  var A = "key--accent";

  var mainRows = [
    [K("Esc", 1, A), SP(1),
     K("F1", 1, P), K("F2"), K("F3"), K("F4"), SP(.5),
     K("F5", 1, A), K("F6", 1, A), K("F7", 1, A), K("F8"), SP(.5),
     K("F9"), K("F10"), K("F11"), K("F12")],
    [K("~"), K("1"), K("2"), K("3"), K("4"), K("5"), K("6"), K("7"), K("8"),
     K("9"), K("0"), K("—"), K("+"), K("⌫", 2, P)],
    [K("Tab", 1.5, P), K("Q"), K("W"), K("E"), K("R"), K("T"), K("Y"), K("U"),
     K("I"), K("O"), K("P"), K("{"), K("}"), K("|", 1.5, P)],
    [K("Caps", 1.75, P), K("A"), K("S"), K("D"), K("F"), K("G"), K("H"), K("J"),
     K("K"), K("L"), K(":"), K("\""), K("⏎", 2.25, P)],
    [K("Shift", 2.25, P), K("Z"), K("X"), K("C"), K("V"), K("B"), K("N"), K("M"),
     K("<"), K(">"), K("?"), K("Shift", 2.75, P)],
    [K("Ctrl", 1.25, P), K("❀", 1.25, "key--accent"), K("Alt", 1.25),
     K("", 6.25, "key--art"), K("Alt", 1.25), K("❀", 1.25, "key--accent"),
     K("Fn", 1.25), K("Ctrl", 1.25, P)]
  ];

  var navRows = [
    [K("Prt"), K("Scr"), K("Pau")],
    [SP(3)],
    [K("Ins", 1, P), K("Home", 1, P), K("PgUp", 1, P)],
    [K("Del", 1, P), K("End", 1, P), K("PgDn", 1, P)],
    [SP(3)],
    [SP(3)],
    [SP(1), K("↑", 1, A), SP(1)],
    [K("←", 1, A), K("↓", 1, A), K("→", 1, A)]
  ];

  function makeKey(item) {
    var cap = document.createElement("div");
    cap.className = "keycap " + (item.cls || "");
    cap.style.width = "calc(var(--u) * " + item.w + " + var(--u) * .14 * " + (item.w - 1) + ")";

    var top = document.createElement("div");
    top.className = "keycap__top";
    top.textContent = item.label;
    cap.appendChild(top);

    ["front", "back", "left", "right"].forEach(function (side) {
      var f = document.createElement("div");
      f.className = "keycap__side keycap__side--" + side;
      cap.appendChild(f);
    });
    return cap;
  }

  function buildRows(rows) {
    var frag = document.createDocumentFragment();
    rows.forEach(function (row) {
      var el = document.createElement("div");
      el.className = "kbd__row";
      row.forEach(function (item) {
        if (item.spacer) {
          var gap = document.createElement("div");
          gap.style.width = "calc(var(--u) * " + item.w + ")";
          gap.style.height = "var(--u)";
          el.appendChild(gap);
        } else {
          el.appendChild(makeKey(item));
        }
      });
      frag.appendChild(el);
    });
    return frag;
  }

  function buildKeyboard(mount) {
    var kbd = document.createElement("div");
    kbd.className = "kbd";
    kbd.setAttribute("aria-hidden", "true");

    var block = document.createElement("div");
    block.className = "kbd__block";

    var main = document.createElement("div");
    main.className = "kbd__col";
    main.appendChild(buildRows([mainRows[0]]));
    var gap = document.createElement("div");
    gap.className = "kbd__gap-y";
    main.appendChild(gap);
    main.appendChild(buildRows(mainRows.slice(1)));

    var nav = document.createElement("div");
    nav.className = "kbd__col";
    nav.appendChild(buildRows(navRows));

    block.appendChild(main);
    block.appendChild(nav);
    kbd.appendChild(block);

    ["front", "back", "left", "right"].forEach(function (side) {
      var w = document.createElement("div");
      w.className = "kbd__wall kbd__wall--" + side;
      kbd.appendChild(w);
    });
    var bottom = document.createElement("div");
    bottom.className = "kbd__bottom";
    kbd.appendChild(bottom);

    mount.appendChild(kbd);
  }

  /* ---------------------------------------------------------
     1b. Кручение мышкой / пальцем / стрелками
     --------------------------------------------------------- */
  function initDrag(stage, spin) {
    var rx = 58, ry = -24;              // наклон и поворот, градусы
    var vx = 0, vy = reduce ? 0 : 0.14; // скорости
    var dragging = false, lastX = 0, lastY = 0, idle = 0, touched = false;
    var AUTO = reduce ? 0 : 0.14;

    function apply() {
      spin.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
    }

    function tick() {
      if (!dragging) {
        ry += vy;
        rx = Math.min(84, Math.max(6, rx + vx));
        vy *= 0.94;
        vx *= 0.9;
        if (Math.abs(vx) < 0.002) vx = 0;
        idle++;
        // через ~4 секунды покоя клавиатура снова начинает медленно вращаться
        if (touched && idle > 240 && Math.abs(vy) < AUTO) vy += (AUTO - vy) * 0.02;
        if (!touched && Math.abs(vy) < AUTO) vy = AUTO;
        apply();
      }
      window.requestAnimationFrame(tick);
    }

    stage.addEventListener("pointerdown", function (e) {
      dragging = true; touched = true; idle = 0;
      lastX = e.clientX; lastY = e.clientY;
      vx = vy = 0;
      stage.classList.add("is-grabbed");
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      ry += dx * 0.35;
      rx = Math.min(84, Math.max(6, rx - dy * 0.25));
      vy = dx * 0.35; vx = -dy * 0.25;
      apply();
    });

    function release(e) {
      if (!dragging) return;
      dragging = false; idle = 0;
      if (e && e.pointerId != null && stage.hasPointerCapture(e.pointerId)) {
        stage.releasePointerCapture(e.pointerId);
      }
    }
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);

    stage.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 15 : 6;
      if (e.key === "ArrowLeft") { ry -= step; touched = true; idle = 0; vy = 0; }
      else if (e.key === "ArrowRight") { ry += step; touched = true; idle = 0; vy = 0; }
      else if (e.key === "ArrowUp") { rx = Math.min(84, rx + step); touched = true; idle = 0; }
      else if (e.key === "ArrowDown") { rx = Math.max(6, rx - step); touched = true; idle = 0; }
      else return;
      e.preventDefault();
      apply();
    });

    apply();
    window.requestAnimationFrame(tick);
  }

  var kbdMount = document.getElementById("kbdMount");
  var kbdStage = document.getElementById("kbdStage");
  var kbdSpin = document.getElementById("kbdSpin");
  if (kbdMount) buildKeyboard(kbdMount);
  if (kbdStage && kbdSpin) initDrag(kbdStage, kbdSpin);

  /* ---------------------------------------------------------
     2. Заголовок по буквам + выезжающий текст на скролле
     --------------------------------------------------------- */
  var track = document.getElementById("poster");
  var titleEl = document.getElementById("posterTitle");
  var copyEl = document.getElementById("posterCopy");
  var spans = [];
  var lines = titleEl ? Array.prototype.slice.call(titleEl.querySelectorAll(".poster__line")) : [];

  lines.forEach(function (line) {
    var text = line.getAttribute("data-title") || line.textContent.trim();
    var chars = Array.from(text);
    var mid = Math.max(chars.length - 1, 1) / 2;
    line.textContent = "";
    chars.forEach(function (ch, i) {
      var sp = document.createElement("span");
      sp.setAttribute("aria-hidden", "true");
      sp.textContent = ch === " " ? " " : ch;
      sp.dataset.fromCenter = String(mid <= 0 ? 0 : Math.abs(i - mid) / mid);
      sp.dataset.side = i < chars.length / 2 ? "1" : "-1";
      line.appendChild(sp);
      spans.push(sp);
    });
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    line.appendChild(sr);
  });

  // обе строки подгоняются по ширине кадра: берётся самая длинная
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
    var h1 = titleEl.querySelector("h1");
    if (!h1) return;
    var byWidth = (box / widest) * 100;
    // заголовок не должен съедать больше 42% высоты кадра
    var frame = titleEl.parentElement ? titleEl.parentElement.clientHeight : 0;
    var byHeight = frame ? (frame * 0.42) / (lines.length * 0.84) : byWidth;
    h1.style.fontSize = Math.min(byWidth, byHeight) + "px";
  }

  if (titleEl) {
    fitTitle();
    window.addEventListener("resize", fitTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  }

  function charReveal(progress, fromCenter) {
    var start = fromCenter * 0.55;
    var end = Math.min(1, start + 0.38);
    return clamp01((progress - start) / Math.max(0.001, end - start));
  }

  function paint(p) {
    var titleProgress = clamp01(p / 0.4);
    for (var i = 0; i < spans.length; i++) {
      var sp = spans[i];
      var fc = parseFloat(sp.dataset.fromCenter);
      var t = charReveal(titleProgress, fc);
      var y = (1 - t) * (18 + fc * 24);
      var x = (1 - t) * (fc > 0.01 ? fc * 16 * parseFloat(sp.dataset.side) : 0);
      sp.style.opacity = t;
      sp.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    }
    if (copyEl) {
      var cp = clamp01((p - 0.62) / 0.34);
      copyEl.style.transform = "translate3d(0," + (1 - cp) * 100 + "%,0)";
    }
  }

  if (track) {
    if (reduce) {
      paint(1);
    } else {
      var target = 0, current = 0, raf = 0;
      var read = function () {
        var rect = track.getBoundingClientRect();
        var scrollable = track.offsetHeight - (window.innerHeight || 1);
        if (scrollable <= 0) return 1;
        return clamp01(-rect.top / scrollable);
      };
      var loop = function () {
        var d = target - current;
        current += Math.abs(d) > 0.35 ? d * 0.22 : d * 0.14;
        if (Math.abs(d) < 0.0008) current = target;
        paint(current);
        raf = window.requestAnimationFrame(loop);
      };
      var onScroll = function () { target = read(); };
      target = current = read();
      paint(current);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      raf = window.requestAnimationFrame(loop);
    }
  }

  /* ---------------------------------------------------------
     3. Падающие лепестки сакуры
     --------------------------------------------------------- */
  var canvas = document.getElementById("petals");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, petals = [];

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(70, Math.max(24, w / 22)));
      petals = [];
      for (var i = 0; i < count; i++) petals.push(spawn(true));
    }

    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -20,
        r: 5 + Math.random() * 8,
        sp: 0.35 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 0.7,
        ang: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.03,
        alpha: 0.4 + Math.random() * 0.5,
        hue: 335 + Math.random() * 15
      };
    }

    function petalPath(p) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(p.r * 0.6, -p.r * 0.5, p.r * 1.1, p.r * 0.35, 0, p.r);
      ctx.bezierCurveTo(-p.r * 1.1, p.r * 0.35, -p.r * 0.6, -p.r * 0.5, 0, 0);
      ctx.closePath();
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.y += p.sp;
        p.x += p.drift + Math.sin((p.y + p.ang * 40) / 90) * 0.5;
        p.ang += p.spin;
        if (p.y - p.r > h || p.x < -40 || p.x > w + 40) petals[i] = spawn(false);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ang);
        ctx.scale(1, 0.8 + Math.sin(p.ang * 1.3) * 0.25);
        ctx.fillStyle = "hsla(" + p.hue + ",78%,80%," + p.alpha + ")";
        petalPath(p);
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
     4. Появление секций
     --------------------------------------------------------- */
  var items = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
