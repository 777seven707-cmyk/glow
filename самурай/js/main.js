/* =========================================================
   Самурай — вступление, курсор, скролл-сцены
   GSAP + ScrollTrigger + SplitText, плавный скролл Lenis.
   3D-сцена (scene.js) грузится динамически: если WebGL или
   CDN недоступны, сайт показывает постер и остаётся рабочим.
   ========================================================= */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isMobile = () => window.innerWidth <= 960;
const { gsap, ScrollTrigger, SplitText, Lenis } = window;
const hasGsap = Boolean(gsap && ScrollTrigger && SplitText);

/* ---------- 3D-сцена ---------- */
let api = null;
let loadProgress = 0;
const scenePromise = import('./scene.js')
  .then((m) => m.createScene($('#scene'), { onProgress: (p) => { loadProgress = Math.max(loadProgress, p); } }))
  .then((a) => { api = a; applyState(); return a; })
  .catch((err) => {
    console.warn('3D-сцена недоступна, показываю постер', err);
    loadProgress = 1;
    $('#sceneFallback').hidden = false;
    return null;
  });
setTimeout(() => { loadProgress = 1; }, 7000);    // не держим вступление дольше 7 секунд: сцена проявится сама

/* ---------- состояния сцены по разделам ---------- */
let state = 'hero';
let armorStep = 'kabuto';
const LAYOUT = {
  hero:     () => (isMobile() ? { shiftX: 0, shiftY: 0.2, sun: 1, petals: 1, visible: 1, track: 1 }
                              : { shiftX: 0.02, shiftY: 0, sun: 1, petals: 1, visible: 1, track: 1 }),
  manifest: () => (isMobile() ? { shiftX: 0, shiftY: 0.2, sun: 0, petals: 0, visible: 0, track: 0.5 }
                              : { shiftX: 0.33, shiftY: 0, sun: 0, petals: 0.6, visible: 1, track: 0.6 }),
  armor:    () => (isMobile() ? { shiftX: 0, shiftY: -0.2, sun: 0, petals: 0, visible: 1, track: 0.3 }
                              : { shiftX: 0.23, shiftY: 0, sun: 0, petals: 0, visible: 1, track: 0.35 }),
  hidden:   () => ({ sun: 0, petals: 0, visible: 0 })
};
function applyState() {
  if (!api) return;
  if (state === 'hidden') { Object.assign(api.rig, LAYOUT.hidden()); return; }
  api.setShot(state === 'armor' ? armorStep : state, LAYOUT[state]());
}
function setState(s) {
  if (state === s) return;
  state = s;
  applyState();
}
window.addEventListener('resize', applyState);

/* ---------- без GSAP: статичная, но полноценная страница ---------- */
if (!hasGsap) {
  document.documentElement.classList.add('no-motion');
  document.body.classList.remove('is-locked');
} else {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  fontsReady.then(init);
}

function init() {
  const lenis = initLenis();
  const hero = prepareHero();
  initIntro(lenis, hero);
  initCursor();
  initMagnetic();
  // триггеры создаём в порядке секций на странице: закрепления
  // (pin) сдвигают всё, что ниже, и должны считаться раньше
  initScenes();
  initNav(lenis);
  initSlash();
  initReveals();
  initVirtues();
}

/* =========================================================
   ПЛАВНЫЙ СКРОЛЛ
   ========================================================= */
function initLenis() {
  if (reduced || !Lenis) return null;
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  return lenis;
}

/* =========================================================
   ВСТУПЛЕНИЕ
   ========================================================= */
function prepareHero() {
  const title = SplitText.create('#heroTitle .line', { type: 'lines,chars', mask: 'lines' });
  const jp = { chars: $$('.hero__jp span') };
  const rest = ['.eyebrow', '#heroLead', '.hero__cta', '.hero__romaji', '.hero__foot', '.nav'];
  if (!reduced) {
    gsap.set(title.chars, { yPercent: 118 });
    gsap.set(jp.chars, { autoAlpha: 0, filter: 'blur(10px)', y: -20 });
    gsap.set(rest, { autoAlpha: 0, y: 24 });
    gsap.set('.backdrop__mountains', { yPercent: 30, autoAlpha: 0 });
  }
  return () => {
    if (reduced) return;
    gsap.timeline({ delay: 0.35 })
      .to(title.chars, { yPercent: 0, duration: 1.4, stagger: 0.045, ease: 'expo.out' })
      .to('.backdrop__mountains', { yPercent: 0, autoAlpha: 0.75, duration: 2.2, ease: 'expo.out' }, 0)
      .to(jp.chars, { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 1.1, stagger: 0.14, ease: 'power3.out' }, 0.3)
      .to(rest, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out' }, 0.45);
  };
}

function initIntro(lenis, heroIn) {
  const intro = $('#intro');
  const unlock = () => {
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  };

  if (reduced) {
    intro.remove();
    unlock();
    scenePromise.then(() => applyState());
    return;
  }

  window.scrollTo(0, 0);
  const line = SplitText.create('#introLine', { type: 'chars' });
  const tl = gsap.timeline();
  tl.to('#ensoPath', { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' })
    .fromTo('#introKanji', { opacity: 0, scale: 0.82, filter: 'blur(14px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, 0.6)
    .from(line.chars, { opacity: 0, y: 14, stagger: 0.03, duration: 0.6, ease: 'power3.out' }, 1.1)
    .fromTo('#introHanko', { opacity: 0, scale: 2.2, rotate: -26 },
      { opacity: 1, scale: 1, rotate: -6, duration: 0.5, ease: 'back.out(2.4)' }, 1.7)
    .to('.intro__stage', { x: 2, yoyo: true, repeat: 3, duration: 0.04 }, 2.05);

  // счётчик идёт за реальной загрузкой модели, но не быстрее анимации
  const count = $('#introCount');
  const start = performance.now();
  const shown = { v: 0 };
  let done = false;
  const tick = () => {
    const byTime = Math.min(1, (performance.now() - start) / 2600);
    const target = Math.min(byTime, loadProgress) * 100;
    shown.v += (target - shown.v) * 0.14;
    if (target === 100 && shown.v > 99.4) shown.v = 100;
    count.textContent = String(Math.round(shown.v)).padStart(3, '0');
    if (!done && shown.v === 100 && tl.progress() === 1) {
      done = true;
      gsap.ticker.remove(tick);
      outro();
    }
  };
  gsap.ticker.add(tick);

  const outro = () => {
    gsap.timeline({ onComplete: () => intro.remove() })
      .to('.intro__stage', { scale: 1.14, opacity: 0, filter: 'blur(10px)', duration: 0.7, ease: 'power2.in' })
      .to('.intro__meta', { opacity: 0, duration: 0.4 }, '<')
      .to('.intro__seam', { scaleY: 1, duration: 0.55, ease: 'power3.inOut' }, '-=0.2')
      .add(() => {
        unlock();
        if (api) api.intro(gsap);
        applyState();
        heroIn();
      })
      .to('.intro__door--l', { xPercent: -101, duration: 1.5, ease: 'expo.inOut' }, '<')
      .to('.intro__door--r', { xPercent: 101, duration: 1.5, ease: 'expo.inOut' }, '<')
      .to('.intro__seam', { opacity: 0, duration: 0.5 }, '<0.25');
  };
}

/* =========================================================
   КУРСОР
   ========================================================= */
function initCursor() {
  if (!finePointer || reduced) return;
  document.documentElement.classList.add('has-cursor');
  const el = $('#cursor');
  const dot = $('.cursor__dot', el);
  const ring = $('.cursor__ring', el);
  const label = $('#cursorLabel');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  let current = '';

  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    el.classList.add('is-on');
    dot.style.transform = `translate3d(${x}px,${y}px,0)`;

    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const link = t.closest('a, button');
    const labelled = link ? null : t.closest('[data-cursor]');
    el.classList.toggle('is-dark', Boolean(t.closest('.section--dark')));
    el.classList.toggle('is-link', Boolean(link));
    const text = labelled ? labelled.dataset.cursor : '';
    if (text !== current) {
      current = text;
      const [jp, ...ru] = text.split(' ');
      label.innerHTML = text ? `<b>${jp}</b>${ru.join(' ')}` : '';
      el.classList.toggle('has-label', ru.length > 0);
      el.classList.toggle('is-hint', Boolean(text) && ru.length === 0);
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  window.addEventListener('pointerdown', () => gsap.to(ring, { scale: 0.8, duration: 0.15, yoyo: true, repeat: 1 }));

  gsap.ticker.add(() => {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    ring.style.translate = `${rx}px ${ry}px`;
  });
}

/* магнитные кнопки */
function initMagnetic() {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.45);
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* =========================================================
   НАВИГАЦИЯ
   ========================================================= */
function initNav(lenis) {
  const nav = $('#nav');
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      if (lenis) { lenis.start(); lenis.scrollTo(target, { duration: 1.8 }); }
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  // цвет меню над тёмными секциями
  const dark = $$('.section--dark').map((sec) => ScrollTrigger.create({
    trigger: sec, start: 'top 40px', end: 'bottom 40px',
    onToggle: () => nav.classList.toggle('is-dark', dark.some((t) => t.isActive))
  }));
  // прячем меню при прокрутке вниз
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > innerHeight * 0.7 && !nav.classList.contains('is-open'));
      if (!CSS.supports('animation-timeline: scroll()')) document.documentElement.style.setProperty('--p', self.progress.toFixed(4));
    }
  });
}

/* =========================================================
   УДАР МЕЧОМ
   ========================================================= */
function initSlash() {
  const hero = $('#top');
  const path = $('#slashPath');
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button') || reduced) return;
    if (api && window.scrollY < innerHeight * 0.5) api.slash(gsap);
    // росчерк через точку клика
    const vx = (e.clientX / innerWidth) * 1000, vy = (e.clientY / innerHeight) * 1000;
    const k = Math.random() > 0.5 ? 1 : -1;
    path.setAttribute('d', `M${vx - 520} ${vy + 300 * k} Q${vx} ${vy - 40} ${vx + 520} ${vy - 300 * k}`);
    gsap.timeline()
      .set(path, { strokeDashoffset: 1, opacity: 1 })
      .to(path, { strokeDashoffset: 0, duration: 0.22, ease: 'power4.out' }, 0.28)
      .to(path, { strokeDashoffset: -1, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.08');
  });
}

/* =========================================================
   СЦЕНЫ ПРИ ПРОКРУТКЕ
   ========================================================= */
function initScenes() {
  const zone = (trigger, name, extra = {}) => ScrollTrigger.create({
    trigger, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) setState(name); },
    ...extra
  });
  zone('#top', 'hero');
  zone('#manifest', 'manifest');
  zone('#code', 'hidden');

  /* 4. Доспех: закреплённый экран, камера ходит по деталям */
  const steps = $$('.step');
  const num = $('#armorNum');
  const bar = $('#armorBar');
  let active = 0;
  const setStep = (i) => {
    if (i === active) return;
    steps[active].classList.remove('is-active');
    steps[i].classList.add('is-active');
    active = i;
    armorStep = steps[i].dataset.shot;
    num.textContent = String(i + 1).padStart(2, '0');
    gsap.to(bar, { scaleX: (i + 1) / steps.length, duration: 0.6, ease: 'power3.out' });
    if (state === 'armor') applyState();
  };
  ScrollTrigger.create({
    trigger: '#armor', pin: '.armor__pin', start: 'top top',
    end: () => '+=' + innerHeight * (steps.length - 0.5),
    onUpdate: (self) => setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)))
  });
  zone('#armor', 'armor', { start: 'top 65%', end: 'bottom 45%' });


  /* 5. Катана: горизонтальная дорожка и клинок, выходящий из ножен */
  const track = $('#katanaTrack');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.timeline({
    scrollTrigger: {
      trigger: '#katana', pin: '.katana__pin', start: 'top top',
      end: () => '+=' + Math.max(innerHeight, dist() * 1.2),
      scrub: 1, invalidateOnRefresh: true
    }
  })
    .to(track, { x: () => -dist(), ease: 'none' }, 0)
    .fromTo('.katana__blade', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power1.inOut' }, 0)
    .fromTo('.katana__blade', { '--glint': '-30%' }, { '--glint': '130%', ease: 'none' }, 0.15);
  zone('#katana', 'hidden');
  zone('#eras', 'hidden');
  zone('#quote', 'hidden');
  zone('.footer', 'hidden');

  /* параллакс и декоративные движения */
  gsap.to('.backdrop__kanji', { yPercent: -30, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__text', { y: -120, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '#top', start: '20% top', end: '80% top', scrub: true } });
  gsap.to('.hero__vertical', { y: -200, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.fromTo('.manifest__enso', { rotate: -40 }, { rotate: 40, ease: 'none', scrollTrigger: { trigger: '#manifest', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.quote__sun', { scale: 0.55, yPercent: 25 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#quote', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.fromTo('.quote__torii', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#quote', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.fromTo('.footer__big', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* =========================================================
   ПОЯВЛЕНИЕ ТЕКСТА
   ========================================================= */
function initReveals() {
  // манифест: слова проявляются тушью по мере прокрутки
  const manifest = SplitText.create('#manifestText', { type: 'words', wordsClass: 'word' });
  gsap.to(manifest.words, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '#manifest', start: 'top 65%', end: 'center 40%', scrub: true }
  });

  // заголовки секций: строки поднимаются из-под маски
  $$('[data-split]').forEach((el) => {
    const s = SplitText.create(el, { type: 'lines,words', mask: 'lines' });
    gsap.from(s.words, {
      yPercent: 110, duration: 1.2, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // эпохи: линия заполняется, карточки выплывают по сторонам
  gsap.to('#timelineFill', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 60%', scrub: true }
  });
  $$('.era').forEach((era, i) => {
    const side = isMobile() ? 0 : (i % 2 ? 1 : -1);
    gsap.from(era.children, {
      x: (j) => (j === 0 ? -side : side) * 70, autoAlpha: 0, filter: 'blur(8px)',
      duration: 1.1, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: era, start: 'top 82%' }
    });
    ScrollTrigger.create({ trigger: era, start: 'top 60%', onToggle: (self) => era.classList.toggle('is-in', self.isActive), end: 'max' });
  });

  // цитата: буквы проступают из размытия
  const quote = SplitText.create('#quoteText', { type: 'words,chars' });
  gsap.from(quote.chars, {
    autoAlpha: 0, y: 40, rotateX: -70, filter: 'blur(12px)',
    duration: 1.2, stagger: 0.035, ease: 'expo.out',
    scrollTrigger: { trigger: '#quoteText', start: 'top 75%' }
  });
  gsap.from('.quote footer, .quote__note, .quote__jp', {
    autoAlpha: 0, y: 20, duration: 1, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '#quoteText', start: 'top 70%' }
  });
}

/* =========================================================
   ДОБРОДЕТЕЛИ: появление, наклон и подсветка за курсором
   ========================================================= */
function initVirtues() {
  const cards = $$('.virtue');
  gsap.from(cards, {
    autoAlpha: 0, y: 80, rotateX: -18, transformOrigin: '50% 100%',
    duration: 1.2, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: '.virtues', start: 'top 80%' }
  });
  if (!finePointer || reduced) return;
  // наклон — обычными твинами, а не quickTo: quickTo заранее создаёт твин
  // и перебивает анимацию появления карточек
  const tilt = (card, x, y) => gsap.to(card, { rotationX: x, rotationY: y, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      tilt(card, (0.5 - py) * 12, (px - 0.5) * 14);
    });
    card.addEventListener('pointerleave', () => tilt(card, 0, 0));
  });
}
