(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initLoader();
    splitWords();
    initReveal();
    initMood();
    if (!reduceMotion) initParallax();
    if (fine && !reduceMotion) initCursor();
    initNav();
    initMobileMenu();
    if (fine && !reduceMotion) initMagnetic();
    if (fine) initSpotlight();
    initRitualLine();
    initSound();
    initScrollProgress();
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function throttleRaf(fn) {
    var raf = null;
    return function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        fn();
        raf = null;
      });
    };
  }

  /* ---- Loader ---- */
  function initLoader() {
    var loader = document.getElementById("loader");
    var bar = document.getElementById("loaderBar");
    if (!loader) return;
    var minDelay = reduceMotion ? 0 : 850;
    var start = Date.now();

    function finish() {
      var wait = Math.max(0, minDelay - (Date.now() - start));
      requestAnimationFrame(function () {
        if (bar) bar.style.right = "0%";
      });
      setTimeout(function () {
        loader.classList.add("is-hidden");
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, reduceMotion ? 0 : 1200);
      }, wait + (reduceMotion ? 0 : 450));
    }

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish);
  }

  /* ---- Kinetic typography ---- */
  function splitWords() {
    var els = document.querySelectorAll('[data-split="words"]');
    els.forEach(function (el) {
      var tint = (el.getAttribute("data-tint") || "")
        .toLowerCase()
        .split(",")
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach(function (w, i) {
        var span = document.createElement("span");
        span.className = "word";
        var bare = w.replace(/[^\w]/g, "").toLowerCase();
        if (tint.indexOf(bare) !== -1) span.classList.add("is-tint");
        span.style.transitionDelay = i * 22 + "ms";
        span.textContent = w;
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
    });
  }

  /* ---- Scroll reveal ---- */
  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal], [data-split="words"]');
    if (!targets.length) return;

    function reveal(el) {
      el.classList.add("is-in");
      el.querySelectorAll(".word").forEach(function (w) {
        w.classList.add("is-in");
      });
    }

    if (!("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- Background mood ---- */
  function initMood() {
    var sections = document.querySelectorAll("section[data-mood]");
    var layers = document.querySelectorAll(".mood-layer");
    if (!sections.length || !layers.length) return;

    function activate(mood) {
      layers.forEach(function (l) {
        l.classList.toggle("is-active", l.getAttribute("data-mood") === mood);
      });
    }
    activate("dawn");

    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activate(entry.target.getAttribute("data-mood"));
        });
      },
      { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---- Mouse parallax on background ---- */
  function initParallax() {
    var raf = null, lastX = 0.5, lastY = 0.5;
    var root = document.documentElement;
    window.addEventListener(
      "mousemove",
      function (e) {
        lastX = e.clientX / window.innerWidth;
        lastY = e.clientY / window.innerHeight;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          root.style.setProperty("--mx", lastX.toFixed(3));
          root.style.setProperty("--my", lastY.toFixed(3));
          raf = null;
        });
      },
      { passive: true }
    );
  }

  /* ---- Custom cursor ---- */
  function initCursor() {
    var cursor = document.getElementById("cursor");
    if (!cursor) return;
    var dot = cursor.querySelector(".cursor__dot");
    var glow = cursor.querySelector(".cursor__glow");
    document.documentElement.classList.add("has-cursor");
    cursor.classList.add("is-hidden");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var gx = mx, gy = my, visible = false;

    window.addEventListener(
      "mousemove",
      function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (!visible) {
          visible = true;
          gx = mx;
          gy = my;
          cursor.classList.remove("is-hidden");
        }
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", function () {
      cursor.classList.add("is-hidden");
    });

    var hoverSelector = "a, button, .space, .quote, input, textarea";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hoverSelector)) cursor.classList.add("is-active");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hoverSelector)) cursor.classList.remove("is-active");
    });

    function loop() {
      gx += (mx - gx) * 0.15;
      gy += (my - gy) * 0.15;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---- Nav shrink on scroll ---- */
  function initNav() {
    var wrap = document.getElementById("navWrap");
    if (!wrap) return;
    var update = throttleRaf(function () {
      wrap.classList.toggle("is-scrolled", window.scrollY > 40);
    });
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---- Mobile menu ---- */
  function initMobileMenu() {
    var burger = document.getElementById("burger");
    var menu = document.getElementById("mobileMenu");
    if (!burger || !menu) return;

    function setOpen(open) {
      document.documentElement.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
    }
    burger.addEventListener("click", function () {
      setOpen(!document.documentElement.classList.contains("menu-open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---- Magnetic buttons ---- */
  function initMagnetic() {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate3d(" + x * 0.18 + "px," + y * 0.3 + "px,0)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "translate3d(0,0,0)";
      });
    });
  }

  /* ---- Cursor-follow glass spotlight ---- */
  function initSpotlight() {
    document.querySelectorAll("[data-spotlight]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--x", e.clientX - r.left + "px");
        el.style.setProperty("--y", e.clientY - r.top + "px");
      });
    });
  }

  /* ---- Ritual progress line ---- */
  function initRitualLine() {
    var line = document.getElementById("ritualLine");
    var fill = document.getElementById("ritualFill");
    if (!line || !fill) return;

    var update = throttleRaf(function () {
      var r = line.getBoundingClientRect();
      var visibleStart = window.innerHeight * 0.8;
      var progress = (visibleStart - r.top) / r.height;
      progress = Math.max(0, Math.min(1, progress));
      fill.style.height = progress * 100 + "%";
    });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---- Scroll progress bar ---- */
  function initScrollProgress() {
    var bar = document.getElementById("progressBar");
    if (!bar) return;
    var update = throttleRaf(function () {
      var el = document.documentElement;
      var height = el.scrollHeight - el.clientHeight;
      bar.style.width = (height > 0 ? (el.scrollTop / height) * 100 : 0) + "%";
    });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---- Ambient sound (procedural, no external assets) ---- */
  function initSound() {
    var buttons = [
      document.getElementById("soundToggle"),
      document.getElementById("soundToggleMobile"),
    ].filter(Boolean);
    if (!buttons.length) return;

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    var ctx = null, master = null, playing = false, fadeTimer = null;

    function build() {
      if (!AudioCtx) return false;
      ctx = new AudioCtx();

      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      var filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.35;
      filter.connect(master);

      [
        { f: 65.41, g: 0.05 },
        { f: 130.81, g: 0.045 },
        { f: 164.81, g: 0.045 },
        { f: 196.0, g: 0.04 },
      ].forEach(function (voice) {
        var osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = voice.f;
        var g = ctx.createGain();
        g.gain.value = voice.g;
        osc.connect(g);
        g.connect(filter);
        osc.start();
      });

      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06;
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = 160;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      return true;
    }

    function setPressed(state) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(state));
        b.classList.toggle("is-on", state);
      });
    }

    function enable() {
      if (!ctx && !build()) return;
      ctx.resume();
      clearTimeout(fadeTimer);
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.5, now + 2.2);
      playing = true;
      setPressed(true);
    }

    function disable() {
      setPressed(false);
      playing = false;
      if (!ctx) return;
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 1.2);
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(function () {
        if (ctx && !playing) ctx.suspend();
      }, 1300);
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        if (playing) disable();
        else enable();
      });
    });
  }
})();
