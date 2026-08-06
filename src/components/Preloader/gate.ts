/* Sweet Tape — the hand-off between the preloader and the page under it.
 *
 * One fact, held on the document rather than in a module variable: while
 * `html[data-loading]` is set, the page is still behind the cover and anything
 * that plays on load should wait. Right now that is the hero's title reveal and
 * nothing else — everything else on the page is either scroll-driven, below the
 * fold, or shut.
 *
 * On the DOM and not in a React context, for the same reason the engines are
 * plain DOM: the two ends are in different subtrees (the layout's preloader and
 * the page's hero), the signal fires once, and threading state between them
 * through React would mean re-rendering the hero at the exact moment a timeline
 * holds transforms on its letters.
 *
 * The attribute is written into the server HTML in (frontend)/layout.tsx, so it
 * is true from the first byte — the stylesheet locks the scroll off it before a
 * single line of JS has run. `release` takes it off, then announces.
 *
 * There is no lost-signal window: release clears the attribute BEFORE it
 * dispatches, so a subscriber arriving late reads an open gate and fires on the
 * spot rather than waiting for an event that has already been and gone.
 */

/** Dispatched on `window`, once, as the cover clears. */
const EVENT = "sweettape:revealed";

/* And one before it: the sweep, a little way into its move. Two signals rather
 * than one because "the page is yours" and "the paper is moving" are different
 * moments and different things want them. The hero's type waits for the first —
 * it is at the very top of the screen and is uncovered last. The roll wants the
 * second: it has to be ALREADY MOVING by the time the sheets pass over it, so
 * it starts while it is still covered and emerges mid-bounce. Waiting for the
 * page to be handed over would mean being revealed at a standstill and then
 * starting, which reads as two events.
 *
 * A module flag rather than an attribute on the document, unlike `held`: this
 * one is not true from the first byte, no stylesheet keys off it, and nothing
 * outside this bundle needs to read it. */
const SWEEP_EVENT = "sweettape:sweeping";
let sweeping = false;

/** Is the page still behind the cover? False on any page with no preloader. */
export function isHeld(): boolean {
  return document.documentElement.dataset.loading !== undefined;
}

/* Runs `fn` when the cover has gone — immediately if it already has, or if
   there is no preloader on this page at all. Returns an unsubscribe, so a
   caller torn down before the sweep (StrictMode's double mount) does not leave
   a listener behind holding a dead timeline. */
export function whenRevealed(fn: () => void): () => void {
  if (!isHeld()) {
    fn();
    return () => {};
  }

  const ac = new AbortController();
  window.addEventListener(EVENT, fn, { once: true, signal: ac.signal });
  return () => ac.abort();
}

/* Runs `fn` once the cover is on the move — immediately if it already is, if it
   has already gone, or if there is no preloader on this page at all. Same
   unsubscribe contract as whenRevealed. */
export function whenSweeping(fn: () => void): () => void {
  if (!isHeld() || sweeping) {
    fn();
    return () => {};
  }

  const ac = new AbortController();
  window.addEventListener(SWEEP_EVENT, fn, { once: true, signal: ac.signal });
  return () => ac.abort();
}

/* Called from inside the sweep — see PRELOADER.SWEEP_MARK for where, and why
   it is a little way in rather than at the start. */
export function startSweep(): void {
  sweeping = true;
  window.dispatchEvent(new Event(SWEEP_EVENT));
}

/* Called from the sweep, later — see PRELOADER.HANDOFF. Clearing the attribute
   is also what unlocks the scroll, since the stylesheet's lock is keyed on it.

   It marks the sweep as begun too, for the case where there never was one: the
   reduced-motion path releases the page on mount without a timeline, and a
   subscriber that arrives afterwards must not be left waiting on an event that
   is never coming. */
export function release(): void {
  sweeping = true;
  delete document.documentElement.dataset.loading;
  window.dispatchEvent(new Event(EVENT));
}
