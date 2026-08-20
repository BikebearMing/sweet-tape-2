/* Sweet Tape — orbiting roll selector.
 *
 * Rolls sit on a circle; selecting one spins the ring until it reaches the
 * 9 o'clock slot. Everything else in the section clears out, the colour sheet
 * sweeps down, and each piece returns once the colour behind it has settled.
 *
 *   0.00 |------ ring closes ------|
 *   0.00 |- THE drops -|
 *   0.06   |--- CREATIVE drops ---|
 *   0.10  |------- card flips -------|
 *   0.12      |----------- orbit travels ----------|
 *   0.12      |- chips out -|······· held off screen ·······|- chips in -|
 *   0.75                        |------ ring opens ------|
 *   0.75                        |------- colour sheet -------|
 *   0.96                          |- THE rises -|
 *   1.24                                |- CREATIVE rises -|
 *                                                          ~2.1s total
 *
 * The section arrives the same way. On first scroll to it only the return
 * halves above run — from parked out positions, with no sheet, because the
 * stage is already in its colour, and without the key visual, which is left
 * face-on throughout. See ENTER below.
 *
 * Deliberately framework-free. React renders the markup once and hands the
 * subtree over; everything below is plain DOM and GSAP. Trying to express this
 * as state would mean re-rendering mid-tween, which is the one thing it cannot
 * survive.
 *
 * Everything is scoped to `root` and every handle is released by the returned
 * cleanup, so mounting twice (which StrictMode does in dev) leaves no doubled
 * listeners or orphaned timelines.
 */
import gsap from "gsap";

/* The word marks' motion, shared with a product's inner page — which sets the
   same two marks and arrives on the same rise. See components/wordDip.ts for
   why the RISE moved out and the DROP below did not. */
import {
  WORD,
  addRise,
  dipTo,
  maskAt,
  maskDip,
  shiftAt,
  shiftDip,
} from "@/components/wordDip";
import type { TapeViewer } from "./tape3d";

import { screenH } from "@/components/viewport";

export function initTapeSlider(root: HTMLElement): () => void {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const qa = <T extends Element>(sel: string) =>
    Array.from(root.querySelectorAll<T>(sel));

  const parent = q<HTMLElement>(".roll-parent");
  const track = parent?.querySelector<HTMLElement>(".rail-track");
  if (!track) return () => {};

  const rolls = Array.from(track.querySelectorAll<HTMLButtonElement>("button"));
  if (!rolls.length) return () => {};

  const rings = rolls.map((b) => b.querySelector<HTMLElement>(".roll-ring")!);

  // glyphs are the images inside .glyph, not the wrappers: the wrapper holds
  // the arc, the image does the moving.
  const letters = qa<HTMLImageElement>(".top-title img");
  const glyphs = qa<HTMLImageElement>(".bottom-title .glyph img");
  const topWord = q<HTMLElement>(".top-title");
  const bottomWord = q<HTMLElement>(".bottom-title");
  // The hidden heading that carries the word mark in text; see setWord.
  const srWord = q<HTMLElement>("h2.sr-only");
  const keyVisual = q<HTMLElement>(".key-visual");
  const card = q<HTMLImageElement>(".key-visual img");
  /* The showcase pair. `showcase` is the WRAPPER — the thing that is placed,
     tilted, drifted and turned — and the photograph and the strip of tape across
     it are the two things inside that a swap has to rewrite. Held as parallel
     arrays rather than re-queried per swap: the swap runs on the one frame the
     card is edge-on and has no room for a querySelector. */
  const showcase = qa<HTMLElement>(".middle .showcase");
  const shots = showcase.map((el) => el.querySelector<HTMLImageElement>(":scope > img"));
  const strips = showcase.map((el) => el.querySelector<HTMLElement>(".showcase-tape"));
  const left = q<HTMLElement>(".left");
  const tagBox = left?.querySelector<HTMLElement>(".tag") ?? null;
  const copyBox = left?.querySelector<HTMLElement>(".subtext .h5") ?? null;
  const chips: HTMLElement[] = [];

  const subhead = q<HTMLElement>(".subhead");
  const sweep = q<HTMLElement>(".sweep-paint");
  const sweepInner = q<HTMLElement>(".sweep-inner");
  const subheadNext = sweep?.querySelector<HTMLElement>(".subhead--next") ?? null;

  const bgOverlay = q<HTMLElement>(".bg-overlay");
  const bgBase = bgOverlay?.querySelector<HTMLElement>(".bg-layer--base") ?? null;
  const bgNext = bgOverlay?.querySelector<HTMLElement>(".bg-layer--next") ?? null;
  const hasBg = !!(bgOverlay && bgBase && bgNext);

  const STEP = 360 / rolls.length; // 4 rolls -> 90deg apart
  const ACTIVE_ANGLE = 180; // 9 o'clock, in CSS angle terms (0 = 3 o'clock)

  // The two overlaps are what blend the close/travel/open into one gesture.
  // Set them to 0 for three discrete beats.
  const RING_OUT = 0.46;
  const TRAVEL = 0.85;
  const RING_IN = 0.55;
  const CLOSE_OVERLAP = 0.34; // orbit starts this early, before the close ends
  const OPEN_LEAD = 0.22; // ring starts this early, before the roll settles

  const EASE = "sine.inOut";
  const EASE_OPEN = "back.out(1.6)";
  const EASE_CLOSE = "back.in(0.9)";

  const BG_REVEAL = 0.85; // colour sheet sweeping down over the stage
  const BG_EASE = "power2.out";

  /* THE DROP IS THIS SECTION'S OWN — it exists to hide a swap, and nowhere else
     on the site swaps a word. The RISE is shared (WORD, in components/wordDip.ts):
     the inner product page arrives on the same one, and the two halves of a
     single move must not be free to drift apart. */
  const WORD_DOWN = 0.32;
  const WORD_HOLD = 0.07; // load-bearing, see addDip
  const WORD_EASE_DOWN = "power2.in";

  /* The bottom mark's stagger is WORD.BOTTOM_STAGGER, and together with the
     duration it is the constraint on the opening: CREATIVE's last letter has to
     be gone before the colour sheet reaches it, which leaves ~0.2s of slack. */
  const BOTTOM_LEAD = 0.06;

  // Beat between the sheet clearing a word and that word rising.
  const WORD_AFTER_SHEET = 0.06;

  const CARD_AT = 0.1; // flips almost on the click, ahead of the colour
  const FLIP_TURN = 0.9;
  const FLIP_SWEEP = 90; // deg to edge-on; the model handoff happens there

  /* The showcase pair turns over edge-on. They need no cover from the colour
     sheet — at 90deg there is nothing of them left to see. SHOW_LAG is what
     keeps the two from reading as one object: the second is still on its way
     out as the first comes back. */
  const SHOW_AT = 0.18; // first image, just behind the key visual's swap
  const SHOW_LAG = 0.26; // second image starts this much later
  const SHOW_TURN = 0.78;
  const SHOW_DEPTH = 55; // px each withdraws at the edge-on moment
  const SHOW_PERSPECTIVE = 900;

  /* The strip of tape across each photograph, being PUT ON — see the markup in
     TapeSlider/index.tsx, and strips.ts for the artwork.
     Once, on the way in, and never again: a selection swaps the strip for the
     incoming tape's behind the same edge-on turn as the photograph, but it does
     not lift and re-stick. It was taped down when the section arrived and it
     stays taped down.
     Slower than the turn that precedes it, because pressing tape on is a slower
     thing than turning a card over, and power2.out so it arrives rather than
     stops. */
  const PRESS = 0.62;
  const PRESS_EASE = "power2.out";

  const CHIP_OUT = 0.34;
  const CHIP_IN = 0.5;
  const CHIP_STAGGER = 0.07;
  const CHIP_HOLD = 0.06;
  const LEFT_OUT = 0.26; // the paragraph fades rather than slides
  const LEFT_IN = 0.5;
  const LEFT_SHIFT = 18;

  /* The entrance.
   *
   * The section is the second thing on the page, so by the time it is reached
   * it has been sitting fully assembled for a screen and a half. Instead it
   * arrives the way a selection arrives: everything that moves during a swap is
   * parked in the out position it would be in mid-swap, and comes back when the
   * section is scrolled to — same durations, same eases, same order, minus an
   * exit nobody was there to watch.
   *
   * Two exceptions. The stage's colour is seeded at first paint and stays, so
   * there is no sheet here: a sheet sweeping a colour over the same colour is a
   * second of nothing, and the section reads as coloured from the start with
   * the furniture arriving into it. And the roll itself sits the entrance out —
   * it is the thing the section is about, so it is already there, face-on, and
   * everything else arrives around it. Its turn belongs to a selection.
   *
   * Once per load. A section that reassembles every time it comes back would
   * also be overriding whatever tape the visitor picked before scrolling away.
   */
  const ENTER = {
    /* When it fires. The section is exactly 100vh, so the negative bottom
       margin reads directly as how much of it is on screen at the moment the
       entrance starts — 45% here, a little under half.

       Worth a thought before changing: the parked pieces are invisible, not
       absent, so every percent of extra wait is a percent of the section
       arriving as empty space. Late enough to have arrived, early enough that
       the first thing seen is the entrance and not the gap. */
    MARGIN: "0px 0px -45% 0px",
    RING_AT: 0.4, // the active ring opens as the rail's own fade lands
    SHOW_AT: 0.22,
    /* The tape goes on AFTER the photograph has arrived — SHOW_AT plus the half
       turn that brings it face-on, plus a beat. A strip pressing onto a card
       that is still edge-on is a strip pressing onto nothing. Each follows its
       own picture, so the pair's SHOW_LAG carries through to them. */
    TAPE_AT: 0.22 + SHOW_TURN / 2 + 0.08,
    TOP_AT: 0.1, // THE
    BOTTOM_AT: 0.26, // CREATIVE, trailing it as it does on a selection
    LEFT_AT: 0.2,
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spin = { rot: ACTIVE_ANGLE }; // tweened; index 0 starts in the active slot
  let activeIndex = 0;
  let radius = 0;

  let timeline: gsap.core.Timeline | null = null;
  let enter: gsap.core.Timeline | null = null;
  let wipe: gsap.core.Tween | null = null;
  let word: gsap.core.Timeline | null = null;
  let bottom: gsap.core.Timeline | null = null;
  let leftTl: gsap.core.Timeline | null = null;
  let cardTl: gsap.core.Timeline | null = null;
  let showTl: gsap.core.Timeline | null = null;
  let pressTl: gsap.core.Timeline | null = null;

  /* The 3D stage arrives asynchronously (its chunk, then two GLBs), so the
     engine runs with or without it: null until ready, and every card path
     falls back to the flat <img> while it is. */
  let viewer: TapeViewer | null = null;
  let viewerGone = false; // torn down before the async load resolved

  function measure() {
    radius = track!.getBoundingClientRect().width / 2;
  }

  /* Scroll parallax. --parallax is the share of the scroll distance an element
     gives back: positive lags behind the page and reads as further away,
     negative runs ahead of it and reads as nearer.

     NOTHING IN THIS SECTION DECLARES ONE ANY MORE — see global.css. The roll
     stopped drifting when it got a lean of its own, and the pair in front of it
     followed, because two photographs sliding past a stationary object they are
     arranged around is the composition coming apart rather than depth. The
     machinery is kept, and the query below still names all three elements, so
     any of them can be given a drift again with one line of CSS. What still
     earns the ticker callback is measureRoll, which the pointer lean reads.

     Driven off GSAP's ticker, which is also driving Lenis, so the offset is
     computed from the same scroll value the page was just laid out with. */
  let drifters: { el: HTMLElement; k: number }[] = [];
  let lastScroll: number | null = null;

  function collectParallax() {
    drifters = [];
    qa<HTMLElement>(".key-visual, .middle .showcase").forEach((el) => {
      const k = parseFloat(getComputedStyle(el).getPropertyValue("--parallax"));
      if (k) drifters.push({ el, k });
    });
  }

  function applyParallax() {
    const y = window.scrollY || window.pageYOffset || 0;
    if (lastScroll !== null && Math.abs(y - lastScroll) < 0.5) return;
    lastScroll = y;
    const rel = y - root.offsetTop;
    drifters.forEach((d) => gsap.set(d.el, { y: rel * d.k }));
    // Measured here, after the drift has been written, because the roll's own
    // parallax is one of the things that moves it. Same gate: the centre only
    // changes when the page has scrolled, so pointermove reads a cached pair
    // instead of forcing a layout on every move.
    measureRoll();
  }

  /* Mouse parallax on the 3D roll. The lean itself lives in tape3d, on a group
     above the flip so the two run concurrently rather than overwriting each
     other; all this side does is say where the pointer is, relative to the
     roll's own centre, and how far out counts as full deflection.
     TILT_REACH is a share of the viewport's short side: the roll is at its
     limit well before the pointer reaches the corner, so the lean is at full
     travel across most of the section rather than only at the extremes. */
  const TILT_REACH = 0.42;
  let rollX = 0;
  let rollY = 0;
  let inView = true;

  function measureRoll() {
    if (!keyVisual) return;
    const b = keyVisual.getBoundingClientRect();
    rollX = b.left + b.width / 2;
    rollY = b.top + b.height / 2;
  }

  function aimRoll(e: PointerEvent) {
    if (!viewer || !inView) return;
    const reach = Math.min(window.innerWidth, screenH()) * 0.5 * TILT_REACH;
    viewer.point((e.clientX - rollX) / reach, (e.clientY - rollY) / reach);
  }

  // Pointer gone — off the window, or the tab blurred with it mid-lean. Home
  // is the pose every other part of the section is composed around.
  const restRoll = () => viewer?.point(0, 0);

  // Runs on every tick of the spin tween, so rolls travel along the arc rather
  // than cutting straight across it.
  function place() {
    for (let i = 0; i < rolls.length; i++) {
      const a = ((i * STEP + spin.rot) * Math.PI) / 180;
      gsap.set(rolls[i], { x: Math.cos(a) * radius, y: Math.sin(a) * radius });
    }
  }

  function revealRing(el: HTMLElement, delay?: number) {
    gsap.to(el, {
      scale: 1,
      opacity: 1,
      duration: reduced ? 0 : RING_IN,
      delay: reduced ? 0 : delay || 0,
      ease: EASE_OPEN,
      overwrite: "auto",
    });
  }

  // Depth of the arc on the sheet's leading edge, capped so it stays a sweep
  // rather than a deep tongue on tall viewports.
  function arcDepth(box: DOMRect) {
    return Math.min(box.height * 0.22, 240);
  }

  function curve(px: number) {
    return `0 0 50% 50% / 0 0 ${px}px ${px}px`;
  }

  /* When the sheet's leading edge has finished passing `el` — i.e. when that
     element may come back on screen in the new colour. The + depth accounts for
     the arc's shallow ends trailing its centre. The ease is scanned rather than
     inverted; power2.out is monotonic so the first sample past the target wins. */
  function sheetClears(el: HTMLElement | null) {
    if (!hasBg || !el) return 0;
    const box = bgOverlay!.getBoundingClientRect();
    const depth = arcDepth(box);
    const travel = box.height + depth + 2;
    const need = (el.getBoundingClientRect().bottom - box.top + depth) / travel;
    const ease = gsap.parseEase(BG_EASE);
    for (let i = 0; i <= 100; i++) {
      if (ease(i / 100) >= need) return (i / 100) * BG_REVEAL;
    }
    return BG_REVEAL;
  }

  function paintChip(el: HTMLElement | null, btn: HTMLElement) {
    if (!el) return;
    const cs = getComputedStyle(btn);
    el.style.setProperty("--tag-bg", cs.getPropertyValue("--tag-bg").trim());
    el.style.setProperty("--tag-ink", cs.getPropertyValue("--tag-ink").trim());
  }

  const varOf = (btn: HTMLElement, name: string) =>
    getComputedStyle(btn).getPropertyValue(name).trim();

  // Added straight to the timeline, not built paused and inserted — a child
  // keeps its own paused flag and would never play.
  function addWipe(tl: gsap.core.Timeline, index: number, at: number) {
    const state = { p: 0 };
    let box: DOMRect | null = null;
    let depth = 0;
    let travel = 0;
    const colour = varOf(rolls[index], "--bg");

    // Also called defensively from onUpdate: GSAP renders a tween once at
    // progress 0 when added to a running timeline, firing onUpdate before
    // onStart.
    function prime() {
      box = bgOverlay!.getBoundingClientRect();
      depth = arcDepth(box);

      /* Taller than the stage by the arc depth. The edge has to finish `depth`
         below the stage bottom or the arc's shallow ends leave wedges in the
         corners — and at stage height it would run out of sheet, exposing the
         old colour as a band across the top. */
      travel = box.height + depth + 2;
      bgNext!.style.height = `${travel}px`;
      bgNext!.style.background = colour;
      bgNext!.style.borderRadius = curve(depth);
      bgNext!.style.transform = `translateY(${-travel}px)`;

      // Same numbers on the repaint layer, so its arc is the sheet's arc.
      if (sweep && sweepInner) {
        sweep.style.height = `${travel}px`;
        sweep.style.borderRadius = curve(depth);
        sweep.style.transform = `translateY(${-travel}px)`;
        sweepInner.style.height = `${box.height}px`;
        sweepInner.style.transform = `translateY(${travel}px)`;
        paintChip(subheadNext, rolls[index]);
      }
    }

    tl.to(
      state,
      {
        p: 1,
        duration: BG_REVEAL,
        ease: BG_EASE,
        onStart: prime,
        onUpdate() {
          if (!box) prime();
          const ty = (state.p - 1) * travel;
          bgNext!.style.transform = `translateY(${ty}px)`;
          if (sweep && sweepInner) {
            // Equal and opposite: the box travels, the copy inside does not.
            sweep.style.transform = `translateY(${ty}px)`;
            sweepInner.style.transform = `translateY(${-ty}px)`;
          }
        },
        onComplete() {
          bgBase!.style.background = colour;
          bgNext!.style.transform = "translateY(-100%)";
          // Repaint before parking the copy, or the chip flicks back to the old
          // colour for a frame.
          paintChip(subhead, rolls[index]);
          if (sweep) sweep.style.transform = "translateY(-100%)";
        },
      },
      at
    );

    return tl.recent() as gsap.core.Tween;
  }

  /* Each letter drops out of the bottom of its own box, recolours out of sight,
     and rises back. `apply` is the only difference between the two words:
     THE moves its own mask, CREATIVE moves the image inside .glyph's overflow
     box — which needs no mask, so it survives the artwork being replaced. */
  function addDip(
    tl: gsap.core.Timeline,
    els: HTMLElement[],
    colour: string,
    at: number,
    stagger: number,
    apply: (el: HTMLElement, y: number) => void,
    read: (el: HTMLElement) => number,
    returnAt: number,
    /* Fired the moment the LAST letter has finished dropping — the one frame
       where every letter is below the clip and the word can be changed for a
       different one without anybody watching it happen. Only the bottom mark
       passes it; THE is the same three letters on every tape.

       It is handed `repark`, which MUST be called after the swap: see the note
       on it below. */
    atBottom?: (repark: () => void) => void
  ) {
    const sub = gsap.timeline();

    /* Every letter's travel, kept so the swap can rewrite it. The letters are
       tweened through these proxies rather than directly, so this is also where
       the return tween reads its start from. */
    const states: { el: HTMLElement; st: { y: number } }[] = [];

    /* Re-measure and re-park, after the word has been changed underneath.
       Without this the mark flickers: each letter dropped by ITS OWN height,
       measured while the OLD word was still in the box, and the incoming word's
       letters are not the same height. Swap CREATIVE (216px) for RELIABLE
       (225px) and the R is nine pixels taller than the hole it is hiding in —
       so the top of the new word is on screen from the instant it arrives,
       before the rise that is supposed to reveal it has started.

       Reading offsetHeight here forces a synchronous layout, which is the
       point: it has to be this frame, while everything is still down. */
    const repark = () => {
      for (const s of states) {
        s.st.y = dipTo(s.el);
        apply(s.el, s.st.y);
      }
    };

    // One hold shared by the whole word. A per-letter hold would have the first
    // letter back up before the last had left, and the sheet is coming.
    const lastDown = (els.length - 1) * stagger + WORD_DOWN;
    const backAt = Math.max(lastDown + WORD_HOLD, (returnAt || 0) - at);

    els.forEach((el, i) => {
      // Start from wherever the letter actually is, not from home. On a fast
      // second click the previous dip is killed mid-flight, and assuming 0 here
      // would snap the letter home for one frame before dropping it again.
      const st = { y: read(el) };
      states.push({ el, st });
      const move = () => apply(el, st.y);
      const offset = i * stagger;

      sub.to(
        st,
        {
          y: dipTo(el),
          duration: WORD_DOWN,
          ease: WORD_EASE_DOWN,
          onUpdate: move,
          onComplete() {
            // Safe only because of WORD_HOLD: with no pause the up tween renders
            // in the same tick and an ease-out brings ~12% of the letter back
            // into view within one frame.
            el.style.setProperty("--word-colour", colour);
            // The stagger means the last letter to start is the last to land,
            // so this is the whole word down rather than just this letter.
            if (i === els.length - 1) atBottom?.(repark);
          },
        },
        offset
      );

      sub.to(
        st,
        {
          y: 0,
          duration: WORD.UP,
          ease: WORD.EASE_UP, // no overshoot, or the tops clip at the peak
          onUpdate: move,
        },
        backAt + offset
      );
    });

    tl.add(sub, at);
    return sub;
  }

  const cardOf = (btn: HTMLElement) => btn.dataset.card || "";

  const modelOf = (btn: HTMLElement) => btn.dataset.model || "";

  /* The tape's word mark, as the key letters.css generates its stencils under.
     Writing it on .bottom-title re-points all eight spans at once — artwork,
     intrinsic widths, arc indices and the display:none on the tail — so a word
     change is one attribute and no DOM work. See WordMarks.tsx on the pool. */
  const wordOf = (btn: HTMLElement) => btn.dataset.word || "";

  function setWord(index: number) {
    const word = wordOf(rolls[index]);
    if (!word || !bottomWord) return;
    bottomWord.dataset.word = word;
    /* The mark is pictures, so the readable copy is a hidden heading beside it
       (TapeSlider/index.tsx). It would otherwise still announce the word the
       page was served with. */
    if (srWord) srWord.textContent = `THE ${word.toUpperCase()}`;
  }

  /* The 3D flip. Out to edge-on on one clean axis — where the roll's real
     side is showing — then the incoming model takes over and continues the
     same direction home. The handoff is invisible as geometry because the
     exports share dimensions; only the side's colour changes, at the turn's
     fastest point. Strict pathway: one axis, the same direction every time,
     nothing layered on top.

     Until the viewer is live (three.js still downloading, or it failed) the
     flat <img> still owns the slot, so the fallback swaps its src at the
     moment the flip would have been edge-on. */
  function addCard(tl: gsap.core.Timeline, index: number, at: number) {
    const sub = gsap.timeline();
    const half = FLIP_TURN / 2;
    const model = modelOf(rolls[index]);

    if (viewer && model && viewer.ready(model)) {
      const v = viewer;
      /* Back under the roll. Only ever needed after the branch below has put
         the card up for a tape whose model had not landed yet — harmless
         otherwise, and cheaper to write unconditionally than to track. */
      if (card) card.style.visibility = "hidden";

      const out = { deg: 0 };
      sub.to(
        out,
        {
          deg: FLIP_SWEEP,
          duration: half,
          ease: "power2.in", // fastest where the side is thinnest to read
          onUpdate: () => v.spin(out.deg),
        },
        0
      );

      // show() keeps the incoming group's leftover rotation, so the spin to
      // its start angle rides in the same call — both land before the next
      // rendered frame.
      const back = { deg: -FLIP_SWEEP };
      sub.call(
        () => {
          v.show(model);
          v.spin(back.deg);
        },
        undefined,
        half
      );

      sub.to(
        back,
        {
          deg: 0,
          duration: half,
          ease: "power2.out",
          onUpdate: () => v.spin(back.deg),
        },
        half
      );
    } else {
      const src = card && cardOf(rolls[index]);
      if (!card || !src) return null;
      /* AND PUT THE CARD BACK, which is new and is what makes this branch
         actually work rather than merely exist.
       *
       * The card is hidden from mount because the roll is coming and flashing
       * artwork it is about to replace is worse than an empty slot. That was
       * safe while every model was resident before the viewer existed: this
       * branch could only run with no viewer at all, and then the card had
       * never been hidden in the first place.
       *
       * Models stream now, so it is reachable with the viewer live and the
       * card hidden — which would have been a swap onto an invisible image and
       * an empty slot for the whole flip. Showing it here means a tape clicked
       * before its model lands turns to the flat card, exactly as it does on a
       * browser that never got three.js at all, and the branch above puts it
       * away again on the next selection that has its roll. */
      sub.call(
        () => {
          card.src = src;
          card.style.visibility = "visible";
        },
        undefined,
        half,
      );
    }

    tl.add(sub, at);
    return sub;
  }

  const showcaseOf = (btn: HTMLElement) =>
    (btn.dataset.showcase || "").split("|").filter(Boolean);

  /* THE STRIP HOLDING THE PAIR DOWN, packed onto the button by RollPicker as
     artwork, underside and box — see strips.ts. The box is two lengths because
     the four rolls are four different shapes: hand a black strip the clear
     strip's proportions and it is not a squashed picture, it is the peel
     appearing not to run properly at one end. */
  function stripOf(btn: HTMLElement) {
    const [src, back, w, h, blend] = (btn.dataset.strip || "").split("|");
    return src && back && w && h ? { src, back, w, h, blend: blend || "normal" } : null;
  }

  /* The strip on ONE card, or on both when `card` is left off.
   *
   * WHICH CARD MATTERS, and getting it wrong is visible. The two photographs
   * turn over a beat apart — SHOW_LAG — so at the moment the first is edge-on
   * and swapping, the second is still face-on showing the OUTGOING picture.
   * Repainting both here put the incoming tape's strip on that picture and left
   * it there for the quarter second until the second card turned: the new tape
   * arriving early, on the old slide, in front of you.
   *
   * Both at once is still right where nothing is mid-turn — the first paint,
   * and the reduced-motion path, which has no turn to hide anything behind.
   *
   * --peel-from / --peel-to are written by Peel as fractions of --peel-span,
   * which is derived from the box below, so rewriting the box carries the
   * fold's travel with it and neither has to be touched here. --peel itself is
   * deliberately left alone: a tape change is a swap, not a re-peel. */
  function setStrip(index: number, card?: number) {
    const s = stripOf(rolls[index]);
    if (!s) return;
    strips.forEach((tape, i) => {
      if (!tape || (card !== undefined && i !== card)) return;
      tape.style.setProperty("--peel-w", s.w);
      tape.style.setProperty("--peel-h", s.h);
      // The filter id, not a colour — one filter is one colour for the whole
      // document. See BACKS in components/Peel.
      tape.style.setProperty("--peel-back", `url(#${s.back})`);
      // Only the clear roll asks for one, and it asks because its artwork is
      // highlights rather than a picture of tape. See strips.ts.
      tape.style.setProperty("--strip-blend", s.blend);
      // Both copies: the face and the mirrored flap are the same picture.
      tape.querySelectorAll("img").forEach((img) => (img.src = s.src));
    });
  }

  // Rotation is reapplied every time because GSAP owns the transform; the CSS
  // only supplies the angle.
  function setShowcase(index: number) {
    const srcs = showcaseOf(rolls[index]);
    showcase.forEach((el, i) => {
      const shot = shots[i];
      if (srcs[i] && shot) shot.src = srcs[i];
      gsap.set(el, { rotation: rotOf(el) });
    });
    setStrip(index);
  }

  /* Same turn as the key visual: out to edge-on, swap where there is no width
     to see, then open back out from the opposite edge so the image is never
     mirrored. The resting tilt is left alone — it lives on rotation, the turn
     on rotationY, so the flip axis leans with the card rather than standing
     upright through it. */
  function addShowcase(tl: gsap.core.Timeline, index: number, at: number) {
    const srcs = showcaseOf(rolls[index]);
    if (!showcase.length || !srcs.length) return null;

    const sub = gsap.timeline();
    const half = SHOW_TURN / 2;

    showcase.forEach((el, i) => {
      const start = i * SHOW_LAG;

      sub.to(el, { rotationY: 90, z: -SHOW_DEPTH, duration: half, ease: "power2.in" }, start);

      sub.call(
        () => {
          const shot = shots[i];
          if (srcs[i] && shot) shot.src = srcs[i];
          /* The tape changes with the picture it is stuck to, behind the same
             edge-on frame — this card's strip and only this card's, or the
             other one is repainted while still face-on and showing the tape it
             is about to stop being. See setStrip. */
          setStrip(index, i);
          gsap.set(el, { rotationY: -90 });
        },
        undefined,
        start + half
      );

      sub.to(
        el,
        {
          rotationY: 0,
          z: 0,
          duration: half,
          ease: "power2.out",
          immediateRender: false, // start value must be read after the callback
        },
        start + half
      );
    });

    tl.add(sub, at);
    return sub;
  }

  const labelsOf = (btn: HTMLElement) =>
    (btn.dataset.tags || "").split("|").filter(Boolean);

  // A fixed pool, built once. Rebuilding per swap would destroy the elements
  // the exit animation is mid-way through moving. Tapes with fewer labels hide
  // the spares.
  function buildChips() {
    if (!tagBox) return;
    const most = rolls.reduce((m, b) => Math.max(m, labelsOf(b).length), 0);
    tagBox.textContent = "";
    chips.length = 0;
    for (let i = 0; i < most; i++) {
      const h = document.createElement("h6");
      h.className = "h6";
      tagBox.appendChild(h);
      chips.push(h);
    }
  }

  const rotOf = (el: HTMLElement) =>
    parseFloat(getComputedStyle(el).getPropertyValue("--rot")) || 0;

  // Called at the point in the timeline where the column is off screen, so none
  // of this is seen changing.
  function fillLeft(index: number) {
    if (!left) return;
    const btn = rolls[index];
    const cs = getComputedStyle(btn);

    (["--tag-bg", "--tag-ink", "--ink"] as const).forEach((name) => {
      left.style.setProperty(name, cs.getPropertyValue(name).trim());
    });

    const labels = labelsOf(btn);
    chips.forEach((c, i) => {
      const used = i < labels.length;
      c.textContent = used ? labels[i] : "";
      c.style.display = used ? "" : "none";
      // Rotation only — passing x would undo the exit and snap the chip back on
      // screen mid-swap.
      gsap.set(c, { rotation: rotOf(c) });
    });

    if (copyBox) copyBox.textContent = btn.dataset.copy || "";
  }

  /* One shared exit distance, measured off the column's right edge so even the
     widest chip clears. Shared with the entrance, which parks the chips there. */
  const chipOutX = () => -(left!.getBoundingClientRect().right + 40);

  /* Chips leave to the left one after another, swap while all off screen, then
     return in the same order. returnAt is the earliest the chips may come back,
     on the parent timeline's clock. */
  function addLeft(
    tl: gsap.core.Timeline,
    index: number,
    at: number,
    returnAt: number
  ) {
    if (!left || !chips.length) return null;

    const sub = gsap.timeline();
    const outX = chipOutX();
    const lastOut = (chips.length - 1) * CHIP_STAGGER + CHIP_OUT;
    // Floored, so the gate can only delay the return, never pull it into the exit.
    const backAt = Math.max(lastOut + CHIP_HOLD, (returnAt || 0) - at);

    chips.forEach((c, i) => {
      sub.to(c, { x: outX, duration: CHIP_OUT, ease: "power2.in" }, i * CHIP_STAGGER);
    });
    if (copyBox) {
      sub.to(copyBox, { opacity: 0, y: LEFT_SHIFT, duration: LEFT_OUT, ease: "power2.in" }, 0);
    }

    sub.call(() => fillLeft(index), undefined, lastOut);

    chips.forEach((c, i) => {
      sub.to(c, { x: 0, duration: CHIP_IN, ease: "power3.out" }, backAt + i * CHIP_STAGGER);
    });
    if (copyBox) {
      sub.to(copyBox, { opacity: 1, y: 0, duration: LEFT_IN, ease: "power3.out" }, backAt);
    }

    tl.add(sub, at);
    return sub;
  }

  /* ------------------------------------------------------------------------
     The entrance. Each of these is the second half of a move addDip / addLeft /
     addShowcase already make — the way home, with nothing preceding it, because
     there was nothing on stage to take off.

     addCard has no counterpart here on purpose: the key visual is not part of
     the entrance and is never parked, so it is face-on from the moment it
     loads.
     --------------------------------------------------------------------- */

  /* Out positions. Every one is exactly where the selection choreography leaves
     the piece mid-swap, which is what lets the entrance be the return half
     verbatim rather than a second animation that happens to look similar.

     Set here rather than in the stylesheet because the chips do not exist until
     buildChips has run. The cost is that a section already on screen when the
     engine mounts would paint once in place before being parked — which the
     170vw hero above it makes academic. */
  function park() {
    letters.forEach((el) => maskDip(el, dipTo(el)));
    glyphs.forEach((el) => shiftDip(el, dipTo(el)));

    if (left && chips.length) {
      const x = chipOutX();
      chips.forEach((c) => gsap.set(c, { x }));
      if (copyBox) gsap.set(copyBox, { opacity: 0, y: LEFT_SHIFT });
    }

    // Edge-on and withdrawn, the same pose addShowcase swaps the artwork at.
    gsap.set(showcase, { rotationY: -90, z: -SHOW_DEPTH });

    /* And the tape not yet on. The stylesheet's rest pose is 1 — stuck down —
       so that a page with no JS shows a photograph properly taped rather than
       one held by a curled strip; this is the one path where something is
       coming to press it, so it is also the only place that may take it off. */
    strips.forEach((t) => t?.style.setProperty("--peel", "0"));

    // The key visual is deliberately absent — see the block comment above.
  }

  function addReturn(tl: gsap.core.Timeline, at: number) {
    if (!left || !chips.length) return null;

    const sub = gsap.timeline();
    chips.forEach((c, i) => {
      sub.to(c, { x: 0, duration: CHIP_IN, ease: "power3.out" }, i * CHIP_STAGGER);
    });
    if (copyBox) {
      sub.to(copyBox, { opacity: 1, y: 0, duration: LEFT_IN, ease: "power3.out" }, 0);
    }

    tl.add(sub, at);
    return sub;
  }

  function addShowcaseIn(tl: gsap.core.Timeline, at: number) {
    if (!showcase.length) return null;

    const sub = gsap.timeline();
    showcase.forEach((el, i) => {
      sub.to(
        el,
        { rotationY: 0, z: 0, duration: SHOW_TURN / 2, ease: "power2.out" },
        i * SHOW_LAG // still what keeps the two from reading as one object
      );
    });

    tl.add(sub, at);
    return sub;
  }

  /* The strips going on. Written as a plain number onto --peel rather than
     tweened by GSAP's CSSPlugin, for the reason peel.ts gives: the value is
     unitless and there is nothing for the plugin to infer. */
  function addPress(tl: gsap.core.Timeline, at: number) {
    const live = strips.filter(Boolean) as HTMLElement[];
    if (!live.length) return null;

    const sub = gsap.timeline();
    live.forEach((tape, i) => {
      const st = { p: 0 };
      sub.to(
        st,
        {
          p: 1,
          duration: PRESS,
          ease: PRESS_EASE,
          onUpdate: () => tape.style.setProperty("--peel", String(st.p)),
        },
        // The pair's own offset, so each strip follows its own photograph in.
        i * SHOW_LAG
      );
    });

    tl.add(sub, at);
    return sub;
  }

  function playEntrance() {
    // The rail's own 0.4s fade, in global.css. ENTER.RING_AT is set to
    // land the opening ring on the end of it.
    track!.classList.add("is-ready");

    enter = gsap.timeline();
    enter.to(
      rings[activeIndex],
      { scale: 1, opacity: 1, duration: RING_IN, ease: EASE_OPEN },
      ENTER.RING_AT
    );

    if (letters.length)
      addRise(enter, letters, ENTER.TOP_AT, WORD.STAGGER, maskDip, maskAt);
    if (glyphs.length)
      addRise(enter, glyphs, ENTER.BOTTOM_AT, WORD.BOTTOM_STAGGER, shiftDip, shiftAt);

    /* Parked in the same handles the click path uses, so an impatient visitor
       who selects a tape mid-entrance is covered by goTo's existing interrupt
       handling rather than by a second copy of it. */
    showTl = addShowcaseIn(enter, ENTER.SHOW_AT);
    pressTl = addPress(enter, ENTER.TAPE_AT);
    leftTl = addReturn(enter, ENTER.LEFT_AT);
  }

  function markState() {
    rolls.forEach((btn, i) => {
      const on = i === activeIndex;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
      gsap.set(btn, { zIndex: on ? 2 : 1 });
    });
  }

  function goTo(index: number) {
    if (index === activeIndex) return;
    activeIndex = index;

    // Land on the nearest equivalent angle, so the ring takes the short way
    // round instead of unwinding 270deg.
    const target = ACTIVE_ANGLE - index * STEP;
    const delta = ((((target - spin.rot) % 360) + 540) % 360) - 180;

    /* Run mid-flight work to its end, because killing it would strand the sheet
       half-drawn with the old colour still on the base, the chips off screen and
       the card edge-on.

       The dips and the left column are the exception. Completing them puts the
       letters and chips back home — visibly, since both are on screen for most
       of their travel — only to send them straight out again. They are left
       where they are instead: addDip reads the letter's position as its start,
       and the chips' tweens pick theirs up for free, because a .to() reads its
       start value when it first renders rather than when it is authored.

       fillLeft is not lost by skipping the completion — the incoming addLeft
       schedules its own. */
    if (wipe && wipe.isActive()) wipe.progress(1);
    // The turns are completed rather than left: abandoning one mid-flight would
    // have the next turn reverse direction from wherever it stopped.
    if (cardTl && cardTl.isActive()) cardTl.progress(1);
    if (showTl && showTl.isActive()) showTl.progress(1);
    /* And the tape stuck. A selection made while the section is still arriving
       kills the entrance below, and the strip would be left curled at whatever
       fraction it had reached — for good, since the press runs once. Completed
       rather than killed, for the same reason as the two turns above. */
    if (pressTl && pressTl.isActive()) pressTl.progress(1);

    // Killing leaves spin.rot where it stopped, which is what delta was measured
    // against — so an interrupted selection re-aims instead of snapping.
    if (timeline) timeline.kill();
    /* A selection made while the section is still arriving. The showcase was
       completed just above — it shares its handle with the entrance — and what
       is left is the words and the chips, which are exactly the two the comment
       above leaves in place on purpose. */
    if (enter) {
      enter.kill();
      enter = null;
    }
    markState();

    if (reduced) {
      gsap.set(rings, { scale: 0, opacity: 0 });
      spin.rot += delta;
      place();
      revealRing(rings[index]);
      if (hasBg) bgBase!.style.background = varOf(rolls[index], "--bg");
      // Per letter, not on :root — the dip writes an inline --word-colour that
      // would win over anything set here.
      const wc = varOf(rolls[index], "--word");
      letters.forEach((el) => el.style.setProperty("--word-colour", wc));
      glyphs.forEach((el) => {
        el.style.setProperty("--word-colour", wc);
        gsap.set(el, { y: 0 });
      });
      // No dip to hide the change behind, so it simply happens.
      setWord(index);
      const rm = modelOf(rolls[index]);
      if (viewer && rm && viewer.ready(rm)) {
        viewer.show(rm);
        viewer.spin(0);
      } else if (card && cardOf(rolls[index])) {
        card.src = cardOf(rolls[index]);
      }
      setShowcase(index);
      gsap.set(showcase, { rotationY: 0, z: 0 });
      paintChip(subhead, rolls[index]);
      fillLeft(index);
      return dispatch(index);
    }

    // Absolute seconds rather than "+=" offsets: the schedule deliberately
    // overlaps, and relative offsets make that very hard to read back.
    const atTravel = RING_OUT - CLOSE_OVERLAP;
    const atOpen = atTravel + TRAVEL - OPEN_LEAD;

    timeline = gsap.timeline();

    timeline
      .to(rings, { scale: 0, opacity: 0, duration: RING_OUT, ease: EASE_CLOSE }, 0)
      .to(
        spin,
        { rot: spin.rot + delta, duration: TRAVEL, ease: EASE, onUpdate: place },
        atTravel
      )
      .to(rings[index], { scale: 1, opacity: 1, duration: RING_IN, ease: EASE_OPEN }, atOpen);

    const wordColour = varOf(rolls[index], "--word");

    if (hasBg) wipe = addWipe(timeline, index, atOpen);

    // Both words drop on the click and are gone before the sheet is released.
    // Each returns the moment the sheet has finished passing it, so they come
    // back in the sheet's own direction — THE first, then CREATIVE.
    if (letters.length)
      word = addDip(
        timeline,
        letters,
        wordColour,
        0,
        WORD.STAGGER,
        maskDip,
        maskAt,
        atOpen + sheetClears(topWord) + WORD_AFTER_SHEET
      );
    if (glyphs.length)
      bottom = addDip(
        timeline,
        glyphs,
        wordColour,
        BOTTOM_LEAD,
        WORD.BOTTOM_STAGGER,
        shiftDip,
        shiftAt,
        atOpen + sheetClears(bottomWord) + WORD_AFTER_SHEET,
        // The word itself changes here, under the fold, between the drop and
        // the return — so the letters go down as CREATIVE and come back as
        // FIXER, which is the whole point of the dip. Then re-park, because the
        // hole each letter is hiding in was measured around the old word.
        (repark) => {
          setWord(index);
          repark();
        }
      );

    cardTl = addCard(timeline, index, CARD_AT);
    showTl = addShowcase(timeline, index, SHOW_AT);
    // Exit with the orbit; return gated on the sheet landing. With no background
    // there is nothing to wait for, so the chips fall back to their own beat.
    leftTl = addLeft(timeline, index, atTravel, hasBg ? atOpen + BG_REVEAL : 0);

    dispatch(index);
  }

  function dispatch(index: number) {
    track!.dispatchEvent(
      new CustomEvent("roll:change", {
        bubbles: true,
        detail: { index, id: rolls[index].dataset.index },
      })
    );
  }

  /* Listeners all share one signal, so cleanup is a single abort() and none can
     be missed. */
  const ac = new AbortController();
  const { signal } = ac;

  rolls.forEach((btn, i) => {
    gsap.set(btn, { xPercent: -50, yPercent: -50 });
    btn.addEventListener("click", () => goTo(i), { signal });
  });

  track.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next =
        (activeIndex + (e.key === "ArrowRight" ? 1 : -1) + rolls.length) % rolls.length;
      goTo(next);
      rolls[next].focus();
    },
    { signal }
  );

  /* Pointer-driven lean. Skipped on touch, where there is no hover to read and
     the handler would only ever fire on a tap, and skipped under reduced
     motion, which is what a lean that follows the cursor is exactly a case of.
     Left on the window rather than the section so the roll keeps responding
     while the pointer is out over the margins. */
  const hover = window.matchMedia("(hover: hover)").matches;
  let viewIo: IntersectionObserver | null = null;
  if (!reduced && hover) {
    window.addEventListener("pointermove", aimRoll, { signal, passive: true });
    document.addEventListener("pointerleave", restRoll, { signal });
    window.addEventListener("blur", restRoll, { signal });

    /* The section is one viewport tall on a long page, and the pointer carries
       on moving after it has been scrolled past. Without this the roll would go
       on easing — and the renderer on drawing frames for it — somewhere nobody
       is looking. Sent home on the way out, so scrolling back finds it face-on
       rather than holding the last lean it was given. */
    viewIo = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) restRoll();
    });
    viewIo.observe(root);
  }

  let resizeTimer: ReturnType<typeof setTimeout>;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measure();
        place();
        lastScroll = null; // offsetTop may have moved, so force a recompute
        applyParallax();
      }, 120);
    },
    { signal }
  );

  measure();
  gsap.set(rings, { scale: 0, opacity: 0 });
  place();
  markState();
  // Seed the stage so the first paint is correct rather than flashing the CSS
  // default.
  if (hasBg) {
    bgBase!.style.background = varOf(rolls[activeIndex], "--bg");
    root.style.setProperty("--word-colour", varOf(rolls[activeIndex], "--word"));
  }
  /* Decode every card up front — the src swaps on the single frame the turn is
     edge-on, and an undecoded image draws nothing. The elements are retained
     rather than discarded: a bare `new Image().src` is collectable the moment it
     leaves scope, taking the decoded bitmap with it. */
  const preloaded = Array.from(
    new Set(
      rolls
        .reduce<string[]>(
          (list, b) =>
            /* The strips are in here for the same reason and are the ones that
               most need to be: three of the six tapes share one 3.9MB SVG, so
               without a decode up front the first selection onto a clear tape
               would turn a card over onto an empty strip. Deduped — the six
               tapes are four rolls. */
            list.concat(cardOf(b) || [], showcaseOf(b), stripOf(b)?.src || []),
          []
        )
        .filter(Boolean)
    )
  )
    .map((src) => {
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => {});
      return img;
    });
  if (card && cardOf(rolls[activeIndex])) card.src = cardOf(rolls[activeIndex]);

  /* The 3D stage. Dynamic import so three.js and the loaders ship as their
     own chunk, fetched after the section is interactive; the GLBs follow
     inside createTapeViewer. Until all of it lands, the flat <img> above is
     the key visual, and every selection falls back to swapping its src — so
     a slow network or a failed chunk degrades to exactly the old behaviour.
     The img is hidden rather than removed when the viewer takes over, in
     case the WebGL context is ever lost. */
  /* THE SELECTED TAPE FIRST, and the order is load order — createTapeViewer
     waits for the head of this list and streams the tail behind it. Put the
     active one anywhere else and the slot stays empty while models for tapes
     nobody has clicked come down ahead of the one on screen. */
  const active = modelOf(rolls[activeIndex]);
  const modelUrls = Array.from(
    new Set([active, ...rolls.map(modelOf)].filter(Boolean)),
  );
  if (keyVisual && modelUrls.length) {
    /* Hidden from mount, not from viewer-ready. The img is the no-JS
       fallback; once scripts are running the roll is coming, and letting the
       flat card paint first just flashes artwork the roll is about to
       replace. The cost is an empty slot while the chunk and models load. */
    if (card) card.style.visibility = "hidden";
    import("./tape3d")
      .then(({ createTapeViewer }) => createTapeViewer(keyVisual, modelUrls))
      .then((v) => {
        if (viewerGone) return v.dispose();
        viewer = v;
        // Catch up to wherever the selection is by now, not where it was
        // when the load started.
        v.show(modelOf(rolls[activeIndex]));
        // Face-on the moment it lands, whenever that is. The roll takes no part
        // in the entrance, so there is nothing here to wait for or catch up to.
        v.spin(0);
      })
      .catch(() => {
        // No three after all — put the flat fallback back on stage. An
        // explicit `visible`, not "": the stylesheet now hides this img from
        // first paint, and only an inline value out-specifies it.
        if (!card) return;
        card.style.visibility = "visible";
      });
  }

  // Perspective on the elements themselves, not a shared parent — the key
  // visual already has its own and the two want independent vanishing points.
  gsap.set(showcase, { transformPerspective: SHOW_PERSPECTIVE });
  setShowcase(activeIndex);
  collectParallax();
  applyParallax();
  gsap.ticker.add(applyParallax);
  paintChip(subhead, rolls[activeIndex]);
  buildChips();
  fillLeft(activeIndex);
  /* Hold everything back until the section is reached — see ENTER above.
     Reduced motion gets what the section always did: the rail fades in on load
     and the ring opens behind it, with nothing parked and nothing to wait for. */
  let io: IntersectionObserver | null = null;
  if (reduced) {
    track.classList.add("is-ready");
    // The rolls are already placed, so the opening ring waits only for the
    // track's fade-in.
    revealRing(rings[activeIndex], 0.4);
  } else {
    park();
    io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        // Disconnected on the way in, not on the way out: once is once, and a
        // visitor scrolling back keeps the tape they chose.
        io?.disconnect();
        io = null;
        playEntrance();
      },
      { rootMargin: ENTER.MARGIN }
    );
    io.observe(root);
  }

  /* Teardown. Everything with a lifetime longer than one frame is released
     here: the ticker callback would otherwise keep running against detached
     nodes, and the listeners would double up when StrictMode remounts onto the
     same DOM. */
  return () => {
    ac.abort();
    clearTimeout(resizeTimer);
    io?.disconnect();
    viewIo?.disconnect();
    gsap.ticker.remove(applyParallax);
    [timeline, enter, wipe, word, bottom, leftTl, cardTl, showTl, pressTl].forEach((t) =>
      t?.kill()
    );
    gsap.killTweensOf([...rings, ...letters, ...glyphs, ...showcase, ...chips, spin]);
    // Back to the stylesheet's rest pose, which is the photograph taped down.
    strips.forEach((t) => t?.style.removeProperty("--peel"));
    if (card) gsap.killTweensOf(card);
    if (copyBox) gsap.killTweensOf(copyBox);
    // The dispose runs here OR in the loader's then-branch, never both:
    // viewerGone tells a load that resolves after teardown to discard itself.
    viewerGone = true;
    viewer?.dispose();
    viewer = null;
    if (card) card.style.visibility = "";
    preloaded.length = 0;
  };
}
