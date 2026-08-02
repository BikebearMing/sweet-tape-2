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
    reset.css
    tokens.css         fonts, orbit sizing, fallback palette
    letters.css        GENERATED — see below
    tape-slider.css    everything else
  collections/         Payload schema. Not live.
public/assets/         artwork, referenced by path
legacy/                the original static build, kept for reference
```

### Two route groups, two roots

`(frontend)` and `(payload)` each render their own `<html>`. There is
deliberately no `app/layout.tsx` above them — the admin ships its own reset and
fonts, and sharing a shell would leak the site's CSS into it.

### Why the animation is not React

`engine.ts` is plain DOM and GSAP, started once from `Stage.tsx` and never
re-rendered. Expressing it as state would mean React replacing nodes mid-tween,
which is the one thing a timeline holding transforms on those nodes cannot
survive. React renders the markup; the engine owns it from mount.

`initTapeSlider` returns a teardown, so StrictMode's double mount rebinds
instead of doubling every listener. `reactStrictMode` is on in `next.config.mjs`
to keep that honest.

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
`tape-slider.css` — those are taste, the generated values are measurement.

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
