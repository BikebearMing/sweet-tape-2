/* The sticky note's boot — clock and lifecycle, no three.
 *
 * Mirrors the engine/heroTape split: this file knows when the note should be
 * running and what time it is; stickyNote.ts knows what a sticky note is. The
 * import is dynamic for the same reason the roll's is — three stays out of the
 * critical bundle — and lands as a cache hit, because the roll's chunk has
 * already fetched it.
 *
 * On GSAP's ticker rather than its own rAF because Lenis and the roll are
 * both on it already: one clock for the section, not three.
 */
import gsap from "gsap";
import type { NoteFace } from "./noteFace";
import type { StickyNote } from "./stickyNote";

/* How far outside the viewport the note keeps animating. Enough that it is
   already mid-flutter when it scrolls on, never caught starting up. */
const NEAR_VIEW = "25% 0px";

/**
 * Mounts the 3D note into the `.sticky-note` inside `root`.
 *
 * @param root the section the slot lives in
 * @param face what is printed on the sheet. Omitted, it is the hero's pinboard
 *   note — everything about the paper, the wind and the light is the same
 *   object either way, and only the printing is a page's own business.
 */
export function initNote(root: HTMLElement, face?: NoteFace): () => void {
  const mount = root.querySelector<HTMLElement>(".sticky-note");
  if (!mount) return () => {};

  /* A prop fluttering in the corner of the eye is exactly what "reduce
     motion" is asking about. The note still renders — with its resting curl,
     which is shape, not motion — but the wind never blows. */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let note: StickyNote | null = null;
  let gone = false; // torn down before the async import resolved
  let onScreen = false; // the observer fires with the initial state on observe

  /* The scroll's draught. Scrolling IS wind as far as the note is concerned —
     the page rushing past the board — so scroll speed becomes extra blow,
     normalised so ~1500px/s of scroll is a full gust's worth. Asymmetric
     smoothing: the draught picks up almost with the flick (fast attack) and
     dies down over a moment after it stops (slow release), which is how air
     actually behaves — nothing stops dead the instant the hand does. */
  const FULL_BLOW = 1500; // px/s of scroll that counts as full draught
  let lastY = window.scrollY;
  let blow = 0;

  /* The cursor's stir — the other input. The pointer's offset from the note's
     centre becomes a direction and a strength that fades out by REACH note
     widths away, all eased so the sheet answers a passing hand with a breath,
     not a twitch. The note's centre comes from the offset chain (cached per
     layout, transform-immune); only the scroll is added per frame. */
  const REACH = 1.7;
  let mouseX = NaN;
  let mouseY = NaN;
  let centreX = 0; // document px
  let centreY = 0;
  let span = 1; // the note's width, the stir's unit of distance
  let pokeX = 0;
  let pokeY = 0;
  let pokeS = 0;

  function place() {
    let x = 0;
    let y = 0;
    for (let n: HTMLElement | null = mount; n; n = n.offsetParent as HTMLElement | null) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    span = mount!.offsetWidth || 1;
    centreX = x + span / 2;
    centreY = y + mount!.offsetHeight / 2;
  }

  function frame(time: number, deltaMs: number) {
    if (!note || !onScreen) return;
    const dt = Math.min(deltaMs / 1000, 0.1) || 0.016;
    const y = window.scrollY;
    const target = Math.min(Math.abs(y - lastY) / dt / FULL_BLOW, 1.2);
    lastY = y;
    const rate = target > blow ? 9 : 2.5;
    blow += (target - blow) * (1 - Math.exp(-rate * dt));

    let tx = 0;
    let ty = 0;
    let ts = 0;
    if (!Number.isNaN(mouseX)) {
      const dx = (mouseX - centreX) / span;
      const dy = (mouseY + y - centreY) / span;
      ts = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
      tx = Math.max(-1, Math.min(1, dx * 1.4));
      ty = Math.max(-1, Math.min(1, dy * 1.4));
    }
    const ease = 1 - Math.exp(-5 * dt); // one soft response for all three
    pokeX += (tx - pokeX) * ease;
    pokeY += (ty - pokeY) * ease;
    pokeS += (ts - pokeS) * ease;

    note.frame(time, blow, pokeX, pokeY, pokeS);
    note.draw();
  }

  /* Off screen the note stops costing anything. The wind is a pure function
     of the clock, so it re-enters at the current time rather than resuming a
     paused phase — nobody can tell, which is the point of wind. */
  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
    },
    { rootMargin: NEAR_VIEW }
  );
  io.observe(mount);

  // The slot is sized in vw, so viewport-width changes are what move its box.
  const ro = new ResizeObserver(() => {
    place();
    note?.resize();
  });
  ro.observe(mount);

  const ac = new AbortController();
  window.addEventListener(
    "pointermove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    },
    { signal: ac.signal, passive: true }
  );

  place();
  if (!reduced) gsap.ticker.add(frame);

  import("./stickyNote")
    .then((mod) => {
      if (gone) return;
      note = mod.createStickyNote(mount, face);
      if (reduced) {
        // One pose, one render: the resting curl, standing still.
        note.frame(0);
        note.draw();
      }

      if (process.env.NODE_ENV !== "production") {
        // Console handle for tuning, compiled out of production builds.
        Object.assign(window, {
          note: {
            NOTE: mod.NOTE,
            WIND: mod.WIND,
            LIGHT: mod.LIGHT,
            SHADOW: mod.SHADOW,
          },
        });
      }
    })
    .catch(() => {
      // No three after all — the slot stays an empty box, and the section's
      // artwork carries it exactly as it did before this file existed.
    });

  return () => {
    gone = true;
    ac.abort();
    io.disconnect();
    ro.disconnect();
    gsap.ticker.remove(frame);
    note?.dispose();
    note = null;
  };
}
