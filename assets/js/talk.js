/* HAVN — Talk: a live AI companion chat.
   Requires assets/js/content.js and main.js (for chrome/i18n) to load first.
   Ships against /api/chat, a small serverless function the site owner must
   deploy separately with their own ANTHROPIC_API_KEY — see README "Talk". */
(function () {
  "use strict";

  var C = window.HAVN_CONTENT;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SESSION_KEY = "havn_talk_session";
  var PAUSE_EVERY = 20;

  var session = [];
  var crisisShown = false;
  var lastErrorKey = null;

  function currentLang() {
    return document.documentElement.lang === "ru" ? "ru" : "en";
  }

  function loadSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      session = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(session)) session = [];
    } catch (e) {
      session = [];
    }
  }

  function saveSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {}
  }

  function getPetName(lang) {
    var species = "cat";
    var customName = null;
    try {
      species = localStorage.getItem("havn_pet_species") || "cat";
      customName = localStorage.getItem("havn_pet_name");
    } catch (e) {}
    if (customName) return customName;
    var c = C.UI[lang].companion;
    return species === "dog" ? c.dogName : c.catName;
  }

  function getPetSpecies() {
    try {
      return localStorage.getItem("havn_pet_species") || "cat";
    } catch (e) {
      return "cat";
    }
  }

  function scanForCrisis(text) {
    var lower = text.toLowerCase();
    var all = C.CRISIS_PATTERNS.en.concat(C.CRISIS_PATTERNS.ru);
    for (var i = 0; i < all.length; i++) {
      if (lower.indexOf(all[i].toLowerCase()) !== -1) return true;
    }
    return false;
  }

  function renderCrisisPanel(lang) {
    var titleEl = document.getElementById("talkCrisisTitle");
    var bodyEl = document.getElementById("talkCrisisBody");
    var gridEl = document.getElementById("talkCrisisGrid");
    if (!titleEl) return;
    titleEl.textContent = C.UI[lang].talk.crisisTitle;
    bodyEl.textContent = C.UI[lang].talk.crisisBody;
    gridEl.innerHTML = "";
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
      gridEl.appendChild(card);
    });
  }

  function renderMessage(role, text, pending) {
    var wrap = document.getElementById("talkMessages");
    var el = document.createElement("div");
    el.className = "talk-msg talk-msg--" + role + (pending ? " talk-msg--pending" : "");
    if (pending) {
      el.innerHTML = '<span class="talk-msg__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    } else {
      el.textContent = text;
    }
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
    return el;
  }

  function renderAllMessages(lang) {
    var wrap = document.getElementById("talkMessages");
    if (!wrap) return;
    wrap.innerHTML = "";
    var greeting = document.createElement("div");
    greeting.className = "talk-msg talk-msg--assistant";
    greeting.textContent = C.UI[lang].talk.greeting.replace("{name}", getPetName(lang));
    wrap.appendChild(greeting);
    session.forEach(function (m) {
      renderMessage(m.role, m.content, false);
    });
    wrap.scrollTop = wrap.scrollHeight;
  }

  function autoGrow(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 152) + "px";
  }

  function setFormDisabled(disabled) {
    document.getElementById("talkInput").disabled = disabled;
    document.getElementById("talkSend").disabled = disabled;
  }

  function showError(key, lang) {
    lastErrorKey = key;
    var el = document.getElementById("talkError");
    el.textContent = C.UI[lang].talk[key];
    el.hidden = false;
  }

  function hideError() {
    lastErrorKey = null;
    document.getElementById("talkError").hidden = true;
  }

  function maybeShowPause() {
    var userTurns = session.filter(function (m) {
      return m.role === "user";
    }).length;
    if (userTurns > 0 && userTurns % PAUSE_EVERY === 0) {
      var lang = currentLang();
      var pauseEl = document.getElementById("talkPause");
      pauseEl.textContent = C.UI[lang].talk.pauseNudge;
      pauseEl.hidden = false;
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    var input = document.getElementById("talkInput");
    var text = input.value.trim();
    if (!text) return;

    var lang = currentLang();
    hideError();

    if (!crisisShown && scanForCrisis(text)) {
      crisisShown = true;
      renderCrisisPanel(lang);
      var panel = document.getElementById("talkCrisis");
      panel.hidden = false;
      panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    renderMessage("user", text, false);
    session.push({ role: "user", content: text });
    saveSession();
    input.value = "";
    autoGrow(input);
    setFormDisabled(true);

    var pendingEl = renderMessage("assistant", "", true);
    var name = getPetName(lang);
    var species = getPetSpecies();

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: session, species: species, name: name, lang: lang }),
    })
      .then(function (res) {
        if (!res.ok) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (body) {
              throw { code: body && body.error };
            });
        }
        return res.json();
      })
      .then(function (data) {
        pendingEl.remove();
        var reply = (data && data.reply) || "";
        renderMessage("assistant", reply, false);
        session.push({ role: "assistant", content: reply });
        saveSession();
        maybeShowPause();
      })
      .catch(function (err) {
        pendingEl.remove();
        showError(err && err.code === "not_configured" ? "errorNoKey" : "errorGeneric", lang);
      })
      .then(function () {
        setFormDisabled(false);
        var wrap = document.getElementById("talkMessages");
        wrap.scrollTop = wrap.scrollHeight;
        input.focus();
      });
  }

  function handleReset() {
    var lang = currentLang();
    if (!window.confirm(C.UI[lang].talk.resetConfirm)) return;
    session = [];
    saveSession();
    crisisShown = false;
    document.getElementById("talkCrisis").hidden = true;
    document.getElementById("talkPause").hidden = true;
    hideError();
    renderAllMessages(lang);
  }

  function wireLangSync() {
    [document.getElementById("langToggle"), document.getElementById("langToggleMobile")]
      .filter(Boolean)
      .forEach(function (b) {
        b.addEventListener("click", function () {
          var lang = currentLang();
          if (crisisShown) renderCrisisPanel(lang);
          var pauseEl = document.getElementById("talkPause");
          if (!pauseEl.hidden) pauseEl.textContent = C.UI[lang].talk.pauseNudge;
          var errorEl = document.getElementById("talkError");
          if (!errorEl.hidden && lastErrorKey) errorEl.textContent = C.UI[lang].talk[lastErrorKey];
          if (session.length === 0) renderAllMessages(lang);
        });
      });
  }

  function init() {
    var page = document.getElementById("talkPage");
    if (!page) return;

    loadSession();
    renderAllMessages(currentLang());
    maybeShowPause();

    var form = document.getElementById("talkForm");
    var input = document.getElementById("talkInput");

    form.addEventListener("submit", handleSubmit);
    input.addEventListener("input", function () {
      autoGrow(input);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else handleSubmit(e);
      }
    });

    document.getElementById("talkReset").addEventListener("click", handleReset);
    wireLangSync();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
