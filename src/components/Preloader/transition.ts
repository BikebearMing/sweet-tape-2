/* Sweet Tape — the page transition.
 *
 * The preloader's rainbow, coming DOWN. One route ends by the stack of coloured
 * sheets falling over it deepest-first, and the next one begins with the same
 * stack lifting off exactly the way it lifts off the home page on a cold load.
 * Nothing here is a second version of that gesture: it is the same elements, the
 * same schedule builder, the same ease and the same two hand-off signals —
 * scheduleSheets and sheetsOf in Preloader/reveal.ts, startSweep and release in
 * Preloader/gate.ts. Only the numbers below are its own, and only because a
 * transition between two pages the reader has asked for cannot take as long as
 * an overture they have not.
 *
 * WHY THE ARC LEADS BOTH WAYS. Every sheet's bottom edge is one wide arc and its
 * top edge is straight. Coming down the arc is the leading edge; lifting off, the
 * arc is again what passes over the page. So the reader never sees a flat line
 * cross the screen — which is the whole reason the cover is cut this way, and
 * the reason the transition covers downward and uncovers UPWARD rather than
 * carrying on down and out of the bottom of the window. A stack continuing in
 * one direction would leave on its straight edge, and a straight edge travelling
 * across a page is a window blind.
 *
 * THE COLOUR ORDER REVERSES WITH IT, and that falls out of the geometry rather
 * than being arranged. The sheets are opaque, so at any point on the screen you
 * see the frontmost one that has reached it: going up the front sheet leads and
 * the run is lime, coral, orange, yellow, lime, light blue, deep blue; coming
 * down the deepest must lead — anything else and the front sheet paints over
 * the whole screen before a single colour behind it has been seen — so the run
 * is that same spectrum backwards. The palette sweeps one way out and the other
 * way in.
 *
 * ROUTING IS THE OTHER HALF. The site's links are plain <a href> and were plain
 * document loads, which is why the preloader used to play on every page: each
 * navigation threw the whole document away, cover and all. This intercepts them
 * and hands the href to the router instead, so the curtain survives the swap —
 * it lives in the layout, which does not remount. That is not a detail of the
 * implementation, it IS the transition: there is no way to animate across a
 * navigation that discards the animation.
 *
 * AND THE INCOMING PAGE IS HELD WHILE IT HAPPENS. hold() goes on before the
 * router is told anything, so every component the new route mounts finds the
 * page behind a cover and queues its entrance on the gate, exactly as it would
 * on a cold load. The two signals then fire at the same FRACTIONS of the last
 * sheet's travel that the preloader uses (SWEEP_MARK, HANDOFF), so the hero's
 * roll starts under the paper and its title starts as the last arc clears the
 * top of the screen — on a route change and on a cold load alike, off one set of
 * numbers.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { resetScroll } from "@/components/SmoothScroll";
import { hold, release, startSweep } from "./gate";
import { lastOf, PRELOADER, scheduleSheets, sheetsOf } from "./reveal";

export const TRANSITION = {
  /* QUICKER THAN THE PRELOADER'S, and by about a fifth. The cover's sweep is
     the end of a four and a half second overture and can afford to be watched;
     this one stands between a reader and the thing they just clicked, and it is
     paid twice — once going down, once coming up. Both directions use these,
     so the two halves are the same weight of gesture.

     The ease is the preloader's own, deliberately unchanged: it is the only
     move on the site that has to start from a dead stop AND hand a still page
     over at the end, and that is just as true in both directions here. */
  DURATION: 0.8,
  EASE: PRELOADER.EASE,

  /* The band widths, as the preloader's STACK_STEP and STACK_SPREAD are — the
     gap between one sheet and the next behind it, and how far a gap may stray
     from that. Tighter than the preloader's 0.09, which is the whole of how
     this reads as one move rather than as seven: at 0.055 across seven sheets
     the stack's own spread is a third of a second, so the last colour is
     already going before the first has finished. */
  STEP: 0.055,
  SPREAD: PRELOADER.STACK_SPREAD,
  DRAG: PRELOADER.STACK_DRAG,

  /* GSAP's lag smoothing for the length of the transition, in ms, and the same
     pair the preloader runs on. A route change is the second-worst frame budget
     of a page's life after hydration — the outgoing page's ScrollTriggers are
     being killed, the incoming page's three is compiling — and with smoothing
     off a 200ms stall advances this timeline by 200ms, which comes straight out
     of the choreography. Put back to 0 at the hand-off, where SmoothScroll
     wants it. */
  LAG: 120,

  /* A beat between the router landing and the cover starting to lift.
   *
   * IT IS NOT A PAUSE FOR EFFECT, it is the incoming page's first frame. The
   * pathname changes on the render that COMMITS the new route, and this
   * controller hears about it from an effect in the layout — which React flushes
   * in tree order, so it runs BEFORE the effects of the components the new page
   * has just mounted. At that instant the new route exists in the DOM and
   * nothing on it has been measured, built, or painted: no ScrollTriggers, no
   * three, no decoded images. Lift on that frame and the paper comes off a page
   * that is still assembling itself.
   *
   * Two frames' worth is enough for React to finish its pass and for the browser
   * to paint once. It is spent entirely behind an opaque cover, so it costs the
   * reader nothing but the wait itself — and it is why ScrollTrigger.refresh
   * below has something to refresh. */
  SETTLE: 0.1,

  /* How long to wait for a route that never lands before lifting the cover
     anyway. A dead link, a chunk that will not load, a 404 that renders
     something unexpected: whatever the reason, a curtain that never goes up is
     a site that is gone. Generous, because the ordinary case resolves in a
     frame or two and this only ever fires when something is already wrong. */
  GIVE_UP: 6,
};

/** What the controller is doing, which is also what a click means at the time. */
type Phase =
  /* Nothing in flight — the cover is parked off the top of the screen. */
  | "idle"
  /* The stack is falling. The route has been asked for partway through this. */
  | "covering"
  /* Opaque and still, waiting for the router. Usually zero frames long. */
  | "covered"
  /* The stack is lifting off the new page. */
  | "revealing";

export type Transition = {
  /** Cover the page, then go. Ignored while another one is in flight. */
  to: (href: string) => void;
  /** The router has landed. Called from the component, off the pathname. */
  arrived: () => void;
  destroy: () => void;
};

/* Which clicks are ours.
 *
 * Everything this turns down is a case where taking the click would be WORSE
 * than a plain navigation, and the list is the standard one for any intercepted
 * link: a modifier means the reader has asked for a new tab or a download, a
 * target means the author has, a foreign origin is not ours to animate, and a
 * link to where we already are is either a hash or a no-op — neither is worth a
 * screen of paper.
 *
 * A defaultPrevented event is somebody else's already. data-no-transition is the
 * escape hatch for a link that must not be intercepted; nothing uses it yet. */
function targetOf(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const a = (e.target as Element | null)?.closest?.("a");
  if (!a || !(a instanceof HTMLAnchorElement)) return null;
  if (a.hasAttribute("download") || a.dataset.noTransition !== undefined) {
    return null;
  }
  if (a.target && a.target !== "_self") return null;

  /* Resolved rather than read: href="/products" is a relative attribute and an
     absolute property, and the comparisons below only make sense on the latter.
     Anything the URL parser will not take — mailto:, tel: — is not a route. */
  let url: URL;
  try {
    url = new URL(a.href, location.href);
  } catch {
    return null;
  }

  if (url.origin !== location.origin) return null;
  if (url.pathname === location.pathname && url.search === location.search) {
    return null;
  }

  return url.pathname + url.search + url.hash;
}

/* The controller. `navigate` is the router's push, handed in rather than
   imported: this module is plain DOM and timelines like every other engine on
   the site, and useRouter is a hook that only the component may call. */
export function createTransition(
  root: HTMLElement,
  navigate: (href: string) => void,
): Transition {
  /* A full screen of colour sliding over the page is exactly what this setting
     is asking about — the stylesheet has already taken the cover out of the
     page for it — so the transition is called off entirely and the router is
     handed the click unadorned. Which still leaves client-side routing on,
     which is the right way round: it is the animation that is unwanted, not the
     navigation being quick. */
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* The plugin is registered wherever it is used, the site's convention — and
     it has to be registered here too even though this creates no trigger of its
     own: refresh() below is a method ON the plugin, and this module may well be
     the first to touch it (a transition off a page with no scroll work on it at
     all). Registering twice is a no-op. */
  gsap.registerPlugin(ScrollTrigger);

  let phase: Phase = "idle";
  /* The two halves of "may the cover lift". They land in either order — a
     prefetched route can commit before the paper has finished falling, and a
     cold one long after — so each sets its own flag and asks. */
  let sealed = false;
  let landed = false;

  let tl: gsap.core.Timeline | null = null;
  let giveUp: gsap.core.Tween | null = null;
  let settle: gsap.core.Tween | null = null;

  function to(href: string): void {
    if (phase !== "idle") return;

    if (still) {
      navigate(href);
      return;
    }

    phase = "covering";
    sealed = false;
    landed = false;

    /* Before anything moves and long before the router is told: the gate is
       what the incoming page's entrances queue on, and it has to be shut by the
       time they mount. */
    hold();
    gsap.ticker.lagSmoothing(TRANSITION.LAG, 33);

    /* Back into the page. The preloader's last act was to take the cover out of
       it with `visibility`, and every sheet is still parked at -100 where the
       sweep left it — which is exactly where this starts from, so there is
       nothing else to reset. */
    gsap.set(root, { visibility: "visible" });

    /* DEEPEST FIRST. The reverse of the sweep's order, and the reason is in the
       note on scheduleSheets: the frontmost sheet is opaque, so if it led it
       would cover the screen on its own and the six colours behind it would
       fall in the dark. */
    const stack = sheetsOf(root).reverse();
    const schedule = scheduleSheets(stack, {
      at: 0,
      step: TRANSITION.STEP,
      spread: TRANSITION.SPREAD,
      duration: TRANSITION.DURATION,
      drag: TRANSITION.DRAG,
    });

    tl = gsap.timeline({
      onComplete: () => {
        phase = "covered";
        sealed = true;
        lift();
      },
    });

    for (const s of schedule) {
      tl.fromTo(
        s.el,
        { yPercent: -100 },
        { yPercent: 0, duration: s.duration, ease: TRANSITION.EASE },
        s.at,
      );
    }

    /* THE ROUTER IS TOLD PARTWAY THROUGH, not at the end, and the moment is
       exact: the screen is opaque as soon as the FIRST sheet to arrive has
       arrived, because each one is a full viewport of solid colour on its own.
       Everything after that is the rest of the stack settling into place behind
       something the reader cannot see through.

       Which buys most of the cover's length back. The last sheet lands about
       three tenths of a second after the first, and asking for the route at the
       first landing means React has that long — plus however long the lift
       waits — to render before anybody is kept waiting. */
    const opaque = schedule[0];
    tl.call(
      () => {
        /* BACK TO THE TOP BEFORE THE ROUTE CHANGES, not after, and this is the
           one piece of the order here that is not obvious.

           The router is told not to scroll (see the note where it is handed in)
           and the document keeps whatever position the outgoing page was left
           at. Reset it afterwards and the incoming page has already mounted at
           that position: its ScrollTriggers are created against a scroll of five
           thousand, and every `once: true` reveal above that line fires on the
           spot — a page whose whole first screenful arrives already arrived,
           and no later refresh can un-fire them.

           So the jump happens here, in the frame the screen goes opaque and
           before React is asked for anything. What it costs is the OUTGOING
           page's triggers scrubbing back to zero, which is a busy frame behind
           a cover that nobody can see through, and which is about to be thrown
           away in any case. */
        resetScroll();
        navigate(href);
      },
      undefined,
      opaque ? opaque.at + opaque.duration : 0,
    );

    giveUp = gsap.delayedCall(TRANSITION.GIVE_UP, () => {
      landed = true;
      lift();
    });
  }

  function arrived(): void {
    /* A pathname change with nothing in flight is the back button, or the first
       mount. Neither is ours: there was no click to intercept, so there is no
       cover over the page and nothing to lift off it. */
    if (phase === "idle" || phase === "revealing") return;
    landed = true;
    lift();
  }

  /* Both halves are in — the paper is down and the route is up behind it. */
  function lift(): void {
    if (!sealed || !landed || phase === "revealing") return;
    phase = "revealing";
    giveUp?.kill();
    giveUp = null;
    settle = gsap.delayedCall(TRANSITION.SETTLE, sweepUp);
  }

  function sweepUp(): void {
    settle = null;

    /* Twice, and the second time is not the same call as the first. The scroll
       was put back to the top before the route changed, so this one is not the
       reset — it is the check that nothing moved it since: Next does its own
       scroll handling on a commit, and any of it that lands after ours would
       otherwise stand. Idempotent when nothing has, which is the ordinary case.

       Then ScrollTrigger is told to measure again. Every start and end on the
       page belongs to a document that has just been replaced, and the new one's
       triggers were built during the commit — before its images had decoded or
       its type had settled, so the heights they recorded are already stale.
       Refreshing here spends that on a covered screen. */
    resetScroll();
    ScrollTrigger.refresh();

    tl?.kill();
    tl = gsap.timeline({
      onComplete: () => {
        phase = "idle";
      },
    });

    /* Front sheet first — the sweep's own order, unreversed. */
    const schedule = scheduleSheets(sheetsOf(root), {
      at: 0,
      step: TRANSITION.STEP,
      spread: TRANSITION.SPREAD,
      duration: TRANSITION.DURATION,
      drag: TRANSITION.DRAG,
    });

    for (const s of schedule) {
      tl.to(
        s.el,
        { yPercent: -100, duration: s.duration, ease: TRANSITION.EASE },
        s.at,
      );
    }

    /* The same two hand-offs the preloader makes, at the same fractions of the
       last sheet's own travel — see PRELOADER.SWEEP_MARK and PRELOADER.HANDOFF,
       which are where the reasoning for both figures lives. Imported and not
       re-chosen: a page arriving by transition and the same page arriving by
       cold load must open on the same beat, or the site has two entrances. */
    const last = lastOf(schedule, 0, TRANSITION.DURATION);

    tl.call(
      startSweep,
      undefined,
      last.at + last.duration * PRELOADER.SWEEP_MARK,
    );

    tl.call(
      () => {
        release();
        /* And back to SmoothScroll's setting, at the moment scrolling becomes
           possible again — which is the only moment at which it matters. */
        gsap.ticker.lagSmoothing(0);
      },
      undefined,
      last.at + last.duration * PRELOADER.HANDOFF,
    );

    /* Out of the page again, so the cover is not a fixed box swallowing clicks
       over the route it just delivered. */
    tl.set(root, { visibility: "hidden" });
  }

  /* Capture phase, so a click is claimed before anything on the way down can
     stop it — and so this sees the event even where a component has its own
     handler on the anchor. */
  const ac = new AbortController();
  document.addEventListener(
    "click",
    (e) => {
      const href = targetOf(e);
      if (!href) return;
      e.preventDefault();
      to(href);
    },
    { capture: true, signal: ac.signal },
  );

  return {
    to,
    arrived,
    destroy: () => {
      ac.abort();
      giveUp?.kill();
      settle?.kill();
      tl?.kill();
      tl = null;
      /* A teardown mid-transition must not leave the site behind a curtain that
         has nothing left to lift it. StrictMode's double mount is the caller
         that matters and it happens before any of this has run, but the rule is
         the same either way: the page comes back. */
      if (phase !== "idle") {
        gsap.set(root, { visibility: "hidden" });
        gsap.set(sheetsOf(root), { yPercent: -100 });
        release();
        gsap.ticker.lagSmoothing(0);
        phase = "idle";
      }
    },
  };
}
