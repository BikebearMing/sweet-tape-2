/* Sweet Tape — the way out arriving: the claim writes itself and the pill pops.
 *
 * OFF THE SCROLL, and there is no other option here: this is the last section of
 * a page that is a dozen screens long, so it is nowhere near the fold when it
 * mounts. The failure a ScrollTrigger causes is when its start is ALREADY behind
 * the scroll at build time — that is the first screenful, and this is the exact
 * opposite end of the document. NEXT UP at the foot of every product page is the
 * same case and the same build.
 *
 * NOTHING HERE IS NEW. The claim takes the site's type voice — every letter
 * under its own mask, sliding up in a shuffled order — at the hero's ease and
 * hidden figure, imported rather than copied so the places this happens cannot
 * drift apart. The pill's pop is WE WANTED TO BE.'s four boxes: scale out of
 * nothing on a curve that overshoots once and settles.
 *
 * THREE THINGS ARRIVE AND ONLY TWO ARE IN THIS FILE. The small line above the
 * claim is running copy, so it takes the site's OTHER entrance — a line at a
 * time, out of a floor that is not drawn — and that one measures its own lines
 * at the moment it plays and needs nothing from here. See components/bodyReveal
 * and ./Stage.tsx, which starts both.
 *
 * THE ORDER IS THE READING ORDER, and the pill is deliberately last. It is the
 * thing the section is pointing AT: it should land on a claim that has already
 * been made, not race it. The gap is most of the letters' own run rather than a
 * beat after it, so the two overlap and the section arrives as one move.
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount replays rather than stacking two tweens on the same letters.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

export const CTA_REVEAL = {
  /* Where the section has to be for it to go: its top edge three quarters of
     the way down the window. NEXT UP's figure, for NEXT UP's reason — the
     section opens straight onto its own small line rather than onto a band of
     padding, so there is nothing to spend an earlier start on. */
  START: "top 75%",

  /* Between letters, in shuffled order. THIRTY-EIGHT CHARACTERS, which is more
     than twice a hero headline, so the hero's 0.025 would run for a second on
     its own — and a claim set at 150 wants to be arriving while it is read, not
     after. Tighter than the hero's, for the reason the hero's kicker is tighter
     than its headline: the stagger is a share of a run, and the run is what has
     to stay the same length. */
  STAGGER: 0.018,

  /* THE PILL, AND IT IS WE WANTED TO BE.'s CARD. Scale from nothing with an
   * overshoot — the site's one "pop", and the thing that makes a small object
   * land rather than fade up.
   *
   * FROM 0.86 AND NOT FROM 0, which is where those boxes start. A card popping
   * out of nothing is a drawing appearing; this is a BUTTON, and a button that
   * grows from a point reads as a notification rather than as part of the
   * composition. Just under nine tenths is enough to see it seat itself.
   *
   * The overshoot is small for the same reason — back.out(1.6) on a 19vw card is
   * a bounce, and on a pill this size it would wobble. */
  PILL_AT: 0.34,
  PILL_DURATION: 0.7,
  PILL_FROM: 0.86,
  PILL_EASE: "back.out(1.4)",
};

/* Fisher–Yates, the hero's. The shuffle IS the effect: reveal the same letters
   left to right and it reads as a wipe rather than as a claim arriving. Local,
   as it is in every other section that does this. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds the section's arrival.
 *
 * @param root the <section class="about-cta">
 * @returns the teardown, which leaves the claim standing and the pill down
 */
export function initCtaReveal(root: HTMLElement): () => void {
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".about-cta-title .char"),
  );
  const pill = root.querySelector<HTMLElement>(".about-cta-button");
  if (!chars.length && !pill) return () => {};

  /* Hand the section over from the stylesheet.
   *
   * global.css holds the letters under their masks and the pill at nothing until
   * this attribute lands, and setting it FIRST is what makes the tweens' numbers
   * mean what they say: GSAP reads the computed transform as its starting point,
   * and a percentage translate coming from CSS is reported as resolved px —
   * which GSAP would then ADD to the yPercent below, leaving every letter parked
   * a full height low. The pill is worse than that rather than differently: a
   * scale from the stylesheet is a resolved matrix, and GSAP would MULTIPLY its
   * own scale by it.
   *
   * Nothing paints in between: the attribute and the fromTos happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* Thirty-eight letters flying in from nowhere and a button springing out of
     the page are exactly what the setting is asking about. The attribute alone
     has already put both where they belong. Here as well as in global.css, which
     also covers the window before hydration. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  if (chars.length) {
    /* ONE POOL ACROSS ALL THREE LINES rather than one per line. Shuffling them
       separately would have MORE COLOUR, finished before YES — BETTER TAPE. had
       started, which is a wipe down the block — the thing the shuffle exists to
       avoid. AboutOpen/reveal.ts makes the same call over two lines. */
    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: CTA_REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      0,
    );
  }

  if (pill) {
    tl.fromTo(
      pill,
      { scale: CTA_REVEAL.PILL_FROM, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: CTA_REVEAL.PILL_DURATION,
        ease: CTA_REVEAL.PILL_EASE,
      },
      CTA_REVEAL.PILL_AT,
    );
  }

  const st = ScrollTrigger.create({
    trigger: root,
    start: CTA_REVEAL.START,
    once: true,
    onEnter: () => tl.play(),
  });

  return () => {
    st.kill();
    tl.kill();
    /* READABLE, not parked. A teardown mid-arrival — a StrictMode remount, a
       route change — must never leave the claim under its own mask or the door
       out of the page invisible, with nothing left running to lift either. Back
       to the stylesheet, which with the attribute still set is home rather than
       hidden. */
    if (chars.length) gsap.set(chars, { clearProps: "transform" });
    if (pill) gsap.set(pill, { clearProps: "transform,opacity,visibility" });
  };
}
