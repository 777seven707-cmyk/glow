# HAVN — a digital sanctuary

A one-page, single-scroll experience built around calm instead of conversion.
No pricing, no portfolio, no "start a project" funnel — just a slow, quiet
digital space made of light, glass and soft motion. Pure HTML/CSS/JS,
no build step, no dependencies.

## Concept

HAVN isn't a studio site. It's a place a visitor arrives at, slows down in,
and leaves a little calmer. The whole page is written as one continuous
arc — dawn → clarity → depth → glow — and the background mood shifts
gently underneath the content to match.

## Structure

```
index.html                 all sections, SVG defs (glass filter, mark gradient)
assets/css/style.css       design tokens, atmosphere, glass, motion, responsive
assets/js/main.js          loader, reveals, mood/parallax, cursor, sound, nav
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

## Accessibility

Semantic sections/headings (one `h1`, `h2` per section, `h3` for sub-items),
a skip link, visible `:focus-visible` rings, 44px-tall nav/footer links,
`aria-pressed` on the sound toggle, `aria-expanded`/`aria-controls` on the
mobile menu trigger, and AA-safe contrast (ink tokens sit well above 4.5:1
on every background in the palette). All motion — parallax, cursor,
blob drift, reveal transitions — is disabled or collapsed to instant/static
under `prefers-reduced-motion: reduce`. Content is fully present and
readable without JavaScript (`<noscript>` hides the loader; reveal states
only apply once an `html.js` class is set).

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
