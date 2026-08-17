/* Sweet Tape — body copy arriving a line at a time.
 *
 * The site's other text entrance, and deliberately not the headlines'. Those
 * split to letters and go up in a shuffled scatter, which is right for six
 * enormous characters and wrong for a sentence: run it over body copy and the
 * reader watches forty small boxes twitch instead of reading the line. So a
 * paragraph rises a LINE at a time out of a floor that is not drawn — every
 * word in a line moves together, the lines follow one another down the block,
 * and nothing about it asks to be looked at.
 *
 * THE LINES ARE MEASURED, NOT MARKED UP, and that is the whole of the design.
 * Where a line breaks is decided by the font, the measure and the window; a
 * <span> per line in the markup would be a guess that goes stale at the first
 * resize and silently masks the wrong words. body.tsx splits to WORDS instead —
 * the largest unit that survives a reflow — and this file groups them back into
 * lines by asking where they actually landed.
 *
 * MEASURED AT PLAY, NOT AT BUILD. The grouping is done inside onEnter rather
 * than on mount, so what is grouped is the layout at the moment the copy is
 * revealed: a window resized between hydration and the reader arriving, a font
 * that swapped in late, a section whose measure moved — all of them are already
 * accounted for, and none of them needs a listener. Once played there is
 * nothing left to keep in step, which is why there is no ResizeObserver here.
 *
 * Once and forward only, like the footer's: copy that has written itself must
 * not unwrite when the reader scrolls back up.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { whenRevealed } from "@/components/Preloader/gate";

export const BODY_REVEAL = {
  /* Where a line waits, as a percentage of its own height. global.css parks the
     words at the same figure and the two have to agree — change both.

     Only just clear, where the headlines' letters are parked at 130. A .body-clip
     is the word's whole line box, half-leading included, so one box height is
     already past the mask's floor; the extra 10 is for a font whose descenders
     run deeper than the leading allows for, and it is all behind the mask. */
  HIDDEN: 110,

  /* Slower than a letter's 0.6. A letter is one of a crowd and reads as texture;
     a line is a whole phrase moving as one object, and at the letters' pace it
     snaps rather than rises. */
  DURATION: 0.72,

  /* Between LINES, not between words — the words of a line share one tween and
     no stagger at all, which is what makes it read as a line rather than as a
     wipe across one. Roughly an eighth of the rise, so the next line is away
     before the one above it has settled and the block arrives as one move. */
  STAGGER: 0.09,

  /* The headlines' curve. Same voice, longer sentence. */
  EASE: "power3.out",

  /* The block's top a little under the fold. Later than the footer's headline
   * (top 80%), because this is small type: a headline can afford to arrive
   * while it is still being approached, where copy that writes itself that far
   * down the window has finished before the reader's eye reaches it.
   *
   * CLAMPED, AND THAT IS NOT A REFINEMENT — without it the last block on the
   * page never arrives at all.
   *
   * "top 88%" is a position in the DOCUMENT: the scroll offset at which this
   * block's top would sit 88% of the way down the window. For copy in the
   * middle of a page that offset is reachable and the trigger fires on the way
   * past. For copy near the very bottom it is not. The footer's legal line sits
   * 1.6vw above the end of the document, so even at maximum scroll its top is
   * about 94% down the window — it can never reach 88%, because there is
   * nothing below it left to scroll. The trigger's start lands beyond the end
   * of the scrollable range, never fires, and the words stay parked under their
   * masks by the gsap.set below. Permanently invisible, and silently so: no
   * error, no warning, just a paragraph that is not there.
   *
   * clamp() pulls a start that falls outside the scrollable range back to its
   * edge, which is exactly this case and exactly what it is for. For every
   * block that could already reach its start it changes nothing at all. */
  START: "clamp(top 88%)",
};

/**
 * Words back into lines, by where they landed.
 *
 * The .body-clip is what is measured and never the .body-rise inside it: the
 * rise is the thing being translated, and asking a moving box where it is gets
 * an answer that includes the very offset being solved for. The clip holds the
 * word's place in the line and does not move at all.
 *
 * offsetTop rather than a rect, for the same reason — and grouped with a
 * TOLERANCE rather than on equality. Equality is nearly always right, since
 * every clip in a line is aligned to the same line-box top, but "nearly always"
 * is not a thing to build a mask out of: a word carrying a different inline
 * size, or a browser reporting a subpixel top, would become a line of its own
 * and go up on a beat of its own. Half a line box is far too small to merge two
 * real lines and far too large for any of that to matter.
 *
 * EXPORTED, because the entrance is no longer the only thing that moves body
 * copy a line at a time. The product page dips its small print out of sight to
 * change colour under a hover (PickYourPlayer/recolour.ts) and needs the same
 * grouping — and "which words are on one line" is a measurement, not a policy.
 * Two copies of it would be two answers the first time a measure changed.
 *
 * ALWAYS CALLED AT THE MOMENT OF USE, never cached. What it returns describes
 * the layout as it stands: a resized window, a late-swapping font or a section
 * whose measure moved are all already accounted for, and none of them needs a
 * listener.
 *
 * @param rises every `.body-rise` in one block, in document order
 * @returns those same elements, grouped by the line they landed on, top down
 */
export function bodyLines(rises: HTMLElement[]): HTMLElement[][] {
  const boxOf = (rise: HTMLElement) => rise.parentElement ?? rise;
  const measured = rises
    .map((rise) => ({ rise, top: boxOf(rise).offsetTop }))
    .sort((a, b) => a.top - b.top);

  const tolerance = Math.max(4, (boxOf(rises[0]).offsetHeight || 16) / 2);

  const lines: HTMLElement[][] = [];
  let current: HTMLElement[] = [];
  let base = -Infinity;

  for (const { rise, top } of measured) {
    if (top - base > tolerance) {
      current = [];
      lines.push(current);
      base = top;
    }
    current.push(rise);
  }

  return lines;
}

/**
 * Builds the line reveal for every block of body copy inside `root`.
 *
 * A block is anything carrying `.body-copy` whose text was emitted by
 * bodyCopy() — the class is the opt-in, so a section gains the entrance by
 * marking its copy up for it and nothing here has to know what a section is.
 *
 * @param root the section element the copy lives in
 * @returns the teardown, which leaves every line readable
 */
export function initBodyReveal(root: HTMLElement): () => void {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>(".body-copy"));
  if (!blocks.length) return () => {};

  /* Hand the words over from the stylesheet, exactly as the headlines' reveals
   * do. global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say: GSAP
   * reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent set below, leaving every line a full height low.
   *
   * On the block itself rather than on the section, so a block can be revealed
   * without the section having an opinion, and so this cannot collide with the
   * data-reveal the letter reveals set on their own roots.
   *
   * Nothing paints in between: the attribute and the set below happen in the
   * same task. */
  for (const block of blocks) block.dataset.reveal = "live";

  /* Copy sliding in from under the floor is exactly what the setting is asking
     about. The attribute alone has already put it where it belongs — and with
     nothing left to run, the words are free from this moment, which is what the
     second attribute says. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const block of blocks) block.dataset.arrived = "";
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by
     client components, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so the second mount
     costs nothing. */
  gsap.registerPlugin(ScrollTrigger);

  const all: HTMLElement[] = [];
  const tweens: gsap.core.Tween[] = [];
  const triggers: ScrollTrigger[] = [];

  /* THE TRIGGERS ARE NOT BUILT YET, and everything else here is.
   *
   * A ScrollTrigger evaluates itself the moment it is created, so one whose
   * start is already behind the current scroll fires on the spot — which for
   * copy in the first screenful of a page means the whole entrance is spent
   * under the cover, and the reader is handed a paragraph that had already
   * arrived. That is not hypothetical: the product page's small print sits
   * within a viewport of the top of the document, and this same file also
   * serves the closing key visual and the footer, which do not.
   *
   * So the WAITING is gated and the ARRIVAL is not. The words are parked below
   * — by the stylesheet until the attribute above, by the gsap.set after that —
   * from the first frame either way; all this defers is the question of whether
   * they have been scrolled to, which is a question with no meaning while the
   * page is behind a sheet of paper. Blocks further down the page are unaffected
   * in every respect: their start is still ahead of the scroll when the cover
   * lifts, so a trigger created then behaves exactly as one created at mount.
   *
   * PICK_REVEAL makes the same call for the headline above these blocks and its
   * note is the longer version of this one. Fires immediately on any page with
   * no cover over it — which now means only a page reached by the back button,
   * since the transition holds the gate on every navigation as well. */
  const pending: (() => void)[] = [];

  for (const block of blocks) {
    const rises = Array.from(block.querySelectorAll<HTMLElement>(".body-rise"));
    if (!rises.length) continue;
    all.push(...rises);

    /* Parked here as well as in the stylesheet, because the attribute above has
       just released the CSS park and something has to hold the words down in
       the frame between that and their own tween. */
    gsap.set(rises, { yPercent: BODY_REVEAL.HIDDEN });

    pending.push(() =>
      triggers.push(
        ScrollTrigger.create({
          trigger: block,
          start: BODY_REVEAL.START,
          once: true,
          onEnter: () => {
            const lines = bodyLines(rises);
            lines.forEach((line, i) => {
              /* One tween for the whole line and no stagger inside it. A
                 stagger here would be a wipe left to right across the line,
                 which is a different effect and a worse one — the eye follows
                 the moving edge instead of reading the words. */
              tweens.push(
                gsap.to(line, {
                  yPercent: 0,
                  duration: BODY_REVEAL.DURATION,
                  ease: BODY_REVEAL.EASE,
                  delay: i * BODY_REVEAL.STAGGER,
                  /* THE HAND-OFF, on the last line only — the block is arrived
                   * when its bottom line has landed.
                   *
                   * It is not read by the stylesheet and never has been. It is
                   * for whatever ELSE wants to drive these words afterwards,
                   * and on the product page something does: hovering a roll
                   * dips the small print out of sight to change its colour
                   * (PickYourPlayer/recolour.ts), and that dip drives the very
                   * same elements on the very same property this tween is
                   * using. Two tweens on one transform is a word jittering
                   * between two ideas of where it should be, so the dip waits
                   * for this.
                   *
                   * Nothing that does not look for it is affected: the footer's
                   * legal line and the closing key visual's sub-line set it and
                   * no one reads it. */
                  onComplete:
                    i === lines.length - 1
                      ? () => {
                          block.dataset.arrived = "";
                        }
                      : undefined,
                }),
              );
            });
          },
        }),
      ),
    );
  }

  /* Now that every block has queued its trigger — see the note above pending.
     The subscription is one-shot, so the whole of this runs on the beat the
     cover hands the page over and never again. */
  const unsubscribe = whenRevealed(() => {
    for (const build of pending) build();
  });

  return () => {
    unsubscribe();
    triggers.forEach((t) => t.kill());
    tweens.forEach((t) => t.kill());
    /* READABLE, not parked. A teardown mid-reveal — a StrictMode remount, a
       route change — must never leave a paragraph hidden under its own mask
       with nothing left running to lift it. clearProps hands the words back to
       the stylesheet, and data-reveal stays set, so the stylesheet's home for
       them is where they belong rather than where they started. */
    if (all.length) gsap.set(all, { clearProps: "transform" });
    /* And nothing is holding the words any more, so whatever mounts next may
       have them from its first frame. */
    for (const block of blocks) block.dataset.arrived = "";
  };
}
