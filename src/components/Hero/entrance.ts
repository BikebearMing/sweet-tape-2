/* Sweet Tape — the roll arriving.
 *
 * It comes up into frame and grows into its own size at the same time, on an
 * ease that goes past and settles: one tween, both properties, so the two are
 * not merely simultaneous but the same gesture. Scale on its own reads as a
 * pop-up; the lift on its own reads as a slide; together they read as something
 * being set down on the page and bouncing once.
 *
 * On the MOUNT, not on the canvas. The engine appends the canvas and owns
 * everything inside it — this only ever touches the box around it, so the two
 * cannot collide. The box declares `translate: -50%` for its centring rather
 * than a transform, which is what leaves `transform` free here; they are
 * separate properties and compose. And nothing the engine measures is affected:
 * it reads clientWidth / clientHeight and accumulates offsetTop, none of which
 * a CSS transform touches. A getBoundingClientRect anywhere in that path would
 * make this unsafe.
 *
 * Parked at mount and played much later, and the two being separate is the
 * whole of what makes it seamless. The box is empty until three and the GLB
 * land, and a transform on an empty box is invisible — so lowering and shrinking
 * it now costs nothing and guarantees that the roll's FIRST painted frame is
 * already lowered and undersized. Park it any later — when the canvas lands,
 * when the cover clears, when the tween starts — and there is a window, however
 * short, in which the roll stands at its resting size and is then snatched back
 * down to start. That window is a jump, and it is visible.
 *
 * Playing waits for two things, and needs both:
 *
 *   the cover to be moving     — a little way into the sweep, NOT at the end of
 *                                it (whenSweeping in Preloader/gate.ts)
 *   something to be in the box — [data-tape="live"], set by the engine when
 *                                three and the GLB have both landed
 *
 * The first is the whole timing of this. The roll has to be ALREADY RISING when
 * the sheets pass across it, so it starts while it is still covered and is
 * caught mid-bounce as the arc goes by. Waiting for the page to be handed over —
 * which happens most of a second later, and after the roll has been in plain
 * sight for half of it — means being revealed at a standstill and then starting,
 * which reads as two separate events rather than one continuous arrival.
 *
 * The second is why this is not simply a delay: the chunk and a 1.3 MB model can
 * outlast the whole preloader on a cold connection, and an entrance played on an
 * empty rectangle is an entrance that never happened. Whichever arrives second
 * starts it — and until then the roll waits where it was parked, which is where
 * it is supposed to start from anyway.
 */
import gsap from "gsap";

import { whenSweeping } from "@/components/Preloader/gate";

export const ROLL = {
  /* After the sweep has told it to go, which is already the moment this wants —
     PRELOADER.SWEEP_MARK is where that lands and is the knob for the timing.
     Left at 0 so the two are not two numbers describing one instant; it is here
     for holding the roll back a fraction against the sheet passing over it, if
     that is ever wanted. */
  DELAY: 0,

  /* Where it starts. Below its resting place and under its own size, both of
     which it makes up on the same clock — hence one tween rather than two.
     The lift is in vw, like every other length in this section, so it scales
     with the layout rather than being a fixed number of pixels at one width.

     13vw is getting on for half the roll's own box (--roll-box is 27.2vw), which
     is a long way for something this large to travel — and the travel is what
     carries the arrival, since the scale change is only ever a fifth. Two
     things move with it, neither of them a limit worth worrying about here:
     back.out carries about 8% of this ABOVE the resting place on the overshoot,
     and starting lower means the sheets uncover the roll a little earlier in
     the sweep, which puts more of the rise on screen rather than less. */
  FROM_Y: "13vw",
  FROM_SCALE: 0.82,

  /* The bounce. back.out overshoots once and settles, and because both
     properties ride the same curve the roll goes a shade too far up AND a shade
     too big at the same moment — which is what makes it read as weight landing
     rather than as two animations that happen to finish together.

     1.5 is a firm settle. Past about 2.2 the overshoot starts to look like a
     second, smaller arrival; toward 0 it becomes a plain ease and the bounce
     goes.

     The one thing to know before touching this number: back.out is heavily
     front-loaded, and reaches full size at exactly 0.4 of its DURATION — every
     value of the overshoot, every duration. The remaining 60% is the overshoot
     going out and coming back. So the moment the roll LOOKS arrived is 0.4 of
     this after PRELOADER.SWEEP_MARK fires, and that has to land well AFTER the
     last sheet has finished uncovering the roll — otherwise the growth is spent
     behind the paper and all there is to watch is the settle.

     At 1.3 that moment is about 0.52s after the mark, against an uncovering
     that finishes roughly 0.2s after it: the roll is a little over half way up
     as the last of the paper leaves it, and arrives a third of a second later,
     in the open. Lengthening this spends more of the rise in plain sight;
     SWEEP_MARK shifts the whole thing. */
  DURATION: 1.3,
  EASE: "back.out(1.5)",
};

export function initRollEntrance(root: HTMLElement): () => void {
  const mount = root.querySelector<HTMLElement>(".hero-tape");
  if (!mount) return () => {};

  /* An object bouncing into frame is what the setting is asking about. The
     engine puts the roll in the box either way; this only decides how it got
     there, and "it was already there" is the answer here. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  let start: gsap.core.Tween | null = null;
  let observer: MutationObserver | null = null;

  /* Built here, played later. A paused fromTo still renders its `from` at once,
     which is what parks the box — see the note at the top of this file for why
     that has to happen now rather than at the moment it plays. */
  const tween = gsap.fromTo(
    mount,
    { y: ROLL.FROM_Y, scale: ROLL.FROM_SCALE },
    {
      y: 0,
      scale: 1,
      duration: ROLL.DURATION,
      ease: ROLL.EASE,
      paused: true,
    },
  );

  /* Both conditions, in whichever order they land. The sweep comes first in the
     nesting because it is the one that always resolves — the tape may never
     arrive at all (no three, no network), and in that case there is nothing to
     animate and nothing left waiting. */
  const unsubscribe = whenSweeping(() => {
    const go = () => {
      start = gsap.delayedCall(ROLL.DELAY, () => tween.play());
    };

    if (mount!.dataset.tape !== undefined) {
      go();
      return;
    }

    /* The engine sets the attribute from a promise that may already be in
       flight, so this is a race the observer settles: watch for it rather than
       polling, and stop watching the moment it lands. */
    observer = new MutationObserver(() => {
      if (mount!.dataset.tape === undefined) return;
      observer?.disconnect();
      observer = null;
      go();
    });
    observer.observe(mount!, { attributes: true, attributeFilter: ["data-tape"] });
  });

  return () => {
    unsubscribe();
    observer?.disconnect();
    start?.kill();
    tween.kill();
    /* A teardown mid-bounce must leave the roll at its own size in its own
       place — the engine's framing assumes the box is untransformed. */
    gsap.set(mount, { clearProps: "transform" });
  };
}
