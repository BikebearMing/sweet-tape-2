/* Sweet Tape — the menu coming down.
 *
 * TWO paused timelines, not one, and the split is the whole behaviour:
 *
 *   The drop — the panel's height, 0 to its own measured height, on an ease
 *   that goes past and comes back. Everything else in the menu is inside that
 *   box, so the bounce carries the contents and the tab with it for free: the
 *   tab is simply the next thing in flow.
 *
 *   The contents — row by row, each row rule-then-word-then-mark, starting
 *   behind the drop so the paper is visibly empty before anything lands on it.
 *
 * Only the drop ever goes back, and it does not simply reverse — the close
 * scrubs its playhead on a slower ease of its own, driven from the component.
 * See MENU_DROP.CLOSE_EASE for why the same curve run backwards will not do.
 *
 * Closing FREEZES the contents where they stand: a word that has been read
 * should not un-write itself on the way out, and the box it is in is closing
 * over it anyway. They are rewound to nothing only once the panel has finished
 * shutting and there is nothing on screen to see it happen. Reopening therefore
 * continues a half-finished reveal rather than restarting it.
 *
 * That is also why nothing is hidden with `visibility` on close: the letters
 * have to still be paintable while the panel closes over them. See the Menu
 * section of global.css.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { REVEAL } from "../Hero/reveal";

export const MENU_DROP = {
  /* Short, because the gesture is a snap rather than a slide — this is the
     ceiling-light pull-cord, which is over before you have let go of it. Most
     of what reads as "sharp" is here rather than in the ease. */
  DURATION: 0.7,

  /* The bounce. back.out overshoots once and settles; the number is how far
     past it goes, and at 1.9 that is a shade over a tenth of the panel's height
     of extra paper before it snaps back. Over half a second it cracks. Raise it
     for a looser string, drop it toward 0 for a drawer.

     elastic.out(1, 0.75) is the other reading of the same gesture: two or three
     diminishing bounces rather than one. It is a bigger personality than this
     menu is asking for, but it is a one-word change. */
  EASE: "back.out(1.9)",

  /* Closing is NOT the open played backwards at the same rate, and it cannot be.
     back.out leaves at nearly five times its own average speed — that is what
     makes the drop crack — so running the same curve in reverse arrives at shut
     with all of that velocity still on it, and the panel slams rather than
     closes.

     So the close scrubs the drop's playhead with an ease of its own instead. It
     is the playhead these two describe, not the height: the panel still follows
     the same curve of positions, but the rate it is read at is now something
     that eases in AND out, which cancels the steep arrival. The scrub also runs
     back through the overshoot on its way, so the panel gathers itself downward
     a little before it goes up.

     Slower than the drop on purpose. Opening is a gesture someone made; closing
     is the thing letting go. */
  CLOSE_DURATION: 0.85,
  CLOSE_EASE: "power2.inOut",
};

/* The tab coming down, once — not the panel's drop, which is what happens every
 * time it is pulled. This is the tab arriving on the page at all.
 *
 * It is the one piece of the site that sits ON the viewport's top edge rather
 * than in the page, so the preloader's sweep passes over it and leaves it
 * exactly as it found it — the only thing that reads as an arrival is for it to
 * come down out of the edge afterwards. Which is also, conveniently, what a
 * pull tab does.
 */
export const MENU_TAB = {
  /* After the page is uncovered. Last of the four arrivals — the roll at 0.15,
     the headline at 0.3, the corner mark at 0.55 (CORNER.DELAY in
     Hero/reveal.ts), then this. It is the invitation, and it lands once the
     page it belongs to is there to be looked at. */
  DELAY: 0.7,

  /* Where it waits: its own height and a bit, clear above the top edge. The
     stylesheet parks it at the same figure and the two have to agree — see the
     Preloader section of global.css, where the park hangs off the same
     attribute the gate clears. */
  HIDDEN: -115,

  /* The drop's own ease, deliberately: the tab arrives with exactly the crack
     it will have every time it is pulled from then on, so the entrance teaches
     the gesture. Slower than the drop, because there is nothing being pulled
     here — it is falling into place, not being yanked. */
  DURATION: 0.75,
  EASE: "back.out(1.9)",
};

/* Returns a teardown. Parked by the stylesheet from the first byte and taken
   over by an inline transform at mount, so the sweep clears a rule that is no
   longer holding anything — see the note on the set below, and TopBand's badge,
   which is the same hand-over on the same attribute. */
export function initTabEntrance(root: HTMLElement): () => void {
  const tab = root.querySelector<HTMLElement>(".menu-tab");
  if (!tab) return () => {};

  /* Nothing to undo — the park is inside a no-preference media query, so with
     this asked for the tab was never lifted in the first place. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* The paper that fills the space between the tab and the top edge while it is
     on its way out — without it the tab is a rectangle falling onto the page
     rather than one being pulled from behind it, and the ease's overshoot
     leaves a gap above it at the end. See .menu-tab.is-arriving in global.css.
     On for the arrival only, which is why it is a class and not a rule. */
  tab.classList.add("is-arriving");

  /* HELD FROM HERE, not from the gate. The stylesheet's park hangs off
   * data-loading — the tab sits ON the viewport's edge and cannot be uncovered
   * by the sweep passing over it, so it is the sweep that releases it rather
   * than a reveal attribute. And release() clears data-loading one statement
   * before it announces itself: a tab parked only inside the callback below
   * spends that gap held up by nothing, and any frame landing in it shows the
   * tab already sitting in the corner a moment before it drops in.
   *
   * This closes the gap by holding it at both ends — the stylesheet up to this
   * line, an inline transform from this line on. `y: 0` is what makes the value
   * safe to write while the CSS park is still applied: GSAP reads a percentage
   * translate out of the stylesheet as resolved px and would otherwise add its
   * own yPercent on top of it, which is a tab parked twice as far up as it
   * should be.
   *
   * After the reduced-motion return above, deliberately — that park is inside a
   * no-preference media query, so a reader who asked for less motion never had
   * the tab lifted and must not be handed one hanging off the top edge. */
  gsap.set(tab, { y: 0, yPercent: MENU_TAB.HIDDEN });

  let tween: gsap.core.Tween | null = null;
  const unsubscribe = whenRevealed(() => {
    tween = gsap.fromTo(
      tab,
      { y: 0, yPercent: MENU_TAB.HIDDEN },
      {
        yPercent: 0,
        duration: MENU_TAB.DURATION,
        delay: MENU_TAB.DELAY,
        ease: MENU_TAB.EASE,
        onComplete: () => tab.classList.remove("is-arriving"),
      },
    );
  });

  return () => {
    unsubscribe();
    tween?.kill();
    // A teardown mid-drop must never leave the only way into the menu off the
    // top of the screen — or trailing a strip of paper above it.
    tab.classList.remove("is-arriving");
    gsap.set(tab, { clearProps: "transform" });
  };
}

export const MENU_REVEAL = {
  /* How long the paper is empty before the first row starts. This is most of
     what makes the entrance read as deliberate rather than as everything
     happening at once — the drop is still travelling when the first rule starts
     drawing, and has snapped home by the time the second row goes. Measured
     against MENU_DROP.DURATION, so the two move together. */
  LEAD: 0.28,

  /* Between rows. Four of them multiply it, so this is the one number to reach
     for if the menu feels slow. */
  ROW: 0.16,

  /* Within a row, the three pieces arrive in the order they are read: the rule
     that opens the row, then the word, then the mark at the end of it. Offsets
     from the row's own start. */
  RULE_AT: 0,
  TEXT_AT: 0.1,
  MARK_AT: 0.26,

  RULE_DURATION: 0.6,
  RULE_EASE: "power2.out",

  /* The disc overshoots and settles — the same character as the drop, and as
     the rolls' hover swing in the slider, at the size of a full stop. */
  MARK_DURATION: 0.5,
  MARK_EASE: "back.out(2.2)",
};

/* Fisher–Yates, same as the hero's. The shuffle is the effect: reveal a word's
   letters left to right and it reads as a wipe, which is a different thing. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type MenuTimelines = {
  /* Played to open; its playhead is scrubbed back to 0 to close. */
  drop: gsap.core.Timeline;
  /* Only ever played forward, paused, or rewound to 0. */
  contents: gsap.core.Timeline;
};

/* Returns the pair, or null when the menu should not animate at all — reduced
   motion, or a panel with nothing in it. A null return leaves the stylesheet in
   charge of both states, which it can do on its own: the closed rule in
   global.css is a plain height: 0, and open is the panel's natural height. The
   menu still works, it just arrives. */
export function buildMenuOpen(root: HTMLElement): MenuTimelines | null {
  const panel = root.querySelector<HTMLElement>(".menu-panel");
  const sheet = root.querySelector<HTMLElement>(".menu-sheet");
  const rows = Array.from(root.querySelectorAll<HTMLElement>(".menu-item"));
  if (!panel || !sheet || !rows.length) return null;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return null;

  const contents = gsap.timeline({ paused: true });

  /* height: "auto" is measured by GSAP when the tween first renders, and the
     overshoot is applied to that measurement — so the panel really does travel
     past its own bottom edge and back, rather than easing into a clamp.

     The `from` renders the moment this is built, which is what parks the panel
     shut: from then on there is an inline height on it and the stylesheet's
     closed rule is only a fallback. */
  const drop = gsap.timeline({ paused: true });

  drop.fromTo(
    panel,
    { height: 0 },
    { height: "auto", duration: MENU_DROP.DURATION, ease: MENU_DROP.EASE },
    0,
  );

  /* The sheet hangs from the panel's leading edge instead of standing still
     under it. Without this the menu is a window opening over a fixed page —
     the panel's bottom edge wipes across stationary rows, and closing wipes
     back. With it the paper itself travels: the rows come DOWN as the panel
     drops and go UP as it shuts, the way anything pulled from a roller does.

     -100% is exact rather than approximate. The sheet is the panel's only
     child and carries all of its padding, so the sheet's height IS the panel's
     natural height — which makes -100% of the sheet exactly the distance the
     panel's edge travels. Same duration and same ease as the height above, so
     the sheet's bottom sits on that edge at every frame including the
     overshoot, where the whole block dips past its resting place and settles
     back. Change one of the two and this stops being true. */
  drop.fromTo(
    sheet,
    { yPercent: -100 },
    { yPercent: 0, duration: MENU_DROP.DURATION, ease: MENU_DROP.EASE },
    0,
  );

  rows.forEach((row, i) => {
    const at = MENU_REVEAL.LEAD + i * MENU_REVEAL.ROW;

    const rule = row.querySelector<HTMLElement>(".menu-rule");
    const chars = row.querySelectorAll<HTMLElement>(".char");
    const mark = row.querySelector<HTMLElement>(".menu-arrow");

    /* The rule draws in from the left. clip-path rather than scaleX, which is
       the cheaper tween and the wrong one: the dashes are a repeating
       background, so a scaled rule would start as a hundred of them crushed
       into a tenth of the width and spread out. Clipping leaves them at their
       own size and uncovers them. */
    if (rule) {
      contents.fromTo(
        rule,
        { clipPath: "inset(0% 100% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: MENU_REVEAL.RULE_DURATION,
          ease: MENU_REVEAL.RULE_EASE,
        },
        at + MENU_REVEAL.RULE_AT,
      );
    }

    /* The hero's move, unchanged — same hidden figure, duration, stagger and
       ease, imported rather than copied so the two cannot drift. The extra
       drama asked of this entrance is all in the spacing between rows above,
       not in the letters: they are the site's one text reveal and they read the
       same here as they do in the headline.

       Shuffled within the row and not across the menu: the rows are already
       staggered against each other, and a menu-wide shuffle would have
       CONTACT's letters arriving before ABOUT's word had finished. */
    if (chars.length) {
      contents.fromTo(
        shuffle(Array.from(chars)),
        { yPercent: REVEAL.HIDDEN },
        {
          yPercent: 0,
          duration: REVEAL.DURATION,
          stagger: REVEAL.STAGGER,
          ease: REVEAL.EASE,
        },
        at + MENU_REVEAL.TEXT_AT,
      );
    }

    if (mark) {
      contents.fromTo(
        mark,
        { scale: 0 },
        {
          scale: 1,
          duration: MENU_REVEAL.MARK_DURATION,
          ease: MENU_REVEAL.MARK_EASE,
        },
        at + MENU_REVEAL.MARK_AT,
      );
    }
  });

  return { drop, contents };
}
