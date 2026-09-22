(function () {
  "use strict";

  var C = window.HAVN_CONTENT;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var STATE = {
    lang: "en",
    groundStep: 0,
    breathing: false,
    petSpecies: "cat",
    petName: "",
    petNameCustom: false,
    activeTopicId: null,
  };
  var breatheTimer = null;
  var lastFocused = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initLoader();
    loadPersistedState();
    wireTopicModal();
    wireBreathing();
    wireGrounding();
    wireCompanion();
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
    if (STATE.activeTopicId) renderTopicModal();
    renderHelp(lang);
    renderMoodOptions(lang);
    updateCompanionVisual();
    refreshBreatheUI();
    renderGroundStep();

    document
      .querySelectorAll("#langToggleLabel, #langToggleMobileLabel")
      .forEach(function (l) {
        l.textContent = lang.toUpperCase();
      });
  }

  /* ---- Topics ---- */
  function renderTopics(lang) {
    var grid = document.getElementById("topicsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    C.TOPICS.forEach(function (topic) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "topic-card";
      card.innerHTML =
        '<span class="topic-card__icon">' + topic.icon + "</span>" +
        '<span class="topic-card__title">' + topic.title[lang] + "</span>" +
        '<span class="topic-card__teaser">' + topic.teaser[lang] + "</span>";
      card.addEventListener("click", function () {
        openTopicModal(topic.id);
      });
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

  function renderTopicModal() {
    var topic = findTopic(STATE.activeTopicId);
    if (!topic) return;
    var lang = STATE.lang;
    document.getElementById("topicModalIcon").innerHTML = topic.icon;
    document.getElementById("topicModalTitle").textContent = topic.title[lang];
    var body = document.getElementById("topicModalBody");
    body.innerHTML = "";
    topic.body[lang].forEach(function (para) {
      var p = document.createElement("p");
      p.appendChild(renderInlineBold(para));
      body.appendChild(p);
    });
    body.scrollTop = 0;
    var panel = document.querySelector(".topic-modal__panel");
    if (panel) panel.scrollTop = 0;
  }

  function openTopicModal(id) {
    if (!findTopic(id)) return;
    STATE.activeTopicId = id;
    renderTopicModal();
    var modal = document.getElementById("topicModal");
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var panel = modal.querySelector(".topic-modal__panel");
    if (panel) panel.focus();
    document.addEventListener("keydown", onModalKeydown);
  }

  function closeTopicModal() {
    var modal = document.getElementById("topicModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onModalKeydown);
    STATE.activeTopicId = null;
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function onModalKeydown(e) {
    if (e.key === "Escape") {
      closeTopicModal();
      return;
    }
    if (e.key === "Tab") {
      var modal = document.getElementById("topicModal");
      var focusables = modal.querySelectorAll("button, a[href]");
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function wireTopicModal() {
    var modal = document.getElementById("topicModal");
    if (!modal) return;
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeTopicModal);
    });
    var closeBtn = document.getElementById("topicModalClose");
    if (closeBtn) closeBtn.addEventListener("click", closeTopicModal);
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
  }

  function spawnPetProp(emoji) {
    var stage = document.getElementById("petStage");
    if (!stage) return;
    var prop = document.createElement("span");
    prop.className = "pet__prop";
    prop.textContent = emoji;
    prop.setAttribute("aria-hidden", "true");
    stage.appendChild(prop);
    prop.addEventListener("animationend", function () {
      if (prop.parentNode) prop.parentNode.removeChild(prop);
    });
  }

  function wireCompanion() {
    var picker = document.getElementById("companionPicker");
    var catBtn = document.getElementById("petCat");
    var dogBtn = document.getElementById("petDog");
    var renameBtn = document.getElementById("petRename");
    var feedBtn = document.getElementById("petFeed");
    var playBtn = document.getElementById("petPlay");
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
    if (feedBtn) {
      feedBtn.addEventListener("click", function () {
        react(C.PET_MESSAGES.feed);
        spawnPetProp(STATE.petSpecies === "dog" ? "🦴" : "🐟");
      });
    }
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        react(C.PET_MESSAGES.play);
        spawnPetProp(STATE.petSpecies === "dog" ? "🎾" : "🧶");
      });
    }

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

  /* ---- Ambient sound (procedural, no external assets) ---- */
  function initSound() {
    var buttons = [
      document.getElementById("soundToggle"),
      document.getElementById("soundToggleMobile"),
    ].filter(Boolean);
    if (!buttons.length) return;

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    var ctx = null,
      master = null,
      playing = false,
      fadeTimer = null;

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
