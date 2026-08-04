import { preload } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

import Stage from "./Stage";
import { MODEL_URL } from "./engine";

/* Section-level copy. Two lines rather than one string: the headline is set as
   two centred lines by design, not by wrapping. The obvious CMS fields, so they
   are named constants rather than strings buried in the markup. */
const KICKER = ["WE'RE", "HERE TO"];
const HEADLINE = ["STICK", "BY YOU"];

/* The rows below are flex, so a plain space between two letters is dropped —
   the gap between words has to be a character carrying a width of its own. */
const NBSP = "\u00A0";

/* One row of copy, split to its letters.
 *
 * Two boxes each: .clip holds the letter's place in the row and masks it, .char
 * is the only thing that moves. Both the arc and the reveal want the transform
 * property and one element cannot carry both — hero.css has the long version.
 *
 * --i is where the letter stands along its row, which is what the arc reads
 * (together with --letters on the row itself) to work out its point on the
 * curve. Written from the string rather than as :nth-child rules — the markup
 * is generated here anyway, and the copy can change length without the
 * stylesheet knowing.
 *
 * Server-rendered, so the split costs nothing on mount and there is never a
 * frame of unsplit text — unlike the runtime splitters this pattern usually
 * comes with.
 */
function letters(text: string): ReactNode[] {
  return [...text].map((ch, i) => (
    <span className="clip" key={i} style={{ "--i": i } as CSSProperties}>
      <span className="char">{ch === " " ? NBSP : ch}</span>
    </span>
  ));
}

/* The hero, server-rendered.
 *
 * Markup only. The roll is a WebGL canvas the engine appends into .hero-tape on
 * mount; nothing here re-renders after that. Without JS — or before three
 * lands — the section is the type and the two colour fields, which is a
 * complete first paint rather than a hole: .hero-tape is absolutely positioned
 * and sized in vw, so the space it will fill is already reserved and the roll
 * arriving shifts nothing.
 */
export default function Hero() {
  /* The GLB is 1.3 MB and it is the hero. Left to itself it would be requested
     third-hand — after hydration, after three's chunk downloads, after the
     loader constructs — which on a cold load is most of a second of empty box.
     React hoists this into <head> so the fetch starts with the document.

     as: "fetch" with crossOrigin set, because that is the request three's
     FileLoader makes (mode cors, credentials same-origin); a mismatch here does
     not break anything but does waste the preload, and the browser says so in
     the console. */
  preload(MODEL_URL, { as: "fetch", crossOrigin: "anonymous" });

  return (
    <Stage>
      {/* The letters are parked under their masks by hero.css and released by
          Hero/reveal.ts. With no JS to release them the type — the one thing
          this section is guaranteed to be able to paint — would never arrive,
          so the stylesheet's hold is lifted here instead. Costs nothing when
          scripting is on: the contents are not even parsed. */}
      <noscript>
        <style>{`.hero-section .char { transform: none }`}</style>
      </noscript>

      <div className="hero-wrapper">
        <div className="top">
          <div className="title">
            {/* The kicker is one line with a gap wide enough for the roll to
                sit in the middle of it, so each half needs to be its own box:
                that gap is the flex gap between the two, and letters promoted
                to flex items of the same row would be spaced apart by it too.

                aria-label is not honoured on a paragraph, so the readable copy
                is a real (hidden) text node and the split version is taken out
                of the tree — a row of block-level letter boxes is otherwise
                liable to be announced a fragment at a time. */}
            <p className="h4">
              <span className="sr-only">{KICKER.join(" ")}</span>
              {KICKER.map((half) => (
                <span className="half" key={half} aria-hidden="true">
                  {letters(half)}
                </span>
              ))}
            </p>

            {/* One heading, two lines. Splitting it across two <h1>s would put
                "STICK" and "BY YOU" in the outline as separate headings.

                --letters is how long the row is; with --i on each letter it is
                everything the arc in hero.css needs. aria-label for the same
                reason as the kicker's hidden copy — on a heading the label is
                honoured, so nothing hidden is needed here. */}
            <div className="warped-text">
              <h1 className="h1" aria-label={HEADLINE.join(" ")}>
                {HEADLINE.map((line) => (
                  <span
                    className="line"
                    key={line}
                    style={{ "--letters": line.length } as CSSProperties}
                  >
                    {letters(line)}
                  </span>
                ))}
              </h1>
            </div>
          </div>
        </div>

        {/* The engine's mount. Empty by design — the canvas is appended here. */}
        <div className="hero-tape" aria-hidden="true" />

        {/* Reserved; nothing designed for it yet. */}
        <div className="bottom-part" />
      </div>
    </Stage>
  );
}
