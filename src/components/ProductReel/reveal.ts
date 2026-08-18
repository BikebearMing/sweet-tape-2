/* Sweet Tape — the run arriving: each piece as the camera reaches it.
 *
 * OFF THE CAMERA AND NOT OFF THE SCROLL, which is the opposite call to every
 * other section on the product page and the same one the home page's pinning
 * section makes. The reason is the same too: this section is a row three
 * windows wide inside a frame that never moves, so "scrolled into view" is true
 * of the whole row the moment the pin engages. A ScrollTrigger per photograph
 * would fire all of them at once, on a screen showing one.
 *
 * WHAT CUES THEM IS pin.ts, which owns the timeline and is therefore the only
 * thing that knows where the camera is. This file is the gestures and nothing
 * else — it is handed an element and plays it. It never asks where anything is.
 *
 * THE PHOTOGRAPHS ARE NOT IN ANY OF IT, and their absence is the point. They
 * used to rise and fade up as the camera reached them, and it was wrong: this
 * section is a run the reader travels ALONG, so a photograph that assembles
 * itself as it enters reads as the page still loading rather than as a place
 * being passed. They are on the page from the first paint. What moves is the
 * picture INSIDE each frame, and that is parallax rather than an entrance —
 * see LAYERS in pin.ts and .reel-shot in global.css.
 *
 * NOTHING HERE IS NEW. The claim takes the site's type voice — every letter
 * under its own mask, sliding up in a shuffled order, at the hero's duration,
 * ease and hidden figure.
 *
 * THE TAPE IS THE ONE PIECE THAT DOES NOT ARRIVE — it is PUT ON. Its gesture is
 * the origin section's press, imported whole from ProductInfo/press.ts rather
 * than re-typed: pressing tape onto something is a slower thing than a card
 * turning over, the two strips land a beat apart because one hand does one at a
 * time, and both of those are argued at length there. What is this section's is
 * only WHEN it happens — on the camera, like everything else here, rather than
 * on an observer of its own.
 *
 * ONE TIMELINE PER PIECE, BUILT ON DEMAND, and both halves of that matter. Per
 * piece, because the camera reaches them at its own pace and a shared timeline
 * would have to encode the row's geometry a second time. On demand, because a
 * scrubbed camera can be dragged BACKWARDS past a cue and forwards again, and a
 * gesture that has already played must not play again — the map is the record
 * of what has been seen, and a piece that is in it is left alone.
 */
import gsap from "gsap";

import { REVEAL } from "../Hero/reveal";
import { PRESS } from "../ProductInfo/press";

export const REEL_REVEAL = {
  /* Between the claim's letters, in shuffled order, across all four lines at
     once — see the note by the heading in index.tsx for why they are one pool
     rather than four. Around forty characters, which is three of the hero's
     headline rather than one, so the hero's own stagger would take a second and
     a half to finish. Two thirds of it. */
  STAGGER: REVEAL.STAGGER * 0.65,

  /* THE PRINTED LABEL, and it is the one gesture here with a turn in it. It is
     a stamp going onto the corner of the photograph, so it lands slightly
     over-square and settles — the rotation is the whole difference between a
     label placed by a hand and a circle fading up. Its rest angle is the
     stylesheet's; this is the amount it arrives ahead of it. */
  BADGE_DURATION: 0.8,
  BADGE_EASE: "power3.out",
  BADGE_FROM: -14, // degrees off its resting lean
  BADGE_SCALE: 0.86,

  /* WHICH END OF --peel IS WHICH. Peel puts its `from` at 0 and its `to` at 1,
     and these strips are declared from={KRAFT_LIFT} to={0} — so 0 is the end
     lifted and 1 is flat. The press runs UP -> DOWN. */
  TAPE_UP: 0,
  TAPE_DOWN: 1,
};

/* Fisher–Yates, the hero's. The shuffle IS the effect: reveal the same letters
   left to right and it reads as a wipe, which on a line this size would be a
   bar of type sweeping across the screen. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type ReelReveals = {
  /** Play one cued piece. A second call for the same piece does nothing. */
  play: (el: HTMLElement) => void;
  /** Put every piece home at once — the reduced-motion and no-camera path. */
  flushAll: () => void;
  destroy: () => void;
};

export function initReelReveal(root: HTMLElement): ReelReveals {
  /* Hand the whole section over from the stylesheet.
   *
   * global.css holds the letters under their masks and the photographs at
   * nothing until this attribute lands, and setting it FIRST is what makes the
   * tweens' numbers mean what they say: GSAP reads the computed transform as
   * its starting point, and a percentage translate coming from CSS is reported
   * as resolved px — which GSAP would then ADD to the yPercent below, leaving
   * every letter parked a full height low.
   *
   * Nothing paints in between: the attribute and the fromTos below happen in
   * different tasks, so the pieces are put back to their `from` poses by this
   * file's own set() rather than being left standing for a frame. */
  root.dataset.reveal = "live";

  const cued = gsap.utils.toArray<HTMLElement>("[data-reel-cue]", root);

  /* THE PARK, and EVERY CUED PIECE HAS TO BE IN IT.
   *
   * The attribute above has just lifted the stylesheet's hold on the whole
   * section, so at this moment every piece is at HOME. This is what puts them
   * back where their gestures begin, in the same task, before anything can
   * paint. A piece missing from this loop is a piece that stands at rest from
   * mount until its cue arrives — and since the cues here are the camera's, that
   * can be several screens of scrolling later. What a reader then sees is the
   * finished thing, and then the same thing snapping away and re-arriving.
   *
   * THE CLAIM USED TO BE MISSING FROM IT, on the reasoning that its letters were
   * still held under their masks by .product-reel .char. They were not: that
   * rule is lifted by exactly the attribute set two lines above, and the letters
   * stood in full view until the section reached its trigger. It is parked here
   * like everything else now, at the same figure its tween starts from.
   *
   * Each kind parks differently, which is why this is a loop with branches
   * rather than one set(): the letters go back under their masks, the tape is
   * parked by LIFTING it rather than hiding it, and everything else waits at
   * nothing. --peel is written straight on rather than tweened, because the
   * value is unitless and there is nothing for GSAP's CSSPlugin to infer — the
   * call press.ts and peel.ts both make about it. */
  const tapes = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLElement>(".peel"));
  const glyphs = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLElement>(".char"));

  for (const el of cued) {
    if (el.classList.contains("reel-claim")) {
      gsap.set(glyphs(el), { yPercent: REVEAL.HIDDEN });
      continue;
    }
    if (el.classList.contains("reel-kraft")) {
      for (const tape of tapes(el)) {
        tape.style.setProperty("--peel", String(REEL_REVEAL.TAPE_UP));
      }
      continue;
    }
    gsap.set(el, { autoAlpha: 0 });
  }

  const played = new Set<HTMLElement>();

  const build = (el: HTMLElement): gsap.core.Timeline => {
    const tl = gsap.timeline();

    if (el.classList.contains("reel-claim")) {
      const chars = glyphs(el);
      if (chars.length) {
        tl.fromTo(
          shuffle(chars),
          { yPercent: REVEAL.HIDDEN },
          {
            yPercent: 0,
            duration: REVEAL.DURATION,
            stagger: REEL_REVEAL.STAGGER,
            ease: REVEAL.EASE,
          },
        );
      }
      return tl;
    }

    if (el.classList.contains("reel-kraft")) {
      tapes(el).forEach((tape, i) => {
        /* A proxy rather than the element: --peel is a plain number and GSAP
           would have nothing to infer a unit from. The same shape addPress uses
           in the slider and press.ts uses in the origin section. */
        const at = { p: REEL_REVEAL.TAPE_UP };
        tl.to(
          at,
          {
            p: REEL_REVEAL.TAPE_DOWN,
            duration: PRESS.TIME,
            ease: PRESS.EASE,
            onUpdate: () => tape.style.setProperty("--peel", String(at.p)),
          },
          i * PRESS.LAG,
        );
      });
      return tl;
    }

    if (el.classList.contains("reel-badge")) {
      /* THE LEAN IS THE STYLESHEET'S AND THIS DOES NOT TOUCH IT. The badge's
         resting angle is the CSS `rotate` property — a property of its own,
         not part of the transform — so the `rotation` animated here composes
         ON TOP of it rather than replacing it, and the label settles at the
         angle the design put it at without that figure being repeated in this
         file. Same trick the cursor's hotspot uses with `translate`, and the
         same reason: two mechanisms, one element, neither overwriting the
         other. */
      tl.fromTo(
        el,
        {
          autoAlpha: 0,
          scale: REEL_REVEAL.BADGE_SCALE,
          rotation: REEL_REVEAL.BADGE_FROM,
        },
        {
          autoAlpha: 1,
          scale: 1,
          rotation: 0,
          duration: REEL_REVEAL.BADGE_DURATION,
          ease: REEL_REVEAL.BADGE_EASE,
        },
      );
      return tl;
    }

    /* Anything else cued would arrive here, and nothing does today — the three
       pieces above are the whole list. Left as a no-op rather than a throw: a
       new piece given data-reel-cue and no gesture should be a piece that does
       not move, not a section that stops. */
    return tl;
  };

  const live: gsap.core.Timeline[] = [];

  const play = (el: HTMLElement) => {
    if (played.has(el)) return;
    played.add(el);
    live.push(build(el));
  };

  return {
    play,

    /* Everything home, with no gesture at all. The attribute above has already
       lifted the stylesheet's hold on the letters; this is the park taken back
       off the photographs. */
    flushAll: () => {
      for (const el of cued) {
        played.add(el);
        if (el.classList.contains("reel-claim")) {
          /* Back out from under the masks. The park above put them there, so
             skipping the claim here — which this used to do — leaves the whole
             claim invisible on the one path where nothing is going to arrive and
             put it right. */
          gsap.set(glyphs(el), { clearProps: "transform" });
          continue;
        }
        if (el.classList.contains("reel-kraft")) {
          /* Back to the stylesheet, which rests the strips STUCK DOWN — the
             finished state, which is where the press was going anyway. */
          for (const tape of tapes(el)) tape.style.removeProperty("--peel");
          continue;
        }
        gsap.set(el, { clearProps: "opacity,visibility,transform" });
      }
    },

    destroy: () => {
      for (const tl of live) tl.kill();
      live.length = 0;
      /* A teardown mid-arrival must leave the section readable: the claim
         standing and the photographs on. Back to the stylesheet, which with the
         attribute still set is home rather than hidden — and the badge's own
         lean lives there, so the transform has to GO rather than be zeroed. */
      for (const el of cued) {
        gsap.set(el, { clearProps: "opacity,visibility,transform" });
        /* THE LETTERS, and not just the heading they sit in. clearProps on the
           <h2> says nothing about the boxes inside it, and those are what the
           park and the tween both move — a teardown that clears only the parent
           leaves a claim still under its masks for the mount that replaces
           this one. */
        gsap.set(glyphs(el), { clearProps: "transform" });
        /* And the tape stuck down. A teardown mid-press must not leave a strip
           parked half lifted for the mount that replaces this one. */
        for (const tape of tapes(el)) tape.style.removeProperty("--peel");
      }
    },
  };
}
