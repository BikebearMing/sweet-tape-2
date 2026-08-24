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
const HEAD = "WHEN LIFE GETS MESSY,";
const TAIL = "SOMETHING HAS TO HOLD";

/* The hole the roll badge sits in — see placeBadges below.
 *
 * The badge is an <image>, and an image cannot ride a textPath: SVG text takes
 * characters, and there is no glyph for a roll of tape. So the TYPE opens a
 * space for it and the marquee flies one copy per repeat into that space, along
 * the same path at the same offset — which is what keeps the two registered
 * however far the band has drifted, and what makes the badge bend with the wave
 * rather than sit flat on top of it.
 *
 * Non-breaking, like the gap between repeats and for exactly that reason: a run
 * of ordinary spaces collapses to one and the hole would close.
 *
 * Six of them against a 150-unit badge. The slot is MEASURED at runtime rather
 * than assumed, so this is a design knob rather than a number that has to be
 * right — widen or narrow it a space at a time and the badge re-centres in
 * whatever it comes to, with nothing else needing to move. */
const SLOT = " ".repeat(6);

export const PHRASE = HEAD + SLOT + TAIL;
/** Where the hole starts and how long it is, in characters from the unit's
    start — the range the badge's own arc length is measured over. */
const SLOT_AT = HEAD.length;
const SLOT_LEN = SLOT.length;
/** The badge's diameter, in viewBox units. Against 190 of tape and 155 of
    type: a little taller than the caps, and still clear of the tape's edges
    where the wave runs steepest. */
export const BADGE_SIZE = 150;
/** The roll, face-on. The vector copy rather than slider/opp/roll.webp, which
    is a 108px button graphic — at band size that is an upscale, and this sits
    under a grain overlay where softness shows. */
export const BADGE_SRC = "/assets/slider/opp/card.svg";
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

  /* The band still reads as a band when still; only the MOTION is optional.
     Which is why this is no longer an early return: the badges have to be
     placed either way. Where the roll sits in the sentence is layout, not
     movement, and a band with a hole in it is not a band held still. */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const guide = root.querySelector<SVGPathElement>("defs path");
  const badges = Array.from(root.querySelectorAll<SVGImageElement>(".band-badge"));

  /* One roll per repeat of the sentence, flown along the same path the type
     rides. `at` is the arc length from a repeat's start to the middle of its
     hole, so each badge lands exactly on its own copy of the slot.
   *
   * getPointAtLength CLAMPS past either end of the path, so a badge whose
   * repeat has run off the end would pile up on the last point and sit there
   * in plain sight rather than leaving with its sentence — hence the explicit
   * hide. The type has no such problem: glyphs past the end are simply not
   * drawn, which is what REPEATS above is relying on. */
  function placeBadges(offset: number, step: number, at: number) {
    if (!guide) return;
    const total = guide.getTotalLength();
    badges.forEach((img, i) => {
      const s = offset + i * step + at;
      if (s < 0 || s > total) {
        img.style.visibility = "hidden";
        return;
      }
      const p = guide.getPointAtLength(s);
      /* The tangent, from a short chord either side. The badge is PRINTED on
         the tape, so it leans with the wave exactly as the letters around it
         do — an upright badge on a bent sentence reads as a sticker over the
         artwork rather than as part of it. */
      const a = guide.getPointAtLength(Math.max(s - 8, 0));
      const b = guide.getPointAtLength(Math.min(s + 8, total));
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      img.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${deg})`);
      img.style.visibility = "visible";
    });
  }

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

    /* The middle of the badge's hole, as an arc length from a repeat's start.
       Measured for exactly the reason `step` is: it is the loaded font that
       decides how wide six non-breaking spaces come out, and nothing else here
       is allowed to assume it. */
    const badgeAt =
      text.getSubStringLength(0, SLOT_AT) +
      text.getSubStringLength(SLOT_AT, SLOT_LEN) / 2;

    if (reduced) {
      /* The tween is normally what applies the anchor — fromTo renders its
         `from` immediately. With no tween the text is still sitting on the
         markup's approximate constant while the badges would be placed against
         the measured anchor, so put the text there by hand first. The band
         gains a correctly anchored sentence out of it, which it did not have
         under this setting before. */
      tp.setAttribute("startOffset", String(anchor));
      placeBadges(anchor, step, badgeAt);
      return;
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
        /* The badges ride the tween itself rather than the ticker, so they are
           read from the same startOffset the frame was drawn with. On the
           ticker they would be a frame behind whatever the attr tween had just
           written — a small constant slip between the roll and the words it
           sits between, which is the one place a slip would show. */
        onUpdate() {
          placeBadges(tp.startOffset.baseVal.value, step, badgeAt);
        },
      }
    );
    // onUpdate does not fire for fromTo's immediate render of its `from`, so
    // the first frame is placed by hand.
    placeBadges(anchor, step, badgeAt);

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
