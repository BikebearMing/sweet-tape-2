# SEO / accessibility overnight pass — morning report

Branch **`dev-seo-safe`**, 10 commits on top of `master` (5ef8b9d). Master and
the live site are untouched. The branch lives in the worktree
`../sweet-tape-2-seo`; your checkout and dev server on :3000 never moved off
master. Every change is head metadata, JSON-LD, or an attribute on an element
that nothing selects by tag — verified by search first and by screenshot after.

**The one-line verdict: markup and metadata are now jury-clean — canonical,
OG complete, manifest, JSON-LD, one h1, landmarks on every page — with zero
rendering change, proven three ways below.**

## 1. Executed changes

**Metadata** (`a81ca1b`, `f5000c1`, `d22bedd`)
- Self-referencing canonical + `og:url` on all 13 public pages — one
  `"./"` in the layout, resolved per-route by Next.
- `theme-color` (#034102, the hero's dark green) and a web app manifest
  wired to the existing SVG favicon + 180px apple icon.
- Titles resized to 53–54 chars and descriptions to 145–150 on home,
  products, about, news (table in §3).

**Structured data** (`6ef9f73`, `ebdce3d`, `c944a57`)
- Organization + WebSite `@graph` in the head of every page.
- Product + BreadcrumbList JSON-LD on the six tape pages (name, line,
  picture from the CMS — no invented offers or ratings).
- NewsArticle + BreadcrumbList on the two stories, with a real
  `datePublished` (the Story type only had display strings; the mapper now
  also exposes the ISO day). Fixed on the way: the articles' `openGraph`
  override was silently dropping `og:url`/`og:type`/`og:site_name` —
  page-level openGraph replaces the layout's whole object.

**Semantics / accessibility** (`c7b0652`, `19340b8`, `693a2bb`)
- `<main>` around every page and `role="banner"` on the masthead. This
  alone cleared 234 of 247 axe violation nodes (`region` +
  `landmark-one-main` on all 14 pages).
- One h1 per page: home's three giant TO CREATE / TO FIX / TO PROTECT
  statements are h2s now. Nothing anywhere selects those by tag — every
  rule and script works the `.giant` class; searched before touching.
- The article share column stays an `<aside>` but is exposed as a named
  region — its complementary role would otherwise nest inside the new
  `<main>` (the one violation my own change introduced; caught by the
  after-audit and fixed).

**Docs** (`b5c5775`, this report)

## 2. Before / after

axe-core violation nodes, all pages: **247 → 13**
(remaining: heading-order ×7 and color-contrast ×6 — both FLAG-only, see §5).

Lighthouse (mobile/desktop, before → after):

| page | accessibility | best-practices | seo |
|---|---|---|---|
| home | 98 / 93→95 | 92 / 92 | 100 / 100 |
| products | 98→100 / 95→96 | 100 / 100 | 100 / 100 |
| about | 95→96 / 95→96 | 100 / 100 | 100 / 100 |
| news | 91→92 / 91→92 | 100 / 100 | 100 / 100 |
| contact | 95→96 / 95→96 | 100 / 100 | 100 / 100 |
| product-masking | 89→91 / 89→91 | 100 / 100 | 100 / 100 |
| product-double | 89→91 / 89→91 | 100 / 100 | 100 / 100 |
| product-stationery | 89→91 / 89→91 | 100 / 100 | 100 / 100 |
| product-cloth | 93→95 / 93→95 | 100 / 100 | 100 / 100 |
| product-opp | 93→95 / 93→95 | 100 / 100 | 100 / 100 |
| product-opp-quiet | 89→91 / 89→91 | 100 / 100 | 100 / 100 |
| news-three-generations | 95→96 / 95→96 | 100 / 100 | 100 / 100 |
| news-mr-diy | 95→96 / 95→96 | 100 / 100 | 100 / 100 |

Every remaining accessibility deduction is a FLAG item (slider heading
ladder, colour contrast, footer target size); home's best-practices 92 is
the sticky-note probe 404 (owner TODO #5).

Lighthouse SEO was already 100 on every page before the pass — what changed
there is invisible to the score but not to a juror reading source: canonical,
og:url, manifest, theme-color, three kinds of JSON-LD, one h1, landmarks.

## 3. Every title and description (review the copy)

| page | title (chars) | description (chars) |
|---|---|---|
| / | SweetTape — Stick By You \| Cloth, Masking & OPP Tapes (53) | Six tapes made in Malaysia, one for every job — cloth, masking, stationery, double-sided and more. Three generations of tape; meet the one who sticks. (150) |
| /products | Our Family — Six Tapes, One for Every Job \| SweetTape (53) | Pick your player: cloth for strength, masking for clean lines, stationery for the desk, double-sided for the invisible fix. Six tapes, one family. (146) |
| /about | About SweetTape — Three Generations of Tape, One Face (53) | Three generations of tape. We wanted to be clearer, easier to choose, recognisable and more human — the same tape as always, finally with a face. (145) |
| /news | What's Rolling — News, Events & Stories from SweetTape (54) | Launches, store shelves and stories from the SweetTape family — what's rolling right now, where to find us, and what we're sticking together next. (146) |

CMS-driven (unchanged by me — edit in the admin if you want them longer):

| page | title | description |
|---|---|---|
| /contact | Contact — SweetTape | Get in touch with SweetTape — SB Tape Group Sdn Bhd *(51 chars — short)* |
| /products/masking | Masking tape — SweetTape | Always ready for school projects… *(good)* |
| /products/double | Double-sided tissue tape — SweetTape | The kind of tape that commits… *(good)* |
| /products/stationery | Stationery tape — SweetTape | From broken corners… *(good)* |
| /products/cloth | Cloth tape — SweetTape | Built for the jobs that fight back… *(good)* |
| /products/opp | OPP tape — SweetTape | **“Placeholder copy for the OPP tape — replace before this goes anywhere near a build.”** |
| /products/opp-quiet | OPP tape, low noise — SweetTape | **same placeholder** |
| /news/… (both) | story title — SweetTape | first paragraph, trimmed at 155 *(good)* |

## 4. TODOs needing you

1. **OPP + OPP-quiet copy** — the CMS placeholder line is now also inside
   their Product JSON-LD and og:description. (You already know; it bites
   harder now.)
2. **Share image** — `/assets/og.jpg` exists and is referenced site-wide ✓;
   if it isn't 1200×630, re-export it at that size.
3. **Manifest icons** — export 192×192 and 512×512 PNGs (512 maskable) and
   add them in `src/app/manifest.ts`; the SVG + 180px apple icon carry it
   until then.
4. **Social profile URLs** — `src/data/footerBalls.ts` still points at
   tiktok.com / facebook.com / instagram.com front doors. Real URLs there,
   then add `sameAs` to the Organization JSON-LD in the layout.
5. **Sticky-note face** — `/assets/sticky-note.png` 404s on home by design
   (Hero/stickyNote.ts probes for a Figma export and draws its stand-in).
   Drop the export in, or accept the console 404 — it is the one thing
   holding home's Best-Practices at 92.

## 5. FLAG list — highest impact, lowest risk first

1. **Skip-to-content link** (low risk, needs CSS) — one anchor before
   `<main>` in the layout + a `.skip-link` rule (visually hidden until
   :focus). First tab stop is currently the menu tab, which is defensible,
   but jurors look for the link.
2. **Colour contrast ×6, the only serious-impact axe finding** (medium —
   it is design): `.pi-back` chip on 4–5 tape pages and the two
   `.index-tab-count` counts on /news fail 4.5:1. Files: global.css
   (`.pi-back`, `.index-tab-count`); a shade darker ink or lighter ground
   on each clears it.
3. **Menu: Escape to close + focus containment** (medium, JS in
   interaction code) — `aria-expanded`/`aria-controls` are already right;
   there is no keydown handling at all in components/Menu. Escape-to-close
   is a few lines in index.tsx; a focus trap touches reveal timing.
4. **Slider heading ladder** (high risk — animation engine) — the h6 tape
   names and h5 subtext that produce all 7 remaining heading-order nodes.
   `.subtext h5` is tag-qualified CSS and TapeSlider/engine.ts *creates*
   `h6` elements at runtime, so retagging means coordinated edits inside
   the slider engine. Not overnight work.
5. **404 server shell** (medium — framework) — unknown URLs serve Next's
   `__next_error__` shell; the PAGE NOT FOUND card renders client-side.
   Pre-JS the 404 has no lang/heading/meta. Needs route-level not-found
   investigation (or accept: crawlers see the 404 status, which is what
   they act on).
6. **target-size** (medium — CSS + physics) — the footer's small social
   discs; the Matter.js pile lands differently each load so the finding
   flickers (it cost one LH run 4 points in the tablet pass too).
7. **paper-clip aspect ratio** (low but visual) — home draws
   paper-clip-1.webp at 62×68 from a 158×165 source (0.91 vs 0.96); a
   re-export or box tweak clears LH image-aspect-ratio.
8. **Image weight** (perf, list only): cloth-tapex4-bottomleft.png 3.5MB,
   opp-tape-last.jpg 2.8MB, cloth-tapex4.png 2.6MB, protect-opp-tape-x4.jpg
   2.3MB, cursor-pointer.svg 1.5MB (!), cursor-type.svg 892KB — the two
   cursor SVGs almost certainly embed rasters. ~10MB recoverable.
9. **Typekit stylesheet is render-blocking** (perf — font loading policy):
   preconnect exists; self-hosting Futura PT would remove the third-party
   block but is licensing + loading-order work.
10. **matter-js delta warnings** (cosmetic console noise, animation-owned).
11. **Deliberate patterns a validator dislikes, left alone**: `<noscript>
    <style>` blocks inside body sections (the no-JS fallbacks), aria-label
    on split-letter headings (honoured by readers, and the mechanism that
    keeps them announced whole), the /contact phone number's breakable
    spaces.

Verified working, for the record: keyboard scrolling through Lenis
(PageDown/arrows/End all move the page), prefers-reduced-motion styling (88
references), :focus-visible styles (31 rules), custom cursor gated off coarse
pointers, alt text on every image, labels on every control.

## 6. Screenshot verification

`seo-screenshots/{before,after,after2}/<page>/<viewport>/p{000..100}.png` —
14 pages × 1440×900, 820×1180, 390×844 × five scroll positions (top to
bottom, scrolled one way at human pace), 210 frames per run.

An animated site never diffs to zero, so the proof is three-legged:

1. **Noise floor**: `after` vs `after2` are the *same build* shot twice;
   before-vs-after differences were compared frame-by-frame against that
   floor (scripts/noise.mjs).
2. Every frame that beat the floor was inspected: all of them are the
   footer physics pile (lands differently every load), the contact page's
   wind-blown 3D note, marquee/canvas motion, or a ±1–40px scroll-capture
   offset (Lenis momentum past the stop) — the same classes of difference
   the two after-runs show each other. Zero layout or rendering change
   attributable to the branch; the two deterministic-looking frames
   collapsed to noise under a 1px vertical shift.
3. **Structural proof**: the served body's tag stream, page by page,
   differs from before by exactly `<main>` (+1), home's h1 4→1 / h2 5→8,
   and the JSON-LD scripts. Nothing else. (The before dump of the product
   pages also reflects the media outage the first audit run hit — see
   SEO_AUDIT.md provenance note.)

Interaction smoke on the after build at 1440×900 and 390×844: preloader
lifts, menu opens and closes (`data-open` flips), all canvases mount,
ScrollTrigger pin engages, the page scrolls end to end.

Production build ✓ (twice), `tsc --noEmit` ✓ clean. No lint script and no
test suite exist in this repo — nothing to run.

## Provenance

- Baseline details: SEO_AUDIT.md (on this branch).
- Audit artefacts: `seo-screenshots/audit/` in the main checkout —
  axe-before/after.json, lh-before/, lh-after/, plus the scripts
  (`seo-screenshots/scripts/`) to re-run any of it.
- The worktree at `../sweet-tape-2-seo` has its own node_modules clone and
  `public/media` copy; delete the folder when the branch is merged or
  abandoned (`git worktree remove ../sweet-tape-2-seo`).
