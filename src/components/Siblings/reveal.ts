/* Sweet Tape — THE SIBLINGS arriving: one label, then the rest, then the name.
 *
 * IT PLAYS ON A CLOCK AND NOT ON THE SCROLLBAR. Reaching the section starts it,
 * once, and the page is never held: it was a pin with the deal stepped off the
 * scroll position, which was asked to go. The sequence is one card per DEAL_GAP
 * and then the name, so how long it runs is how many cards the row has — three
 * take longer than two, and a lone card is over almost as it lands — with no
 * figure here that knows the count.
 *
 * THE ORDER, WHICH IS THE WHOLE EFFECT — written here for the three-card row the
 * section was drawn as, which is the longest it gets:
 *
 *   1. The first label arrives on its own, IN THE MIDDLE OF THE SCREEN and
 *      standing square. It comes UP into its place and it does not fade in;
 *      nothing here fades. See CARD_RISE.
 *   2. The second is dealt to its right: the fan swings, the first slides left
 *      and takes on half its lean, and the pair stays centred. What the eye sees
 *      is the row GROWING rather than cards stacked onto one end.
 *   3. The third is dealt, the fan swings again, and they land on the
 *      arrangement the design draws — every card at its own lean.
 *   4. THE SIBLINGS writes itself in the gap the arrangement has just made.
 *
 * HOW MANY CARDS IS THE TAPE'S BUSINESS AND NOT THIS FILE'S. The range is not
 * three grades of everything — see `faces` in src/data/tape-types.ts — so a row
 * can be one card or two, and every number in here is read off the row that was
 * actually rendered rather than typed. A shorter row is the same deal with fewer
 * cards in it; nothing above changes but the count.
 *
 * THE NAME COMES LAST, AND THAT IS A GEOMETRY DECISION RATHER THAN A TASTE ONE.
 * Its place is under the RAISED card — a gap that does not exist until the row
 * is finished. Written any earlier it has to be shoved out of the way of whatever
 * is standing in the middle of the screen, and a name that shifts to make room is
 * a worse answer than a name that waits for its room to exist.
 *
 * IT PLAYS ONCE, like the product page's other arrivals (ProductInfo, NextUp):
 * scrolled back to, the row is simply standing.
 *
 * THE DEAL IS A ROTATION AND NOT A SLIDE, which is the reference effect's move
 * and this arrangement's own logic. The row is an arc: the raised card square,
 * the ones beside it lower and leaning away from it. So the cards are hung
 * on a wheel whose centre is far below the page, and dealing is turning it — a
 * card brought to the middle of the screen is stood square by the same turn that
 * brings it, and the ones already down lean and dip away exactly as the design
 * has them lean. A translation would have to fake both.
 *
 * NOTHING IS MEASURED IN THIS FILE. Where a card sits is read off the laid-out
 * row — the arrangement is flex and lives in global.css — and even the wheel's
 * radius falls out of it: it is the one that stands the first card square when it
 * is centred, which is the stylesheet's own offset and the stylesheet's own lean
 * dividing into each other. Move a card there, or resize one, and the deal
 * follows with nothing here to keep in step. That is the bargain
 * GiantPinning/pin.ts strikes with its camera and the reason neither file has a
 * list of coordinates in it.
 *
 * THE NAME IS THE SITE'S HEADLINE VOICE, unchanged: every letter under its own
 * mask, sliding up in a shuffled order, at the hero's duration, ease and hidden
 * figure. The cards are pictures rather than type, and the news index argues at
 * length why pictures do not get the letter treatment.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

/* The phone's one move — see the phone branch in initSiblingsReveal. RISE is a
   share of the card's own height and SCALE is where it starts; the trigger is
   measured on the card's resting box, so START is where its top has to be. */
const PHONE_ARRIVE = {
  RISE: 0.22,
  SCALE: 0.82,
  DURATION: 0.8,
  EASE: "back.out(1.5)",
  START: "top 88%",
};

export const SIBLINGS_REVEAL = {
  /* WHERE IT STARTS. The stage's top edge just above the middle of the window —
     and the stage is the window's height with the row centred in it, so the
     first card lands with its top half over the fold and the rest of the row is
     dealt as the section comes up. It was "top 25%" while a pin was coming to
     hold the page; nothing holds it now, and a clock started that late is still
     dealing when a steady scroll has the section halfway off the top. Much
     earlier and the first card is dealt below the fold. */
  START: "top 45%",

  /* ONE CARD TO THE NEXT, in seconds — and the one number that decides how long
     the whole thing runs, since the sequence is this once per card and then the
     name. Shorter than SPRING_DURATION on purpose: an elastic.out is home in
     the first half of its length and only ringing after that, so the next card
     is dealt as the last one settles rather than after it has gone still. Much
     shorter and the row is flicked at you; longer and there is dead air between
     two cards. */
  DEAL_GAP: 0.6,

  /* And a little more than that between the last card and the name. Long enough
     that the two read as cause and effect rather than as one event: the row is
     what is being named, so it has to be there first — and the gap it is written
     into is one the arrangement has only just made. */
  TITLE_GAP: 0.18,

  /* THE WHEEL'S RADIUS, when the stylesheet's own figures cannot give one — as a
     multiple of the row's width. See `pivot` below: the radius is normally the
     one that stands the first card square as it is centred, which is that card's
     offset divided by the tangent of its lean. A row whose first card is set
     dead straight has no such number, and this is the fallback: four screen
     widths, which is about what the design's own figures come to. */
  PIVOT_FALLBACK: 4,

  /* And how straight a lean has to be before that division stops meaning
     anything, in degrees. Under this the fallback is used instead — a tenth of a
     degree of lean divided into a four-hundred-pixel offset is a wheel the size
     of a county, and the deal stops being a turn at all. */
  PIVOT_MIN_TILT: 0.5,

  /* Between letters, in shuffled order. Twelve characters set at 70px — the
     closing key visual's pace, not the hero's: at 0.025 a block this small is
     still assembling itself long after the card above it has settled. */
  STAGGER: 0.03,

  /* A CARD BEING DEALT: IT COMES UP OUT OF THE WHEEL.
   *
   * NO FADE, WHICH IS THE REFERENCE EFFECT'S CALL AND THE RIGHT ONE. A card is
   * either on the table or it is not — the reference switches its visibility and
   * springs it, and the whole reason that reads as a card being DEALT rather
   * than as a card appearing is that there is no dissolve to watch. A fade is
   * what an image does when it loads; it is not what an object does when it is
   * put down.
   *
   * BUT IT DOES TRAVEL, AND IT TRAVELS UP — which is the one thing the reference
   * does that is easy to misread from its source. The only entrance it writes is
   * `scale: 0.94`, which looks like a card growing on the spot; it is not. The
   * scale is on the CIRCLE, whose origin is a hundred and fifty viewport widths
   * below the card, so six per cent of it is nine viewport widths of RADIAL
   * travel — the card starts a good way below its place, riding the same spoke
   * it will settle on, and springs up. What reads on the screen is a card coming
   * from the bottom, and the size change is a tenth of the gesture.
   *
   * So this is written as the thing it actually is: how far up the card comes, as
   * a fraction of its own width. Just under a half, which is the reference's own
   * proportion at its card size. The scale that goes with it is NOT a second
   * decision — see `entrance` below, where it is divided out of the wheel so the
   * two stay in the relationship the reference has them in. */
  CARD_RISE: 0.45,

  /* And the floor under that division. The wheel here is far bigger relative to
     a card than the reference's, so the scale that a given rise implies is
     gentle — but a shallow-leaning arrangement can make the wheel bigger still,
     and past a point the size change rounds away to nothing and the entrance is
     a card sliding up. This is as small as the shrink is allowed to get. */
  CARD_SCALE_MIN: 0.94,

  /* THE SPRING — the reference's exactly, and it carries the whole entrance:
     the rise and the shrink are one tween on one curve, because they are one
     move along one spoke and splitting them would let the card arrive before it
     was full size. elastic.out(0.6, 0.3), where the amplitude under 1 keeps the
     overshoot to a fraction of the move: a label pressed down and giving a
     little, which is what a printed card put on a table does. */
  SPRING_DURATION: 0.75,
  SPRING_EASE: "elastic.out(0.6, 0.3)",

  /* THE FAN TURNING under the card just dealt. The same spring, because it is
     the same gesture seen from the other side — the cards already down swing
     aside to make room, and they arrive at the new middle the way the new card
     arrives at its place. A shade longer than the deal, so the turn is still
     settling as the card lands beside it. This is the reference effect's own
     pairing: the card springs and the wheel springs after it. */
  SHIFT_DURATION: 0.8,
  SHIFT_EASE: "elastic.out(0.6, 0.3)",
};

/* Fisher–Yates, the hero's. The shuffle IS the effect for TYPE: reveal the same
   letters left to right and it reads as a wipe. It is used on the name and never
   on the cards — those are dealt in the order they are read in. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initSiblingsReveal(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>(".siblings-stage");
  const row = root.querySelector<HTMLElement>(".siblings-row");
  const fan = root.querySelector<HTMLElement>(".siblings-fan");
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".siblings-title .char"),
  );
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>(".siblings-card"),
  );
  if (!chars.length && !cards.length) return () => {};

  /* Hand both over from the stylesheet.
   *
   * global.css holds the letters under their masks until this attribute lands,
   * and setting it first is what makes the tween's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would then
   * ADD to the yPercent below, leaving every letter parked a full height low.
   *
   * THE CARDS ARE HELD BY THE SAME ATTRIBUTE and released by the same line. They
   * are parked at nothing rather than under a mask, for the reason the index's
   * cards are: an entrance that begins by moving something the reader can
   * already see is a page correcting itself.
   *
   * Nothing paints in between: the attribute, the park below and the name's
   * fromTo all happen in this one task, and a fromTo renders its `from`
   * immediately even when paused. */
  root.dataset.reveal = "live";

  /* Twelve letters flying in from nowhere and three labels being dealt onto the
     screen are exactly what the setting is asking about. The attribute alone
     has already put the whole arrangement where it belongs: the row as the
     design draws it and the name standing. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* A PHONE shows the cards in one column with no pin and no deal — see "The
     siblings — the phone" in global.css, which lifts the parks itself. What is
     left is each card's own small arrival as it is scrolled to: up a little and
     up to size, once. The spring is the desktop deal's, so it is the same
     object landing.

     The lean is written with the move because GSAP writes the WHOLE transform
     the moment it touches one, and the stylesheet's rotate() would be lost —
     the same reason every tween below carries it.
     ponytail: decided once at mount; a window dragged across 767px keeps the
     mode it loaded in until the next navigation. */
  if (window.matchMedia("(max-width: 767px)").matches) {
    gsap.registerPlugin(ScrollTrigger);
    const arrivals = cards.map((card) => {
      const tilt =
        parseFloat(getComputedStyle(card).getPropertyValue("--sib-tilt")) || 0;
      return gsap.fromTo(
        card,
        {
          autoAlpha: 0,
          y: card.offsetHeight * PHONE_ARRIVE.RISE,
          scale: PHONE_ARRIVE.SCALE,
          rotation: tilt,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotation: tilt,
          duration: PHONE_ARRIVE.DURATION,
          ease: PHONE_ARRIVE.EASE,
          scrollTrigger: {
            trigger: card,
            start: PHONE_ARRIVE.START,
            once: true,
          },
        },
      );
    });
    return () => {
      arrivals.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      gsap.set(cards, { clearProps: "transform,opacity,visibility" });
    };
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* THE RESTING ANGLE COMES OFF THE ELEMENT rather than out of this file. Each
     card carries its own --sib-tilt from index.tsx, where the arrangement lives,
     so re-ordering or re-leaning the row needs nothing here. Every tween that
     touches a card has to write it, because GSAP writes the ENTIRE transform the
     moment it touches one — a rotation left to the stylesheet would simply
     vanish for the length of the move. */
  const tiltOf = (el: Element) =>
    parseFloat(getComputedStyle(el).getPropertyValue("--sib-tilt")) || 0;

  /* HOW FAR THE FAN HAS TO SWING with the first n cards dealt, in px along the
   * row, so that those n are centred in the box. Index 0 is one card down, index
   * 1 is two, and the last is the whole row — which is zero, because the row is
   * already centred by the stylesheet's flex.
   *
   * offsetLeft and offsetWidth rather than getBoundingClientRect, deliberately:
   * these are LAYOUT numbers and take no notice of the transforms this file is
   * writing, so the measure is the same taken before the first card is dealt as
   * it is in the middle of the third. A rect would be measuring the cards where
   * they have been animated to and folding that back into the answer.
   *
   * Re-taken on every ScrollTrigger refresh, which includes every resize — the
   * arrangement is in vw and every one of these numbers moves with the window. */
  const spots = () => {
    if (!row || !cards.length) return cards.map(() => 0);
    const middle = row.clientWidth / 2;
    const out = cards.map((_, i) => {
      const from = cards[0].offsetLeft;
      const to = cards[i].offsetLeft + cards[i].offsetWidth;
      return middle - (from + to) / 2;
    });

    /* AND THE LAST ONE IS ZERO BY DEFINITION, not by measurement.
     *
     * The run ends at the arrangement the stylesheet laid out — that IS the
     * design, and the swing is a displacement measured FROM it. The measurement
     * agrees, now that a short row is simply a short row: the fan holds nothing
     * but cards and centres them, so "the cards centred" and "the fan at rest"
     * are one position again. Stated rather than measured because it is a
     * statement about where the run ENDS, and a rounding error in the last stop
     * would leave the finished composition a pixel off the design for the sake
     * of arithmetic that already knows the answer.
     *
     * It was load-bearing rather than tidy for one round, when a range of two
     * held the third place open with an empty box: the measure then centred the
     * PAIR, which took the raised card off the middle of the screen and left the
     * name standing under nothing. The empty place is gone and so is the
     * disagreement. */
    out[out.length - 1] = 0;
    return out;
  };
  let stops = spots();

  /* AND HOW FAR BELOW THE ROW THE WHEEL'S CENTRE SITS, in px.
   *
   * THE RADIUS IS THE ONE THAT STANDS THE FIRST CARD SQUARE. Swinging the fan far
   * enough to bring that card to the middle of the screen also turns it by the
   * angle the swing subtends — so pick the radius at which that angle is exactly
   * the lean the stylesheet gave it, and the card arrives centred AND upright in
   * one move. Every other stage falls out of the same wheel: two cards down and
   * the pair is symmetric about the middle, each wearing half its lean; three and
   * the wheel is home, every card at the angle the design drew it at.
   *
   * That is the whole reason the deal is a rotation. These three cards are not a
   * row that happens to be tilted — they are an arc, and this is its centre.
   *
   * The fallback is for an arrangement that gives no such number; see
   * PIVOT_FALLBACK. */
  const pivot = () => {
    const lean = Math.abs(cards.length ? tiltOf(cards[0]) : 0);
    const reach = Math.abs(stops[0] ?? 0);
    const fallback = (row?.clientWidth ?? 0) * SIBLINGS_REVEAL.PIVOT_FALLBACK;
    const length =
      lean < SIBLINGS_REVEAL.PIVOT_MIN_TILT || !reach
        ? fallback
        : reach / Math.tan((lean * Math.PI) / 180);

    /* THE SPOKE IS MEASURED TO THE CARD'S MIDDLE and the origin from the fan's
       top edge, and the difference between those two is not academic: the cards
       hang a couple of hundred pixels below the box's top, so a radius written
       straight into transform-origin is that much SHORT and the swing lands the
       card a good inch off centre. It was doing exactly that. */
    const line = cards.length
      ? cards[0].offsetTop + cards[0].offsetHeight / 2
      : 0;
    return { length, origin: line + length };
  };
  let wheel = pivot();

  /* The angle that swing comes to, in degrees — the wheel's own arithmetic, and
     the reason nothing here has to know what any of the numbers above are. */
  const angleFor = (count: number) =>
    wheel.length
      ? (Math.atan((stops[count - 1] ?? 0) / wheel.length) * 180) / Math.PI
      : 0;

  /* HOW MANY ARE DOWN — kept so a refresh mid-deal can put the fan back where
     that many cards want it. */
  let shown = 0;

  /* WHERE A CARD IS DEALT FROM: down its own spoke, and how much smaller it is
   * for being there.
   *
   * THE TWO ARE ONE FACT — see CARD_RISE. A point pulled in along a radius by
   * `rise` sits at (radius − rise) / radius of its distance from the hub, and
   * that ratio IS the scale; the reference gets its 9vw of travel by writing the
   * ratio, and this gets the ratio by writing the travel. Same relationship,
   * stated from the end anybody can see.
   *
   * A rise is measured off the card's own width so the entrance is the same
   * gesture at any window size, and the scale is floored — see CARD_SCALE_MIN. */
  const entrance = (card: HTMLElement) => {
    const rise = card.offsetWidth * SIBLINGS_REVEAL.CARD_RISE;
    const scale = wheel.length ? 1 - rise / wheel.length : 1;
    return { rise, scale: Math.max(scale, SIBLINGS_REVEAL.CARD_SCALE_MIN) };
  };

  const deal = (card: HTMLElement) => {
    /* ON THE TABLE FIRST AND IN ONE STEP — see CARD_RISE. The card is simply
       there, at its full weight and at the lean the stylesheet gave it; what
       moves is where along its spoke it is. */
    gsap.set(card, { autoAlpha: 1, rotation: tiltOf(card) });
    const from = entrance(card);
    gsap.fromTo(
      card,
      { y: from.rise, scale: from.scale },
      {
        y: 0,
        scale: 1,
        duration: SIBLINGS_REVEAL.SPRING_DURATION,
        ease: SIBLINGS_REVEAL.SPRING_EASE,
        /* overwrite "auto" rather than killing the card's tweens outright: it
           takes over only the properties it actually writes, and there is
           nothing else on this element to disturb. */
        overwrite: "auto",
      },
    );
  };

  /* THE FAN SWINGING so the cards dealt so far sit in the middle of the screen.
     One turn of one box rather than a translation per card — see the note at the
     top: the swing is what leans them, and a card's lean is not a decoration on
     top of its position here, it is the same fact. */
  const turn = (count: number, animated: boolean) => {
    if (!fan) return;
    gsap.to(fan, {
      rotation: angleFor(count),
      duration: animated ? SIBLINGS_REVEAL.SHIFT_DURATION : 0,
      ease: SIBLINGS_REVEAL.SHIFT_EASE,
      overwrite: "auto",
    });
  };

  const dealTo = (count: number) => {
    deal(cards[count - 1]);
    shown = count;
    turn(count, true);
  };

  /* THE WHOLE SEQUENCE, ON ONE CLOCK: a card every DEAL_GAP, and the name a gap
     after the last of them. This is where the length follows the row — nothing
     counts cards but the loop. */
  const tl = gsap.timeline({ paused: true });
  cards.forEach((_, i) => {
    tl.call(dealTo, [i + 1], i * SIBLINGS_REVEAL.DEAL_GAP);
  });
  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: SIBLINGS_REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      cards.length * SIBLINGS_REVEAL.DEAL_GAP + SIBLINGS_REVEAL.TITLE_GAP,
    );
  }

  /* Parked at nothing, and the wheel turned to where the first card is dealt —
     so card one lands in the middle of the screen rather than in its place at
     the left of a row of three.

     THE PIVOT IS SET ONCE AND NOT TWEENED. It is the wheel's centre, some four
     screen widths below the page; `rotation` is the only thing that ever moves,
     which is what makes the swing one number rather than three. */
  gsap.set(cards, { autoAlpha: 0 });
  if (fan) {
    gsap.set(fan, {
      transformOrigin: `50% ${Math.round(wheel.origin)}px`,
      rotation: angleFor(1),
    });
  }

  /* NOT `once`, though it only ever plays once: the trigger has to outlive the
     entrance to keep hearing refreshes, and play() on a finished timeline does
     nothing. */
  const st = ScrollTrigger.create({
    trigger: stage ?? root,
    start: SIBLINGS_REVEAL.START,
    onEnter: () => tl.play(),
    /* The deal's geometry is layout, and layout is what a refresh means. Re-
       measured and re-applied on the spot: a refresh that leaves the row at an
       offset computed for the old window is a row standing off centre. */
    onRefresh: () => {
      stops = spots();
      wheel = pivot();
      if (fan) {
        gsap.set(fan, {
          transformOrigin: `50% ${Math.round(wheel.origin)}px`,
        });
      }
      turn(shown || 1, false);
    },
  });

  return () => {
    st.kill();
    tl.kill();
    gsap.killTweensOf(cards);
    /* A teardown mid-deal must leave the section readable — the name standing
       and all three labels in place. Back to the stylesheet, which with the
       attribute still set is home rather than hidden. */
    if (chars.length) gsap.set(chars, { clearProps: "transform" });
    if (fan) {
      gsap.killTweensOf(fan);
      gsap.set(fan, { clearProps: "transform,transformOrigin" });
    }
    if (cards.length) {
      gsap.set(cards, { clearProps: "transform,opacity,visibility" });
    }
  };
}
