/* Sweet Tape — the index arriving: the filter written, the cards blurred up.
 *
 * Two entrances on one cue, and deliberately two different ones. The rule down
 * the left is TYPE and takes the site's headline voice — every letter under its
 * own mask, sliding up in a shuffled order, at the hero's duration and ease. The
 * wall of cards on the right is not type at all: nine rectangles doing that would
 * be nine separate arrivals competing with each other, and shuffling anything
 * about a grid destroys the one thing a grid is for.
 *
 * SO THE CARDS COME INTO FOCUS INSTEAD. Each starts blurred, a little low and at
 * nothing, and resolves in place — the eye is not asked to follow anything, it is
 * asked to wait a beat while nine things become legible. Read across the rows
 * rather than shuffled, because that is the order they are going to be read in
 * anyway and a grid that assembles out of order reads as broken rather than as
 * arriving.
 *
 * THE BLUR IS A FILTER AND FILTERS ARE EXPENSIVE. Nine full-bleed cards each
 * carrying a photograph, each being re-rasterised every frame for the length of
 * the move — that is the one thing here that can cost a frame rate, and it is why
 * the blur is small, the duration is short and the whole thing is over in well
 * under a second. It is also why the property is cleared at the end rather than
 * left sitting at blur(0px): a filter that is still declared still promotes the
 * element, and nine promoted layers is nine layers the compositor keeps for the
 * rest of the page's life.
 *
 * REPLAYED ON EVERY FILTER CHANGE, which is what `replay` is for. Switching to
 * EVENT hides five of the nine and leaves four standing where they were — and
 * four cards that simply survive a cut read as nothing having happened. Playing
 * them in again says a new set has arrived. See filter.ts, which owns which cards
 * those are; this file only ever animates what it is handed.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

export const INDEX_REVEAL = {
  /* Where the section has to be for either of them to go: its top edge four
     fifths of the way down the window. The key visual's 75% would be early here
     — this section opens on the filter rule and the first row of cards together,
     so by the time its top edge is at three quarters there is already a row and a
     half in shot. */
  START: "top 80%",

  /* Between the filter's letters. ALL / EVENT / NEWS is twelve characters over
     three short rows set large, so this is the key visual's pace rather than the
     hero's — at 0.025 a block this small is still assembling itself after the
     first row of cards has finished. */
  STAGGER: 0.03,

  /* THE CARDS. How far each one is blurred to begin with, in px at the design
     width — small on purpose, and not only for the frame rate: past about 14 the
     card stops being an out-of-focus card and becomes a coloured smudge, which
     has nothing to resolve INTO. What sells it is the last third of the move,
     where the type comes back rather than the picture. */
  BLUR: 10,

  /* And how far it rises, as a percentage of its own height. A tenth of a card
     is enough to give the focus somewhere to arrive from; more and it is a slide
     with a blur on it, which is the entrance every other section on this site
     already has. */
  RISE: 6,

  DURATION: 0.62,
  /* Between cards, read across the rows. Nine of them multiply it, so this is
     the one number to reach for if the wall feels slow: at 0.06 the last card
     starts about half a second after the first and the whole grid is done inside
     a second and a bit. */
  CARD_STAGGER: 0.06,
  /* .out and not .inOut, the site's arrival curve: the move is quickest at the
     start, so most of its length is spent on the part worth watching — the last
     of the blur coming off. */
  CARD_EASE: "power2.out",
};

/* Fisher–Yates, the hero's. The shuffle IS the effect for TYPE: reveal the same
   letters left to right and it reads as a wipe. It is used on the filter's
   letters and never on the cards — see the note at the top. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type IndexReveal = {
  /* Play the cards in again — the filter calls this once it has decided which
     ones are on the page. A no-op before the section has been scrolled to, so a
     reader who taps a tab above the fold does not spend the entrance early. */
  replay: () => void;
  stop: () => void;
};

export function initIndexReveal(root: HTMLElement): IndexReveal {
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".index-filters .char"),
  );
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".index-card"));

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say: GSAP
   * reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would then
   * ADD to the yPercent below, leaving every letter parked a full height low.
   *
   * THE CARDS ARE HELD BY THE SAME ATTRIBUTE and released by the same line. They
   * are parked at nothing rather than under a mask, for the reason the tag on the
   * page's opening screen is: an entrance that begins by blurring something the
   * reader can already see is a page correcting itself.
   *
   * Nothing paints in between: the attribute and both fromTos happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* Twelve letters flying in from nowhere and nine cards resolving out of a blur
     are exactly what the setting is asking about. The attribute alone has already
     put both where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { replay: () => {}, stop: () => {} };
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so the second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* Shuffled across ALL THREE ROWS rather than within each, the same call every
     multi-line headline on this site makes: ALL / EVENT / NEWS is one block, and
     shuffling row by row would have ALL home before EVENT had started — a wipe
     down the list, which is the thing the shuffle exists to avoid. */
  const filter = chars.length
    ? gsap.fromTo(
        shuffle(chars),
        { yPercent: REVEAL.HIDDEN },
        {
          yPercent: 0,
          duration: REVEAL.DURATION,
          stagger: INDEX_REVEAL.STAGGER,
          ease: REVEAL.EASE,
          paused: true,
        },
      )
    : null;

  /* Built fresh for every play rather than rewound, and that is not laziness:
     the set of cards is different after a filter change, so a tween holding the
     old nine would go on animating five that are no longer on the page — and,
     worse, would still be holding their transforms when they came back.

     `paused` is what makes the FIRST one safe. The stylesheet's hold is lifted
     the moment this file runs (see data-reveal above), so from that instant the
     cards are the stylesheet's business and the stylesheet has them standing.
     A tween built when the trigger fires would therefore be a wall that is
     already on screen snapping to invisible and then blurring up — and the
     trigger fires as the top row comes into shot, which is exactly when somebody
     is looking at it. A paused fromTo renders its `from` the moment it is
     created, so the cards are parked in the same task the hold is lifted and
     nothing is painted in between. Every letter reveal on this site is built
     this way and for this reason. */
  function buildCards(targets: HTMLElement[], paused: boolean) {
    if (!targets.length) return null;

    return gsap.fromTo(
      targets,
      {
        autoAlpha: 0,
        yPercent: INDEX_REVEAL.RISE,
        filter: `blur(${INDEX_REVEAL.BLUR}px)`,
      },
      {
        autoAlpha: 1,
        yPercent: 0,
        filter: "blur(0px)",
        duration: INDEX_REVEAL.DURATION,
        stagger: INDEX_REVEAL.CARD_STAGGER,
        ease: INDEX_REVEAL.CARD_EASE,
        paused,
        /* The filter comes off the elements entirely, not down to zero — a
           declared filter keeps the card on its own compositor layer for good.
           The transform is left alone: GSAP owns it from here and the next
           replay's `from` reads it. */
        onComplete: () => gsap.set(targets, { clearProps: "filter" }),
      },
    );
  }

  /* All nine, because at mount nothing is filtered — the page is served with no
     filter on it, which is the ALL tab (see filter.ts). Held until the section is
     scrolled to. */
  let wall = buildCards(cards, true);
  let played = false;

  const st = ScrollTrigger.create({
    trigger: root,
    start: INDEX_REVEAL.START,
    once: true,
    onEnter: () => {
      played = true;
      filter?.play();
      wall?.play();
    },
  });

  /* Read off the DOM rather than tracked here. filter.ts decides what is shown
     by writing one attribute on this root and letting the stylesheet do the
     hiding, so the honest question is "what is being painted right now" — and
     checking a box's own layout is the one answer that cannot go stale. */
  function visible(): HTMLElement[] {
    return cards.filter((c) => c.offsetParent !== null);
  }

  return {
    replay: () => {
      /* Before the section has been reached there is nothing to replay: the wall
         is still parked at its `from` and will play in full when it is scrolled
         to. Rebuilding here would only re-park a different subset of it — and
         then the trigger would play the tween it replaced. */
      if (!played) return;
      wall?.kill();
      wall = buildCards(visible(), false);
    },
    stop: () => {
      st.kill();
      filter?.kill();
      wall?.kill();
      /* A teardown mid-arrival must leave the section readable — the rule
         standing and every card in focus. Back to the stylesheet, which with the
         attribute still set is home rather than hidden. */
      gsap.set(chars, { clearProps: "transform" });
      if (cards.length) {
        gsap.set(cards, { clearProps: "transform,opacity,visibility,filter" });
      }
    },
  };
}
