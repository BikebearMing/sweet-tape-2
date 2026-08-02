/* eslint-disable @next/next/no-img-element */
import { tapes } from "@/data/tapes";
import Stage from "./Stage";
import RollPicker from "./RollPicker";
import { TopTitle, BottomTitle, WORDMARK_TEXT } from "./WordMarks";

/* Section-level copy. Not per tape, so it does not live in tapes.ts — but it is
   the other obvious CMS field, so it is a named constant rather than a string
   buried in the markup. */
const SUBHEAD = "MEET THE ONE WHO STICKS";

/* The section, server-rendered in the first tape's state.
 *
 * Everything below is markup only. The moment it mounts, the engine takes over
 * the DOM and swaps sources, colours and copy in place — so the initial values
 * here are the first paint and the no-JS fallback, not a state React keeps in
 * step. Nothing re-renders after mount, by design: a re-render mid-tween would
 * replace nodes GSAP is holding transforms on.
 */
export default function TapeSlider() {
  const first = tapes[0];

  return (
    <Stage>
      <div className="wrapper">
        {/* Two stacked colour fields; the incoming one sweeps over the base,
            then commits down to it so the pair is ready to swap again. */}
        <div className="bg-overlay" aria-hidden="true">
          <div className="bg-layer bg-layer--base" />
          <div className="bg-layer bg-layer--next" />
        </div>

        {/* The word mark is eleven images with no text in them, so the headline
            is announced here instead. */}
        <h2 className="sr-only">{WORDMARK_TEXT}</h2>

        <h6 className="subhead">{SUBHEAD}</h6>

        {/* The subhead again in the incoming colours, inside a duplicate of the
            colour sheet with overflow hidden — so it is uncovered along exactly
            the curve the sheet draws. .sweep-inner cancels the outer travel so
            the copy holds still while the box slides past. */}
        <div className="sweep-paint" aria-hidden="true">
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
              {first.showcase.map((src, i) => (
                <img className="showcase" src={src} alt="" key={i} />
              ))}

              <TopTitle />

              <div className="key-visual">
                <img src={first.card} alt="" />
              </div>

              <BottomTitle />
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
