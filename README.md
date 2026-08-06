# Sweet Tape

Next.js 16 (App Router) + Payload 3. Payload is installed and configured but
**nothing on the site reads from it yet** — the tape content is local, by design,
until the database is wired up.

```bash
npm install
npm run dev        # http://localhost:3000
```

No environment variables are needed to run the site. `/admin` needs a database;
see [Payload](#payload) below.

## Where things are

```
src/
  app/
    (frontend)/        the site — its own <html>, fonts and CSS
    (payload)/         the admin and REST/GraphQL routes, generated boilerplate
  components/
    SmoothScroll.tsx   Lenis, driven off GSAP's ticker
    Preloader/
      index.tsx        the cover, server-rendered so it is in the first paint
      reveal.ts        the hold and the sweep off the page; PRELOADER is the
                       knobs, including how long the cover is up
      gate.ts          html[data-loading] — what the hero's title waits on
    Hero/
      index.tsx        the section's markup, server-rendered
      Stage.tsx        the one client component: a ref, and the effect that
                       starts the engine
      engine.ts        the scroll choreography — pure maths on window.scrollY
      heroTape.ts      the roll and the strip it dispenses; its own chunk
    TapeSlider/
      index.tsx        the section's markup, server-rendered
      Stage.tsx        the one client component: a ref, and the effect that
                       starts the engine
      RollPicker.tsx   the orbit
      WordMarks.tsx    THE and CREATIVE
      engine.ts        all of the animation
  data/
    tapes.ts           the four tapes — copy, artwork and palette
    wordmarks.json     letter artwork for the two word marks
  styles/
    global.css         the whole site, in nine sections: letters (imported),
                       reset, tokens, preloader, hero, wave band, tape slider,
                       menu, cursor
    letters.css        GENERATED — see below. @imported by global.css
  collections/         Payload schema. Not live.
public/assets/         artwork, referenced by path
legacy/                the original static build, kept for reference
hero.html / hero.css   the standalone hero prototype the section was ported
                       from. Superseded — delete once nothing is being tuned
                       in it, or it will drift. Unrelated to src/styles.
```

### One stylesheet

`(frontend)/layout.tsx` imports `global.css` and nothing else. Its section
order is the cascade order, and it is load-bearing where two rules touch the
same property — put a new rule in the section it belongs to rather than at the
end of the file.

### Two route groups, two roots

`(frontend)` and `(payload)` each render their own `<html>`. There is
deliberately no `app/layout.tsx` above them — the admin ships its own reset and
fonts, and sharing a shell would leak the site's CSS into it.

### The preloader holds the page, not the load

The cover is on a clock, not on the network: it runs its four beats — the mark
drops in, the line writes itself, the line drops back, the stack leaves — and
goes, whatever has arrived. `PRELOADER` in `Preloader/reveal.ts` is every one of
those beats. What it does gate is the hero's title reveal, which would otherwise
be spent behind it.

It leaves as five sheets rather than one: lime, then one per tape in that tape's
stage colour, a tenth of a second apart, so the arc crosses the screen as a run
of coloured bands. The colours come from `src/data/tapes.ts`; only their order
is set in `Preloader/index.tsx`, and it is set by hand because what the data
cannot know is how the four look side by side.

That hand-off is one attribute — `html[data-loading]`, written into the server
HTML by the layout and taken off partway through the sweep. The stylesheet locks
the scroll off it before any JS has run; `Preloader/gate.ts` is the whole of the
signalling, and anything that should wait for the page to be visible subscribes
there rather than being wired to the preloader. A page with no cover on it (or a
reader who has asked for reduced motion) reads an open gate and starts at once,
so nothing has to know whether the preloader exists.

### Why the animation is not React

`engine.ts` is plain DOM and GSAP, started once from `Stage.tsx` and never
re-rendered. Expressing it as state would mean React replacing nodes mid-tween,
which is the one thing a timeline holding transforms on those nodes cannot
survive. React renders the markup; the engine owns it from mount.

`initTapeSlider` returns a teardown, so StrictMode's double mount rebinds
instead of doubling every listener. `reactStrictMode` is on in `next.config.mjs`
to keep that honest. `initHero` is built the same way.

### Three.js is never in the first load

Both sections import their three module with a dynamic `import()`, so three and
the GLTF loader land in their own chunk after the page is interactive. The
slider degrades to the flat `<img>` while it waits; the hero degrades to type
and colour. Neither blocks first paint.

The hero's roll is the exception that needed help: it is the first thing on the
page and its GLB is 1.3 MB, which would otherwise not be requested until the
chunk had downloaded and the loader had been constructed. `Hero/index.tsx`
calls React's `preload()` so the fetch starts with the document instead.

### Rendering is on demand

Neither three scene runs a fixed 60fps loop. The hero renders only when the
scroll position actually moved the roll, and stops entirely when an
`IntersectionObserver` says the section has left the viewport. The scroll maths
runs on GSAP's ticker — the same one driving Lenis — because a `scroll`
listener reads a position one frame stale and the roll visibly lags the page.

### Adding or editing a tape

Everything about a tape is one object in [`src/data/tapes.ts`](src/data/tapes.ts)
— copy, artwork paths and the six palette colours. The colours reach the page as
custom properties on that tape's roll button; the engine reads them off the
button with `getComputedStyle` at the moment it repaints. Nothing else needs
touching.

### `letters.css` is generated

```bash
npm run letters
```

Reads `src/data/wordmarks.json`, measures each PNG, and writes the mask stencil
plus `flex-grow` / `aspect-ratio` for every letter. Run it after changing the
artwork. The hand-tuned arc nudges (`--i` / `--dx` / `--dy` / `--dr`) stay in
`global.css` — those are taste, the generated values are measurement.

It is the one file `global.css` does not absorb, exactly because it is
rewritten wholesale by the script; `global.css` `@import`s it instead, so the
layout still pulls in a single stylesheet.

The old static build inlined all this artwork as base64 (39 KB) because CSS
masks are same-origin and `file://` fails that check. Served over HTTP the
paths just work, so it is now 2.8 KB and the PNGs cache normally.

### Fonts

Futura PT Condensed comes from an Adobe kit that is **domain-locked**. Every
host you serve from — `localhost` included — has to be listed at
fonts.adobe.com or it silently falls back to Arial Narrow. Inter Tight is
self-hosted via `@fontsource-variable`.

## Payload

Set up and parked. `/admin` and `/api/*` exist and the config compiles, but the
site never imports it, so the whole thing builds and runs with no database.

To bring it up:

1. `cp .env.example .env.local` and point `DATABASE_URI` at Neon
   (`?sslmode=require`), plus a long random `PAYLOAD_SECRET`.
2. `npm run dev`, open `/admin`, create the first user. Payload creates its
   tables on first connect.

`src/collections/Tapes.ts` mirrors the `Tape` type field for field, so swapping
`src/data/tapes.ts` for a query later is a mapper, not a redesign. Artwork is
stored as a path string rather than an upload relationship — moving those four
fields to `upload` is the one migration that collection will need.

Uploads go to `public/media`, kept away from `public/assets` so Payload deleting
a record can never remove a file the code still points at.

```bash
npm run generate:types   # after changing a collection
npx payload generate:importmap   # after adding a custom admin component
```

## Known open items

- `.roll-parent` sits at `left: 42vw` with `overflow: hidden`, which puts three
  of the four rolls off stage or clipped to slivers that cannot be clicked.
  Needs a design decision: pull it left, or drop the `overflow: hidden` if the
  edge bleed is intentional.
- Cloth and stationery `--word` / `--tag-bg` are placeholders, as is their
  showcase artwork.
- Masking's chip is `#D7791A` on `#FFDC13` — about 2.3:1, hard to read at 1vw.
