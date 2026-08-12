/* Sweet Tape — sitting the slider's drawing where the window can see it.
 *
 * THE PROBLEM THIS SOLVES. Everything in the middle of this section — the
 * subhead chip, THE, the roll, CREATIVE — is one rigid drawing measured in vw,
 * hung from the section's top edge. That is deliberate and it is documented at
 * length in global.css (see the note by .bottom-title): the pieces have to hold
 * their positions against EACH OTHER, and the moment one of them is measured in
 * a viewport HEIGHT it slides past the rest as the window changes shape.
 *
 * What a vw drawing cannot do is sit correctly in a window whose height is not
 * a fixed fraction of its width. At 1920 the drawing is a third bigger than it
 * is at 1440 while a 1920 monitor is typically only a fifth taller, so the whole
 * thing rides down the screen. Measured, before this file existed:
 *
 *     1440 x  900   key visual 57.6% down the window   <- the designed frame
 *     1920 x 1080   ...64%
 *     1920 x  969   ...71.3%, and the word mark ran off the bottom
 *
 * So the drawing is MOVED UP, by one length written as --slide-lift on the
 * section. It is never resized: the roll is the product shot and it is the size
 * it is meant to be at a given page width, which is the whole reason this is a
 * translation and not a scale.
 *
 * WHAT STOPS IT. The wave band's tape hangs down into this section's top, and
 * above the subhead chip there is 4.7vw of clear stage before it — measured, at
 * both 1440 and 1920, since the band is drawn in vw like everything else. That
 * is the ceiling: the drawing may rise into that gap and no further, because the
 * chip disappearing under the band is a worse fault than the roll sitting low.
 * CLEAR keeps a band of it unspent so the two never actually touch.
 *
 * The cap binds on tall-and-narrow windows, and there it is a partial fix by
 * design — the honest ceiling on what moving a rigid drawing can do.
 */

/* All three read off the design at 1440 x 900, which is the frame the
   composition is right on and therefore the frame where the lift is 0. In
   hundredths, so they multiply against a viewport in pixels. */
const FRAME = {
  /* The key visual's centre in the drawing: 8vw of wave-band clearance plus the
     28vw .key-visual is placed at. This is the piece the eye judges the section
     by, so it is the piece the lift is aimed at. */
  ROLL: 0.36,
  /* And where that centre belongs in the window — 518px down a 900px one. THE
     ONE KNOB: lower it to sit the roll higher in the window. */
  SEAT: 0.576,
  /* The ceiling, as a fraction of the width. The measured clear stage above the
     chip is 4.7vw; this is that less about a vw of air, so the chip keeps its
     distance from the band's lowest point at every size. Re-measure if the wave
     band's overlap or the 8vw content shift ever changes. */
  CLEAR: 0.036,
};

/* Below this the write is churn — a shift nobody can see, and a repaint of a
   WebGL canvas and two photographs to deliver it. */
const STEP = 0.5;

export function initSliderFit(root: HTMLElement): () => void {
  let at = NaN;

  function fit() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!w || !h) return;

    /* How far the roll has sunk below its seat, capped at the room the band
       leaves. Never negative: on a window TALLER than the drawing needs, the
       roll is already above its seat and pushing it down would be inventing a
       problem to solve. */
    const sunk = FRAME.ROLL * w - FRAME.SEAT * h;
    const lift = Math.min(Math.max(0, sunk), FRAME.CLEAR * w);

    if (Math.abs(lift - at) < STEP) return;
    at = lift;
    root.style.setProperty("--slide-lift", `${-Math.round(lift * 10) / 10}px`);
  }

  /* On the element rather than on window resize alone: a phone rotating, a
     devtools pane opening and a zoom change all move these numbers, and only
     some of them fire resize. The listener stays as the cheap path. */
  const ro = new ResizeObserver(fit);
  ro.observe(document.documentElement);
  const ac = new AbortController();
  window.addEventListener("resize", fit, { signal: ac.signal, passive: true });

  fit();

  return () => {
    ac.abort();
    ro.disconnect();
    /* Back to the stylesheet's registered initial value of 0, so a StrictMode
       remount starts from the designed drawing rather than from the last thing
       this wrote. */
    root.style.removeProperty("--slide-lift");
  };
}
