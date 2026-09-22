#!/usr/bin/env node
/* One-off generator: reads assets/js/content.js and emits a static, crawlable
   HTML page per topic under topics/*.html. Re-run this after editing TOPICS
   in content.js. Not a runtime dependency — output is committed, plain JS/CSS
   still drive language switching and interactivity in the browser. */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.join(__dirname, "..");
var OUT_DIR = path.join(ROOT, "topics");

function loadContent() {
  var code = fs.readFileSync(path.join(ROOT, "assets/js/content.js"), "utf8");
  var sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "content.js" });
  return sandbox.window.HAVN_CONTENT;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineBold(s) {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function topicCard(t) {
  return (
    '<a class="topic-card" href="' + t.id + '.html">' +
    '<span class="topic-card__icon">' + t.icon + "</span>" +
    '<span class="topic-card__title">' + escapeHtml(t.title.en) + "</span>" +
    '<span class="topic-card__teaser">' + escapeHtml(t.teaser.en) + "</span>" +
    "</a>"
  );
}

function pageHTML(topic, allTopics) {
  var title = escapeHtml(topic.title.en) + " — HAVN";
  var desc = escapeHtml(topic.teaser.en);
  var body = topic.body.en.map(function (p) {
    return "      <p>" + inlineBold(p) + "</p>";
  }).join("\n");
  var more = allTopics
    .filter(function (t) { return t.id !== topic.id; })
    .map(topicCard)
    .join("\n      ");

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>" + title + "</title>\n" +
    '<meta name="description" content="' + desc + '">\n' +
    '<meta name="theme-color" content="#eef7fd">\n' +
    '<meta name="author" content="HAVN">\n' +
    '<meta name="color-scheme" content="light">\n' +
    "\n" +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + title + '">\n' +
    '<meta property="og:description" content="' + desc + '">\n' +
    '<meta property="og:locale" content="en_US">\n' +
    '<meta property="og:image" content="../assets/img/og-cover.png">\n' +
    '<meta property="og:image:width" content="1200">\n' +
    '<meta property="og:image:height" content="630">\n' +
    '<meta property="og:image:alt" content="HAVN — a digital sanctuary, an orb resting on a soft horizon">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:image" content="../assets/img/og-cover.png">\n' +
    "\n" +
    '<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="../assets/css/style.css">\n' +
    '<script>document.documentElement.classList.add("js");</script>\n' +
    '<noscript><style>.loader{display:none!important}</style></noscript>\n' +
    "</head>\n" +
    "<body>\n" +
    "\n" +
    '<a href="#main" class="skip-link">Skip to content</a>\n' +
    "\n" +
    '<div class="loader" id="loader" aria-hidden="true">\n' +
    '  <div class="loader__inner">\n' +
    '    <svg class="loader__mark" viewBox="0 0 48 40" aria-hidden="true">\n' +
    '      <circle cx="24" cy="17" r="12" fill="url(#markGlow)" stroke="currentColor" stroke-width="1.1"/>\n' +
    '      <line x1="4" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>\n' +
    '      <line x1="12" y1="33" x2="36" y2="33" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".4"/>\n' +
    "    </svg>\n" +
    '    <span class="loader__word" data-i18n="loader.word">Arriving, quietly</span>\n' +
    '    <div class="loader__bar"><i id="loaderBar"></i></div>\n' +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    '<svg class="sr-only" aria-hidden="true" focusable="false">\n' +
    "  <defs>\n" +
    '    <radialGradient id="markGlow" cx="35%" cy="30%" r="75%">\n' +
    '      <stop offset="0%" stop-color="#ffffff"/>\n' +
    '      <stop offset="55%" stop-color="#cfe9fb"/>\n' +
    '      <stop offset="100%" stop-color="#8fd0f2"/>\n' +
    "    </radialGradient>\n" +
    '    <filter id="glass-distort" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">\n' +
    '      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.06" numOctaves="1" seed="7" result="turbulence"/>\n' +
    '      <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise"/>\n' +
    '      <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="18" xChannelSelector="R" yChannelSelector="B"/>\n' +
    "    </filter>\n" +
    '    <symbol id="cloud-shape" viewBox="0 0 200 100">\n' +
    '      <g fill="currentColor">\n' +
    '        <ellipse cx="60" cy="66" rx="46" ry="27"/>\n' +
    '        <ellipse cx="102" cy="48" rx="44" ry="35"/>\n' +
    '        <ellipse cx="142" cy="62" rx="40" ry="26"/>\n' +
    '        <ellipse cx="86" cy="72" rx="58" ry="21"/>\n' +
    '        <ellipse cx="132" cy="74" rx="40" ry="19"/>\n' +
    "      </g>\n" +
    "    </symbol>\n" +
    '    <symbol id="bird-shape" viewBox="0 0 24 12">\n' +
    '      <path d="M0 7 Q6 -1 12 7 Q18 -1 24 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>\n' +
    "    </symbol>\n" +
    "  </defs>\n" +
    "</svg>\n" +
    "\n" +
    '<div class="atmosphere" id="atmosphere" aria-hidden="true">\n' +
    '  <div class="mood-layer" data-mood="dawn"></div>\n' +
    '  <div class="mood-layer" data-mood="clarity"></div>\n' +
    '  <div class="mood-layer" data-mood="deep"></div>\n' +
    '  <div class="mood-layer" data-mood="glow"></div>\n' +
    '  <span class="blob blob--1"></span>\n' +
    '  <span class="blob blob--2"></span>\n' +
    '  <span class="blob blob--3"></span>\n' +
    '  <span class="blob blob--4"></span>\n' +
    '  <span class="ray ray--1"></span>\n' +
    '  <span class="ray ray--2"></span>\n' +
    '  <div class="clouds">\n' +
    '    <svg class="cloud cloud--1" viewBox="0 0 200 100"><use href="#cloud-shape"/></svg>\n' +
    '    <svg class="cloud cloud--2" viewBox="0 0 200 100"><use href="#cloud-shape"/></svg>\n' +
    '    <svg class="cloud cloud--3" viewBox="0 0 200 100"><use href="#cloud-shape"/></svg>\n' +
    '    <svg class="cloud cloud--4" viewBox="0 0 200 100"><use href="#cloud-shape"/></svg>\n' +
    '    <svg class="cloud cloud--5" viewBox="0 0 200 100"><use href="#cloud-shape"/></svg>\n' +
    "  </div>\n" +
    '  <div class="birds">\n' +
    '    <div class="bird bird--1"><svg class="bird__glyph" viewBox="0 0 24 12"><use href="#bird-shape"/></svg></div>\n' +
    '    <div class="bird bird--2"><svg class="bird__glyph" viewBox="0 0 24 12"><use href="#bird-shape"/></svg></div>\n' +
    '    <div class="bird bird--3"><svg class="bird__glyph" viewBox="0 0 24 12"><use href="#bird-shape"/></svg></div>\n' +
    "  </div>\n" +
    "</div>\n" +
    '<div class="grain" aria-hidden="true"></div>\n' +
    "\n" +
    '<div class="cursor" id="cursor" aria-hidden="true">\n' +
    '  <span class="cursor__glow"></span>\n' +
    '  <span class="cursor__ring"></span>\n' +
    '  <span class="cursor__dot"></span>\n' +
    "</div>\n" +
    "\n" +
    '<div class="progress" aria-hidden="true"><i id="progressBar"></i></div>\n' +
    "\n" +
    '<div class="nav-wrap" id="navWrap">\n' +
    '  <nav class="nav" aria-label="Primary">\n' +
    '    <a href="../index.html" class="brand" data-magnetic>\n' +
    '      <svg class="brand__mark" viewBox="0 0 48 40" aria-hidden="true">\n' +
    '        <circle cx="24" cy="17" r="12" fill="url(#markGlow)" stroke="currentColor" stroke-width="1.1"/>\n' +
    '        <line x1="4" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>\n' +
    "      </svg>\n" +
    '      <span class="brand__word">HAVN</span>\n' +
    "    </a>\n" +
    "\n" +
    '    <div class="nav__links">\n' +
    '      <a href="../index.html#topics" class="nav__link"><span data-i18n="nav.topics">Topics</span></a>\n' +
    '      <a href="../index.html#tools" class="nav__link"><span data-i18n="nav.tools">Tools</span></a>\n' +
    '      <a href="../index.html#companion" class="nav__link"><span data-i18n="nav.companion">Companion</span></a>\n' +
    '      <a href="../index.html#gallery" class="nav__link"><span data-i18n="nav.moments">Moments</span></a>\n' +
    '      <a href="../index.html#help" class="nav__link nav__link--help"><span data-i18n="nav.support">Support</span></a>\n' +
    "    </div>\n" +
    "\n" +
    '    <button class="lang-toggle" id="langToggle" type="button">\n' +
    '      <span id="langToggleLabel">EN</span>\n' +
    "    </button>\n" +
    "\n" +
    '    <button class="sound-toggle" id="soundToggle" type="button" aria-pressed="false">\n' +
    '      <span class="sound-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span>\n' +
    '      <span class="sr-only" data-i18n="sound.label">Toggle ambient sound</span>\n' +
    "    </button>\n" +
    "\n" +
    '    <button class="burger" id="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu">\n' +
    "      <i></i><i></i>\n" +
    "    </button>\n" +
    "  </nav>\n" +
    "</div>\n" +
    "\n" +
    '<div class="mmenu" id="mobileMenu" aria-hidden="true">\n' +
    '  <a href="../index.html#topics" data-i18n="nav.topics">Topics</a>\n' +
    '  <a href="../index.html#tools" data-i18n="nav.tools">Tools</a>\n' +
    '  <a href="../index.html#companion" data-i18n="nav.companion">Companion</a>\n' +
    '  <a href="../index.html#gallery" data-i18n="nav.moments">Moments</a>\n' +
    '  <a href="../index.html#help" data-i18n="nav.support">Support</a>\n' +
    '  <div class="mmenu__row">\n' +
    '    <button class="lang-toggle" id="langToggleMobile" type="button"><span id="langToggleMobileLabel">EN</span></button>\n' +
    '    <button class="sound-toggle mmenu__sound" id="soundToggleMobile" type="button" aria-pressed="false">\n' +
    '      <span class="sound-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span>\n' +
    '      <span class="sr-only" data-i18n="sound.label">Toggle ambient sound</span>\n' +
    "    </button>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    '<main id="main">\n' +
    "\n" +
    '<section class="section topic-page" id="topicPage" data-mood="clarity" data-topic-id="' + topic.id + '">\n' +
    '  <div class="container container--narrow">\n' +
    '    <a class="topic-page__back" href="../index.html#topics" data-i18n="topicPage.back" data-reveal>← Back to Topics</a>\n' +
    '    <div class="topic-page__icon" id="topicPageIcon" aria-hidden="true" data-reveal>' + topic.icon + "</div>\n" +
    '    <h1 class="topic-page__title" id="topicPageTitle" data-reveal>' + escapeHtml(topic.title.en) + "</h1>\n" +
    '    <p class="topic-page__teaser" id="topicPageTeaser" data-reveal>' + escapeHtml(topic.teaser.en) + "</p>\n" +
    '    <div class="topic-page__body" id="topicPageBody" data-reveal>\n' +
    body + "\n" +
    "    </div>\n" +
    '    <p class="topic-page__closing" data-i18n="topics.closing" data-reveal>If this feels bigger than a website can hold, that\'s okay — that\'s what Support, below, is for.</p>\n' +
    '    <a href="../index.html#help" class="btn btn--sm" data-reveal><span data-i18n="topics.openSupport">Go to Support →</span></a>\n' +
    "  </div>\n" +
    "\n" +
    '  <div class="container topic-page__more">\n' +
    '    <span class="sec-eyebrow" data-i18n="topicPage.moreTopics" data-reveal>More topics</span>\n' +
    '    <div class="topics__grid" id="topicPageMoreGrid" data-reveal="scale">\n' +
    "      " + more + "\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</section>\n" +
    "\n" +
    "</main>\n" +
    "\n" +
    '<footer class="footer">\n' +
    '  <div class="container">\n' +
    '    <div class="footer__top">\n' +
    '      <div class="footer__brand">\n' +
    '        <a href="../index.html" class="brand" data-magnetic>\n' +
    '          <svg class="brand__mark" viewBox="0 0 48 40" aria-hidden="true">\n' +
    '            <circle cx="24" cy="17" r="12" fill="url(#markGlow)" stroke="currentColor" stroke-width="1.1"/>\n' +
    '            <line x1="4" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>\n' +
    "          </svg>\n" +
    '          <span class="brand__word">HAVN</span>\n' +
    "        </a>\n" +
    '        <p data-i18n="footer.tagline">A digital sanctuary for a noisy world.</p>\n' +
    "      </div>\n" +
    "\n" +
    '      <div class="footer__cols">\n' +
    '        <div class="footer__col">\n' +
    '          <b data-i18n="footer.explore">Explore</b>\n' +
    '          <a href="../index.html#philosophy" data-i18n="footer.philosophy">Philosophy</a>\n' +
    '          <a href="../index.html#spaces" data-i18n="footer.spacesLink">Spaces</a>\n' +
    '          <a href="../index.html#ritual" data-i18n="footer.ritual">Ritual</a>\n' +
    '          <a href="../index.html#presence" data-i18n="footer.presence">Presence</a>\n' +
    '          <a href="../index.html#gallery" data-i18n="footer.moments">Moments</a>\n' +
    "        </div>\n" +
    '        <div class="footer__col">\n' +
    '          <b data-i18n="footer.support">Get support</b>\n' +
    '          <a href="../index.html#topics" data-i18n="footer.topicsLink">Topics</a>\n' +
    '          <a href="../index.html#tools" data-i18n="footer.toolsLink">Tools</a>\n' +
    '          <a href="../index.html#companion" data-i18n="footer.companionLink">Companion</a>\n' +
    '          <a href="../index.html#help" data-i18n="footer.helpLink">Support</a>\n' +
    '          <a href="../index.html#charity" data-i18n="footer.charityLink">Charity</a>\n' +
    "        </div>\n" +
    '        <div class="footer__col">\n' +
    '          <b data-i18n="footer.connect">Connect</b>\n' +
    '          <a href="mailto:hello@havn.studio">hello@havn.studio</a>\n' +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    '    <div class="footer__line" aria-hidden="true"></div>\n' +
    "\n" +
    '    <div class="footer__bottom">\n' +
    '      <span>© <span id="year">2026</span> <span data-i18n="footer.copyright">HAVN. A digital sanctuary.</span></span>\n' +
    '      <a href="../index.html" class="to-top" data-magnetic><span data-i18n="footer.toTop">Back to top ↑</span></a>\n' +
    "    </div>\n" +
    "  </div>\n" +
    "</footer>\n" +
    "\n" +
    '<script src="../assets/js/content.js"></script>\n' +
    '<script src="../assets/js/main.js" defer></script>\n' +
    "</body>\n" +
    "</html>\n"
  );
}

function main() {
  var content = loadContent();
  var topics = content.TOPICS;
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  topics.forEach(function (topic) {
    var html = pageHTML(topic, topics);
    var file = path.join(OUT_DIR, topic.id + ".html");
    fs.writeFileSync(file, html, "utf8");
    console.log("wrote topics/" + topic.id + ".html");
  });

  console.log(topics.length + " topic pages generated.");
}

main();
