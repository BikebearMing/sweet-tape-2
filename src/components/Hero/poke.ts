/* Sweet Tape — the headline, poked.
 *
 * Hover STICK BY YOU and the letters near the cursor hop up, puff and lean away
 * from it; leave and they spring back, middle-out. Ported from another site's
 * pointer poke, minus its SplitText — the letters are already split on the
 * server (components/letters), and the arc and the /lab/headings nudges live on
 * .clip, so moving .char touches neither.
 *
 * IT IS THE SITE'S HEADLINE HOVER NOW — the hero's, LET'S MAKE IT STICK's, the
 * footer's sign-off and each of WHY WE EXIST's three phrases (final round,
 * 2026-09-29) — which is what the selector argument is. Same numbers on all of
 * them on purpose: POKE is in em of whichever headline, so a smaller setting
 * gets the proportionally smaller poke for free.
 *
 * THE NUMBERS ARE NOT THE ORIGINAL'S. They were sized for ordinary headings;
 * this one is 20vw, where 1em is ~290px at 1440 and the original's 1.9em reach
 * swept a whole line at once. POKE is in em of the headline, tune it live.
 *
 * A LETTER JOINS THE POKE THE MOMENT IT IS HOME, one at a time, not when the
 * whole headline is. The first three headlines arrive in one gesture and never
 * feel the difference; the giant phrases are the reason — each is a window and
 * a half wide and writes itself across the camera's own sweep, so "wait for
 * all of it" would keep the poke dead for exactly the dwell at a stop where
 * someone tries it. A letter still rising, or still parked under its mask, is
 * simply not in the poke yet.
 *
 * The masks come off PER LETTER for the same reason (inline overflow on the
 * clip, while the cursor is on the headline) — a hop is taller than the mask's
 * headroom, but lifting every mask in the headline would uncover parked
 * letters standing 130% below their line. Nothing is behind a lifted mask:
 * only a letter that has finished arriving gets its clip opened.
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

export function initPoke(root: HTMLElement, selector = ".title .h1"): () => void {
  const el = root.querySelector<HTMLElement>(selector);
  /* Two ways in: the cursor's, and the finger's. A tablet has no hover to
     sweep the line with, so there a TAP is the poke — same bulge, same spring
     back, driven from one pointerdown instead of a stream of moves. Phones
     (under 768) keep their stillness: the headline there is most of the
     screen and a poke on the way into every scroll would be noise. */
  const hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const tappable = !hoverable && window.matchMedia("(min-width: 744px)").matches;
  if (
    !el ||
    (!hoverable && !tappable) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return () => {};

  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
  const spotOf = new Map(chars.map((c, i) => [c, i]));
  let spots: { x: number; y: number }[] = [];
  let em = 16;
  let at: { x: number; y: number } | null = null;
  let frame = 0;

  /* The letters currently IN the poke — home, and with their clip opened. A
     set rather than a re-check because a letter being poked is tweening again
     by the very next frame, and asking "are you still?" would evict it. */
  const lifted = new Set<HTMLElement>();
  const wake = () => {
    for (const c of chars) {
      if (lifted.has(c)) continue;
      if (gsap.isTweening(c) || (gsap.getProperty(c, "yPercent") as number) !== 0)
        continue;
      lifted.add(c);
      c.parentElement!.style.overflow = "visible";
    }
    return lifted.size;
  };

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
    /* Nobody home yet — the stick headline waits under its masks for a scroll
       trigger (a paused fromTo holds yPercent at 130, and nothing is tweening
       while it waits), and a giant phrase's far end is still parked while its
       near end is being hovered. wake() takes in whoever has arrived; a poke
       with an empty roll is a hover over letters that have not entered. */
    if (!wake()) return;
    if (!el.hasAttribute("data-poke")) {
      measure();
      el.dataset.poke = "";
    }
    const box = el.getBoundingClientRect();
    const px = at.x - box.left;
    const py = at.y - box.top;
    const reach = em * POKE.REACH;
    const pull = (i: number) =>
      smooth(clamp(1 - Math.hypot(px - spots[i].x, py - spots[i].y) / reach, 0, 1));
    /* Only the lifted — a parked letter given a lean would keep it through its
       own entrance and arrive crooked. The index functions take the TARGET,
       not GSAP's index: the filtered array's positions no longer line up with
       spots, which was measured over everyone. */
    const live = chars.filter((c) => lifted.has(c));
    gsap.to(live, {
      y: (_: number, t: HTMLElement) => -POKE.HOP * em * pull(spotOf.get(t)!),
      rotate: (_: number, t: HTMLElement) => {
        const i = spotOf.get(t)!;
        return -POKE.TILT * pull(i) * clamp((px - spots[i].x) / (reach * 0.5), -1, 1);
      },
      scale: (_: number, t: HTMLElement) => 1 + POKE.PUFF * pull(spotOf.get(t)!),
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
    gsap.to(chars.filter((c) => lifted.has(c)), {
      y: 0,
      rotate: 0,
      scale: 1,
      duration: POKE.SETTLE,
      ease: "elastic.out(1, 0.45)",
      stagger: { each: 0.014, from: "center" },
      overwrite: "auto",
      // Masks back on only once every letter is home.
      onComplete: () => {
        delete el.dataset.poke;
        lifted.forEach((c) => (c.parentElement!.style.overflow = ""));
        lifted.clear();
      },
    });
  };

  /* The tap: poke where the finger lands, then spring back on the same
     middle-out settle the cursor's leave uses. No preventDefault — a poke on
     the way into a scroll costs nothing and stops nothing. */
  let settle: ReturnType<typeof setTimeout> | undefined;
  const onTap = (e: PointerEvent) => {
    at = { x: e.clientX, y: e.clientY };
    poke();
    clearTimeout(settle);
    settle = setTimeout(onLeave, 350);
  };

  if (hoverable) {
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
  } else {
    el.addEventListener("pointerdown", onTap);
  }

  if (process.env.NODE_ENV !== "production") Object.assign(window, { poke: { POKE } });

  return () => {
    if (frame) cancelAnimationFrame(frame);
    clearTimeout(settle);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    el.removeEventListener("pointerdown", onTap);
    delete el.dataset.poke;
    lifted.forEach((c) => (c.parentElement!.style.overflow = ""));
    lifted.clear();
  };
}
