/* Sweet Tape — the index arriving: the rule written row by row, the cards
 * bounced up.
 *
 * Two entrances on one cue, and deliberately two different ones. The rule down
 * the left is TYPE and takes the site's headline voice — every letter under its
 * own mask, sliding up in a shuffled order. The wall of cards on the right is not
 * type at all: nine rectangles doing that would be nine separate arrivals
 * competing with each other, and shuffling anything about a grid destroys the one
 * thing a grid is for.
 *
 * THE LEFT COLUMN IS THE MENU'S ENTRANCE, and it is the same one on purpose. The
 * menu is a sheet of perforated paper whose rows arrive one at a time, each word
 * with its own rule; this column is three tabs down a sheet with the same
 * perforation between them, drawn in lime instead of ink. So it arrives the way
 * the menu does — row by row, rather than all twelve letters shuffled together
 * across the whole block, which is what it used to do and which read as one
 * event where the design draws three.
 *
 * THE ORDER WITHIN A ROW IS INVERTED FROM THE MENU'S, and that is the one
 * difference. The menu's rule sits ABOVE its word and opens the row, so it draws
 * first. Here the rule sits UNDER the tab it belongs to, so the word lands and
 * the line is then drawn beneath it — an underline being made, not a rule being
 * laid down for something to arrive on. Draw it first and the eye watches an
 * empty line waiting for a word.
 *
 * THE CARDS BOUNCE UP. Each starts at nothing, a shade small and a little low,
 * and arrives on the site's back.out — the menu drop's character, the rolls'
 * hover swing, the arrow disc in a menu row: this site's things overshoot once
 * and settle. Read across the rows rather than shuffled, because that is the
 * order they are going to be read in anyway and a grid that assembles out of
 * order reads as broken rather than as arriving.
 *
 * IT USED TO RESOLVE OUT OF A BLUR and does not any more, which is worth a line
 * because the argument for the blur was a good one and it is not what is wanted
 * here. Nine full-bleed cards each carrying a photograph, each re-rasterised
 * every frame for the length of the move, was the one thing on this page that
 * could cost a frame rate — so the new entrance is cheaper as well as livelier:
 * transform and opacity, both of which the compositor does on its own.
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

  /* Between the letters of ONE tab. ALL / EVENT / NEWS is twelve characters over
     three short rows set large, so this is the key visual's pace rather than the
     hero's — at 0.025 a word this size is still assembling itself after the line
     under it has finished drawing. */
  STAGGER: 0.03,

  /* BETWEEN THE ROWS, and the number that makes this a cascade rather than a
     block. The menu's MENU_REVEAL.ROW is 0.16 and this is a shade slower on
     purpose: the menu has four short rows of ink on paper and this is three set
     at display size, so each one takes longer to read and wants longer to itself.
     Three of them multiply it, so this is the one figure to reach for if the
     column feels slow — at 0.18 the last tab starts a little over a third of a
     second after the first, which is about when the first row of cards is landing
     beside it. */
  ROW: 0.18,

  /* Within a row, offsets from that row's own start: the word, then the line
     drawn under it. TEXT_AT is zero because the word IS the row — the rule is
     what follows. The gap between them is short enough that the two read as one
     gesture; much past a fifth of a second and the line reads as an afterthought
     rather than as the end of the stroke. */
  TEXT_AT: 0,
  RULE_AT: 0.14,

  /* The line uncovering from the left. MENU_REVEAL.RULE_DURATION and
     RULE_EASE to the digit — it is the same perforation being drawn, so it is
     drawn at the same rate. Re-stated rather than imported: this section and the
     menu share a drawing, not a dependency, and the two figures in global.css
     that give the line its mark and pitch make the same bargain. */
  RULE_DURATION: 0.6,
  RULE_EASE: "power2.out",

  /* THE CARDS. How small each one starts, and how far below its place. Both are
     small on purpose: this is a wall of nine rectangles in a grid, and a card
     that starts at 0.7 and flies half its own height is an entrance that has to
     be watched rather than one that happens while the eye is arriving. At 0.94
     and 8 the move is felt more than seen, which is what a bounce on nine things
     at once has to be.

     THE SCALE OVERSHOOTS AND THE GAP ABSORBS IT. back.out(1.7) carries a card
     something under a per cent past its full size before it settles — three
     pixels or so on a 313px card, against 15px of grid gap. Push CARD_SCALE much
     further from 1 and the overshoot grows with it, and neighbouring cards start
     to touch at the peak. */
  CARD_SCALE: 0.94,
  CARD_RISE: 8,

  /* Longer than the old blur-up's 0.62, because a back ease spends its last
     third settling and a bounce cut short is a twitch. */
  CARD_DURATION: 0.7,

  /* Between cards, read across the rows. Nine of them multiply it, so this is
     the other number to reach for if the wall feels slow: at 0.06 the last card
     starts about half a second after the first and the whole grid is done inside
     a second and a bit. */
  CARD_STAGGER: 0.06,

  /* The overshoot. back.out(1.7) is the softer cousin of the menu drop's
     back.out(1.9) and the arrow disc's back.out(2.2) — the same character, dialled
     down because this is nine of them going at once rather than one thing being
     pulled. Raise it toward 2 for more crack; drop it to 1 and the bounce is
     barely there. */
  CARD_EASE: "back.out(1.7)",
};

/* Fisher–Yates, the hero's. The shuffle IS the effect for TYPE: reveal the same
   letters left to right and it reads as a wipe. It is used on a tab's letters and
   never on the cards — see the note at the top. */
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
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>(".index-filters li"),
  );
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".index-filters .char"),
  );
  const rules = Array.from(
    root.querySelectorAll<HTMLElement>(".index-filters .index-rule"),
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
   * THE RULES AND THE CARDS ARE HELD BY THE SAME ATTRIBUTE and released by the
   * same line — the rules clipped to nothing from the left, the cards parked at
   * nothing rather than under a mask. The cards are held for the reason the tag
   * on the page's opening screen is: an entrance that begins by shrinking
   * something the reader can already see is a page correcting itself.
   *
   * Nothing paints in between: the attribute and every fromTo below happen in
   * the same task, and a fromTo renders its `from` immediately even when
   * paused. */
  root.dataset.reveal = "live";

  /* Twelve letters flying in from nowhere, two lines drawing themselves and nine
     cards bouncing up are exactly what the setting is asking about. The attribute
     alone has already put all three where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { replay: () => {}, stop: () => {} };
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so the second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* THE COLUMN, row by row — the menu's contents timeline in miniature.
   *
   * Shuffled WITHIN a row and not across the three, which is the same call the
   * menu makes and the opposite of the one this file used to make. The rows are
   * already staggered against each other; a column-wide shuffle on top of that
   * would have NEWS's letters arriving before ALL's word had finished, and the
   * three rules would then be drawing under words that were not there yet.
   *
   * The last row has no rule under it — see NewsIndex/index.tsx — so `rule` is
   * simply null there and the row is its word alone. */
  const filter = rows.length ? gsap.timeline({ paused: true }) : null;

  rows.forEach((row, i) => {
    if (!filter) return;
    const at = i * INDEX_REVEAL.ROW;

    const letters = Array.from(row.querySelectorAll<HTMLElement>(".char"));
    if (letters.length) {
      filter.fromTo(
        shuffle(letters),
        { yPercent: REVEAL.HIDDEN },
        {
          yPercent: 0,
          duration: REVEAL.DURATION,
          stagger: INDEX_REVEAL.STAGGER,
          ease: REVEAL.EASE,
        },
        at + INDEX_REVEAL.TEXT_AT,
      );
    }

    /* The rule draws in from the left. clip-path rather than scaleX, which is
       the cheaper tween and the wrong one: the marks are a repeating background,
       so a scaled rule would start as a hundred of them crushed into a tenth of
       the width and spread out. Clipping leaves them at their own size and
       uncovers them. The menu's rule is drawn by exactly these two lines. */
    const rule = row.querySelector<HTMLElement>(".index-rule");
    if (rule) {
      filter.fromTo(
        rule,
        { clipPath: "inset(0% 100% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: INDEX_REVEAL.RULE_DURATION,
          ease: INDEX_REVEAL.RULE_EASE,
        },
        at + INDEX_REVEAL.RULE_AT,
      );
    }
  });

  /* Built fresh for every play rather than rewound, and that is not laziness:
     the set of cards is different after a filter change, so a tween holding the
     old nine would go on animating five that are no longer on the page — and,
     worse, would still be holding their transforms when they came back.

     `paused` is what makes the FIRST one safe. The stylesheet's hold is lifted
     the moment this file runs (see data-reveal above), so from that instant the
     cards are the stylesheet's business and the stylesheet has them standing.
     A tween built when the trigger fires would therefore be a wall that is
     already on screen snapping to invisible and then bouncing up — and the
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
        scale: INDEX_REVEAL.CARD_SCALE,
        yPercent: INDEX_REVEAL.CARD_RISE,
      },
      {
        autoAlpha: 1,
        scale: 1,
        yPercent: 0,
        duration: INDEX_REVEAL.CARD_DURATION,
        stagger: INDEX_REVEAL.CARD_STAGGER,
        ease: INDEX_REVEAL.CARD_EASE,
        paused,
        /* THE ALPHA IS ON THE SAME CURVE AND THAT IS FINE, which is not obvious:
           back.out overshoots everything it is given, so the opacity is carried
           past 1 on its way. There is nothing to see — opacity is clamped where
           it is painted, so the card simply reaches solid a beat early and does
           the last of its settling at full strength, which is the half of the
           move worth watching anyway. Splitting the fade onto a curve of its own
           would be two tweens on nine cards to fix nothing.

           NOTHING IS CLEARED AT THE END. The blur-up this replaced had to take
           its filter off the elements — a declared filter keeps a card on its own
           compositor layer for good — and a transform does not have that problem.
           GSAP owns it from here and the next replay's `from` reads it. */
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
         standing, both lines drawn and every card in place. Back to the
         stylesheet, which with the attribute still set is home rather than
         hidden. */
      gsap.set(chars, { clearProps: "transform" });
      if (rules.length) gsap.set(rules, { clearProps: "clipPath" });
      if (cards.length) {
        gsap.set(cards, { clearProps: "transform,opacity,visibility" });
      }
    },
  };
}
