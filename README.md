# HAVN — a digital sanctuary

A slow, single-scroll homepage built around calm instead of conversion, plus
a handful of dedicated pages (one per topic, and a Talk page) — and, since
this update, real support for anyone having a hard time. No pricing, no
portfolio, no "start a project" funnel. Plain HTML/CSS/JS throughout, no
build step, no framework dependencies — except `api/chat.js`, one small
serverless function behind the Talk page (see "Talk" below), which is
Node but still has no build step and no framework of its own.

## Concept

HAVN isn't a studio site. It's a place a visitor arrives at, slows down in,
and — if they need it — finds something that actually helps: a catalog of
what hard feelings tend to look like, a breathing/grounding/reframing
toolkit, a private mood check-in, a small animal companion, a live AI
companion to talk to, and a list of real, verified crisis resources. The
atmospheric sections (Philosophy, Spaces, Ritual, Presence, Moments) are
still here — they're the "sanctuary" half. Topics, Tools, Companion, Talk
and Support are the "help" half. Neither is a demo of the other; they're
meant to work together.

**This is not a substitute for professional care.** The Support section says
so explicitly, in both languages, next to real crisis-line contacts, and the
Talk page repeats it above the chat itself. See "Support resources" and
"Talk" below before repurposing any of this for anything beyond a
portfolio/demo project — Talk especially, since it's the one part of the
site that responds to people dynamically instead of showing fixed, reviewed
text.

## Structure

```
index.html                 all sections, SVG defs (glass filter, mark/cloud/bird symbols)
talk.html                  the Talk page — live AI companion chat (needs api/chat.js deployed)
topics/*.html               one static, crawlable page per topic (generated — see below)
assets/css/style.css       design tokens, atmosphere, glass, motion, responsive
assets/js/content.js       bilingual (en/ru) copy: topics, tool labels, pet
                            affirmations, crisis resources, CRISIS_PATTERNS
                            keyword list, every UI string
assets/js/main.js          i18n engine, loader, reveals, mood/parallax, cursor,
                            sound, topic pages, breathing/grounding/reframing/
                            mood tools, pet companion, nav
assets/js/talk.js          Talk page only: chat UI, crisis-keyword scan,
                            session-only (sessionStorage) history, /api/chat calls
api/chat.js                serverless function (Vercel) that calls the Claude
                            API server-side — the only non-static piece; see "Talk"
assets/img/favicon.svg     the HAVN mark (orb + horizon)
assets/img/og-cover.png    1200×630 share preview, rendered from the same mark
assets/audio/ambient.mp3   the looped ambient track behind the sound toggle
scripts/build-topic-pages.js  one-off Node generator for topics/*.html (below)
package.json                just an "engines" pin for api/chat.js — nothing to install
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

Static site, any host works — **except** for the Talk page's chat, which
needs `api/chat.js` to actually run somewhere. Everything else (including
the rest of the Talk page itself — it just shows a "not connected yet"
message without the function) works on any static host, unchanged.

**GitHub Pages:** Settings → Pages → Source: `Deploy from a branch` → root.
This serves every static file, `talk.html` included, but GitHub Pages can't
run `api/chat.js` — Talk's chat won't work unless you also deploy that
function elsewhere (below) and are OK with it living on a different origin.
**Netlify / Vercel / Cloudflare Pages:** connect the repo, leave the build
command empty, publish directory = repo root. **Vercel specifically** also
auto-deploys `api/chat.js` as a serverless function with zero config, which
is why it's the simplest option if you want Talk fully working — see "Talk"
below for the exact steps.

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
the mobile menu) plays `assets/audio/ambient.mp3`, a real track, looped.

It's decoded once into an `AudioBuffer` and played through an
`AudioBufferSourceNode` with `loop = true`, rather than a plain
`<audio loop>` element — MP3s can pick up a small audible seam at the loop
point through a media element (encoder padding at the file's edges), and
looping the decoded buffer directly avoids that. The buffer is fetched and
decoded lazily on first click (not on page load — nothing about a ~6MB file
should cost a visitor who never touches the toggle anything), then cached,
so toggling off and back on never re-fetches it. Gain ramps over ~2.5s on
enable and ~1.4s on disable (no clicks); the source itself just keeps
running while `AudioContext.suspend()` freezes it silently in between, so a
muted tab costs nothing and toggling resumes mid-loop rather than
restarting the track from zero. `main.js` resolves the fetch URL from its
own `<script>` tag's resolved `src` rather than a hardcoded relative path,
since the same `main.js` runs from `index.html`, `talk.html`, and every
`topics/*.html` file at a different folder depth.

An earlier version of this synthesized the pad live with oscillators and a
procedural reverb, before a real track existed to loop — see git history if
that's ever useful again. If you swap in your own track, same path,
`assets/audio/ambient.mp3`, same loop-friendly approach applies: something
without a hard cut at either end loops far more gracefully than something
that ends abruptly, since the tail flows straight into the head with no
crossfade of its own.

## Topics, Tools & Companion

**Topics** (`#topics`) is a catalog of eight things that are hard to carry —
anxiety, depression, loneliness, grief, bullying, disability/chronic illness,
burnout, low self-esteem. Each card is a real link to its own static page
under `topics/` (`topics/anxiety.html`, etc.) — a genuine URL that's
crawlable, bookmarkable and shareable, not a modal or a tab. Each page holds
a full, long-form piece written directly to the reader in second person:
not a bullet-point symptom list, but a real, warm piece of writing —
validating, never diagnostic, ending with a bridge to Support, plus a "more
topics" grid linking to the other seven. `content.js` stores each one as an
array of paragraph strings (`**text**` renders as an emphasized line via
`renderInlineBold()` client-side, or the equivalent plain-string transform
in the page generator — both build with `createElement`/`textContent` or
escape-then-replace, never raw `innerHTML` of unescaped content, even
though the content is fully first-party) — both languages run 1,300–1,900
words per topic, translated for warmth rather than word-for-word.

The eight `topics/*.html` files are generated, not hand-written — run
`node scripts/build-topic-pages.js` after editing `TOPICS` in `content.js`
to regenerate them. The script reads `content.js` in a Node `vm` sandbox (a
stand-in `window` object) so the browser-only content file needs no changes
to also run at build time, and writes one self-contained HTML file per
topic: shared nav/atmosphere/footer chrome (with `../`-relative links back
into `index.html`), a statically-rendered English body for no-JS visitors
and crawlers, and the same `assets/js/main.js` the rest of the site uses —
`renderTopicPage()` hydrates the page and handles the live language toggle
exactly like every other section.

**Tools** (`#tools`) are four small, real exercises, not gamified in any
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
- *Loosen a stuck thought* — a five-prompt, guided version of cognitive
  reframing (the "is this a fact or does it just feel like one," "what
  would you tell a friend" technique CBT actually uses), stepped through
  the same one-prompt-at-a-time UI as grounding. No free-text box: nothing
  typed is stored or evaluated, since there's no server and no model
  reading it — it's a worksheet, not a chatbot.

**Companion** (`#companion`) is a small SVG cat or dog (visitor's choice,
persisted locally) with a body, a wagging tail, and blush cheeks, not just
a face. A plain click/tap still greets it — but Food and a Toy sit next to
it as real draggable objects (Pointer Events, so mouse/touch/pen all work):
pick one up and drag it onto the companion to feed or play, release short of
the target and it springs back to its dock instead. A toy dragged with real
motion gets thrown — it tumbles across the stage along the release direction
and speed (`--throw-x` driving a dedicated `petPropThrow` keyframe) rather
than just popping in place; food always uses the gentler pop. Dragging isn't
required, though: a short tap/click on either item, or `Tab` to it and press
`Enter`/`Space`, triggers the same feed/play reaction without needing a
pointer — needed for keyboard and screen-reader use, and a straightforward
fallback for anyone who'd rather not fuss with dragging. Every reaction
plays a gentle bounce/tail-wag and surfaces a random line from its own
affirmation pool (16 general, 9 feed-themed, 9 play-themed, per language).
None of it decays — there's no hunger bar, no neglect state, nothing that
could make a hard week feel like a second failure. The companion can be
renamed via a native `prompt()`. On the homepage it exists to be a soft,
low-stakes, always-available presence — pre-written affirmations, not a
chatbot. If a visitor wants an actual conversation, that's a separate,
clearly-labeled destination: the Talk page, below.

All of the above's state (`havn_pet_species`, `havn_pet_name`,
`havn_mood_<date>`, `havn_lang`) lives only in the visitor's own
`localStorage`. Every homepage feature makes zero network requests beyond
loading its own static files — verified by watching the network panel
through every interaction above. Talk is the one deliberate exception; see
below for exactly what it sends and where.

## Talk

`talk.html` is a live AI conversation — a different feature from the
companion above, and honest about that difference: it's introduced as an
AI, not pretended to be a real animal or a real person. It exists because
sometimes a pre-written line isn't what someone needs; they need to
actually say something and have a response land. It's the one part of this
project that isn't a static site under the hood, and the one place real
API cost and real safety questions apply, so it gets its own section.

**How it works.** The page (`talk.html` + `assets/js/talk.js`) keeps the
conversation in `sessionStorage` only — gone when the tab closes, or the
moment someone clicks "New conversation." Every send POSTs the *whole*
message list so far to `/api/chat`, a small serverless function
(`api/chat.js`) that adds a system prompt server-side, forwards it to the
Claude API with the site owner's own key, and returns just the reply. The
function is stateless: it logs nothing, stores nothing, and the API key
never appears in any file that ships to the browser.

**The system prompt holds three lines that don't move, regardless of what
a visitor asks for:**
1. It never runs an actual trauma-processing or reprocessing technique
   (no imitation EMDR, no "let's revisit that memory," no exposure
   scripts) — that specific kind of work needs a trained person in the
   room, not an unsupervised model. It's instructed to say so warmly if
   someone asks for it, not to attempt it.
2. It never diagnoses, never names a condition, never suggests medication
   or a specific treatment.
3. On any sign of acute risk, it's instructed to stay present and guide
   the person toward Support rather than trying to handle it alone.

Rule 3 is backed by code, not just the model's judgment: every message a
visitor sends is checked against `CRISIS_PATTERNS` in `content.js` (a
plain, deterministic keyword/phrase list, English and Russian) *before* it
reaches the AI at all. A match pins the same Support resources from below
directly onto the Talk page — visibly, and for the rest of that session —
whether or not the model itself brings it up. This is a blunt instrument
(explicit phrases only, so it won't catch everything, and can occasionally
false-trigger on an unrelated sentence that happens to contain one) but a
predictable one, which matters more here than cleverness would.

Beyond that: replies are capped short by `max_tokens` (this is meant to be
a conversation, not an essay generator); after every 20 messages a gentle,
skippable "no rush to finish" note appears rather than nothing (no
engagement-maximizing design, same rule the rest of the site holds to);
and there's no rate limiting on the function itself, so keep an eye on
usage in the Anthropic console — a slow week costs little, a link that
goes viral could cost real money.

**To actually turn it on**, you need your own Anthropic API key — nothing
here can provision or pay for one on your behalf:
1. Create a key at [console.anthropic.com](https://console.anthropic.com).
2. Deploy this repo to Vercel (or any host that runs Node serverless
   functions from an `api/` folder the same way).
3. In the Vercel project's environment variables, add `ANTHROPIC_API_KEY`
   with that key. Optionally add `HAVN_TALK_MODEL` to pin a specific model
   id instead of the `claude-sonnet-5` default — model ids change over
   time, so check the current ones before deploying.
4. Redeploy. Until step 3 is done, the Talk page still loads and reads
   fine — sending a message just shows a plain "not connected yet" note
   instead of failing silently.

**If you fork this for real-world use beyond a portfolio/demo**, Talk is
the piece that most needs a second, qualified pair of eyes before real
strangers use it — more than the static Topics text, because it responds
live instead of showing fixed, already-reviewed words. Have someone with
real clinical judgment review the system prompt in `api/chat.js` and the
`CRISIS_PATTERNS` list in `content.js`, and go in expecting to keep tuning
both.

## Support resources

`#help` lists six real, verified places to get real help, each checked live
against its own organization's site (via web search) before being included:
a national crisis line for Russia (the long-established, official Детский
телефон доверия, 8-800-2000-122), the US 988 Suicide & Crisis Lifeline,
Crisis Text Line (US/Canada/UK/Ireland — text HOME to 741741, for anyone who
can't or doesn't want to make a phone call), Samaritans (UK & Ireland, 116
123, 24/7 since long before either country had a mental-health app), and two
worldwide directories (Find A Helpline, Befrienders Worldwide) for everyone
else. The section opens with an explicit, two-language statement that HAVN
is not a person, a doctor, or a crisis line, and that immediate danger means
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
Topics, all six Support resources, and every pet affirmation, is translated,
not just the UI chrome.

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
loader; reveal states only apply once an `html.js` class is set; the
homepage's Topics/Support/Tools/Companion sections do need JS to render
their content, same as any data-driven part of a JS-free-by-default page —
but each `topics/*.html` page ships its full English text statically, so it
reads and works with JavaScript off; JS only takes over to hydrate the
language toggle).

Topics used to open in a focus-trapped modal; they're now real pages
(`topics/*.html`), which sidesteps the whole class of modal-focus-trap bugs
— normal document flow, normal `Tab` order, the browser's own back button
instead of a close button and a restored-focus workaround.

The companion's Food/Toy items are draggable, but dragging is never the
only way in: both items are real `<button>`s in the normal tab order, and
`Enter`/`Space` triggers the exact same feed/play reaction a completed drag
does — `makeDraggable()` in `main.js` wires pointer and keyboard handling
side by side rather than faking keyboard support on top of a mouse-only
gesture.

Talk's chat is a real `<form>` — `Enter` sends, `Tab` order is untouched,
the message list and error/pause notes are `aria-live="polite"` so a screen
reader announces new replies without needing focus moved there, and the
crisis panel is `aria-live="assertive"` specifically so it interrupts and
gets announced immediately when it appears, rather than waiting to be
discovered.

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
| `assets/js/content.js` — `CRISIS_PATTERNS` | Talk's keyword safety net — **have someone qualified review before reuse** |
| `assets/js/content.js` — `UI` | every other translated string on the page |
| `api/chat.js` — `buildSystemPrompt()` | Talk's AI persona and hard safety rules |
| `api/chat.js` — `DEFAULT_MODEL`, `MAX_OUTPUT_TOKENS` | which model Talk calls, and its reply-length cap |
| `assets/css/style.css` — `:root` | palette, spacing, easing |
| `assets/audio/ambient.mp3` | the looped ambient track itself — swap the file to change the sound |
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
