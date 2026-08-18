/* Sweet Tape — the word marks' dip, and the half of it that is a rise.
 *
 * TWO SECTIONS SET THE SAME PAIR OF WORDS NOW — the slider's stage, where THE
 * and the tape's own word drop out of sight so the mark can be changed
 * underneath, and a product's inner page, where there is nothing to change and
 * the word simply arrives. The second is the FIRST half of nothing and the
 * second half of the slider's move, verbatim: same travel, same duration, same
 * ease, same stagger.
 *
 * That "verbatim" is the whole reason this file exists rather than a second set
 * of numbers in the new section. The rise is not a value that happens to be
 * shared; it is one gesture the site makes, and a page whose letters come up at
 * 0.38 beside a page whose letters come up at 0.42 is two sites. Retune it here
 * and both move together.
 *
 * WHAT IS *NOT* HERE is the drop. Falling is the slider's alone — it exists to
 * hide a swap, and there is no swap on a page about one tape — and the tween
 * that does it is threaded through the mid-air repark, the per-letter recolour
 * and the atBottom hand-off, none of which mean anything to a section that only
 * ever comes up. addDip stays in TapeSlider/engine.ts with the machinery it
 * belongs to, and reads its two shared numbers off WORD below so the two halves
 * of one move cannot drift apart.
 *
 * The four apply/read pairs are here for the same reason: they are how a letter
 * is moved, they differ between the two marks and not between the two sections,
 * and both callers need all four.
 */
import gsap from "gsap";

export const WORD = {
  /* Coming home. No overshoot in the ease, deliberately: the letters are
     clipped by their own boxes, so anything that carries a letter past its rest
     position shaves the top of it off at the peak of the bounce. */
  UP: 0.42,
  EASE_UP: "power3.out",

  /* Between T, H and E. */
  STAGGER: 0.08,

  /* Tighter than THE's, because the bottom mark is up to eight letters and
     eight at 0.08 would be 0.56s of stagger before the duration is counted.
     On the slider these two are also the constraint on the opening — the word's
     last letter has to be gone before the colour sheet reaches it. */
  BOTTOM_STAGGER: 0.05,
};

/* How far a letter has to travel to be clear of its own box — a shade past, so
   no hairline is left showing at the edge.

   offsetHeight, not the bounding rect: the bottom mark's letters sit in
   wrappers tilted up to 8deg on the arc, and a tilted box's bounding rect is
   taller than the letter inside it — enough to overshoot the clip and leave the
   letter parked below where it needs to be.

   Used to park as well as to travel, which is what keeps the two in agreement:
   the resting-out position is by definition the point the drop drops to. */
export const dipTo = (el: HTMLElement) =>
  (el.offsetHeight || el.getBoundingClientRect().height || 1) + 2;

/* THE moves its own MASK. The image's box is the only place it is allowed to
   paint, so walking the stencil out of the bottom clips the letter away with no
   wrapper needed — which is why these three letters are bare <img> and the
   bottom mark's are not. */
export function maskDip(el: HTMLElement, y: number) {
  const v = `0px ${y}px`;
  el.style.setProperty("mask-position", v);
  el.style.setProperty("-webkit-mask-position", v);
}

export function maskAt(el: HTMLElement) {
  const m = /([-\d.]+)px\s+([-\d.]+)px/.exec(
    el.style.getPropertyValue("mask-position")
  );
  return m ? parseFloat(m[2]) : 0;
}

/* The tape's word moves the IMAGE, inside .glyph's overflow box. It needs no
   mask of its own, which is what lets the artwork underneath be replaced
   mid-dip without the thing that is hiding it going with it. */
export function shiftDip(el: HTMLElement, y: number) {
  gsap.set(el, { y });
}

export function shiftAt(el: HTMLElement) {
  return (gsap.getProperty(el, "y") as number) || 0;
}

/* The letters coming up, one after another.
 *
 * Tweened through a proxy object rather than by handing the elements to GSAP:
 * `apply` is a mask-position on one mark and a transform on the other, and only
 * one of those is a property GSAP can be pointed at. One code path for both is
 * worth the object.
 *
 * `read` rather than a literal start, so a rise that begins while a previous
 * one is still in flight picks the letter up where it actually is instead of
 * snapping it back down for a frame first.
 */
export function addRise(
  tl: gsap.core.Timeline,
  els: HTMLElement[],
  at: number,
  stagger: number,
  apply: (el: HTMLElement, y: number) => void,
  read: (el: HTMLElement) => number
) {
  const sub = gsap.timeline();

  els.forEach((el, i) => {
    const st = { y: read(el) };
    sub.to(
      st,
      {
        y: 0,
        duration: WORD.UP,
        ease: WORD.EASE_UP,
        onUpdate: () => apply(el, st.y),
      },
      i * stagger
    );
  });

  tl.add(sub, at);
  return sub;
}
