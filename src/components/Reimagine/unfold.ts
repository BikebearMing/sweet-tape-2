/* Sweet Tape — the statement on the open sheet, revealed on arrival.
 *
 * THE FLIPBOOK AND THE PIN ARE GONE. The section used to hold the screen for
 * two screens of scroll while six stills of a ball of paper opened; now the
 * sheet rests open from the first paint — one photograph, no held screen — and
 * what animates is everything ON it: the statement's letters rise under their
 * masks, the strip of tape rolls down over the hole in the third line, and the
 * props dress the sheet around them. The old choreography survives with the
 * unfold cut off its front; every beat below is measured from the reveal
 * starting instead of from the last cut landing.
 *
 * ONCE, AND FORWARD ONLY, exactly as before. The cue is the reader scrolling
 * the sheet into view (REIMAGINE.START); the timeline keeps its own clock from
 * there. A reader who scrolls back up finds the statement written and waiting,
 * not a sheet that unwrites itself.
 *
 * NO PIN ALSO MEANS `once: true` IS SAFE AGAIN. The old trigger could not use
 * it — killing a pinning trigger reverts the pin under the reader — and grew a
 * velocity gate (SETTLE) because the pin could catch the screen while the
 * reader was still travelling. A trigger that only cues a timeline has neither
 * problem: it fires once, dies, and the page never held anything.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

export const REIMAGINE = {
  /* WHERE THE REVEAL STARTS: the stage's top reaching six tenths down the
     window, which has the sheet's upper half well inside the frame before a
     letter moves. Earlier ("top 80%") and the writing starts while the paper is
     a sliver at the fold; later ("top 30%") and a slow reader stares at a blank
     sheet they have already begun to read. */
  START: "top 60%",

  /* WHERE THE WRITING STARTS, in seconds from the reveal. The props open at
     PROPS.AT before it, so the hand is already dressing the sheet as the
     statement begins — the same overlap the two had when an unfold ran ahead
     of them. */
  TEXT_AT: 0.67,

  /* THE STRIP OF TAPE over the hole in the third line — see the markup in
     ./index.tsx for which end and how big; this is only when. LAG is measured
     from the last letter landing: the sentence is written and THEN it is
     taped, an order of events rather than two things at once. */
  TAPE: {
    LAG: 0,
    DURATION: 0.55,
    EASE: "sine.inOut",
    FROM: 1,
  },

  /* THE SHEET BEING DRESSED — six strips rolled down and two photographs put
     down, in document order off props.tsx. AT is seconds from the reveal;
     before TEXT_AT on purpose, so the first strip is on its way down before
     the first letter is up. */
  PROPS: {
    AT: 0.2,
    STAGGER: 0.08,

    /* Shorter and blunter than the sentence's own strip: these are six things
       happening at the edges of the frame, not the thing being watched. */
    TAPE: { DURATION: 0.42, EASE: "sine.inOut", FROM: 1 },

    /* A photograph is PUT DOWN: up off the paper a little small, settling past
       its size. The one overshoot in the section, and the right one — a hand
       letting go of something. FADE is linear and short so the eye reads the
       move, not the arrival. */
    SHOT: {
      DURATION: 0.62,
      EASE: "back.out(1.9)",
      RISE: 9,
      SCALE: 0.86,
      FADE: 0.2,
    },
  },

  /* Between letters, in shuffled order. Well under the hero's 0.025: there are
     ninety-odd characters here against a headline's twenty. */
  STAGGER: 0.011,
};

/* Fisher–Yates, the hero's and the footer's. The shuffle IS the effect. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ROLL A STRIP OF TAPE DOWN, on this timeline, at this moment.
 *
 * --peel is written as a bare number off a plain object — no unit for GSAP's
 * CSSPlugin to infer — and the first write happens now, outside the timeline,
 * which is what takes the strip off the page before its beat: the markup's
 * rest pose is the tape lying flat, so a page with no script keeps it stuck
 * down. autoAlpha rather than opacity, and shown on the frame the roll starts
 * rather than faded — what appears is the stub at the fold, already on its way
 * out from under itself. */
function roll(
  tl: gsap.core.Timeline,
  el: HTMLElement,
  at: number,
  spec: { DURATION: number; EASE: string; FROM: number },
): void {
  const fold = { v: spec.FROM };
  const write = () => el.style.setProperty("--peel", String(fold.v));
  write();

  gsap.set(el, { autoAlpha: 0 });
  tl.set(el, { autoAlpha: 1 }, at);

  tl.to(
    fold,
    { v: 0, duration: spec.DURATION, ease: spec.EASE, onUpdate: write },
    at,
  );
}

export function initReimagine(root: HTMLElement): () => void {
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));
  const tape = root.querySelector<HTMLElement>(".reimagine-tape");

  /* Hand the letters over from the stylesheet — the site's usual hand-off, and
     the reason it has to happen before the tween is built: global.css parks
     them with a percentage translate, GSAP reads that as resolved px and would
     ADD its own yPercent to it, leaving every letter a full height low. With
     the attribute on, the computed transform is `none` and GSAP owns it. */
  root.dataset.reveal = "live";

  /* Ninety letters flying up and props landing are exactly what this setting
     is asking about. The stylesheet's rest pose IS the finished section — the
     sheet open, the statement on it, the tape flat (--peel is never written,
     so it rests at 0) — and the attribute above has already handed the letters
     home. Nothing to do but stay out of the way. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, which still renders on the server. Idempotent. */
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: REIMAGINE.STAGGER,
        ease: REVEAL.EASE,
      },
      REIMAGINE.TEXT_AT,
    );
  }

  /* THE TAPE, after the last letter: the end of the writing is read off the
     other constants rather than typed, so tuning any of them moves this with
     them. */
  if (tape) {
    const written =
      chars.length > 0
        ? REVEAL.DURATION + REIMAGINE.STAGGER * (chars.length - 1)
        : 0;

    roll(
      tl,
      tape,
      REIMAGINE.TEXT_AT + written + REIMAGINE.TAPE.LAG,
      REIMAGINE.TAPE,
    );
  }

  /* AND THE SHEET IS DRESSED. One query and not two lists — document order is
     arrival order, off props.tsx, and which move a prop gets is a fact about
     the prop, read off its class: a strip rolls down, everything else comes up
     off the paper and settles. The bounce goes on .reimagine-pop rather than
     the prop itself because the prop's own rule carries the lean as a
     transform GSAP would otherwise have to preserve. */
  const props = Array.from(
    root.querySelectorAll<HTMLElement>(".reimagine-prop"),
  );

  props.forEach((prop, i) => {
    const at = REIMAGINE.PROPS.AT + i * REIMAGINE.PROPS.STAGGER;

    if (prop.classList.contains("reimagine-prop-tape")) {
      roll(tl, prop, at, REIMAGINE.PROPS.TAPE);
      return;
    }

    const pop = prop.querySelector<HTMLElement>(".reimagine-pop");
    if (!pop) return;

    const { DURATION, EASE, RISE, SCALE, FADE } = REIMAGINE.PROPS.SHOT;

    /* fromTo and not to, on both: the FROM is what parks the prop out of sight
       at bind time — the stylesheet's rest pose is the finished section, so
       something has to take the props away the moment there is a script to
       bring them back. */
    tl.fromTo(
      pop,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: FADE, ease: "none" },
      at,
    );

    tl.fromTo(
      pop,
      { yPercent: RISE, scale: SCALE },
      { yPercent: 0, scale: 1, duration: DURATION, ease: EASE },
      at,
    );
  });

  /* THE CUE, AND ONLY A CUE — no pin, so the trigger's whole job is to notice
     the sheet arriving and spend itself. play() on a timeline already at its
     end does nothing, so even a stale late fire is a no-op. */
  const stage = root.querySelector<HTMLElement>(".reimagine-stage") ?? root;

  const st = ScrollTrigger.create({
    trigger: stage,
    start: REIMAGINE.START,
    once: true,
    onEnter: () => tl.play(),
  });

  if (process.env.NODE_ENV !== "production") {
    // Console handle for tuning: reimagine.tl.timeScale(0.1) before scrolling
    // in, or reimagine.tl.progress(0.4) to hold it halfway.
    Object.assign(window, { reimagine: { REIMAGINE, tl, st } });
  }

  return () => {
    st.kill();
    tl.kill();
    /* A teardown mid-reveal must leave the section that reads: the statement
       on the sheet, the tape stuck down, the props in place — which is the
       stylesheet's own rest pose, so everything is handed back to it. --peel
       is an inline custom property and comes off with removeProperty rather
       than through GSAP, which never owned it. */
    gsap.set(chars, { clearProps: "transform" });
    if (tape) {
      tape.style.removeProperty("--peel");
      gsap.set(tape, { clearProps: "opacity,visibility" });
    }
    props.forEach((prop) => {
      prop.style.removeProperty("--peel");
      gsap.set(prop, { clearProps: "opacity,visibility" });
    });
    gsap.set(root.querySelectorAll(".reimagine-pop"), {
      clearProps: "transform,opacity,visibility",
    });
  };
}
