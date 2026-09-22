# HAVN — a digital sanctuary

A one-page, single-scroll experience built around calm instead of conversion —
and, since this update, real support for anyone having a hard time. No
pricing, no portfolio, no "start a project" funnel. Pure HTML/CSS/JS, no
build step, no framework dependencies.

## Concept

HAVN isn't a studio site. It's a place a visitor arrives at, slows down in,
and — if they need it — finds something that actually helps: a catalog of
what hard feelings tend to look like, a breathing and grounding exercise, a
private mood check-in, a small animal companion, and a list of real, verified
crisis resources. The atmospheric sections (Philosophy, Spaces, Ritual,
Presence, Moments) are still here — they're the "sanctuary" half. Topics,
Tools, Companion and Support are the "help" half. Neither is a demo of the
other; they're meant to work together.

**This is not a substitute for professional care.** The Support section says
so explicitly, in both languages, next to real crisis-line contacts. See
"On the support content" below before repurposing this for anything beyond
a portfolio/demo project.

## Structure

```
index.html                 all sections, SVG defs (glass filter, mark/cloud/bird symbols)
assets/css/style.css       design tokens, atmosphere, glass, motion, responsive
assets/js/content.js       bilingual (en/ru) copy: topics, tool labels, pet
                            affirmations, crisis resources, every UI string
assets/js/main.js          i18n engine, loader, reveals, mood/parallax, cursor,
                            sound, topic modal, breathing/grounding/mood tools,
                            pet companion, nav
assets/img/favicon.svg     the HAVN mark (orb + horizon)
assets/img/og-cover.png    1200×630 share preview, rendered from the same mark
components/ui/             React/shadcn reference components (not used by the
                            static site — see "Moving to React" below)
.nojekyll                  so GitHub Pages serves files as-is
```

## Run locally

Open `index.html` directly, or serve it:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy

Static site, any host works.

**GitHub Pages:** Settings → Pages → Source: `Deploy from a branch` → root.
**Netlify / Vercel / Cloudflare Pages:** connect the repo, leave the build
command empty, publish directory = repo root.

If you publish under a real domain, change `og:image` / `twitter:image` in
`index.html` to an absolute URL — otherwise Telegram/WhatsApp/Slack previews
won't pick up the cover image.

## Brand

**HAVN** (styled without the middle *e*) — a stand-in for *haven*: shelter,
not excitement. The mark is an orb resting on a horizon line — morning light
meeting still water — built as inline SVG so it can breathe (a slow
`scale` pulse) everywhere it appears: loader, navbar, hero, footer.

## Theme

Everything lives in CSS custom properties at the top of `style.css`:

| Token | Role |
|---|---|
| `--white` / `--milk` / `--mist` / `--ice` / `--sky` | the light-to-icy background ramp |
| `--cyan` / `--cyan-2` / `--azure` / `--azure-deep` | accent, used sparingly (one gradient word per heading, links, glow) |
| `--ink` / `--ink-2` / `--ink-3` | text, darkest to most muted (opacity-based, not separate colors) |
| `--glass` / `--glass-border` / `--glass-shadow` | shared glassmorphism recipe |
| `--ease-out` / `--ease-soft` | the two easing curves used for every transition |

The site is light-only by design — there is no dark mode to keep visually
consistent with a second palette; introducing one would need real design
work, not a token flip.

## The background

`.atmosphere` is a fixed layer behind everything: four large radial-gradient
blobs drifting on 55–85s keyframe loops, two soft diagonal light rays, and
four full-bleed "mood" gradients that cross-fade (opacity, not gradient
interpolation — the reliable way to morph gradients smoothly) as the visitor
scrolls past each `section[data-mood]`. A scrollspy-style `IntersectionObserver`
with a thin center band (`rootMargin: "-45% 0px -45% 0px"`) decides which
mood is active. The whole layer nudges a few pixels toward the cursor via
two CSS custom properties (`--mx`/`--my`) written from a rAF-throttled
`mousemove` listener, smoothed with a CSS `transition` rather than manual
lerp math.

Deliberately **not** WebGL/Three.js: a shader background fights the brief's
own instruction not to feel like "a technological interface." Layered CSS
gradients are also cheaper, need no shader tuning, and degrade to a static
frame for free under `prefers-reduced-motion`.

A `.clouds` layer adds five soft SVG cloud shapes (one `<symbol>`, reused via
`<use>`, tinted and blurred differently per instance) drifting a few `vw`
back and forth on 150–230s loops — slow enough to read as weather, not UI.

## Moments (gallery)

`#gallery`, near the bottom of the page, is the one section that isn't pure
typography: five tiles in an asymmetric grid, each a layered CSS gradient
standing in for a photo (no stock imagery, to keep the abstract/generative
language consistent with the rest of the site). One tile ("Passing") animates
its `background-position` slowly, the closest thing on the page to a looping
video, flagged with a small pulsing "Live" badge. Captions sit on a
gradient scrim dark enough to keep white caption text at ≥4.5:1 contrast
against any of the tile backgrounds, not just the darkest one.

## Motion system

Three reveal variants, applied with `data-reveal`, so the page doesn't use
one animation for every element (nor a different one for each):

* `[data-reveal]` (default) — fade + rise + blur-to-sharp, for most blocks.
* `[data-reveal="scale"]` — same, with a touch of scale, for glass cards.
* `[data-reveal="line"]` — per-line blur/translate reveal, used once, for
  the hero heading.

Kinetic typography (`[data-split="words"]`) is wrapped into `.word` spans
at runtime — not hand-authored in the markup — so paragraph copy stays
editable as plain text; `data-tint="word"` tints a specific word to accent
blue. One `IntersectionObserver` in `main.js` drives all of it.

## Sound

Off by default, everywhere. The glass toggle in the navbar (and its twin in
the mobile menu) doesn't play a file — there's no licensed ambient track to
ship — it **synthesizes** one with the Web Audio API: four sine oscillators
(a soft low C-major voicing) through a shared lowpass filter, with a slow
LFO breathing the filter's cutoff so the pad shifts instead of droning.
Gain ramps over ~2s on enable and ~1.2s on disable (no clicks), and the
`AudioContext` is created lazily on the first click (autoplay policy) and
suspended after fade-out so a muted tab costs nothing.

## Topics, Tools & Companion

**Topics** (`#topics`) is a catalog of eight things that are hard to carry —
anxiety, depression, loneliness, grief, bullying, disability/chronic illness,
burnout, low self-esteem. Each card opens (in an accessible modal —
focus-trapped, closes on Escape/backdrop/close button, returns focus on
close, scrolls its own body independently on long content) a full,
long-form piece written directly to the reader in second person: not a
bullet-point symptom list, but a real, warm piece of writing — validating,
never diagnostic, ending with a bridge to Support. `content.js` stores each
one as an array of paragraph strings (`**text**` renders as an emphasized
line via `renderInlineBold()`, built with `createElement`/`textContent`,
never `innerHTML`, even though the content is fully first-party) — both
languages run 1,300–1,900 words per topic, translated for warmth rather
than word-for-word.

**Tools** (`#tools`) are three small, real exercises, not gamified in any
way that would reward staying longer than needed:
- *Breathe with me* — one minute of box breathing (4-4-4-4), a CSS
  `animation` on the ring synced to a `setInterval` label ("Breathe in" /
  "Hold" / "Breathe out"). Starts/stops cleanly, no auto-loop beyond what
  the visitor asks for.
- *Come back to the room* — the 5-4-3-2-1 grounding technique, stepped
  through one prompt at a time.
- *Mood check-in* — five options, once per calendar day. Saved to
  `localStorage` only, keyed by today's date; nothing is sent anywhere,
  ever. There is deliberately no history/streak/chart — the goal is a
  moment of noticing, not a habit-tracking product to keep opening.

**Companion** (`#companion`) is a small SVG cat or dog (visitor's choice,
persisted locally) with a body, a wagging tail, and blush cheeks, not just
a face. Three separate interactions — pet, Feed, Play — each play a gentle
bounce/tail-wag and surface a random line from their own affirmation pool
(16 general, 9 feed-themed, 9 play-themed, per language); Feed and Play
also pop a small species-appropriate emoji (fish/bone, yarn/tennis ball)
that fades on its own. None of it decays — there's no hunger bar, no
neglect state, nothing that could make a hard week feel like a second
failure. The companion can be renamed via a native `prompt()`. It exists
to be a soft, low-stakes, always-available presence — not a chatbot, not a
game with a score.

All of the above's state (`havn_pet_species`, `havn_pet_name`,
`havn_mood_<date>`, `havn_lang`) lives only in the visitor's own
`localStorage`. The site makes zero network requests beyond loading its own
static files — verified by watching the network panel through every
interaction above.

## Support resources

`#help` lists real, verified places to get real help, each checked against
its own organization's site before being included: a national crisis line
for Russia (the long-established, official Детский телефон доверия,
8-800-2000-122), the US 988 Suicide & Crisis Lifeline, and two international
directories (Find A Helpline, Befrienders Worldwide) for everywhere else.
The section opens with an explicit, two-language statement that HAVN is not
a person, a doctor, or a crisis line, and that immediate danger means
contacting local emergency services — not this website.

**If you fork this for real-world use beyond a portfolio/demo:** re-verify
every number and link in `assets/js/content.js` (`HELP_RESOURCES`) before
publishing, add resources for whatever countries your actual audience is
in, and — because this touches mental health — have the Topics copy read by
someone qualified before you rely on it. Nothing here was written to
diagnose, treat, or replace care; it was written to be a decent first step
and a nudge toward real help.

## Language

Two full languages ship today — English (default for most visitors) and
Russian (default when the browser reports a `ru*` locale, or after a manual
switch) — toggled from the pill button in the nav (and mobile menu), and
remembered in `localStorage`. Every string on the page, including the eight
Topics, the four Support resources, and all eight pet affirmations, is
translated, not just the UI chrome.

Architecture: `assets/js/content.js` exports one `HAVN_CONTENT` object —
`UI` (nested per-section strings, looked up by dot-path, e.g.
`"topics.eyebrow"`), `TOPICS`, `HELP_RESOURCES`, `PET_MESSAGES`,
`MOOD_OPTIONS`, each keyed `{ en, ru }`. `main.js`'s `applyLanguage(lang)`
walks every `[data-i18n]` element and swaps its text; elements that also
carry `data-split="words"` (the kinetic-typography lines) get re-split into
`.word` spans rather than just re-texted, preserving the reveal animation —
and preserving Unicode correctly (`\p{L}`, not `\w`, so Cyrillic isn't
silently stripped when matching the tinted word in "Тишина"). Adding a third
language means adding one more key to each object in `content.js` — no
template changes required.

## Accessibility

Semantic sections/headings (one `h1`, correctly-nested `h2`/`h3` throughout,
even after adding four new sections), a skip link, visible `:focus-visible`
rings, 44px-tall nav/footer links, `aria-pressed` on the sound toggle,
`aria-expanded`/`aria-controls` on the mobile menu trigger, and AA-safe
contrast (every text token clears 4.5:1 against every background it's
actually used on — re-verified with a contrast script after adding the
Topics/Support/Gallery-caption text, which pushed two labels from a
lighter "muted" tier up to the AA-safe one). All motion — parallax, cursor,
blob/cloud/bird drift, breathing ring, reveal transitions — is disabled or
collapsed to instant/static under `prefers-reduced-motion: reduce`. Content
is fully present and readable without JavaScript (`<noscript>` hides the
loader; reveal states only apply once an `html.js` class is set; the Topics/
Support/Tools/Companion sections do need JS to render their content, same
as any data-driven part of a JS-free-by-default page).

The topic modal is a real dialog: `role="dialog"` + `aria-modal`, opening
moves focus into the panel, `Tab`/`Shift+Tab` are trapped inside it, `Escape`
or the backdrop closes it, and focus returns to whatever opened it.

One general-purpose fix worth noting: `[hidden]{display:none !important}`
was added to the reset, because the grounding tool's "Start over" button —
`hidden` by default, `class="btn ..."` — stayed visible despite the
attribute, since `.btn`'s own `display: inline-flex` (equal specificity,
later in the cascade) was beating the UA stylesheet's `[hidden]` rule. Any
future `hidden`-toggled element with an explicit `display` class would have
hit the same bug.

## Performance

No images except the two small SVGs and the OG cover; no WebGL; no
animation loop runs unless something is actually moving (the cursor's rAF
loop is the one exception, and it's skipped entirely on touch/coarse
pointers and under reduced motion). Everything animated uses `transform`/
`opacity`/`filter` only. Scroll/mousemove handlers are rAF-throttled. Large
blobs get their softness from gradient stops, not `filter: blur()`, to
avoid blurring huge painted layers.

## Customize

| Where | What |
|---|---|
| `index.html` — `<!-- HERO -->` | badge, heading, subtitle, CTA labels |
| `index.html` — `<!-- SPACES -->` | the five room names/descriptions/swatch colors |
| `index.html` — `<!-- RITUAL -->` | the four "how to be here" steps |
| `index.html` — `<!-- PRESENCE -->` | the three quotes |
| `assets/js/content.js` — `TOPICS` | the eight topic cards, both languages |
| `assets/js/content.js` — `HELP_RESOURCES` | crisis/support resources — **re-verify before reuse** |
| `assets/js/content.js` — `PET_MESSAGES`, `MOOD_OPTIONS` | companion affirmations, mood check-in options |
| `assets/js/content.js` — `UI` | every other translated string on the page |
| `assets/css/style.css` — `:root` | palette, spacing, easing |
| `assets/js/main.js` — `initSound()` | the chord/voicing used for ambient sound |
| `index.html` — footer `mailto:` | contact address |

## Moving to React

Not needed for this site, but `components/ui` already has shadcn-style
building blocks (button, card, spotlight) left over from earlier
exploration, in case a future rebuild wants them — see
`components/ui/README.md`. They aren't wired into `index.html`.

## Browsers

Chrome, Firefox, Safari, Edge — current versions. `backdrop-filter` falls
back gracefully (plain blur before the SVG-displacement enhanced version,
so Safari still gets real glass, just without the refraction texture).
