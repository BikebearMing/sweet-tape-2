import type { CSSProperties } from "react";

import HandNote from "@/components/HandNote";
import { letters } from "@/components/letters";
import Stage from "@/components/WhatsRolling/Stage";

/* PAGE NOT FOUND — the 404.
 *
 * IT IS THE NEWS PAGE'S TITLE CARD WITH THE ABOUT PAGE'S DOOR ON IT, and both
 * halves of that are reuse rather than resemblance. The site already has an
 * object whose whole job is to name a page and hold a beat (components/
 * WhatsRolling) and another whose whole job is to be the way out of a page that
 * has ended (the pill at the foot of /about). A 404 is exactly those two things
 * and nothing else, so it wears both: Stage and reveal.ts are imported, the
 * pill's classes are the about page's own, and the .not-found block in
 * global.css is the entire difference.
 *
 * WHAT THIS PAGE CHANGES ABOUT THE CARD is three things, all of them in that
 * block: the type does not curve, the sheet stands full height with its stack
 * centred in it, and the bulge along its foot is dropped because the footer
 * bites up into this sheet rather than lying under it.
 *
 * NO CHIP OVER THE HEADLINE. The card on /news wears one because it is the
 * first of four screens and the chip says which of them this is; there is
 * nothing to disambiguate here, and a small label reading 404 over a headline
 * that already says PAGE NOT FOUND is the same sentence twice.
 *
 * THE WAY BACK IS ONE DOOR AND NOT A MENU. The pull-down and the footer's row
 * are both on this page already — the layout mounts one and (frontend)/
 * not-found.tsx renders the other — so a list of routes here would be a third
 * copy of the same four words. What is in neither is the home page, which is
 * the one place a reader who has landed on nothing actually wants.
 */

/* Two lines, and the break is the drawing's rather than a wrap — every headline
   on this site is stored this way. Plain words: a 404 is the one screen where
   the reader is already mildly annoyed, and a joke is a second thing to get
   past before the way out. */
const HEADING = ["PAGE NOT", "FOUND"];

/* The note, in this page's ink. Three short lines, broken by hand and not by a
   wrap, lower case like every other note on the site — and it says the one
   useful thing the headline cannot: that the rest of the site is fine. */
const NOTE = ["nothing here.", "the links below", "still work"];

/* The door. Capitalised by the pill's own text-transform, so it is written here
   the way it is read. */
const LABEL = "Back home";

/* The pill's chevron, and it is drawn twice because the pill is two discs — one
   that leaves and one that arrives. A copy of components/AboutCta's, which is a
   local function there rather than an export; four lines of path data are not
   worth a shared module, and this one has to stay identical to that one for the
   same reason the classes do. */
function Chevron() {
  return (
    <svg viewBox="0 0 12 12" fill="none" focusable="false">
      <path
        d="M4.2 1.6 8.6 6l-4.4 4.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <Stage className="whats-rolling not-found">
      {/* WITHOUT JAVASCRIPT THE PAGE IS STILL A PAGE, which matters more here
          than anywhere else on the site: this is the screen a reader arrives at
          by accident, and a blank lime sheet is a second failure on top of the
          first. The letters are parked under their masks by global.css and the
          pill at nothing by the about page's rule; both are shown outright.

          The note comes back as its ruled margin and the hidden text node
          beside it — its words are drawn at runtime and there is no runtime.
          See components/WhatsRolling, which carries the long version. */}
      <noscript>
        <style>{`.not-found .char { transform: none }
          .not-found .rolling-note { opacity: 1; visibility: visible }
          .not-found .about-cta-button { opacity: 1; transform: none }`}</style>
      </noscript>

      {/* The page's one h1, split to letters for the card's reveal — each waits
          below its own mask and slides up in a shuffled order.

          FLAT, AND THAT IS THIS PAGE'S OWN CALL. The wrapper still carries the
          arc's knobs because it is the card's, and .not-found sets both to
          nothing — see global.css. It is kept rather than removed so the
          heading and the curve stay separable the way they are everywhere else.

          aria-label rather than a second hidden copy of the words: it is
          honoured on a heading, so the line is announced whole and the rows of
          letter boxes are never read out a fragment at a time. */}
      <div className="rolling-warp">
        <h1 className="rolling-title" aria-label="Page not found">
          {HEADING.map((line) => (
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

      {/* THE PILL, AND IT IS THE ABOUT PAGE'S — the same four classes, so the
          shape, the two discs, the swap on hover and every measurement in it
          come from one rule. What this page sets is what that rule leaves open:
          the two colour knobs it reads, the size, and the air above it. All
          three are in .not-found in global.css.

          SMALLER THAN THE ABOUT PAGE'S, because it is doing less. That one
          closes a story and is the only thing on its screen worth pressing;
          this one is a way out of a dead end under a headline four times its
          height. The pill is written in ems throughout, so one font-size is the
          whole of the difference.

          A plain <a> and not next/link: it is one navigation off a dead route,
          and prefetching the home page from the 404 is work done for a page the
          reader may well not ask for.

          Both discs are aria-hidden — they repeat the label's meaning and
          nothing else. */}
      <a className="about-cta-button" href="/">
        <span className="about-cta-label">{LABEL}</span>

        {/* The one on the drawing — a flex item, so it is what gives the pill
            its width and its right-hand end. It is the one that LEAVES. */}
        <span className="about-cta-disc" aria-hidden="true">
          <Chevron />
        </span>

        {/* The one that arrives, absolutely positioned and out of the layout, so
            the pill is the same size whether it is moving or not. */}
        <span className="about-cta-disc about-cta-next" aria-hidden="true">
          <Chevron />
        </span>
      </a>

      {/* The note, and on this page it is written in the TOP right rather than
          the bottom. The card on /news puts it low because the headline fills
          the sheet and the bottom right is the only corner left; here the stack
          is centred and the empty corners are the top ones, and a note in the
          bottom right would be sitting in the footer's bite. Where it stands is
          .not-found .rolling-note — the component itself is unchanged. */}
      <HandNote className="rolling-note" lines={NOTE} />
    </Stage>
  );
}
