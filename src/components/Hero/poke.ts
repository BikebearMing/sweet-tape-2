/* Sweet Tape — the headline, poked.
 *
 * Hover STICK BY YOU and the letters near the cursor hop up, puff and lean away
 * from it; leave and they spring back, middle-out. Ported from another site's
 * pointer poke, minus its SplitText — the letters are already split on the
 * server (components/letters), and the arc and the /lab/headings nudges live on
 * .clip, so moving .char touches neither.
 *
 * THE NUMBERS ARE NOT THE ORIGINAL'S. They were sized for ordinary headings;
 * this one is 20vw, where 1em is ~290px at 1440 and the original's 1.9em reach
 * swept a whole line at once. POKE is in em of the headline, tune it live.
 *
 * Idle until the entrance has finished: a letter still rising is skipped by
 * the isTweening check rather than fought over.
 *
 * The masks come off (data-poke → overflow: visible in global.css) while the
 * cursor is on it, since a hop is taller than the mask's headroom. Nothing is
 * behind them by then — the entrance is done.
 */
import gsap from "gsap";

export const POKE = {
  REACH: 0.8, // em — how far from the cursor a letter still feels it
  HOP: 0.08, // em — how high the nearest letter jumps
  PUFF: 0.08, // + scale at the cursor
  TILT: 11, // deg — lean away from the cursor
  FOLLOW: 0.45, // s — how fast the bulge chases the cursor
  SETTLE: 0.9, // s — the spring back on leave
};

const smooth = (k: number) => k * k * (3 - 2 * k);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function initPoke(root: HTMLElement): () => void {
  const el = root.querySelector<HTMLElement>(".title .h1");
  if (
    !el ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return () => {};

  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
  let spots: { x: number; y: number }[] = [];
  let em = 16;
  let at: { x: number; y: number } | null = null;
  let frame = 0;

  /* Measured off .clip, which the poke never moves, so it is right even while
     letters are still springing back. Relative to the heading so a scroll under
     a resting cursor does not stale it; re-taken on every enter, which covers
     a resize without a listener. */
  const measure = () => {
    const box = el.getBoundingClientRect();
    em = parseFloat(getComputedStyle(el).fontSize) || 16;
    spots = chars.map((c) => {
      const b = c.parentElement!.getBoundingClientRect();
      return { x: b.left - box.left + b.width / 2, y: b.top - box.top + b.height / 2 };
    });
  };

  const poke = () => {
    frame = 0;
    if (!at) return;
    if (!el.hasAttribute("data-poke")) {
      if (chars.some((c) => gsap.isTweening(c))) return; // still arriving
      measure();
      el.dataset.poke = "";
    }
    const box = el.getBoundingClientRect();
    const px = at.x - box.left;
    const py = at.y - box.top;
    const reach = em * POKE.REACH;
    const pull = (i: number) =>
      smooth(clamp(1 - Math.hypot(px - spots[i].x, py - spots[i].y) / reach, 0, 1));
    gsap.to(chars, {
      y: (i: number) => -POKE.HOP * em * pull(i),
      rotate: (i: number) =>
        -POKE.TILT * pull(i) * clamp((px - spots[i].x) / (reach * 0.5), -1, 1),
      scale: (i: number) => 1 + POKE.PUFF * pull(i),
      transformOrigin: "50% 100%",
      duration: POKE.FOLLOW,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const onMove = (e: PointerEvent) => {
    at = { x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(poke);
  };

  const onLeave = () => {
    at = null;
    if (!el.hasAttribute("data-poke")) return;
    gsap.to(chars, {
      y: 0,
      rotate: 0,
      scale: 1,
      duration: POKE.SETTLE,
      ease: "elastic.out(1, 0.45)",
      stagger: { each: 0.014, from: "center" },
      overwrite: "auto",
      // Masks back on only once every letter is home.
      onComplete: () => delete el.dataset.poke,
    });
  };

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);

  if (process.env.NODE_ENV !== "production") Object.assign(window, { poke: { POKE } });

  return () => {
    if (frame) cancelAnimationFrame(frame);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    delete el.dataset.poke;
  };
}
