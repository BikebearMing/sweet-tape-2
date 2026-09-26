# SEO / accessibility audit — baseline (before changes)

Taken 2026-09-26 against a production build of `master` (5ef8b9d), served at
localhost:3001 with the live database through the VPS tunnel. Chromium
headless shell (Playwright build 1234) for axe and screenshots; Lighthouse
13.5.0 for scores. Every public route plus the 404 — the `/lab/*` pages are
robots-disallowed dev tools and are not audited.

## Pages

`/`, `/products`, `/about`, `/news`, `/contact`, six `/products/[id]`
(masking, double, stationery, cloth, opp, opp-quiet), two `/news/[id]`
(same-tape-three-generations-finally-a-face, sweettape-now-at-mr-diy), and
the 404.

## Lighthouse (Accessibility / Best Practices / SEO)

| page | a11y (m/d) | best-practices (m/d) | seo (m/d) |
|---|---|---|---|
| home | 98/93 | 92/92 | 100/100 |
| products | 98/95 | 100/100 | 100/100 |
| about | 95/95 | 100/100 | 100/100 |
| news | 91/91 | 100/100 | 100/100 |
| contact | 95/95 | 100/100 | 100/100 |
| product-masking | 89/89 | 100/100 | 100/100 |
| product-double | 89/89 | 100/100 | 100/100 |
| product-stationery | 89/89 | 100/100 | 100/100 |
| product-cloth | 93/93 | 100/100 | 100/100 |
| product-opp | 93/93 | 100/100 | 100/100 |
| product-opp-quiet | 89/89 | 100/100 | 100/100 |
| news-three-generations | 95/95 | 100/100 | 100/100 |
| news-mr-diy | 95/95 | 100/100 | 100/100 |

Failing audits behind those numbers: errors-in-console (home — the
sticky-note probe 404), image-aspect-ratio (home — paper-clip-1.webp drawn
62×68 against a 158×165 source), heading-order (home + product pages —
slider ladder), landmark-one-main (all), color-contrast (products/news),
target-size (footer physics pile, position varies per load). 404 page not
Lighthouse-scored (error shell).

## axe-core 4.10.2 violations

247 violation nodes across 14 pages, all of them four rules:

| rule | impact | nodes | where |
|---|---|---|---|
| `region` (content outside landmarks) | moderate | 221 | every page — no `<main>`; masthead outside any landmark |
| `landmark-one-main` | moderate | 13 | every page except home’s variant count |
| `heading-order` | moderate | 7 | home (h2 → h6 jump into the slider names), six product pages (slider ladder) |
| `color-contrast` | serious | 6 | `.pi-back` on 5 product pages, `.index-tab-count` ×2 on /news |

Raw node lists: `seo-screenshots/audit/axe-before.json` (main checkout).

What axe did **not** find is worth recording: zero missing alt attributes,
zero unlabeled buttons or links, zero missing `lang`, zero ARIA misuse on
the split-letter headings. The a11y groundwork in this codebase is real.

## HTML validation (html-validate 10.x, recommended preset)

No structural errors. Everything reported is one of:

- **React/Next output style** — self-closed void elements (`<meta/>`),
  `charSet`/`fetchPriority` attribute casing, `async=""` boolean values.
  All valid HTML5; attribute names are case-insensitive and void-element
  self-closing is permitted. Not actionable, and W3C Nu does not flag them.
- **`<style>` inside `<div>`/`<section>`/`<footer>`** (~90) — the site’s
  deliberate no-JS fallbacks (`<noscript><style>`) and per-tape scrollbar
  colours. Technically non-conforming, universally supported, and moving
  them means restructuring reveal architecture → flagged, not fixed.
- **`aria-label` on heading elements** (~82) — the split-letter pattern.
  html-validate calls it “allowed but not recommended”; it is honoured by
  screen readers on headings and is what keeps letter-split lines announced
  whole. Deliberate; leave.
- **404 shell** — the served 404 HTML is Next’s `__next_error__` shell
  (no `lang`, empty body pre-JS). Framework behaviour; see FLAG list.
- `tel-non-breaking` ×2 on /contact — the phone number would want `&nbsp;`;
  changing text content risks a wrap change → flagged, not fixed.

## Console (production build, all pages, three viewports)

Clean of application errors. The full sweep (3 viewports × 14 pages, scrolled
end to end) logged only:

- `GET /assets/sticky-note.png` → 404 on home — **by design**: Hero/stickyNote.ts
  probes for a Figma export of the note face and draws its own stand-in until
  the file is dropped in (see NOTE_URL). Owner TODO, not a bug.
- `matter-js` delta warnings (42×) — the footer physics pile under scroll
  pressure; animation-owned, flagged.
- Next.js "preloaded but not used" warnings for two CSS chunks and a font —
  framework preload timing, not app code.
- Aborted `?_rsc=` prefetches — Next Link prefetch cancelled at page close;
  benign.

## Headings as served (before)

- home: `h1 h2 h2 h6×5 h5 h5 h2 h1 h1 h1 h2 h2` — four h1s (hero + three
  giant statements), h6/h5 ladder from the tape slider
- product pages: `h1 h5 h3 h2 h2 h3 h3 h3 h2 h5 h2 h2` — slider h5s break
  the ladder
- about / news / contact / articles / products: clean single-h1 ladders
- 404: no headings in server HTML (client renders the `h1` — see FLAG list)

## Meta as served (before)

Every page: unique title + description, full OG set (og:title/description/
type/site_name/image via layout defaults + page overrides), twitter card,
SVG favicon + apple-touch-icon, `lang="en"`, viewport ✓.
Missing everywhere: canonical, og:url, manifest, theme-color, JSON-LD.
robots.txt and sitemap.xml already exist and are correct.
