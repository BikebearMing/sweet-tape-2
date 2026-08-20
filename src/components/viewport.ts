/* Sweet Tape — the viewport the layout is allowed to see.
 *
 * THE BUG THIS FILE EXISTS FOR. On iOS Safari the address bar retracts as you
 * scroll down and comes back as you scroll up. That is not a chrome animation
 * over a fixed page: the window genuinely changes height mid-gesture, by around
 * 80px on a phone, and every change fires a `resize`. So a site that measures
 * anything off window.innerHeight re-measures it several times during a single
 * flick, and every re-measure moves something under the reader's thumb.
 *
 * On this site that is not a subtle wobble. The slider's fit (TapeSlider/fit.ts)
 * turns the window height into a translation of the whole centre column; the
 * pinning sections hand ScrollTrigger a frame that is one window tall and a
 * scroll distance measured from it. Change the height halfway down and the
 * drawing slides and the pin's start moves — which is the "smooth in devtools,
 * broken on the phone" report, and the reason it does not reproduce in devtools
 * is that a simulated viewport has no address bar to retract.
 *
 * THE FIX IS TO STOP ASKING. A phone's screen does not change size; only the
 * browser's furniture does. So the height is measured ONCE and held for the
 * session, and the only thing that can move it is a change of WIDTH — which on
 * a phone means a rotation, and on a desktop means an actual window resize,
 * both of which are real reflows that should re-measure.
 *
 * WHICH height to hold is the second half of it, and the stylesheet already
 * argues the case at .about-open: the SMALL viewport, the height with the
 * toolbar out. Hold the large one and a full-screen box is one toolbar taller
 * than the window at rest, so the page opens with a strip of the next section
 * already showing. Hold the small one and the box always fits, and what the
 * retracting toolbar uncovers is a little more of the section — which is what
 * every other site does and what the platform's own `svh` unit is for.
 *
 * SO CSS AND JS READ THE SAME NUMBER. --screen is a registered length, declared
 * in the stylesheet's Tokens as 100svh so it is correct before a line of this
 * has run, and pinned to a px value here on touch devices so it cannot drift
 * afterwards. screenH() below returns that same value to the engines. There is
 * no third copy and there must not be: a pin measured off one height inside a
 * box laid out at another is exactly the seam that shows.
 */

/* Coarse pointer AND no hover — the pair, rather than a user-agent sniff or
   `ontouchstart`. A touchscreen laptop answers yes to touch events and has a
   mouse and a window that really does resize; a phone is the device that has
   neither a hover state nor a stable-height browser. */
const TOUCH =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

/* What the last measurement saw. Width decides whether a resize is real; height
   is what everything else reads. */
let w = typeof window === "undefined" ? 0 : window.innerWidth;
let h = 0;

/* Subscribers, called only when the numbers above actually moved. A Set rather
   than an array so a component that mounts twice under StrictMode and cleans up
   once cannot leave a duplicate behind. */
const listeners = new Set<() => void>();

/* The small viewport in pixels.
 *
 * Read off the registered --screen property rather than computed here, because
 * the stylesheet's 100svh is the browser's own answer to "how tall is the
 * window with the toolbar out" and there is no way to derive it from
 * innerHeight — innerHeight is whatever the toolbar happens to be doing right
 * now. Registered as <length> is what makes this work: an unregistered custom
 * property comes back as the literal token "100svh", a registered one is
 * absolutised to px at computed-value time.
 *
 * Falls back to innerHeight if the property is missing, which is a browser
 * without @property rather than a browser without svh. */
function measureSmall(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--screen")
    .trim();
  const px = parseFloat(raw);
  return Number.isFinite(px) && px > 0 ? px : window.innerHeight;
}

/** The window's width. The same number window.innerWidth gives; it is here so
    that geometry code reads both axes from one place. */
export function screenW(): number {
  return w;
}

/** The window's height, held still for the session on a phone. Use this
    ANYWHERE a layout or a scroll position is derived from the viewport —
    window.innerHeight is only correct for things that should genuinely follow
    the toolbar, of which this site has none. */
export function screenH(): number {
  return h || window.innerHeight;
}

/** Subscribe to real viewport changes — a rotation or a desktop resize, never a
    retracting toolbar. Returns its own unsubscribe.

    Callers that used to listen for `resize` directly should use this instead;
    the whole point is that there is one decision about what counts as a change
    and every engine on the site abides by it. */
export function onViewportChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** A ResizeObserver that only reports WIDTH changes.
 *
 * For the two callers that watch document.documentElement. Observing the
 * document is how you catch a zoom or a devtools pane, neither of which
 * reliably fires `resize` — but it is also how you catch the address bar, which
 * changes the document's height and nothing else. Everything on this site that
 * is worth re-measuring is sized in vw, so the height half of the callback is
 * pure churn at best and a mid-scroll relayout at worst.
 *
 * Rounded before comparing: sub-pixel widths on a scaled display would
 * otherwise report a change on every frame the observer runs. */
export function observeWidth(
  el: Element,
  fn: () => void,
): () => void {
  let last = Math.round(el.getBoundingClientRect().width);
  const ro = new ResizeObserver(() => {
    const now = Math.round(el.getBoundingClientRect().width);
    if (now === last) return;
    last = now;
    fn();
  });
  ro.observe(el);
  return () => ro.disconnect();
}

/* Has the resize we were just handed changed anything we hold?
 *
 * WIDTH IS THE TEST, and on a touch device it is the only test. A phone's
 * height changes constantly and means nothing; its width changes on rotation
 * and means everything. On a desktop both axes are the user dragging a window
 * corner, so both count.
 *
 * The height is re-read from the stylesheet rather than from innerHeight even
 * on desktop, so the two paths cannot disagree about what a screen is. */
function sample(): boolean {
  const nw = window.innerWidth;
  const nh = measureSmall();
  const moved = TOUCH ? nw !== w : nw !== w || Math.abs(nh - h) > 1;
  if (!moved) return false;
  w = nw;
  h = nh;
  return true;
}

/* Mounted once, from SmoothScroll. Everything else on the site reads the
   exported functions and never touches window.

   THE PIN, and it only happens on touch: --screen is left as the stylesheet's
   100svh on desktop, where svh and vh are the same number and a real resize
   should genuinely reflow. On a phone it is frozen to the px this session
   opened at, so that even a browser whose svh follows the toolbar — and some
   in-app webviews do — cannot move the layout mid-scroll. */
export function initViewport(): () => void {
  h = measureSmall();
  w = window.innerWidth;
  if (TOUCH) document.documentElement.style.setProperty("--screen", `${h}px`);

  const ac = new AbortController();

  function onResize() {
    /* Unpin before measuring, or we would only ever read back the value we
       wrote — the property IS the measurement. Restoring the stylesheet's
       100svh lets the browser answer for the new orientation, then we pin the
       answer again. */
    if (TOUCH) document.documentElement.style.removeProperty("--screen");
    const changed = sample();
    if (TOUCH) document.documentElement.style.setProperty("--screen", `${h}px`);
    if (changed) for (const fn of listeners) fn();
  }

  /* orientationchange as well as resize, and not instead of it: Safari fires
     orientationchange BEFORE the new dimensions are readable, so the resize
     that follows is the one that carries the numbers. Both are cheap — sample()
     is what decides whether anything happens. */
  window.addEventListener("resize", onResize, {
    signal: ac.signal,
    passive: true,
  });
  window.addEventListener("orientationchange", onResize, {
    signal: ac.signal,
    passive: true,
  });

  return () => {
    ac.abort();
    document.documentElement.style.removeProperty("--screen");
  };
}
