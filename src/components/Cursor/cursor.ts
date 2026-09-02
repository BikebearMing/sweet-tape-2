/* The custom cursor — the taped arrow (public/assets/new-cursor.svg).
 *
 * It IS the pointer, so it tracks 1:1 by default: a cursor that lags where
 * you clicked is a cursor that lies, and every target on this page is small
 * (roll buttons on an orbit). CONFIG.CHASE loosens that into a trail if the
 * looser feel is wanted.
 *
 * Driven from GSAP's ticker rather than the pointermove event: moves arrive
 * in coalesced bursts, and writing a transform per event does work the screen
 * never shows. One write per frame, on the same ticker Lenis and the hero run
 * on, so all three settle together.
 *
 * Native cursor: hidden by a class this file adds to <html>, never by a
 * stylesheet rule on its own. If the module fails to load, is skipped for a
 * coarse pointer, or is torn down, the class is absent and the real cursor is
 * simply there — the page is never left with no pointer at all.
 */
import gsap from "gsap";

/* What counts as interactive. Matched with closest() on a delegated listener
   rather than bound per element: the slider's engine rebuilds its chips and
   roll pool on mount, and anything bound at init would be pointing at nodes
   that no longer exist. */
const INTERACTIVE =
  'a[href], button, [role="button"], input, select, textarea, label, summary, [data-cursor]';

/* Live-tweak in dev: cursor.CONFIG.HOVER = 1.4; (takes effect next state) */
export const CONFIG = {
  /* Fraction of the remaining distance covered each frame. 1 is exact — the
     arrow is the pointer. Drop toward 0.2 for a dragged-sticker trail. */
  CHASE: 1,
  /* Resting lean, clockwise. Lives here rather than as a CSS `rotate` — the
     individual rotate property is applied BEFORE the transform GSAP writes,
     which would spin the tracking translation with it and skew the arrow off
     the pointer by this angle. Rotation on this element belongs to GSAP
     alone; every state below is stated relative to this. */
  BASE: 7,
  HOVER: 1.18, // scale over something clickable
  PRESS: 0.86, // scale while the button is held
  TILT: -8, // degrees the arrow kicks back from BASE on hover
  FADE: 0.2, // seconds, the show/hide at the window's edge
  MORPH: 0.28, // seconds, the state change
};

/* The three faces. Sizes are the artwork's own box at 0.8 — the same
   reduction the arrow already carried — and the hotspot is the point of the
   drawing that must sit under the real pointer: the arrow's tip, the hand's
   fingertip, the I-beam's middle, in those same reduced pixels. */
const VARIANTS = {
  arrow: { url: "/assets/new-cursor.svg", w: 48, h: 52, hx: 11.2, hy: 12 },
  pointer: { url: "/assets/cursor-pointer.svg", w: 46.4, h: 49.6, hx: 13.3, hy: 6.3 },
  type: { url: "/assets/cursor-type.svg", w: 25.6, h: 40.8, hx: 12.8, hy: 20.4 },
};
type Variant = keyof typeof VARIANTS;

/* A caret belongs over anything text goes into — including a rich editor,
   which is a div and would otherwise read as a button. */
const TEXTUAL = "input, textarea, [contenteditable]";

export function initCursor(): () => void {
  /* Touch and pen get nothing: there is no hover to react to, no persistent
     pointer to represent, and hiding the native cursor on a hybrid device
     would leave a trackpad user with an invisible one. */
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const arrow = document.createElement("div");
  arrow.className = "cursor-arrow";
  // Decorative, and duplicated by the real pointer for anyone not seeing it.
  arrow.setAttribute("aria-hidden", "true");

  const root = document.documentElement;
  root.classList.add("has-cursor");
  document.body.append(arrow);

  /* Hidden until the pointer first moves — otherwise it sits in the top-left
     corner until the mouse is touched, which reads as a rendering bug rather
     than as a cursor waiting. */
  gsap.set(arrow, { autoAlpha: 0, rotation: CONFIG.BASE });

  let px = 0; // where the pointer is
  let py = 0;
  let ax = 0; // where the arrow has got to
  let ay = 0;
  let live = false; // has the pointer been seen at all

  const setX = gsap.quickSetter(arrow, "x", "px");
  const setY = gsap.quickSetter(arrow, "y", "px");

  const show = (on: boolean) =>
    gsap.to(arrow, {
      autoAlpha: on ? 1 : 0,
      duration: reduced ? 0 : CONFIG.FADE,
      overwrite: "auto",
    });

  /* State is scale and tilt together — GSAP holds both on the same transform
     it is writing x/y into, which is why they are set here rather than by a
     CSS class with a transition. */
  const morph = (scale: number, rotation: number) =>
    gsap.to(arrow, {
      scale,
      rotation,
      duration: reduced ? 0 : CONFIG.MORPH,
      ease: "power3.out",
      overwrite: "auto",
    });

  /* Which face is on screen. The box, the artwork and the hotspot change
     together — they are one drawing — and inline styles are used so the
     stylesheet keeps stating the arrow as the resting default. */
  let variant: Variant = "arrow";
  const paint = (v: (typeof VARIANTS)[Variant]) => {
    arrow.style.backgroundImage = `url("${v.url}")`;
    arrow.style.width = `${v.w}px`;
    arrow.style.height = `${v.h}px`;
    /* translate, not transform — GSAP owns the transform for tracking. It is
       applied first, so the scale below still pivots on the hotspot. */
    arrow.style.translate = `${-v.hx}px ${-v.hy}px`;
    arrow.style.transformOrigin = `${v.hx}px ${v.hy}px`;
  };
  paint(VARIANTS.arrow);
  /* Prime the other two: the artwork is heavy (each is a traced raster), and
     a swap that lands on an unloaded background is a swap to nothing. */
  Object.values(VARIANTS).forEach((v) => {
    new Image().src = v.url;
  });

  /* Swapping faces is a cut: the artwork is exchanged on the spot and only
     the scale and tilt tween, exactly as they do when the face stays put. */
  const face = (next: Variant, scale: number, rotation: number) => {
    if (next !== variant) {
      variant = next;
      paint(VARIANTS[next]);
    }
    morph(scale, rotation);
  };

  function onMove(e: PointerEvent) {
    px = e.clientX;
    py = e.clientY;
    if (live) return;
    // First sighting: place it exactly, rather than letting it fly in from
    // the corner on the first frame of the chase.
    live = true;
    ax = px;
    ay = py;
    setX(ax);
    setY(ay);
    show(true);
  }

  const tick = () => {
    if (!live) return;
    /* Reduced motion gets the position, not the chase — a trailing element
       is exactly the kind of incidental movement the setting asks to lose. */
    const k = reduced ? 1 : Math.min(1, Math.max(0, CONFIG.CHASE));
    ax += (px - ax) * k;
    ay += (py - ay) * k;
    setX(ax);
    setY(ay);
  };
  gsap.ticker.add(tick);

  /* Hover, by delegation. pointerover/pointerout fire on every node crossing,
     so both ends resolve to the nearest interactive ancestor and the state
     only changes when THAT changes — moving between a button's own children
     is not a leave. */
  let hovered: Element | null = null;
  let held = false;
  /* One place the state is decided, so hover and press cannot disagree about
     which face is showing — every event below just updates its own flag and
     asks for the state that follows. */
  const apply = () =>
    face(
      hovered ? (hovered.matches(TEXTUAL) ? "type" : "pointer") : "arrow",
      held ? CONFIG.PRESS : hovered ? CONFIG.HOVER : 1,
      CONFIG.BASE + (hovered ? CONFIG.TILT : 0),
    );
  const onOver = (e: PointerEvent) => {
    const hit = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
    if (hit === hovered) return;
    hovered = hit;
    apply();
  };
  const onOut = (e: PointerEvent) => {
    if (!hovered) return;
    // relatedTarget is where the pointer went; still inside means no leave.
    const to = e.relatedTarget as Element | null;
    if (to && hovered.contains(to)) return;
    hovered = null;
    apply();
  };

  const onDown = () => {
    held = true;
    apply();
  };
  const onUp = () => {
    held = false;
    apply();
  };

  /* The window's edges. pointerleave on the document covers walking off the
     page; blur covers the pointer leaving via something over the page —
     devtools, a tab switch, a native menu — where no leave event arrives and
     the arrow would otherwise stay frozen mid-screen. */
  const onLeave = () => show(false);
  const onEnter = () => live && show(true);

  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerup", onUp, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  document.addEventListener("pointerenter", onEnter);
  window.addEventListener("blur", onLeave);

  if (process.env.NODE_ENV !== "production") {
    // Console handle for tuning, same convention as window.hero / window.band.
    Object.assign(window, { cursor: { CONFIG } });
  }

  return () => {
    gsap.ticker.remove(tick);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("pointerenter", onEnter);
    window.removeEventListener("blur", onLeave);
    gsap.killTweensOf(arrow);
    root.classList.remove("has-cursor");
    arrow.remove();
  };
}
