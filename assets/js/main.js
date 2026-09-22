(function () {
  "use strict";

  var C = window.HAVN_CONTENT;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var SITE_ROOT = (function () {
    var el = document.currentScript;
    return el ? el.src.replace(/assets\/js\/main\.js(\?.*)?$/, "") : "";
  })();

  var STATE = {
    lang: "en",
    groundStep: 0,
    reframeStep: 0,
    breathing: false,
    petSpecies: "cat",
    petName: "",
    petNameCustom: false,
  };
  var breatheTimer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initLoader();
    loadPersistedState();
    wireBreathing();
    wireGrounding();
    wireReframe();
    wireCompanion();
    wireCharityShare();
    initI18n();
    initReveal();
    initAtmosphereMood();
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

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return o && o[k] !== undefined ? o[k] : null;
    }, obj);
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

  /* ---- Persisted state (pet only; language handled in initI18n) ---- */
  function loadPersistedState() {
    try {
      STATE.petSpecies = localStorage.getItem("havn_pet_species") || "cat";
      var customName = localStorage.getItem("havn_pet_name");
      if (customName) {
        STATE.petName = customName;
        STATE.petNameCustom = true;
      }
    } catch (e) {}
  }

  /* ---- i18n ---- */
  function initI18n() {
    var saved = null;
    try {
      saved = localStorage.getItem("havn_lang");
    } catch (e) {}
    var browserRu = navigator.language && navigator.language.toLowerCase().indexOf("ru") === 0;
    var initial = saved || (browserRu ? "ru" : "en");
    applyLanguage(initial);

    function toggle() {
      applyLanguage(STATE.lang === "en" ? "ru" : "en");
    }
    [document.getElementById("langToggle"), document.getElementById("langToggleMobile")]
      .filter(Boolean)
      .forEach(function (b) {
        b.addEventListener("click", toggle);
      });
  }

  function updateSplitElement(el, text, tintWord) {
    var wasIn = el.classList.contains("is-in");
    el.textContent = "";
    var words = text.trim().split(/\s+/);
    words.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "word" + (wasIn ? " is-in" : "");
      var bare = w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
      if (tintWord && bare === tintWord.toLowerCase()) span.classList.add("is-tint");
      span.style.transitionDelay = i * 22 + "ms";
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  function applyLanguage(lang) {
    STATE.lang = lang;
    try {
      localStorage.setItem("havn_lang", lang);
    } catch (e) {}
    document.documentElement.lang = lang;
    var ui = C.UI[lang];

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (el.hasAttribute("data-split")) return;
      var val = getPath(ui, el.getAttribute("data-i18n"));
      if (typeof val === "string") el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var val = getPath(ui, el.getAttribute("data-i18n-placeholder"));
      if (typeof val === "string") el.placeholder = val;
    });

    document.querySelectorAll("[data-split='words'][data-i18n]").forEach(function (el) {
      var val = getPath(ui, el.getAttribute("data-i18n"));
      if (typeof val !== "string") return;
      var tintWord = null;
      if (el.hasAttribute("data-tint")) {
        tintWord = lang === "ru" ? "тишина" : "stillness";
        el.setAttribute("data-tint", tintWord);
      }
      updateSplitElement(el, val, tintWord);
    });

    renderTopics(lang);
    renderTopicPage(lang);
    renderHelp(lang);
    renderMoodOptions(lang);
    updateCompanionVisual();
    refreshBreatheUI();
    renderGroundStep();
    renderReframeStep();

    document
      .querySelectorAll("#langToggleLabel, #langToggleMobileLabel")
      .forEach(function (l) {
        l.textContent = lang.toUpperCase();
      });
  }

  /* ---- Topics ---- */
  function topicCardMarkup(topic, lang) {
    return (
      '<span class="topic-card__icon">' + topic.icon + "</span>" +
      '<span class="topic-card__title">' + topic.title[lang] + "</span>" +
      '<span class="topic-card__teaser">' + topic.teaser[lang] + "</span>"
    );
  }

  function renderTopics(lang) {
    var grid = document.getElementById("topicsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    C.TOPICS.forEach(function (topic) {
      var card = document.createElement("a");
      card.className = "topic-card";
      card.href = "topics/" + topic.id + ".html";
      card.innerHTML = topicCardMarkup(topic, lang);
      grid.appendChild(card);
    });
  }

  function findTopic(id) {
    for (var i = 0; i < C.TOPICS.length; i++) {
      if (C.TOPICS[i].id === id) return C.TOPICS[i];
    }
    return null;
  }

  function renderInlineBold(text) {
    var span = document.createDocumentFragment();
    var parts = text.split(/\*\*(.+?)\*\*/g);
    parts.forEach(function (part, i) {
      if (!part) return;
      if (i % 2 === 1) {
        var strong = document.createElement("strong");
        strong.textContent = part;
        span.appendChild(strong);
      } else {
        span.appendChild(document.createTextNode(part));
      }
    });
    return span;
  }

  /* ---- Topic page (dedicated page per topic, under /topics/) ---- */
  function renderTopicPage(lang) {
    var page = document.getElementById("topicPage");
    if (!page) return;
    var topic = findTopic(page.getAttribute("data-topic-id"));
    if (!topic) return;

    var iconEl = document.getElementById("topicPageIcon");
    if (iconEl) iconEl.innerHTML = topic.icon;
    var titleEl = document.getElementById("topicPageTitle");
    if (titleEl) titleEl.textContent = topic.title[lang];
    var teaserEl = document.getElementById("topicPageTeaser");
    if (teaserEl) teaserEl.textContent = topic.teaser[lang];

    var body = document.getElementById("topicPageBody");
    if (body) {
      body.innerHTML = "";
      topic.body[lang].forEach(function (para) {
        var p = document.createElement("p");
        p.appendChild(renderInlineBold(para));
        body.appendChild(p);
      });
    }

    var moreGrid = document.getElementById("topicPageMoreGrid");
    if (moreGrid) {
      moreGrid.innerHTML = "";
      C.TOPICS.forEach(function (t) {
        if (t.id === topic.id) return;
        var card = document.createElement("a");
        card.className = "topic-card";
        card.href = t.id + ".html";
        card.innerHTML = topicCardMarkup(t, lang);
        moreGrid.appendChild(card);
      });
    }

    document.title = topic.title[lang] + " — HAVN";
  }

  /* ---- Help / Support ---- */
  function renderHelp(lang) {
    var grid = document.getElementById("helpGrid");
    if (!grid) return;
    grid.innerHTML = "";
    C.HELP_RESOURCES.forEach(function (r) {
      var card = document.createElement("div");
      card.className = "help-card";
      card.innerHTML =
        '<div class="help-card__top"><span class="help-card__name">' +
        r.name +
        '</span><span class="help-card__region">' +
        r.region[lang] +
        "</span></div>" +
        '<p class="help-card__desc">' +
        r.desc[lang] +
        "</p>" +
        '<a class="help-card__link" href="https://' +
        r.url +
        '" target="_blank" rel="noopener noreferrer">' +
        r.url +
        " ↗</a>";
      grid.appendChild(card);
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
    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---- Background mood (atmosphere) ---- */
  function initAtmosphereMood() {
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
    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  /* ---- Mouse parallax on background ---- */
  function initParallax() {
    var raf = null,
      lastX = 0.5,
      lastY = 0.5;
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
    var ring = cursor.querySelector(".cursor__ring");
    var glow = cursor.querySelector(".cursor__glow");
    document.documentElement.classList.add("has-cursor");
    cursor.classList.add("is-hidden");

    var mx = window.innerWidth / 2,
      my = window.innerHeight / 2,
      gx = mx,
      gy = my,
      rx = mx,
      ry = my,
      visible = false;

    window.addEventListener(
      "mousemove",
      function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (!visible) {
          visible = true;
          gx = mx;
          gy = my;
          rx = mx;
          ry = my;
          cursor.classList.remove("is-hidden");
        }
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", function () {
      cursor.classList.add("is-hidden");
    });

    var hoverSelector = "a, button, .space, .quote, .tile, input, textarea";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hoverSelector)) cursor.classList.add("is-active");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hoverSelector)) cursor.classList.remove("is-active");
    });

    document.addEventListener("mousedown", function (e) {
      var ripple = document.createElement("span");
      ripple.className = "cursor__ripple";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      document.body.appendChild(ripple);
      ripple.addEventListener("animationend", function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      });
    });

    function loop() {
      gx += (mx - gx) * 0.15;
      gy += (my - gy) * 0.15;
      rx += (mx - rx) * 0.3;
      ry += (my - ry) * 0.3;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
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
      a.addEventListener("click", function () {
        setOpen(false);
      });
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

  /* ---- Breathing tool ---- */
  function refreshBreatheUI() {
    var toggleLabel = document.getElementById("breatheToggleLabel");
    var label = document.getElementById("breatheLabel");
    if (!toggleLabel) return;
    var t = C.UI[STATE.lang].tools;
    toggleLabel.textContent = STATE.breathing ? t.breathStop : t.breathStart;
    if (label && !STATE.breathing) label.textContent = "—";
  }

  function wireBreathing() {
    var ring = document.getElementById("breatheRing");
    var label = document.getElementById("breatheLabel");
    var toggleBtn = document.getElementById("breatheToggle");
    if (!ring || !toggleBtn) return;
    var phaseIdx = 0;

    function phaseText() {
      var t = C.UI[STATE.lang].tools;
      return [t.breathIn, t.breathHold, t.breathOut, t.breathHold][phaseIdx % 4];
    }
    function tick() {
      label.textContent = phaseText();
      phaseIdx++;
    }
    function start() {
      STATE.breathing = true;
      phaseIdx = 0;
      ring.classList.remove("is-active");
      void ring.offsetWidth;
      ring.classList.add("is-active");
      tick();
      clearInterval(breatheTimer);
      breatheTimer = setInterval(tick, 4000);
      refreshBreatheUI();
    }
    function stop() {
      STATE.breathing = false;
      clearInterval(breatheTimer);
      ring.classList.remove("is-active");
      refreshBreatheUI();
    }
    toggleBtn.addEventListener("click", function () {
      STATE.breathing ? stop() : start();
    });
  }

  /* ---- Grounding tool ---- */
  function renderGroundStep() {
    var steps = C.UI[STATE.lang].tools.groundSteps;
    var countEl = document.getElementById("groundCount");
    var stepEl = document.getElementById("groundStep");
    var nextBtn = document.getElementById("groundNext");
    var restartBtn = document.getElementById("groundRestart");
    if (!stepEl) return;
    if (STATE.groundStep >= steps.length) {
      stepEl.textContent = C.UI[STATE.lang].tools.groundDone;
      countEl.textContent = "";
      nextBtn.hidden = true;
      restartBtn.hidden = false;
    } else {
      stepEl.textContent = steps[STATE.groundStep];
      countEl.textContent = STATE.groundStep + 1 + " / " + steps.length;
      nextBtn.hidden = false;
      restartBtn.hidden = true;
    }
  }

  function wireGrounding() {
    var nextBtn = document.getElementById("groundNext");
    var restartBtn = document.getElementById("groundRestart");
    if (!nextBtn) return;
    nextBtn.addEventListener("click", function () {
      STATE.groundStep++;
      renderGroundStep();
    });
    restartBtn.addEventListener("click", function () {
      STATE.groundStep = 0;
      renderGroundStep();
    });
  }

  /* ---- Reframe-a-thought tool ---- */
  function renderReframeStep() {
    var steps = C.UI[STATE.lang].tools.reframeSteps;
    var countEl = document.getElementById("reframeCount");
    var stepEl = document.getElementById("reframeStep");
    var nextBtn = document.getElementById("reframeNext");
    var restartBtn = document.getElementById("reframeRestart");
    if (!stepEl) return;
    if (STATE.reframeStep >= steps.length) {
      stepEl.textContent = C.UI[STATE.lang].tools.reframeDone;
      countEl.textContent = "";
      nextBtn.hidden = true;
      restartBtn.hidden = false;
    } else {
      stepEl.textContent = steps[STATE.reframeStep];
      countEl.textContent = STATE.reframeStep + 1 + " / " + steps.length;
      nextBtn.hidden = false;
      restartBtn.hidden = true;
    }
  }

  function wireReframe() {
    var nextBtn = document.getElementById("reframeNext");
    var restartBtn = document.getElementById("reframeRestart");
    if (!nextBtn) return;
    nextBtn.addEventListener("click", function () {
      STATE.reframeStep++;
      renderReframeStep();
    });
    restartBtn.addEventListener("click", function () {
      STATE.reframeStep = 0;
      renderReframeStep();
    });
  }

  /* ---- Mood check-in (private: localStorage only, never sent anywhere) ---- */
  function moodStorageKey() {
    var d = new Date();
    return "havn_mood_" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function renderMoodOptions(lang) {
    var wrap = document.getElementById("moodOptions");
    var reflection = document.getElementById("moodReflection");
    if (!wrap) return;
    var saved = null;
    try {
      saved = localStorage.getItem(moodStorageKey());
    } catch (e) {}

    wrap.innerHTML = "";
    C.MOOD_OPTIONS.forEach(function (m) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mood__option" + (saved === m.id ? " is-selected" : "");
      btn.setAttribute("aria-label", m.label[lang]);
      btn.textContent = m.emoji;
      btn.addEventListener("click", function () {
        try {
          localStorage.setItem(moodStorageKey(), m.id);
        } catch (e) {}
        renderMoodOptions(STATE.lang);
      });
      wrap.appendChild(btn);
    });

    if (saved) {
      var moodObj = null;
      for (var i = 0; i < C.MOOD_OPTIONS.length; i++) {
        if (C.MOOD_OPTIONS[i].id === saved) moodObj = C.MOOD_OPTIONS[i];
      }
      if (moodObj) {
        reflection.textContent = moodObj.reflection[lang];
        reflection.hidden = false;
      }
    } else {
      reflection.hidden = true;
    }
  }

  /* ---- Companion (cat / dog) ---- */
  function defaultPetName(species, lang) {
    var c = C.UI[lang].companion;
    return species === "dog" ? c.dogName : c.catName;
  }

  function updateCompanionVisual() {
    var picker = document.getElementById("companionPicker");
    var catBtn = document.getElementById("petCat");
    var dogBtn = document.getElementById("petDog");
    var nameEl = document.getElementById("petName");
    if (!picker || !catBtn || !dogBtn || !nameEl) return;
    catBtn.hidden = STATE.petSpecies !== "cat";
    dogBtn.hidden = STATE.petSpecies !== "dog";
    picker.querySelectorAll(".companion__pick").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-species") === STATE.petSpecies);
    });
    nameEl.textContent = STATE.petNameCustom
      ? STATE.petName
      : defaultPetName(STATE.petSpecies, STATE.lang);
    var msgEl = document.getElementById("petMessage");
    if (msgEl) msgEl.textContent = "";
    var foodEmoji = document.getElementById("petFoodEmoji");
    if (foodEmoji) foodEmoji.textContent = STATE.petSpecies === "dog" ? "🦴" : "🐟";
    var toyEmoji = document.getElementById("petToyEmoji");
    if (toyEmoji) toyEmoji.textContent = STATE.petSpecies === "dog" ? "🎾" : "🧶";
  }

  function spawnPetProp(emoji, thrown, throwX) {
    var stage = document.getElementById("petStage");
    if (!stage) return;
    var prop = document.createElement("span");
    prop.className = "pet__prop" + (thrown ? " is-thrown" : "");
    prop.textContent = emoji;
    prop.setAttribute("aria-hidden", "true");
    if (thrown) {
      var tx = Math.max(-70, Math.min(70, throwX * 0.4));
      prop.style.setProperty("--throw-x", tx + "px");
    }
    stage.appendChild(prop);
    prop.addEventListener("animationend", function () {
      if (prop.parentNode) prop.parentNode.removeChild(prop);
    });
  }

  /* Drag an item onto a drop target via Pointer Events (mouse+touch+pen);
     a short tap and Enter/Space both act as a keyboard/no-drag equivalent
     so the interaction stays usable without a pointer. */
  function makeDraggable(item, getTarget, onActivate) {
    if (!item) return;
    var dragging = false;
    var pointerId = null;
    var startX = 0,
      startY = 0,
      dx = 0,
      dy = 0;
    var highlighted = null;

    function setPos(x, y) {
      item.style.transform = x || y ? "translate3d(" + x + "px," + y + "px,0)" : "";
    }

    function hit(clientX, clientY) {
      var target = getTarget();
      if (!target) return null;
      var r = target.getBoundingClientRect();
      var pad = 18;
      var inside =
        clientX >= r.left - pad &&
        clientX <= r.right + pad &&
        clientY >= r.top - pad &&
        clientY <= r.bottom + pad;
      return inside ? target : null;
    }

    function highlight(target) {
      if (target === highlighted) return;
      if (highlighted) highlighted.classList.remove("is-drop-ready");
      highlighted = target;
      if (highlighted) highlighted.classList.add("is-drop-ready");
    }

    function end(activate) {
      dragging = false;
      item.classList.remove("is-dragging", "is-over-target");
      highlight(null);
      setPos(0, 0);
      if (activate) onActivate({ thrown: Math.hypot(dx, dy) > 40, dx: dx });
      dx = 0;
      dy = 0;
    }

    item.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button > 0) return;
      dragging = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      dy = 0;
      item.classList.add("is-dragging");
      if (item.setPointerCapture) {
        try {
          item.setPointerCapture(pointerId);
        } catch (err) {}
      }
    });

    item.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      setPos(dx, dy);
      var target = hit(e.clientX, e.clientY);
      item.classList.toggle("is-over-target", !!target);
      highlight(target);
    });

    item.addEventListener("pointerup", function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      var moved = Math.hypot(dx, dy);
      var target = moved > 8 ? hit(e.clientX, e.clientY) : getTarget();
      end(!!target);
    });

    item.addEventListener("pointercancel", function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      end(false);
    });

    item.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        onActivate({ thrown: false, dx: 0 });
      }
    });
  }

  function wireCompanion() {
    var picker = document.getElementById("companionPicker");
    var catBtn = document.getElementById("petCat");
    var dogBtn = document.getElementById("petDog");
    var renameBtn = document.getElementById("petRename");
    var foodItem = document.getElementById("petFood");
    var toyItem = document.getElementById("petToy");
    var msgEl = document.getElementById("petMessage");
    if (!picker || !catBtn || !dogBtn) return;

    picker.querySelectorAll(".companion__pick").forEach(function (b) {
      b.addEventListener("click", function () {
        STATE.petSpecies = b.getAttribute("data-species");
        try {
          localStorage.setItem("havn_pet_species", STATE.petSpecies);
        } catch (e) {}
        updateCompanionVisual();
      });
    });

    function activePetEl() {
      return STATE.petSpecies === "dog" ? dogBtn : catBtn;
    }
    function react(pool) {
      var petEl = activePetEl();
      petEl.classList.remove("is-happy");
      void petEl.offsetWidth;
      petEl.classList.add("is-happy");
      var msgs = pool[STATE.lang];
      msgEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    }
    catBtn.addEventListener("click", function () {
      react(C.PET_MESSAGES.greet);
    });
    dogBtn.addEventListener("click", function () {
      react(C.PET_MESSAGES.greet);
    });

    makeDraggable(foodItem, activePetEl, function () {
      react(C.PET_MESSAGES.feed);
      spawnPetProp(STATE.petSpecies === "dog" ? "🦴" : "🐟");
    });
    makeDraggable(toyItem, activePetEl, function (info) {
      react(C.PET_MESSAGES.play);
      spawnPetProp(STATE.petSpecies === "dog" ? "🎾" : "🧶", info.thrown, info.dx);
    });

    if (renameBtn) {
      renameBtn.addEventListener("click", function () {
        var current = STATE.petNameCustom
          ? STATE.petName
          : defaultPetName(STATE.petSpecies, STATE.lang);
        var promptText = STATE.lang === "ru" ? "Новое имя:" : "New name:";
        var next = window.prompt(promptText, current);
        if (next && next.trim()) {
          STATE.petName = next.trim().slice(0, 24);
          STATE.petNameCustom = true;
          try {
            localStorage.setItem("havn_pet_name", STATE.petName);
          } catch (e) {}
          updateCompanionVisual();
        }
      });
    }
  }

  /* ---- Charity: share button ---- */
  function wireCharityShare() {
    var btn = document.getElementById("charityShare");
    var note = document.getElementById("charityShareNote");
    if (!btn) return;
    var clearTimer = null;
    btn.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard
        .writeText(url)
        .then(function () {
          if (!note) return;
          note.textContent = C.UI[STATE.lang].charity.shareCopied;
          clearTimeout(clearTimer);
          clearTimer = setTimeout(function () {
            note.textContent = "";
          }, 2400);
        })
        .catch(function () {});
    });
  }

  /* ---- Ambient sound ----
     A real track (assets/audio/ambient.mp3), looped gapless through the Web
     Audio API rather than a plain <audio loop> element: decoding it once
     into an AudioBuffer and looping that buffer avoids the small seam MP3s
     can get at their loop point with a media element. Fetched and decoded
     lazily on first click, not on page load. */
  function initSound() {
    var buttons = [
      document.getElementById("soundToggle"),
      document.getElementById("soundToggleMobile"),
    ].filter(Boolean);
    if (!buttons.length) return;

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    var ctx = null,
      master = null,
      source = null,
      buffer = null,
      loadPromise = null,
      playing = false,
      failed = false,
      fadeTimer = null;

    function ensureContext() {
      if (ctx) return ctx;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      return ctx;
    }

    function loadBuffer() {
      if (loadPromise) return loadPromise;
      loadPromise = fetch(SITE_ROOT + "assets/audio/ambient.mp3")
        .then(function (res) {
          if (!res.ok) throw new Error("ambient audio request failed");
          return res.arrayBuffer();
        })
        .then(function (data) {
          return ctx.decodeAudioData(data);
        })
        .then(function (decoded) {
          buffer = decoded;
        });
      return loadPromise;
    }

    function startSource() {
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(master);
      source.start(0);
    }

    function setPressed(state) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(state));
        b.classList.toggle("is-on", state);
      });
    }

    function fadeTo(target, duration) {
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(target, now + duration);
    }

    function enable() {
      if (!ensureContext() || failed) return;
      setPressed(true);
      playing = true;
      clearTimeout(fadeTimer);

      var go = function () {
        if (!playing) return;
        if (ctx.state === "suspended") ctx.resume();
        if (!source) startSource();
        fadeTo(0.55, 2.5);
      };

      if (buffer) {
        go();
      } else {
        loadBuffer().then(go).catch(function () {
          failed = true;
          playing = false;
          setPressed(false);
        });
      }
    }

    function disable() {
      setPressed(false);
      playing = false;
      if (!ctx || !source) return;
      fadeTo(0, 1.4);
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(function () {
        if (ctx && !playing) ctx.suspend();
      }, 1600);
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        if (playing) disable();
        else enable();
      });
    });
  }
})();
