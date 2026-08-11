/* Sweet Tape — the roll after the story.
 *
 * The scroll sequence ends with the tape cut and the roll turned home, and at
 * that moment nothing owns it any more: the engine's phase goes to "done", its
 * frame() stops posing, and the renderer's dirty gate means the last frame
 * drawn is simply the frame left on screen. Which is a freeze, not a rest — the
 * roll had been turning and feeding for two viewports and then it is a
 * photograph. This is what it does instead.
 *
 * Two things, summed into one offset and handed over in a single call, because
 * they are one pose and not two:
 *
 *   FLOAT   an ambient sway on three sines of different, mutually awkward
 *           periods, so the loop never lines up with itself and there is no
 *           beat to spot. This is the part that runs whether anyone is there.
 *   LEAN    the roll answering the pointer, on all four channels at once — see
 *           the block below, which is where the actual design is.
 *
 * Nothing here is grabbable and nothing here takes a click: the mount stays
 * pointer-events: none across its whole box, and all of this comes off one
 * passive pointermove on the window. The roll reacts to the room rather than
 * being operated.
 *
 * None of it touches the tape stuck to the cardboard either: the drift lands on
 * the roll's group alone (see `lean` in heroTape.ts), and the strip is not in
 * it — it has been stuck down and it must not move.
 *
 * Everything here is in DEGREES and seconds, unlike the engine's document px —
 * this has no relationship to the page's geometry at all beyond where the roll
 * happens to be on screen, which is the only thing the lean needs.
 *
 * Created by the engine when the finale completes, never before: until then the
 * scroll owns the roll's pose and the two would be writing over each other.
 * Reduced motion never reaches that point at all — the engine parks the section
 * at rest and the finale never fires — so there is no separate check for it.
 */
import type { HeroTape } from "./heroTape";

/* Live-tweak in dev: hero.IDLE.LEAN_YAW = 12 */
export const IDLE = {
  /* THE FLOAT — amplitudes in degrees. Small on purpose: this is meant to be
     noticed as the roll being ALIVE rather than as the roll moving. Past about
     4 degrees of yaw the label starts visibly presenting and hiding itself,
     which reads as an animation playing rather than as something at rest. */
  YAW: 2.2,
  TILT_X: 1.4,
  TILT_Z: 0.9,
  /* Their periods, in seconds. Deliberately not in any simple ratio: three
     sines at 5, 10 and 15 would re-align every 30 seconds and the eye finds
     that repeat quickly. These share no useful factor, so the combined pose
     does not come round again in any time anyone is going to watch it. */
  PERIOD_YAW: 7.3,
  PERIOD_X: 5.1,
  PERIOD_Z: 9.7,

  /* THE LEAN — what the pointer does, in degrees at the edge of the viewport.
   *
   * Four channels off two axes of pointer, and the split between them is the
   * whole reason this reads as an object reacting rather than as a picture
   * being tilted:
   *
   *   YAW    the roll TURNS to face the pointer. The big one, and the one that
   *          carries the perspective — a disc seen off-axis foreshortens, so
   *          this is what actually skews the label rather than just moving it.
   *   ROLL   and BANKS as it turns, opposite to the yaw, the way anything
   *          leans into a corner. Tiny against the yaw and it has to stay that
   *          way: this is the channel that spins the label in the screen plane,
   *          so pushed up it stops reading as a lean and starts reading as the
   *          artwork being rotated.
   *   TILT   the vertical answer — the roll lifting its face toward a pointer
   *          above it and dropping away from one below.
   *   SPIN   and a nudge on the wheel itself, about its own axle. Deliberately
   *          the smallest of the four. It is a roll of tape, so SOME rotation
   *          is what the object is for — but the finale's whole payoff is the
   *          label landing upright, and anything past about ten degrees starts
   *          undoing that. Enough to say the thing turns, not enough to turn it.
   *
   * The yaw and the spin look similar written down and are not: yaw turns the
   * roll to face elsewhere, spin turns the label within its own face. Having
   * both off the same pointer axis is what makes the response read as solid —
   * the object turns AND the wheel gives a little. */
  LEAN_YAW: 9,
  LEAN_ROLL: 2.5,
  LEAN_TILT: 4.5,
  LEAN_SPIN: 5,

  /* How fast each is chased, in 1/s — the same exponential ease the parallax
     uses, and frame-rate independent for the same reason.
   *
   * Two rates rather than one, and the gap between them is doing real work. The
   * turn is light and answers the pointer quickly; the wheel is HEAVY and comes
   * round behind it. Run both at one rate and the four channels arrive together
   * as a single rigid transform, which is the flat thing this exists to fix.
   *
   * Neither is fast enough to track exactly, on purpose: a roll that landed on
   * the pointer's position every frame would read as rigidly attached to the
   * cursor rather than as looking at it. */
  EASE: 3,
  SPIN_EASE: 1.4,
};

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type RollIdle = {
  /** One frame of it. Called by the engine's ticker, with the ticker's own
      time in seconds and the frame's delta in ms. */
  frame(time: number, deltaMs: number): void;
  stop(): void;
};

export function createRollIdle(mount: HTMLElement, tape: HeroTape): RollIdle {
  /* The roll's centre on screen, for the lean. The x is fixed by the layout, so
     it is read once per resize; the y is held in DOCUMENT space and the scroll
     taken off it per frame — a rect read every frame would be a forced layout
     on the ticker, which is the thing the whole section is careful about. */
  let centreX = 0;
  let centreDocY = 0;

  function measure() {
    const r = mount.getBoundingClientRect();
    centreX = r.left + r.width / 2;
    // The roll is framed in the mount's top square (the view offset in
    // heroTape.ts), so its centre is half the box's WIDTH down — not half its
    // height, which runs on past the cardboard as drawing room for the strip.
    centreDocY = r.top + window.scrollY + r.width / 2;
  }

  let px = 0; // the pointer, in viewport px
  let py = 0;
  let seen = false; // no pointer yet: float only, nothing to lean toward

  // Where the chase has got to, in degrees.
  let leanX = 0;
  let leanY = 0;
  let leanZ = 0;
  let spin = 0;

  function onMove(e: PointerEvent) {
    px = e.clientX;
    py = e.clientY;
    seen = true;
  }

  /* One passive listener on the window, and nothing on the roll itself. The
     pointer's position is all this needs, so there is no hit test to do, no
     element to put over the section, and nothing anywhere that can eat a click
     or swallow a touch scroll. */
  const ac = new AbortController();
  window.addEventListener("pointermove", onMove, { signal: ac.signal, passive: true });
  window.addEventListener("resize", measure, { signal: ac.signal, passive: true });

  // The section is sized in vw, so a width change moves the roll's centre.
  const ro = new ResizeObserver(measure);
  ro.observe(mount);
  measure();

  function frame(time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 0.1); // a hung tab must not teleport

    /* The pointer, normalised against HALF the viewport, so the far edge is a
       full lean and no offset at all is none. Measured from the ROLL rather
       than from the screen's centre, so it looks at the pointer rather than at
       where the pointer happens to be on the page. */
    const toX = seen ? clamp((px - centreX) / (window.innerWidth / 2), -1, 1) : 0;
    const toY = seen
      ? clamp((py - (centreDocY - window.scrollY)) / (window.innerHeight / 2), -1, 1)
      : 0;

    const k = 1 - Math.exp(-IDLE.EASE * dt);
    leanY += (toX * IDLE.LEAN_YAW - leanY) * k;
    /* Negated against the yaw: the roll banks INTO its turn. Sharing a sign
       would lean it out of the turn, which reads as the label sliding. */
    leanZ += (-toX * IDLE.LEAN_ROLL - leanZ) * k;
    /* Positive rotation about x tips the roll's face DOWN, and toY grows
       downward too — so the two agree without a sign, and the roll lifts its
       face toward a pointer above it. */
    leanX += (toY * IDLE.LEAN_TILT - leanX) * k;
    // The wheel, on its own slower rate — see SPIN_EASE.
    spin += (toX * IDLE.LEAN_SPIN - spin) * (1 - Math.exp(-IDLE.SPIN_EASE * dt));

    // The float. A pure function of the ticker's clock, so it neither
    // accumulates drift nor depends on having been running.
    const floatY = IDLE.YAW * Math.sin((time * TAU) / IDLE.PERIOD_YAW);
    const floatX = IDLE.TILT_X * Math.sin((time * TAU) / IDLE.PERIOD_X + 1.7);
    const floatZ = IDLE.TILT_Z * Math.sin((time * TAU) / IDLE.PERIOD_Z + 0.6);

    tape.drift(floatX + leanX, floatY + leanY, floatZ + leanZ, spin);
  }

  return {
    frame,
    stop() {
      ac.abort();
      ro.disconnect();
      // Hand the roll back exactly as the finale left it.
      tape.drift(0, 0, 0, 0);
    },
  };
}
