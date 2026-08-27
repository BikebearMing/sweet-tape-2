"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";


import { initPreloader } from "./reveal";
import { createTransition, type Transition } from "./transition";

/** The mark. A flat SVG — the movement is Preloader/sticker.ts plus the
 *  timeline in Preloader/reveal.ts, where it used to be a components/Peel
 *  assembly and, before that, 1.8 MB of gif with the animation baked into it.
 *  Its own size is 191 x 118, and sticker.ts and global.css both hold that
 *  ratio; the file is named here and nowhere else. */
const MARK = "/assets/preloader-image.svg";

/* The stack under the sheet: one sheet per tape, in that tape's stage colour,
 * leaving one after another so the cover comes off as bands of colour rather
 * than as a single wipe.
 *
 * The order is set here and the colours are not — those come from the tapes
 * themselves, so a palette edited in src/data/tapes.ts turns up here with
 * nothing to keep in step. What the data cannot know is how they sit TOGETHER,
 * and there are two rules:
 *
 *   A RUN, NOT A SHUFFLE. Taken in the tapes' own order the deep blue lands
 *   between two brights and reads as a gap in the rainbow. By hue instead —
 *   coral 10, orange 30, yellow 50, lime 75, then the two blues at 197 and 232
 *   — it reads as one sweep of the spectrum. The darkest is therefore last, and
 *   it is the one that finally lifts off the hero, against the lightest thing on
 *   the page.
 *
 *   NOT LIME FIRST. The cover itself is the hero's lime, and the first sheet
 *   under it is the first thing the sweep uncovers: put the lime tape there and
 *   the opening band is lime leaving over lime, which shows nothing. Coral
 *   opens instead and the lime waits until the middle, where it has warm on one
 *   side of it and blue on the other.
 *
 * All six, because the whole point is the site's palette going past — it was
 * four when there were four tapes. Nothing downstream cares how many: the sweep
 * measures its own handoff off the LAST sheet (see lastSweep in reveal.ts), so
 * adding a tape lengthens the cover by one STACK_STEP and stays in step. */
const STACK_ORDER = [
  "stationery", // coral
  "masking", // orange
  "opp-quiet", // yellow
  "opp", // lime
  "double", // light blue
  "cloth", // deep blue
];

/** One sheet per tape named above, in that order, coloured from the palette the
 *  layout hands down.
 *
 *  THE PALETTE IS A PROP NOW, not an import. The tapes live in Postgres and this
 *  is a client component: importing src/data/tapes would pull the database
 *  adapter into the browser bundle. The root layout does the query and passes
 *  six ids and six colours, which is all this ever wanted from a tape.
 *
 *  STILL LOUD ABOUT A MISSING ONE, because the quiet version has already
 *  happened once: the tapes were re-keyed from "mask-1" to real slugs, every id
 *  here stopped resolving, and what shipped was a stack of nothing — the cover
 *  still swept, in one colour, and the only sign was that the bands were gone. A
 *  missing tape is a content edit and must not take the animation with it, but it
 *  must not be silent either. Which now includes the palette arriving empty
 *  because the database was unreachable. */
function stackOf(palette: Palette): { id: string; bg: string }[] {
  return STACK_ORDER.flatMap((id) => {
    const tape = palette.find((t) => t.id === id);

    if (!tape && process.env.NODE_ENV !== "production") {
      console.warn(
        `[Preloader] STACK_ORDER names "${id}", which is not a tape slug in the ` +
          `CMS. That sheet is missing from the sweep.`,
      );
    }

    return tape ? [{ id, bg: tape.bg }] : [];
  });
}

export type Palette = { id: string; bg: string }[];

/** The one route the overture belongs to. */
const HOME = "/";

/* The preloader — and, once it has gone, the curtain the whole site changes
 * pages behind.
 *
 * A sheet of paper over the page with the mark in the middle, lifted off after
 * a beat — Preloader/reveal.ts owns all of that and this component owns none of
 * it, the same division the hero and the menu make. The coloured stack behind
 * that sheet then stays where it is parked, off the top of the screen, and comes
 * back down over every route change; Preloader/transition.ts owns that, and this
 * component owns none of it either.
 *
 * ONE ELEMENT FOR BOTH, deliberately. A separate curtain component would be the
 * same seven sheets with the same arcs in the same colours, kept in step with
 * these by hand — and the transition's whole claim is that it IS the preloader's
 * rainbow, coming the other way.
 *
 * THE OVERTURE IS THE HOME PAGE'S. The mark is the site introducing itself,
 * which is a thing to do once, at the front door: land on /products from a
 * search result and what you want is the page, not a logo you have not asked
 * about. So every other route gets the same cover with nothing printed on it,
 * and it sweeps off after a beat rather than after four seconds
 * (PRELOADER.SWEEP_BARE).
 *
 * Frozen at the first render rather than followed, and that is the point of the
 * useState: `here` changes under a client-side transition, and a mark that
 * reappeared on the curtain the moment the router pointed at the home page would
 * turn every navigation home into a second overture — sliding in from off the
 * top of the screen, on paper that is on its way down.
 *
 * Server-rendered, deliberately. The cover has to be in the first painted frame
 * or there is a flash of the page it exists to cover, so it is markup in the
 * document rather than something mounted on hydration; the "use client" here
 * buys the effects, not the rendering. usePathname is honest under that — Next
 * renders client components on the server too, and it has the route there — so
 * the home page's HTML carries the mark and no other page's does.
 *
 * The scroll lock is not here either. It hangs off `html[data-loading]` in
 * global.css — written into the server HTML by the layout, taken off by the
 * sweep and put back by the transition (gate.ts) — so the page is held from the
 * first byte rather than from whenever hydration happens to land.
 */
export default function Preloader({ palette }: { palette: Palette }) {
  const ref = useRef<HTMLDivElement>(null);
  /* Computed once from the prop rather than on every render: the stack is seven
     divs whose colours do not change for the life of the page, and re-deriving
     them on each render of a component that re-renders on every navigation
     would be work for nothing. */
  const STACK = useMemo(() => stackOf(palette), [palette]);
  const here = usePathname();
  const router = useRouter();
  const [overture] = useState(() => here === HOME);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initPreloader(root);
  }, []);

  /* The transition, built once and kept — it outlives every route, which is the
     whole reason it can animate across one. */
  const tr = useRef<Transition | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* scroll: false, and the transition does it by hand instead — see
       resetScroll in SmoothScroll. The router's own reset writes the document's
       scroll directly, which Lenis overwrites from its own held position on the
       next frame; two of them fighting over the same number is worse than
       either, and only one of them knows about the smooth scroller. */
    const built = createTransition(root, (href) =>
      router.push(href, { scroll: false }),
    );
    tr.current = built;
    return () => {
      tr.current = null;
      built.destroy();
    };
  }, [router]);

  /* THE LANDING. There is no "navigation finished" callback in the app router —
     the pathname changing IS the signal, and it changes on the render that
     commits the new page. So the cover waits here rather than on a promise:
     effects run after that commit, which is exactly the moment the new route's
     own components have mounted and queued themselves on the gate.

     Skipped on the first run by the controller itself, which knows whether it
     asked for this route or merely woke up on it. */
  useEffect(() => {
    tr.current?.arrived();
  }, [here]);

  return (
    <>
      {/* With no JS the sweep never runs, and a cover that cannot leave is a
          site that cannot be read — so the whole thing is called off before it
          paints, scroll lock included. The hero makes the same call about its
          letters. Costs nothing when scripting is on: the contents are not even
          parsed. */}
      <noscript>
        <style>{`.site-preloader, .site-haze { display: none } html[data-loading] { overflow: visible } html[data-loading] .menu-tab { transform: none }`}</style>
      </noscript>

      {/* aria-hidden because it is a held curtain, not content: the page behind
          it is already in the accessibility tree and reachable, and announcing
          a decorative mark over the top of it says nothing a reader needs.

          The box itself paints nothing — every colour here is on a sheet
          inside it, and they all leave. */}
      {/* THE HAZE. A box of its own, OUTSIDE the cover, and every word of that
          is load-bearing — it was inside .site-preloader first and it blurred
          nothing at all.

          A backdrop-filter only ever blurs what paints BENEATH the element.
          Inside the cover, beneath it means the cover's own sheets and nothing
          else: the whole preloader is one stacking context painting above the
          site, so the page is not in this element's backdrop at any z-index it
          could take in there. Out here it is a plain fixed box at 499 — over
          the page, over the menu, under the cover at 500 — and the page is
          exactly what is beneath it.

          Which is also why it is not a filter on the page itself. A page here
          is several screens tall and a filter makes the browser rasterise all
          of it, on the frame a route change is already the busiest of the
          page's life; and a filtered element becomes the containing block for
          every `position: fixed` inside it, which on this site is every pinned
          section — each would jump by the whole scroll offset on the frame the
          blur went on. This box is one viewport, and the page never learns
          about it.

          Off until it is wanted: the radius is a variable the transition
          writes, and the filter is only declared while data-leaving is on it
          (see .site-haze in global.css). The overture never pays for it. */}
      <div className="site-haze" aria-hidden="true" />

      <div className="site-preloader" ref={ref} aria-hidden="true">
        {/* The stack, deepest last. All four sit exactly under the lime sheet
            and are invisible until it moves; z-index is what decides which one
            the sweep uncovers first, so it counts DOWN as the stack goes back.
            The colour is inline because it comes from the data — everything
            else about these sheets is in the stylesheet. */}
        {STACK.map(({ id, bg }, i) => (
          <div
            className="preloader-layer arc-cut"
            key={id}
            style={{ background: bg, zIndex: STACK.length - i }}
          />
        ))}

        {/* The front sheet, and the only one with anything printed on it. It is
            here on every route even when the overture is not: it is the lime
            the cover opens on, the last colour to leave, and the first to
            arrive when the curtain comes back down between pages. Empty, it is
            simply the seventh sheet. */}
        <div
          className="preloader-sheet arc-cut"
          style={{ zIndex: STACK.length + 1 }}
        >
          {overture && (
            /* The mark, arriving as a sticker: it springs up off the sheet,
                  its shape flexes as it settles, a sheen pans across it, and
                  then it holds until the cover carries it away.

                  EMPTY IN THE DOCUMENT, and that is the one place the mark
                  parts company with the rest of this component. Everything else
                  here is server-rendered because it has to be in the first
                  painted frame; this box is sixty-four columns carrying about
                  twenty-five kilobytes of inline style between them, and it is
                  hidden until its beat a full second later. So the wrapper is
                  the markup — it holds the layout box, and the artwork is
                  preloaded in the head — and Preloader/sticker.ts builds the
                  columns into it on mount. See the note there.

                  Sized by .site-preloader .preloader-mark in global.css,
                  exactly as the Peel assembly and the bare <img> before it
                  were: same box, same one number.

                  IT IS THE WHOLE OVERTURE NOW. STICK BY YOU was set under it
                  and has gone: the mark arriving as an object says the thing,
                  and a headline under it was the hero's line arriving twice
                  within four seconds of itself. What went with it is a beat,
                  not just an element — see PRELOADER in reveal.ts. */
            <div className="preloader-mark" data-sticker={MARK} />
          )}
        </div>
      </div>
    </>
  );
}
