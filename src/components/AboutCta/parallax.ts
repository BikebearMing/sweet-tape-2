/* Sweet Tape — the curtain drifting behind the way out.
 *
 * THE SHEET NEVER MOVES AND THE CURTAIN INSIDE IT DOES, which is the closing key
 * visual's photograph exactly (MakeItStick/parallax.ts, where the approach is
 * argued at length). Everything on this section is measured against the sheet's
 * own edges — the small line 174 down it, the crate's top edge clearing the
 * pill's foot, the arc along its bottom — so a sheet that slid would take the
 * whole composition with it. What moves is the picture behind all of that.
 *
 * AND THE CRATE GOES THE OTHER WAY, a fortieth as far. That is the part that
 * makes the rest of it visible, and it was not here at first: the curtain drifted
 * alone and the section looked completely still, because a parallax is not a
 * picture moving — it is two pictures moving at DIFFERENT RATES, and the eye
 * reads the difference rather than either one. A flat green field with no edge in
 * it has nothing to be measured against, however far it travels. The crate has
 * edges everywhere, so forty pixels of it against a curtain going the other way
 * is read immediately.
 *
 * IT IS BOUNDED BY AN APPOINTMENT, which is why it is small. The crate's top edge
 * is placed to clear the pill's foot by 15 (--cta-front-top in global.css), and
 * the crate is only ever high when the section is on its way OUT — by which time
 * the pill is at the top of the window or past it. The sheet paints behind the
 * copy in any case, so the worst frame is a tape passing behind a white pill
 * rather than over it.
 *
 * THE SLACK IS READ OFF THE LAYOUT rather than declared here. The stylesheet
 * cuts the curtain taller than the sheet (--cta-drift, in the About block of
 * global.css) and hangs the overhang half above and half below; this measures
 * that half. So the travel is whatever the stylesheet's overhang actually is —
 * the picture can never be driven past its own edge and let the section's green
 * show through, however that figure is retuned, and there is no second copy of
 * it here to keep in step.
 *
 * LINEAR, AND ZEROED AT THE CENTRE CROSSING, like every other parallax on this
 * site: the curtain is cropped exactly as the stylesheet cropped it at the
 * moment the sheet's middle passes the middle of the window, which is when it is
 * most looked at. The drift is what happens on the way in and on the way out.
 *
 * Driven off GSAP's ticker because Lenis is on that same ticker — a scroll
 * listener would read a position one frame stale. Positions are measured through
 * the offsetTop chain, which transforms do not disturb; a rect here would read
 * back the very offset this file writes and feed on itself.
 */
import gsap from "gsap";

import { onViewportChange, screenH } from "@/components/viewport";

export const CTA_PARALLAX = {
  /* Kept animating this far outside the viewport, so the curtain is never caught
     sitting still at an edge it is about to come back through. The closing key
     visual's figure. */
  NEAR_VIEW: "20% 0px",

  /* The two properties the stylesheet tunes the movement with, read at measure
     time rather than carried here — --cta-drift is measured off the layout as
     slack, and these two are read as numbers. Either can be set to nothing
     without this file knowing. */
  FRONT_PROP: "--cta-front-drift",

  /* THE ZOOM, AND IT IS THE ONE THING HERE THE OTHER PARALLAXES ON THIS SITE DO
   * NOT DO.
   *
   * A vertical drift needs the picture to have detail along the axis it travels,
   * and this one very nearly does not: the curtain is a field of vertical folds,
   * uniform down its whole length. Slide it and almost nothing changes. So the
   * picture is also wound down from a little over its cover size to exactly its
   * cover size across the crossing — folds spreading apart, which is a change on
   * the axis the photograph actually has detail on.
   *
   * READ OFF THE STYLESHEET, like the slack. --cta-zoom-gain sits with
   * --cta-drift in the About block, so both halves of the movement are tuned in
   * one place and either can be set to nothing without touching this file.
   *
   * IT IS A CEILING THAT COMES DOWN TO 1, never a range around it. The image is
   * cover-cropped to the sheet at exactly 1, so any value below would pull it
   * off its own edges and show the section's green down the sides. */
  ZOOM_PROP: "--cta-zoom-gain",
};

/**
 * Starts the curtain's drift inside its sheet.
 *
 * @param root the <section class="about-cta">
 * @returns the teardown, which hands the picture back to the stylesheet
 */
export function initCtaParallax(root: HTMLElement): () => void {
  const sheet = root.querySelector<HTMLElement>(".about-cta-sheet");
  const img = sheet?.querySelector<HTMLElement>(".about-cta-bg");
  const front = sheet?.querySelector<HTMLElement>(".about-cta-front");

  /* A photograph drifting behind a headline is decoration by definition; "reduce
     motion" parks it, and parked is the crop the stylesheet already draws. */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!sheet || !img || reduced) return () => {};

  /* Half the overhang — see the note above. */
  let slack = 0;
  /* How much bigger than its cover size the curtain starts, read off the
     stylesheet at measure time so the two halves of the movement are tuned
     together. A section whose author sets it to 0 gets the drift alone. */
  let zoomGain = 0;
  /* How far the crate goes against the curtain, in px — a share of its own
     height, read off the stylesheet and multiplied by the box at measure time.
     See --cta-front-drift, which is a ratio for two reasons. */
  let frontDrift = 0;
  /* How far the sheet's centre travels from the middle of the window before the
     section is fully off one edge or the other — half a window plus half the
     sheet. The full drift is therefore spent exactly over the curtain's visible
     life: saturation happens off screen, so the clamp is never something you
     see. */
  let range = 1;
  let centre = 0;

  let onScreen = true;

  function docTop(el: HTMLElement) {
    let y = 0;
    for (
      let n: HTMLElement | null = el;
      n;
      n = n.offsetParent as HTMLElement | null
    ) {
      y += n.offsetTop;
    }
    return y;
  }

  function measure() {
    const sheetH = sheet!.offsetHeight;
    slack = Math.max((img!.offsetHeight - sheetH) / 2, 0);
    centre = docTop(sheet!) + sheetH / 2;
    range = Math.max((screenH() + sheetH) / 2, 1);
    const cs = getComputedStyle(root);
    zoomGain =
      Math.max(parseFloat(cs.getPropertyValue(CTA_PARALLAX.ZOOM_PROP)), 0) || 0;
    /* A RATIO IN THE STYLESHEET AND PIXELS HERE. An unregistered custom property
       comes back from getComputedStyle as the token it was written as, so a
       length would arrive as a string with a unit still on it and parse to a
       number that means nothing — a 2.778vw drift reached this line as 2.778 and
       moved the crate three pixels instead of forty. --cta-front-drift is a bare
       share of the crate's own height for exactly that reason, and multiplying
       it by the measured box is also what keeps the travel the same fraction of
       the artwork at every window. */
    const share =
      Math.max(parseFloat(cs.getPropertyValue(CTA_PARALLAX.FRONT_PROP)), 0) ||
      0;
    frontDrift = share * (front?.offsetHeight ?? 0);
  }

  function frameTick() {
    if (!onScreen || (slack <= 0 && zoomGain <= 0 && frontDrift <= 0)) return;
    const viewCentre = window.scrollY + screenH() / 2;
    /* Positive once the sheet's centre is above the middle of the window, which
       is to say once the section is on its way out. Clamped, so a fast flick
       past the section cannot throw the crop past its overhang. */
    const t = Math.max(-1, Math.min(1, (viewCentre - centre) / range));

    /* DOWNWARD as the page scrolls up past it. The sign is the same statement
       the closing key visual makes and the hero makes with a positive depth: the
       picture gives back some of every scrolled pixel, so it reads as sitting
       BEHIND the sheet it is seen through. Reverse it and the curtain reads as
       nearer than the type printed on it, which nothing physical does. */
    const pan = t * slack;

    /* THE ZOOM, ON THE SAME t AND IN THE SAME DIRECTION. Biggest as the section
       comes up the screen, exactly its cover size by the time it leaves — so the
       picture settles INTO the sheet rather than pulsing about inside it, and
       the frame it holds at the crossing is the one the crop was chosen for.
       (1 - t) / 2 maps the -1..1 crossing onto 1..0. */
    const zoom = 1 + zoomGain * ((1 - t) / 2);

    /* Half-px resolution: below that the churn repaints a still page for
       movement nobody can see. The zoom is quantised against the same idea —
       four decimals is well under a pixel on a picture this size. */
    const snapped = Math.round(pan * 2) / 2;
    const zoomed = Math.round(zoom * 10000) / 10000;
    const stamp = `${snapped}/${zoomed}`;
    if (img!.dataset.at === stamp) return;
    img!.dataset.at = stamp;
    /* Custom properties rather than the transform, because the transform is the
       stylesheet's: it composes both of these into a translate and a scale of
       its own, and the translate also carries the -50% centring that writing the
       transform here would silently take over. */
    img!.style.setProperty("--cta-pan", `${snapped}px`);
    img!.style.setProperty("--cta-zoom", String(zoomed));

    /* THE CRATE, AGAINST THE CURTAIN. Negative t is the section coming up the
       screen, so the sign here puts the crate LOW on the way in and high on the
       way out — the opposite of the curtain, which is the whole of the effect.
       Same clamp, same half-pixel quantisation, its own stamp. */
    if (front && frontDrift > 0) {
      const lead = Math.round(-t * frontDrift * 2) / 2;
      if (front.dataset.at !== String(lead)) {
        front.dataset.at = String(lead);
        front.style.setProperty("--cta-front-pan", `${lead}px`);
      }
    }
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
    },
    { rootMargin: CTA_PARALLAX.NEAR_VIEW },
  );
  io.observe(sheet);

  /* The section is sized in vw, so a width change is what moves the sheet and
     resizes the overhang. */
  const ro = new ResizeObserver(measure);
  ro.observe(root);
  const stopVp = onViewportChange(measure);

  /* AND AGAIN WHEN THE PICTURES ARRIVE, which is the one measurement here that
     is not available on the first frame. Both images are lazy — they are on the
     last section of a long page — and the crate is the one with no height in the
     stylesheet: its box is its file's own aspect at the sheet's width, so until
     the bytes land it is 100% wide and NOTHING tall, and a drift measured as a
     share of that is a drift of zero. Measured once at mount it stayed zero for
     the life of the page, and the crate never moved.

     The curtain does not need this — its height is a calc off the sheet — but it
     is listened to anyway: a picture that has just changed size is a picture
     worth re-measuring, whichever one it is. */
  const ac = new AbortController();
  for (const picture of [img, front]) {
    picture?.addEventListener("load", measure, { signal: ac.signal });
  }

  measure();
  gsap.ticker.add(frameTick);

  return () => {
    stopVp();
    ac.abort();
    io.disconnect();
    ro.disconnect();
    gsap.ticker.remove(frameTick);
    /* Back to the stylesheet's crop. A teardown mid-section must not leave the
       picture frozen at whatever offset it happened to be carrying. */
    img.style.removeProperty("--cta-pan");
    img.style.removeProperty("--cta-zoom");
    delete img.dataset.at;
    front?.style.removeProperty("--cta-front-pan");
    if (front) delete front.dataset.at;
  };
}
