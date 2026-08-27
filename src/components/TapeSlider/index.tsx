/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import Peel from "@/components/Peel";
import { getTapes } from "@/data/tapes";
import Stage from "./Stage";
import RollPicker from "./RollPicker";
import { stripOf } from "./strips";
import { TopTitle, BottomTitle, wordmarkText } from "./WordMarks";

/* HOW MUCH OF THE STRIP IS STILL UP BEFORE THE SECTION IS REACHED, as a
 * fraction of it — Peel's `from`, with `to` at 0, which is flat. The strip is
 * being PUT ON, so the far value goes in `from` and the same geometry runs
 * backwards; there is no second code path for a peel that sticks down rather
 * than lifting. GiantPinning tapes its photographs on the same way.
 *
 * The two differ so the pair does not read as one mechanism — the same reason
 * the photographs themselves turn over a beat apart (SHOW_LAG in engine.ts). */
const LIFT = [0.66, 0.54];

/* Section-level copy. Not per tape, so it does not live in tapes.ts — but it is
   the other obvious CMS field, so it is a named constant rather than a string
   buried in the markup. */
const SUBHEAD = "MEET THE ONE WHO STICKS";

/* THE PHONE'S STEP ARROW, drawn once and mirrored in CSS for the forward
 * button — one glyph, so the two can never drift apart in weight or length.
 *
 * Not components/Arrow: that mark is a link LEAVING, it points off the page at
 * 45deg and swings to face what it belongs to. This is a DIRECTION on a
 * control, which is a different thing to draw — the same call Article's back
 * link makes when it reaches for a bare chevron instead.
 *
 * Round caps and joins, because it is printed at 7vw on a soft disc and a
 * square cap at that size reads as a chipped edge. currentColor, so the disc's
 * rule is the only place the tape's palette is named. */
function NavArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M20.5 12H4.5M11.5 4.5 4 12l7.5 7.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* The section, server-rendered in the first tape's state.
 *
 * Everything below is markup only. The moment it mounts, the engine takes over
 * the DOM and swaps sources, colours and copy in place — so the initial values
 * here are the first paint and the no-JS fallback, not a state React keeps in
 * step. Nothing re-renders after mount, by design: a re-render mid-tween would
 * replace nodes GSAP is holding transforms on.
 */
export default async function TapeSlider() {
  const tapes = await getTapes();

  const first = tapes[0];

  return (
    <Stage>
      <div className="wrapper">
        {/* Two stacked colour fields; the incoming one sweeps over the base,
            then commits down to it so the pair is ready to swap again. */}
        <div className="bg-overlay" aria-hidden="true">
          <div className="bg-layer bg-layer--base" />
          <div className="bg-layer bg-layer--next arc-cut" />
        </div>

        {/* The word mark is a row of images with no text in them, so the
            headline is announced here instead. It is the FIRST tape's — the
            engine rewrites it as the word changes. */}
        <h2 className="sr-only">{wordmarkText(first.word)}</h2>

        <h6 className="subhead">{SUBHEAD}</h6>

        {/* The subhead again in the incoming colours, inside a duplicate of the
            colour sheet with overflow hidden — so it is uncovered along exactly
            the curve the sheet draws. .sweep-inner cancels the outer travel so
            the copy holds still while the box slides past. */}
        <div className="sweep-paint arc-cut" aria-hidden="true">
          <div className="sweep-inner">
            <h6 className="subhead subhead--next">{SUBHEAD}</h6>
          </div>
        </div>

        <RollPicker />

        <div className="tape-slide">
          <div id="creative" className="wrapper">
            <div className="left">
              <div className="tags">
                {/* Rebuilt on mount into a fixed pool sized to the tape with the
                    most labels — see buildChips. These are the first paint. */}
                <div className="tag">
                  {first.tags.map((t) => (
                    <h6 className="h6" key={t}>
                      {t}
                    </h6>
                  ))}
                </div>

                <div className="subtext">
                  <h5 className="h5">{first.copy}</h5>
                </div>
              </div>
            </div>

            <div className="middle">
              {/* THE TAPE IS WHAT PEELS, not the photograph — a picture whose
                  corner lifts is a picture coming unstuck from nothing, where a
                  strip of tape is the thing that was holding it. The wrapper
                  takes over the layout box the bare <img> used to hold, so the
                  stylesheet's placement, tilt and drift are unchanged; it is
                  also what the engine now turns, which is what carries the strip
                  through the swap with the picture it is stuck to.

                  drive="manual": the press belongs to the section's entrance and
                  is written by engine.ts, once, on the way in. Neither of
                  peel.ts's own drivers fits. "loop" alternates, so it would rest
                  either flat (and the motion is a peel, which is the wrong way
                  round) or lifted (a permanently curled strip that occasionally
                  presses down). "scroll" scrubs both ways, so the tape would
                  come back off on the way up — and this one goes on and stays
                  on.

                  direction 90deg swings the fold ACROSS the strip so it lands
                  end-first; the tilt alone would crease it lengthwise into a
                  stripe. No lean of its own: the strip is a child of the
                  photograph's box and takes the tilt the stylesheet gives that,
                  which is the tilt it should have — it was laid on the picture,
                  not on the page. */}
              {first.showcase.map((src, i) => {
                const strip = stripOf(first.id);
                return (
                  <span className="showcase" key={i}>
                    <img src={src} alt="" />
                    <Peel
                      className="showcase-tape"
                      src={strip.src}
                      back={strip.back}
                      drive="manual"
                      direction="90deg"
                      box={`${strip.w.toFixed(2)}px ${strip.h.toFixed(2)}px`}
                      from={LIFT[i] ?? LIFT[0]}
                      to={0}
                      style={{ "--strip-blend": strip.blend } as CSSProperties}
                    />
                  </span>
                );
              })}

              <TopTitle />

              <div className="key-visual">
                <img src={first.card} alt="" />
              </div>

              <BottomTitle word={first.word} />
            </div>
          </div>
        </div>

        {/* THE PHONE'S PAIR OF CHEVRONS, and they are the orbit's stand-in
            rather than a second selector: they step the SAME activeIndex the
            rolls do, through the same goTo, so a tap here runs the identical
            swap a click on a roll runs. engine.ts wires them.

            IN THE MARKUP AT EVERY WIDTH and hidden by the stylesheet on the
            desktop, not rendered conditionally — a media query in JS would
            have to re-render this section to change its mind about the
            viewport, and nothing here re-renders after mount by design (see
            the note at the top of this file).

            OUTSIDE .tape-slide, so the drawing's 8vw wave-band shift is not
            inherited from it by accident; the phone rule restates that shift
            here so the pair lives in the same coordinate frame as the copy it
            sits under. */}
        <div className="tape-nav">
          <button type="button" data-step="-1" aria-label="Previous tape">
            <NavArrow />
          </button>
          <button type="button" data-step="1" aria-label="Next tape">
            <NavArrow />
          </button>
        </div>
      </div>
    </Stage>
  );
}
