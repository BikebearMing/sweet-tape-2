/* Sweet Tape — the two strips going on, once.
 *
 * The tape is PUT ON and it stays on. It is pressed down when the section is
 * reached, and after that it is a photograph with tape on it and a sentence
 * with tape across it — which is what those are.
 *
 * WHY NEITHER OF PEEL'S OWN DRIVERS FITS, since both were tried:
 *
 *   "loop"   alternates for ever. So the strip either rests FLAT and
 *            periodically lifts — which is a piece of tape coming off by itself
 *            — or rests LIFTED, which is a permanently curled strip that
 *            occasionally presses down. The gesture here has a direction and a
 *            destination, and a loop has neither.
 *   "scroll"  scrubs the fold off the page position, forwards AND back. Scroll
 *            up and the tape comes off again. This one goes on and stays on.
 *
 * So: drive="manual" in the markup, and this is the hand. It is the same
 * arrangement the slider's showcase strips use (addPress in TapeSlider/
 * engine.ts) and for the same reasons, written out here because that one is a
 * beat inside a much larger entrance timeline and this is the whole of it.
 *
 * ONCE PER LOAD. The observer disconnects on the way IN, not on the way out, so
 * scrolling past and coming back finds the tape where it was left. That is the
 * point of the whole file.
 *
 * WRITTEN AS A PLAIN NUMBER onto --peel rather than tweened by GSAP's CSSPlugin
 * — the value is unitless and there is nothing for the plugin to infer, which
 * is the note peel.ts makes about it too.
 */
import gsap from "gsap";

/* Which end of --peel is which: Peel puts its `from` at 0 and its `to` at 1,
   and this section's strips are declared from={LIFT} to={0} — so 0 is the
   corner lifted and 1 is flat. The press runs 0 -> 1. */
const UP = 0;
const DOWN = 1;

export const PRESS = {
  /* How much of the section has to be on screen before the hand arrives. The
     strips are a third of the way down it, so a little under half means they
     are comfortably in view rather than pressing themselves at the very edge
     of the screen. */
  MARGIN: "0px 0px -35% 0px",

  /* Slower than a card turning over, because pressing tape onto something is a
     slower thing than turning something over, and power2.out so it ARRIVES
     rather than stops. Both are the slider's own figures. */
  TIME: 0.62,
  EASE: "power2.out",

  /* The two do not land together. One hand puts one piece of tape on at a time,
     and two strips pressing in lockstep read as a single mechanism firing —
     the same reason the slider's showcase pair is offset from each other. The
     photograph is taped first because it is the object; the sentence follows. */
  LAG: 0.22,
};

/* The strips, in the order a hand would do them. */
const STRIPS = [".info-shot-tape", ".info-story-tape"];

export function initPress(root: HTMLElement): () => void {
  const strips = STRIPS.map((sel) => root.querySelector<HTMLElement>(sel)).filter(
    Boolean
  ) as HTMLElement[];
  if (!strips.length) return () => {};

  /* Tape going on is a small, contained move, but it is still a thing arriving
     under its own steam. Reduced motion gets the finished page: the stylesheet
     already rests these at DOWN, so there is nothing to set and nothing to
     play — the tape is simply already on, which is where all of this was going
     to end up anyway. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* PARKED AT MOUNT, PRESSED ON ARRIVAL, and the gap between the two is what
     keeps it from being visible. The stylesheet rests the strips DOWN — so a
     page with no JavaScript, or one where this never runs, shows properly taped
     artwork rather than one held on by a curled strip — and this is the one
     path where something is coming to press them, so it is the only place
     allowed to take them off again.

     It happens now rather than when the section is reached because the section
     is a full screen below the fold: at mount there is nobody looking, and by
     the time there is, the strips have been lifted for a second or more. Park
     it on the observer instead and the tape is flat until the moment it is
     seen, then snaps up and presses — which reads as the page correcting
     itself. */
  strips.forEach((el) => el.style.setProperty("--peel", String(UP)));

  let tl: gsap.core.Timeline | null = null;

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      /* Disconnected on the way in. Once is once: a reader who scrolls past and
         comes back finds tape that is still stuck down, not tape that presses
         itself on again every time it is looked at. */
      io.disconnect();

      tl = gsap.timeline();
      strips.forEach((el, i) => {
        const at = { p: UP };
        tl!.to(
          at,
          {
            p: DOWN,
            duration: PRESS.TIME,
            ease: PRESS.EASE,
            onUpdate: () => el.style.setProperty("--peel", String(at.p)),
          },
          i * PRESS.LAG
        );
      });
    },
    { rootMargin: PRESS.MARGIN }
  );
  io.observe(root);

  return () => {
    io.disconnect();
    tl?.kill();
    /* Back to the stylesheet's rest pose, which is the tape stuck down — a
       teardown mid-press must not leave a strip parked half lifted for the
       mount that replaces this one. */
    strips.forEach((el) => el.style.removeProperty("--peel"));
  };
}
