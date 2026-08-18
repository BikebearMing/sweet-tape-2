/* Sweet Tape — NEXT UP arriving: the name writes itself, the chip turns, the
 * label lands.
 *
 * OFF THE SCROLL, like every other section on this page and unlike the home
 * page's opening screen. This is the foot of a long page and is nowhere near
 * the fold when it mounts, which is exactly where a ScrollTrigger is right; the
 * failure a trigger causes is when its start is ALREADY behind the scroll at
 * build time, and that is the first screenful, not this.
 *
 * NOTHING HERE IS NEW. The name takes the site's type voice — every letter
 * under its own mask, sliding up in a shuffled order, at the hero's duration,
 * ease and hidden figure. The chip's turn is the title card's, imported whole
 * from WhatsRolling/reveal.ts, which is where every one of those numbers is
 * argued and why it is a rotateY rather than a forward flip. The origin section
 * and the story page take exactly the same pair.
 *
 * THE PANEL ARRIVES FIRST AND CARRIES THE REST UP WITH IT. It is one move —
 * the yellow sheet sliding up onto the lime — and everything on it is a child of
 * it, so the type and the label are still settling as the sheet lands rather
 * than starting from a panel that is already there. The panel's own bottom goes
 * DOWN behind the footer while it travels, which costs nothing: .site-footer
 * sits over this section at z-index 100, so what a reader sees is a sheet coming
 * up out from under it.
 *
 * THEN THE READING ORDER, with one exception. The chip goes on the beat behind
 * the name that those two are already on everywhere else they appear together
 * (REVEAL.DELAY against TAG.DELAY) — the chip is a tenth of the type's size and
 * opening on it would be the section introducing its own label. The label comes
 * last because it is the thing being pointed AT: it should arrive on a panel
 * that already says NEXT UP, not before it.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";
import { ROLL } from "../ProductIntro/reveal";
import { TAG } from "../WhatsRolling/reveal";

export const NEXTUP_REVEAL = {
  /* Where the section has to be for it to go: its top edge three quarters of
     the way down the window. THE SIBLINGS' figure — this section opens straight
     onto its own chip rather than onto a band of padding, so it does not want
     the origin section's later 70%. */
  START: "top 75%",

  /* THE PANEL COMING UP. A sheet being slid into place, so it decelerates into
     its position rather than springing past it — the bounce on this page belongs
     to the label, and two things overshooting in the same second read as one
     wobbly section rather than as two objects.

     The travel is in vw so it scales with everything else here, and it is only
     a few per cent of the panel's own height: a big sheet moving a long way is a
     transition, and this is an arrival. */
  PANEL_RISE: "7vw",
  PANEL_DURATION: 0.9,
  PANEL_EASE: "power3.out",

  /* How far into the panel's rise the name starts writing itself. Not zero: the
     sheet should be visibly moving before anything on it does, or the two read
     as one compound object sliding rather than as type landing on paper. Not
     late either — past about a third the panel has stopped and the section opens
     twice. */
  TEXT_AT: 0.18,

  /* Between letters, in shuffled order. Seven characters, which is half a hero
     headline, so the hero's own figure reads correctly here — no reason for a
     number of this section's own. */
  STAGGER: REVEAL.STAGGER,

  /* The chip's beat behind the name, and it is not a figure of its own: it is
     the gap the title card and the origin section already put between these two
     gestures, measured rather than re-typed so all three stay in step. */
  CHIP_GAP: TAG.DELAY - REVEAL.DELAY,

  /* THE LABEL, arriving last — and the gesture is not this section's either. It
   * is ROLL, imported whole from the opening screen of this same page: a roll
   * coming up into frame and growing into its own size on ONE tween, so the two
   * are the same gesture rather than two that finish together. Scale alone reads
   * as a pop-up, the lift alone reads as a slide, and the pair reads as weight
   * being set down and bouncing once. The long-form reasoning for every one of
   * its numbers is in Hero/entrance.ts, which is where it started.
   *
   * THE TRAVEL IS THE ONE THING TAKEN AS A FRACTION RATHER THAN A FIGURE. That
   * file writes its rise as a share of its own roll's box, and says why: a
   * shared absolute would make a bigger roll travel visibly less far relative to
   * itself. So this reads the same share off whatever size the label actually
   * is, rather than carrying a second vw figure that has to be re-derived every
   * time --nextup-roll moves.
   *
   * It also means the label starts almost entirely behind the footer, which is
   * where half of it lives anyway — so what arrives is a roll rising out from
   * under the green rather than one appearing on top of it. */
  ROLL_AT: 0.42,
  ROLL_TRAVEL: 0.4767, // 14.6vw of ProductIntro's 30.625vw roll
};

/* Fisher–Yates, the hero's. The shuffle IS the effect: reveal the same letters
   left to right and it reads as a wipe rather than as a word arriving. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initNextUpReveal(root: HTMLElement): () => void {
  const panel = root.querySelector<HTMLElement>(".wrapper");
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));
  const chip = root.querySelector<HTMLElement>(".subhead");
  const roll = root.querySelector<HTMLElement>(".bottom-roll");
  if (!panel && !chars.length && !chip && !roll) return () => {};

  /* Hand the section over from the stylesheet.
   *
   * global.css holds the letters under their masks and the chip and the label
   * at nothing until this attribute lands, and setting it FIRST is what makes
   * the tweens' numbers mean what they say: GSAP reads the computed transform as
   * its starting point, and a percentage translate coming from CSS is reported
   * as resolved px — which GSAP would then ADD to the yPercent below, leaving
   * every letter parked a full height low.
   *
   * Nothing paints in between: the attribute and the fromTos happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* A sheet sliding up, a word flying in from nowhere, a chip turning over and a
     label bouncing into place are exactly what the setting is asking about. The
     attribute alone has already put all four where they belong, and the panel
     was never held by anything. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  if (panel) {
    tl.fromTo(
      panel,
      { y: NEXTUP_REVEAL.PANEL_RISE },
      {
        y: 0,
        duration: NEXTUP_REVEAL.PANEL_DURATION,
        ease: NEXTUP_REVEAL.PANEL_EASE,
      },
      0,
    );
  }

  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: NEXTUP_REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      NEXTUP_REVEAL.TEXT_AT,
    );
  }

  if (chip) {
    tl.fromTo(
      chip,
      {
        autoAlpha: 0,
        rotateY: TAG.FROM,
        transformPerspective: TAG.PERSPECTIVE,
        transformOrigin: TAG.ORIGIN,
      },
      {
        autoAlpha: 1,
        rotateY: 0,
        duration: TAG.DURATION,
        ease: TAG.EASE,
      },
      NEXTUP_REVEAL.TEXT_AT + NEXTUP_REVEAL.CHIP_GAP,
    );
  }

  if (roll) {
    tl.fromTo(
      roll,
      {
        /* Function-based, so a resize between mount and the trigger firing is
           measured rather than remembered — the figure is a share of the label's
           own box and the box is in vw. */
        y: () => roll.offsetWidth * NEXTUP_REVEAL.ROLL_TRAVEL,
        scale: ROLL.FROM_SCALE,
      },
      {
        y: 0,
        scale: 1,
        duration: ROLL.DURATION,
        ease: ROLL.EASE,
      },
      NEXTUP_REVEAL.ROLL_AT,
    );
  }

  const st = ScrollTrigger.create({
    trigger: root,
    start: NEXTUP_REVEAL.START,
    once: true,
    onEnter: () => tl.play(),
  });

  return () => {
    st.kill();
    tl.kill();
    /* A teardown mid-arrival must leave the section readable — the name
       standing, the chip face on and the label down. Back to the stylesheet,
       which with the attribute still set is home rather than hidden. */
    if (panel) gsap.set(panel, { clearProps: "transform" });
    if (chars.length) gsap.set(chars, { clearProps: "transform" });
    if (chip) gsap.set(chip, { clearProps: "transform,opacity,visibility" });
    if (roll) gsap.set(roll, { clearProps: "transform,opacity,visibility" });
  };
}
