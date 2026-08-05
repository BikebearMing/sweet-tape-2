/* The wavy tape band's marquee.
 *
 * The text rides the SVG path via textPath, so the browser does the bending —
 * all this module animates is ONE number, startOffset. The loop trick: the
 * string is the same phrase repeated, so sliding the offset back by exactly
 * one phrase's advance width puts every glyph where its neighbour was, and the
 * repeat's jump is invisible. That is why the phrase length is MEASURED
 * (getSubStringLength) rather than guessed: the loop is seamless only if the
 * shift matches the font's real metrics, which are not known until the
 * typekit CSS has resolved — hence the wait on document.fonts.ready.
 *
 * Scroll gives the band its life: the tween's timeScale chases the scroll
 * velocity, so the tape drifts on its own, hurries when the page is thrown,
 * and runs backwards when the page is pulled back up. Same pattern as the
 * hero's engine — read window.scrollY on the GSAP ticker (Lenis writes it
 * there), never bind a scroll listener.
 */
import gsap from "gsap";

/* One repeat of the marquee, shared with the markup so the measured character
   range and the rendered text can never disagree. The gap is non-breaking
   spaces: SVG collapses runs of ordinary spaces, which would make the measured
   phrase longer than the drawn one and the loop would tick. */
export const PHRASE = "WHEN LIFE GETS MESSY, SOMETHING HAS TO HOLD";
export const GAP = "   ";
export const UNIT = PHRASE + GAP;
/* Enough copies to cover the visible stretch of path (~5000 units) at every
   offset in the loop; overflow past the path's end is simply not drawn. */
export const REPEATS = 6;

/* The feel. Not a marquee: at rest the band only drifts — IDLE throttle
   against the SPEED reference, ~60 viewBox units/s, a screen-width in under
   half a minute. Scroll is the accelerator, and the smoothing is asymmetric
   on purpose: ATTACK picks the shove up quickly enough to feel connected to
   the wheel, RELEASE bleeds it off over a couple of seconds, so the band
   coasts down after the page stops rather than snapping back to its drift.

   Live-tweak in dev: band.CONFIG.IDLE = 0.4; (takes effect next frame) */
export const CONFIG = {
  SPEED: 120, // what timeScale 1 means, in viewBox units per second
  IDLE: 0.9, // resting throttle — the slow drift
  GAIN: 0.5, // how hard scroll velocity (px/frame) leans on the throttle
  MAX: 5, // full-throttle cap, both directions
  MIN: -4, // negative: pulling the page back up runs the band backwards
  ATTACK: 0.12, // per-frame lerp when the target is pulling AWAY from idle
  RELEASE: 0.03, // per-frame lerp on the way back down — the coast
  /* How far ahead of the viewport the band wakes, in px. The approach scroll
     then spends itself on the throttle before the band is seen, so it enters
     already moving — at 0 the first visible frames are the anchor pose
     accelerating from rest. Read once, when the observer is built: changing
     it from the console does nothing (unlike the knobs above). */
  LEAD: 600,
};

export function initBand(root: HTMLElement): () => void {
  const text = root.querySelector<SVGTextElement>("text");
  const tp = root.querySelector<SVGTextPathElement>("textPath");
  if (!text || !tp) return () => {};

  // The band still reads as a band when still; only the motion is optional.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return () => {};

  let dead = false;
  let tween: gsap.core.Tween | undefined;
  let tick: (() => void) | undefined;
  let io: IntersectionObserver | undefined;
  let inView = true;

  document.fonts.ready.then(() => {
    if (dead) return;

    /* The advance width of one repeat, in the font that actually loaded.
       Path-independent: it sums character advances, the curve never stretches
       them. */
    const step = text.getSubStringLength(0, UNIT.length);

    /* Where the sentence STARTS: its first word at the section's left edge.
       The path begins 3200 units off-screen left (so glyphs enter the frame
       already bent), which means the text must be pushed the arc length of
       that lead-in along the path. Bisection, because startOffset speaks arc
       length and the left edge is an x; the path's x is monotonic, so the
       split is safe. Measured rather than baked so the curve can change
       without this going stale. */
    /* Nudged INSET units in from the edge itself, so the opening word stands
       clear rather than kissing the crop. */
    const INSET = 40;
    const guide = root.querySelector<SVGPathElement>("defs path");
    let anchor = INSET;
    if (guide) {
      let lo = 0;
      let hi = guide.getTotalLength();
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (guide.getPointAtLength(mid).x < 0) lo = mid;
        else hi = mid;
      }
      anchor = (lo + hi) / 2 + INSET;
    }

    /* Paused until the section is first seen: the whole point of the anchor
       is that the sentence greets you from its first word, and an unpaused
       drift would have carried it off by the time you scrolled down here.
       fromTo's immediateRender still applies the anchor now, so the paused
       band already sits correctly. The loop stays seamless from any anchor —
       the wrap shifts by exactly one repeat, and every repeat is the same. */
    tween = gsap.fromTo(
      tp,
      { attr: { startOffset: anchor } },
      {
        attr: { startOffset: anchor - step },
        duration: step / CONFIG.SPEED,
        ease: "none",
        repeat: -1,
        paused: true,
      }
    );

    /* Velocity from scrollY deltas — already eased, because Lenis writes
       scrollY and Lenis glides; the ATTACK/RELEASE lerp on top turns that
       into a shove and a coast. Skipped entirely off-screen — the tween is
       paused there and the lerp would only wind up a stale speed to unleash
       on re-entry. */
    let lastY = window.scrollY;
    let speed = CONFIG.IDLE;
    tween.timeScale(speed);
    const clamp = gsap.utils.clamp(CONFIG.MIN, CONFIG.MAX);
    tick = () => {
      const y = window.scrollY;
      const v = y - lastY;
      lastY = y;
      if (!inView) return;
      const target = clamp(CONFIG.IDLE + v * CONFIG.GAIN);
      // Away from idle is the scroll shoving; toward it is the coast home.
      const chase =
        Math.abs(target - CONFIG.IDLE) > Math.abs(speed - CONFIG.IDLE)
          ? CONFIG.ATTACK
          : CONFIG.RELEASE;
      speed += (target - speed) * chase;
      tween!.timeScale(speed);
    };
    gsap.ticker.add(tick);

    /* A mid-page section spends most of the scroll out of sight; attribute
       tweens repaint SVG text every frame, so pause the whole thing there.
       rootMargin inflates the "in sight" box by LEAD on both sides, which is
       what starts the band before it shows and lets it run a beat after. */
    io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        tween?.paused(!inView);
      },
      { rootMargin: `${CONFIG.LEAD}px 0px` }
    );
    io.observe(root);

    if (process.env.NODE_ENV !== "production") {
      // Console handle for tuning, same convention as window.hero. Everything
      // but SPEED reads live (SPEED is baked into the tween's duration).
      Object.assign(window, { band: { CONFIG } });
    }
  });

  return () => {
    dead = true;
    if (tick) gsap.ticker.remove(tick);
    tween?.kill();
    io?.disconnect();
  };
}
