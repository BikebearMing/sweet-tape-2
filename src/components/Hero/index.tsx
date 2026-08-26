import { preload } from "react-dom";
import type { CSSProperties } from "react";

import Stage from "./Stage";
import HandNote from "@/components/HandNote";
import Peel from "@/components/Peel";
import { letters, words } from "@/components/letters";
import { MODEL_URL } from "./engine";

/* Section-level copy. Two lines rather than one string: the headline is set as
   two centred lines by design, not by wrapping. The obvious CMS fields, so they
   are named constants rather than strings buried in the markup. */
const KICKER = ["WE'RE", "HERE TO"];
const HEADLINE = ["STICK", "BY YOU"];
/* The corner mark. Two lines for the same reason the headline is: the break is
   set, not wrapped — it is short copy in a corner and it has one shape. */
const CORNER_MARK = ["STICK WITH YOU THROUGH", "THREE GENERATIONS"];
const CARDBOARD_COPY =
  "DIY FAIL, MOVING DAY CHAOS, SCHOOL PROJECT EMERGENCY,LAST-MINUTES FIXES. WE ALWAYS STICK BY YOU.";

/* The badge in the middle of the kicker — the same file the preloader draws its
   mark from, deliberately and not by coincidence: it is one logo, and pointing
   both at it means there is one thing to replace when the artwork changes.

   It is also already in the browser by the time the hero needs it. The layout
   preloads this for the preloader, which paints it before anything else on the
   page, so the copy here is a cache hit and the drop has nothing to decode on
   its first frame. */
const HERO_MARK = "/assets/preloader-image.svg";

/* Running copy split to letters — the cardboard's h2, which wraps, where the
 * headline's rows do not. Each word becomes an inline flex box of letter clips
 * so the line breaks BETWEEN words exactly as the unsplit text would; the
 * spaces between them are real text nodes, so they keep their width without a
 * box of their own.
 *
 * Long tokens are further chunked after commas and hyphens ("EMERGENCY,LAST-"
 * is one whitespace token but three chunks): adjacent chunks butt together
 * seamlessly, but the line is allowed to wrap between them — which is where
 * plain text would have broken too.
 *
 * IT LIVES IN components/letters NOW, beside the split it is built on. It was
 * local to this file while the cardboard was the only copy on the site that both
 * split to letters and wrapped; the news page's lead story is the second, and a
 * second copy of a splitter is two answers to where a line breaks. */

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
      {/* The letters are parked under their masks by global.css and released by
          Hero/reveal.ts. With no JS to release them the type — the one thing
          this section is guaranteed to be able to paint — would never arrive,
          so the stylesheet's hold is lifted here instead. Costs nothing when
          scripting is on: the contents are not even parsed. */}
      <noscript>
        <style>{`.hero-section .char { transform: none } .hero-section .corner-perf { clip-path: none }`}</style>
      </noscript>

      <div className="hero-wrapper">
        <div className="top">
          {/* The corner mark, out of flow in the lime field's top-left. After
              .top's grain in source, which is what keeps it over the texture —
              positioned siblings paint in tree order and the grain is a
              positioned ::before. .title holds itself above the same layer the
              same way, with position: relative.

              Split to letters and given an arrival of its own — the
              perforation is punched down the edge and the two lines write
              themselves after it, a beat behind the headline (initCornerMark
              in Hero/reveal.ts). The dots are a real element rather than the
              ::before they were, because a pseudo-element cannot be handed to
              GSAP; the menu's rules are real elements for the same reason.

              aria-label is not honoured on a paragraph, so the readable copy
              is a real (hidden) text node and the split version is taken out
              of the tree — a row of block-level letter boxes is otherwise
              liable to be announced a fragment at a time. Same call the
              kicker makes. */}
          <p className="corner-mark">
            <span className="sr-only">{CORNER_MARK.join(" ")}</span>
            <span className="corner-perf" aria-hidden="true" />
            {CORNER_MARK.map((line) => (
              <span className="line" key={line} aria-hidden="true">
                {letters(line)}
              </span>
            ))}
          </p>

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

              <span className="half" aria-hidden="true">
                {letters(KICKER[0])}
              </span>

              {/* The badge that fills that gap, dropped into it from above the
                  top of the page once the cover has gone (Hero/mark.ts).

                  BETWEEN the halves rather than laid over them, and the empty
                  span is why. The two words are different widths — WE'RE
                  against HERE TO — so the middle of the gap is not the middle
                  of the kicker, and a badge centred on the row sits visibly off
                  to one side of its own slot. A zero-width item here is exactly
                  the gap's centre, and stays exactly the gap's centre if either
                  word is ever re-set. Nothing moves to make room: the span has
                  no size and the badge inside it is out of flow.

                  Which is also why the row is written out rather than mapped
                  over KICKER, as it was when it was only two boxes: what is
                  between the halves is as much the design as the halves are,
                  and it is not something a list of two labels can express.

                  Out of the a11y tree: the readable copy is the sr-only line
                  above, and it is one phrase. A brand name announced in the
                  middle of it would split "WE'RE HERE TO" in half, and the mark
                  is not saying anything the page does not already say. */}
              <span className="hero-mark-slot" aria-hidden="true">
                <img
                  className="hero-mark"
                  src={HERO_MARK}
                  alt=""
                  draggable={false}
                />
              </span>

              <span className="half" aria-hidden="true">
                {letters(KICKER[1])}
              </span>
            </p>

            {/* One heading, two lines. Splitting it across two <h1>s would put
                "STICK" and "BY YOU" in the outline as separate headings.

                --letters is how long the row is; with --i on each letter it is
                everything the arc in global.css needs. aria-label for the same
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

        {/* The dark-green pinboard below the roll. Its props arrive one at a
            time; so far: the sticky note, a 3D sheet fluttering on the wall.
            The mount is empty by design — Hero/note.ts appends the canvas. */}
        {/* data-parallax is each prop's depth — how much of a scrolled px it
            gives back (Hero/parallax.ts). Positive lags the page: deeper,
            pressed into the board. Negative outruns it: lifted toward the
            viewer. data-parallax-ease is its weight — how fast it chases that
            offset, in 1/s: the gift is light and snaps with the scroll, the
            lemon painting is heavy and settles a beat later, the cardboard
            sits in between. The cardboard carries its copy with it, so the
            wrapper wears the attributes rather than the img. */}
        <div className="bottom-part">

          
          <img
            src="./assets/lemon painting 1.webp"
            alt=""
            id="lemon"
            // data-parallax="0.14"
            // data-parallax-ease="3.5"
          />
          
          <img
            id="gift"
            src="./assets/gift 1.webp"
            alt=""
            data-parallax="-0.12"
            data-parallax-ease="9"
          />

          
          {/* No parallax here, deliberately: the finale tapes the strip across
              this board, and the strip is fixed to the section — a drifting
              board would slide under its own tape. */}
          <div className="cardboard-wrapper">
            {/* Same split-letter reveal as the headline, but driven by the
                  scroll (Hero/reveal.ts, initCopyReveal) since this sits a
                  viewport below the fold. aria-label carries the readable
                  copy, same as the h1. */}
            <h2 className="h2" aria-label={CARDBOARD_COPY}>
              <span aria-hidden="true">{words(CARDBOARD_COPY)}</span>
            </h2>
            <img id="cardboard" src="./assets/cardboard.webp" alt="" />
            
          </div>

          {/* The tab of tape that holds the note up, and the scroll is what
              STICKS IT DOWN — see components/Peel. It is found turned right
              over, off the note, and lays itself onto the paper end-first as
              the note comes up the screen. Scrubbed rather than looped, so it
              lifts back off again on the way up.

              Which is the peel run backwards, and it is written as exactly
              that: the fold's far end is `from` and its flat end is `to`. The
              geometry does not know or care which of the two is further along
              — see the note by --peel-from in global.css.

              --peel-dir turns the fold a quarter turn so the tab lands
              END-FIRST rather than dropping along its whole top edge at once,
              and `box` is what that turn has to be told: the size the
              stylesheet's #tape-on-note rule gives it. Everything the turn
              costs — how far the clip frame swings off the artwork, and
              therefore how much it has to be bled back — is worked out from
              those two numbers rather than typed.

              WHICH IS WHY IT IS READ OFF THE RULE rather than typed here. The
              strip is a different size on a phone, and a literal box in this
              file is a second copy of that figure that no media query can
              reach — the fold would go on being bled for a desktop strip and
              the clip frame would swing off a phone-sized one. #tape-on-note
              declares --tape-w and derives --tape-h from the artwork's aspect;
              both this and the rule's own `width` read them, so there is one
              number and the phone block moves it.

              Which is what leaves from/to readable: 0.55 is a little past half
              way along the strip, and 0 is its near edge, nothing folded, stuck
              flat to the note.

              The wrapper is what #tape-on-note sizes and places; the two copies
              of the artwork live inside it. */}
          <Peel
            src="./assets/tape-on-note.webp"
            id="tape-on-note"
            back="peel-back-masking"
            drive="scroll"
            direction="90deg"
            box="var(--tape-w) var(--tape-h)"
            from={0.55}
            to={0}
          />

          {/* The same move on the painting, and the same reading of it: found
              turned back, stuck down by the scroll.

              The strip is DRAWN at an angle — 16.952deg of lean baked into the
              artwork, not put there by CSS — and that is why the direction is
              that lean PLUS a quarter turn. The lean on its own would run the
              fold ALONG the tape and crease it lengthwise into a stripe; it is
              the extra 90deg that swings the fold across the strip so it comes
              away end-first, off the right.

              box is #tape-on-lemon's own --tape-w and the height its 283x134
              artwork takes at that width, for the reason the note's strip reads
              its box off the stylesheet too: the phone re-sizes both, and a
              literal box here could not follow. */}
          <Peel
            src="./assets/tape-on-lemon.webp"
            id="tape-on-lemon"
            back="peel-back-masking"
            drive="scroll"
            direction="106.952deg"
            box="var(--tape-w) var(--tape-h)"
            from={0.55}
            to={0}
          />

          {/* And the note written on the board above that tape: a margin ruled
              in two strokes and four lines of handwriting beside it, all of it
              DRAWN — the lines first, then the words, off one playhead
              (components/HandNote/hand.ts).

              The letterforms are built at runtime by Vara from a JSON font of
              drawn strokes, which is why this is the one prop on the board with
              nothing to show in the markup. The readable copy is inside it as a
              hidden text node, so the sentence survives with or without any of
              that. */}
          <HandNote />
          <div className="sticky-note" aria-hidden="true" />
          <img id="paperclip" src="./assets/paper-clip-1.webp" alt="" />
          <img src="./assets/tape top.webp" alt="" id="tape-top" />
        </div>

        
      </div>
    </Stage>
  );
}
