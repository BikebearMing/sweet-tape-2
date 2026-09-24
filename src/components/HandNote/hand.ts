/* Sweet Tape — the pinboard note, ruled and typed.
 *
 * Two things happen and they are one gesture: the ruled corner
 * (components/HandNote/index.tsx, two thin lines round the copy) draws out,
 * the pen lifts, and the copy beside it is typed a character at a time in
 * Nothing You Could Do. One paused GSAP timeline per note, released once when
 * the note is scrolled into view and left standing — copy that untypes itself
 * when the reader looks back up is a party trick.
 *
 * The copy is real text in the markup, so without JS (or with reduced motion)
 * the note simply stands. This file only splits each line into character spans
 * and hides them until their beat.
 *
 * park and write draw SVG paths by their dash — the note no longer
 * uses them, the cue's arrow does. They, typeset, type and DRAW are exported
 * for the product row's hover cue (PickYourPlayer/cue.ts), which is this note with a different
 * release: written on every hover, taken away on every leave.
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount rebuilds rather than stacking a second note on the first.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";

/* The drawing, in seconds. Every instance scales all of it by its own
 * --hand-draw (see `pace`), so these are the hero's figures and the rest are
 * multiples of them. */
export const DRAW = {
  RULE: 0.75, // both ruled lines, end to end, at one constant pen speed
  LIFT: 0.14, // the pen off the page between the margin and the first key
  CHAR: 0.06, // one keystroke — a space costs the same
  BREAK: 0.18, // the carriage return between lines
};

/* Where the note starts typing: its top at this fraction down the viewport. */
const START_AT = 0.78;

/* Park a path with its whole length pushed past the end of the dash, ready to be
   pulled back to 0. The +2/+1 keeps a round cap on a zero-length dash from
   painting a dot at the start of the path before the pen touches down. */
export function park(path: SVGPathElement): void {
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len + 2}`;
  path.style.strokeDashoffset = `${len + 1}`;
}

/* Lay a set of paths end to end on the timeline at a constant pen speed, and
   return the time the last one finishes at. */
export function write(
  tl: gsap.core.Timeline,
  paths: SVGPathElement[],
  at: number,
  duration: number,
): number {
  const total = paths.reduce((sum, p) => sum + p.getTotalLength(), 0) || 1;
  let cursor = at;
  for (const path of paths) {
    const slice = (path.getTotalLength() / total) * duration;
    tl.to(path, { strokeDashoffset: 0, duration: slice, ease: "none" }, cursor);
    cursor += slice;
  }
  return cursor;
}

/* Split every .hand-line under `mount` into one span per character, and hand
   them back line by line. Rebuilt from textContent each time, so a second call
   on the same mount (StrictMode) splits the same text again rather than
   splitting spans. */
export function typeset(mount: HTMLElement): HTMLElement[][] {
  return Array.from(mount.querySelectorAll<HTMLElement>(".hand-line")).map(
    (line) => {
      const text = line.textContent ?? "";
      line.textContent = "";
      return Array.from(text, (ch) => {
        const span = document.createElement("span");
        span.textContent = ch;
        line.appendChild(span);
        return span;
      });
    },
  );
}

/* Hide the characters and put one keystroke per character on the timeline from
   `at`, with a carriage return between lines. Returns when the last key lands. */
export function type(
  tl: gsap.core.Timeline,
  lines: HTMLElement[][],
  at: number,
  pace: number,
): number {
  let cursor = at;
  lines.forEach((chars, i) => {
    if (i) cursor += DRAW.BREAK * pace;
    for (const ch of chars) {
      tl.set(ch, { visibility: "visible" }, cursor);
      cursor += DRAW.CHAR * pace;
    }
  });
  gsap.set(lines.flat(), { visibility: "hidden" });
  return cursor;
}

/**
 * Types every note under `root` — each on its own timeline and observer, so two
 * notes on one canvas type at their own speeds when their own picture arrives.
 */
export function initHandNote(root: HTMLElement): () => void {
  const stops = Array.from(
    root.querySelectorAll<HTMLElement>(".hand-note"),
  ).map(initOne);
  return () => stops.forEach((stop) => stop());
}

function initOne(note: HTMLElement): () => void {
  const mount = note.querySelector<HTMLElement>(".hand-ink");
  const across = note.querySelector(".hand-rule--x");
  const down = note.querySelector(".hand-rule--y");
  if (!mount || !across || !down) return () => {};

  /* Reduced motion: the markup already IS the finished note. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const css = getComputedStyle(note);
  /* How fast, as a MULTIPLE of DRAW — per instance, because some notes are only
     on screen for a second. */
  const pace = parseFloat(css.getPropertyValue("--hand-draw")) || 1;
  /* And how long it waits after being seen, in seconds (a bare number — `0.15s`
     would parse to NaN and silently become zero). */
  const delay = parseFloat(css.getPropertyValue("--hand-delay")) || 0;

  const lines = typeset(mount);

  /* The corner, drawn out from where the lines cross: across first, then down,
     sharing RULE by length so the pen moves at one speed. */
  const tl = gsap.timeline({ paused: true });
  const a = across.clientWidth;
  const d = down.clientHeight;
  const rule = DRAW.RULE * pace;
  tl.fromTo(across, { scaleX: 0 }, { scaleX: 1, duration: (rule * a) / (a + d || 1), ease: "none" }, 0);
  tl.fromTo(down, { scaleY: 0 }, { scaleY: 1, duration: (rule * d) / (a + d || 1), ease: "none" });
  type(tl, lines, tl.duration() + DRAW.LIFT * pace, pace);

  let stopped = false;
  let held: gsap.core.Tween | null = null;
  let io: IntersectionObserver | null = null;

  /* NOT UNTIL THE COVER HAS CLEARED — a note on the opening screen is in view
     under the preloader, and would otherwise be typed before anyone could see
     it. Then an IntersectionObserver rather than a scroll position, because the
     pinning section's note is carried by a camera transform no offsetTop sees. */
  const unsubReveal = whenRevealed(() => {
    if (stopped) return;
    io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (delay > 0) held = gsap.delayedCall(delay, () => tl.play());
        else tl.play();
        io?.disconnect(); // once typed, it stays typed
        io = null;
      },
      { rootMargin: `0px 0px ${-(1 - START_AT) * 100}% 0px` },
    );
    io.observe(note);
  });

  return () => {
    stopped = true;
    unsubReveal();
    io?.disconnect();
    held?.kill();
    tl.kill();
    gsap.set([across, down], { clearProps: "transform" });
    /* Back to plain text, so a rebuild splits the sentence and not the spans. */
    mount
      .querySelectorAll<HTMLElement>(".hand-line")
      .forEach((line) => (line.textContent = line.textContent));
  };
}
