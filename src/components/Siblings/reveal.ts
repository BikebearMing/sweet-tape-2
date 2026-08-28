/* Sweet Tape — THE SIBLINGS arriving: one label, then the rest, then the name.
 *
 * THE SECTION HOLDS STILL WHILE THE PAGE SCROLLS PAST IT and the range is dealt
 * onto it a card at a time. It is the arrangement the pinning section already
 * uses on this site — a box the height of the window, held with position: fixed
 * while a length of scroll is spent — and it is here for the same reason: this
 * row is a handful of objects arriving one after another, and that many arrivals
 * inside the second and a half a section takes to cross the screen is a row that
 * assembles itself while the reader is still on the one above it.
 *
 * THE ORDER, WHICH IS THE WHOLE EFFECT — written here for the three-card row the
 * section was drawn as, which is the longest it gets:
 *
 *   1. The first label arrives on its own, IN THE MIDDLE OF THE SCREEN and
 *      standing square, on the way in — before the pin takes hold, so the card is
 *      put down while the section is still coming up rather than onto a page that
 *      has already stopped. It comes UP into its place and it does not fade in;
 *      nothing here fades. See CARD_RISE.
 *   2. The pin engages and the second is dealt to its right: the fan swings, the
 *      first slides left and takes on half its lean, and the pair stays centred.
 *      What the eye sees is the row GROWING rather than cards stacked onto one
 *      end.
 *   3. The third is dealt, the fan swings again, and they land on the
 *      arrangement the design draws — every card at its own lean.
 *   4. THE SIBLINGS writes itself in the gap the arrangement has just made.
 *   5. A beat with the whole thing standing, and the pin lets go.
 *
 * HOW MANY CARDS IS THE TAPE'S BUSINESS AND NOT THIS FILE'S. The range is not
 * three grades of everything — see `faces` in src/data/tape-types.ts — so a row
 * can be one card or two, and every number in here is read off the row that was
 * actually rendered rather than typed. A shorter row is the same deal with fewer
 * beats in it; nothing above changes but the count.
 *
 * THE NAME COMES LAST, AND THAT IS A GEOMETRY DECISION RATHER THAN A TASTE ONE.
 * Its place is under the RAISED card — a gap that does not exist until the row
 * is finished. Written any earlier it has to be shoved out of the way of whatever
 * is standing in the middle of the screen, and a name that shifts to make room is
 * a worse answer than a name that waits for its room to exist.
 *
 * THE CARDS ARE DEALT ON A STEP AND NOT SCRUBBED. Scroll position picks WHICH
 * beat you are on; the move itself then plays at its own pace. That is the one
 * thing that cannot be done the other way round — the settle is a spring, and a
 * spring scrubbed off a scrollbar is not a spring: it is a shape being dragged,
 * and it stops dead the moment the wheel does.
 *
 * IT RUNS BACKWARDS. Scroll up and the last card dealt is taken back off and the
 * row re-centres; go back above the pin entirely and the name goes under its
 * masks again. A pinned sequence that only assembles is a section that is spent
 * the first time it is passed.
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

import { screenH } from "@/components/viewport";

export const SIBLINGS_REVEAL = {
  /* WHERE THE FIRST CARD ARRIVES, on the way in and before the pin. The stage's
     top edge a quarter of the way down the window — and the stage is the
     window's height with the row centred in it, so that puts the row three
     quarters of the way down: on screen, low, and rising into the middle as the
     last quarter of the section is scrolled. Earlier and the card is dealt below
     the fold; later and it is dealt onto a section that has already stopped,
     which reads as the pin having stuck. */
  ARRIVE_START: "top 25%",

  /* And where the section takes the screen. Full bleed, so its top at the top —
     the pinning section's own start, and the honest one for a box that is
     exactly the window's height. */
  PIN_START: "top top",

  /* HOW MANY BEATS THE PIN IS SPENT ON — one per card, one for the name and one
   * to stand and look at the whole thing before it lets go. Five, for three
   * cards.
   *
   * A CONSTANT PLUS THE COUNT AND NOT A FLAT FIVE, which it was while the row
   * was always three. The row is the tape's list now and can be shorter, and a
   * pin costing five beats to deal one card is three screens of scrolling with
   * nothing happening in them. See stepsFor, just below.
   *
   * THE FIRST BEAT IS ONE WITH NOTHING IN IT, and that is the point of it:
   * card one has already arrived on the way in, so this is the moment it stands
   * alone in the middle of the held screen before the row starts growing around
   * it. Without it the second card is dealt on the same frame the pin engages,
   * and the card that was supposed to introduce the section never gets looked
   * at.
   *
   * Equal slices of the pin's length, which is what makes the step below a floor
   * of the progress. */
  EXTRA_STEPS: 2,

  /* And how long a beat is, in windows of scrolling — the one number that
     decides how long the section is, since the pin's whole length is this times
     the count above. At 0.7 across five beats the section costs about three and a
     half screens. Shorter and cards are dealt faster than the moves themselves
     play, which reads as the row being flicked at you; longer and there is dead
     scrolling between two cards with nothing happening in it. */
  BEAT: 0.7,

  /* The beat between the last card landing and the name starting. Long enough
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
  SPRING_DURATION: 0.9,
  SPRING_EASE: "elastic.out(0.6, 0.3)",

  /* AND TAKING ONE BACK OFF, on the way up: DOWN THE SPOKE IT CAME UP.
   *
   * The reference takes a class off and the card is simply gone, which is right
   * for a deck of twenty where the one being dropped is behind four others. Here
   * there are three, they are the size of the screen, and the reader is watching
   * the one that vanishes — so it goes back the way it came, shrinking as it
   * nears the hub, and leaves through the bottom of the held screen. The stage
   * clips, so it is out of sight before it is switched off and there is no pop
   * and still no fade anywhere in this section.
   *
   * .in, which is the mirror of the entrance's .out: slowest at the start, so the
   * move begins as a card being drawn back rather than as one being dropped. No
   * spring on the way out — an elastic here would have the card hesitate on its
   * way off the table, which is a section arguing with somebody who has decided
   * to leave. */
  LEAVE_DURATION: 0.45,
  LEAVE_EASE: "power2.in",

  /* How far past the bottom edge it goes before it is switched off, as a
     fraction of its own width. Enough that the corner is clear of the edge on
     the last frame of the move — the cards lean, so the trailing corner is lower
     than the box's bottom. */
  LEAVE_CLEAR: 0.15,

  /* THE FAN TURNING under the card just dealt. The same spring, because it is
     the same gesture seen from the other side — the cards already down swing
     aside to make room, and they arrive at the new middle the way the new card
     arrives at its place. A shade longer than the deal, so the turn is still
     settling as the card lands beside it. This is the reference effect's own
     pairing: the card springs and the wheel springs after it. */
  SHIFT_DURATION: 1,
  SHIFT_EASE: "elastic.out(0.6, 0.3)",

};

/** The beats the pin is spent on, for a row of this many cards: one each, plus
 *  the name's and the hold at the end. Three cards comes to five, which is the
 *  figure this was written as. */
const stepsFor = (cards: number) => cards + SIBLINGS_REVEAL.EXTRA_STEPS;

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
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".siblings-card"));
  if (!chars.length && !cards.length) return () => {};

  /* The pin's length, in beats. Read once off the row that was rendered — the
     count cannot change without this component remounting. */
  const steps = stepsFor(cards.length);

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
     screen are exactly what the setting is asking about — and holding the page
     still for three and a half screens to do it is more so than either. The
     attribute alone has already put the whole arrangement where it belongs: the
     row as the design draws it, the name standing, and no pin at all. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
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
     * design, and the swing is a displacement measured FROM it. Measuring the
     * last stop like the others was harmless while every place in the row held a
     * card, because centring the cards and resting the fan were then the same
     * position. They are not once a place is left empty: a range of two sits in
     * the left and middle places with the right one open (see .siblings-space),
     * and the measured answer swings the whole composition sideways to put the
     * PAIR in the middle of the screen — which takes the raised card off centre
     * and leaves the name standing under nothing. */
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

  /* HOW MANY ARE DOWN. Everything below moves this towards a number and animates
     only what changed, so a restored scroll position landing three cards in is
     three cards standing rather than three cards dealt on one frame. */
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

  const deal = (card: HTMLElement, animated: boolean) => {
    /* THE EXIT IS KILLED RATHER THAN OVERWRITTEN, and it has to be: it switches
       the card off when it finishes, and a tween that merely has its properties
       taken over still runs to the end and still fires that. Dealt on top of a
       card on its way out, the card would arrive and then blink off half a
       second later. Killing it takes the callback with it. */
    gsap.killTweensOf(card);

    /* ON THE TABLE FIRST AND IN ONE STEP — see CARD_RISE. The card is simply
       there, at its full weight and at the lean the stylesheet gave it; what
       moves is where along its spoke it is. */
    gsap.set(card, { autoAlpha: 1, rotation: tiltOf(card) });
    if (!animated) {
      gsap.set(card, { y: 0, scale: 1 });
      return;
    }
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

  /* AND TAKING ONE BACK OFF, on the way up: off the table, in one step. The
     mirror of the deal would be a card being un-dealt in the same loving detail
     it was dealt with, which is a section arguing with somebody who has decided
     to leave — and the reference does the same thing, by taking a class off. */
  const undeal = (card: HTMLElement, animated: boolean) => {
    gsap.killTweensOf(card);
    if (!animated) {
      gsap.set(card, { autoAlpha: 0, y: 0, scale: 1 });
      return;
    }

    /* HOW FAR DOWN IS OFF THE SCREEN, measured from where the card is NOW rather
       than from where it belongs — it may be halfway up its own entrance when
       the reader turns round, and a fixed distance would leave it short. The
       stage is the held screen, so its bottom edge is the one to clear.

       The shrink is the entrance's arithmetic on the exit's distance: the card
       is going back toward the hub, and how far along the spoke it is IS its
       size. See `entrance`. */
    const from = card.getBoundingClientRect();
    const floor = stage?.getBoundingClientRect().bottom ?? screenH();
    const drop =
      Math.max(0, floor - from.top) +
      card.offsetWidth * SIBLINGS_REVEAL.LEAVE_CLEAR;
    const scale = wheel.length
      ? Math.max(1 - drop / wheel.length, SIBLINGS_REVEAL.CARD_SCALE_MIN / 2)
      : 1;

    gsap.to(card, {
      y: "+=" + Math.round(drop),
      scale,
      duration: SIBLINGS_REVEAL.LEAVE_DURATION,
      ease: SIBLINGS_REVEAL.LEAVE_EASE,
      overwrite: "auto",
      /* Switched off only once it is out of the frame, and put back at its place
         in the same breath — so the next deal starts from the card's own spoke
         rather than from wherever this move left it. */
      onComplete: () => gsap.set(card, { autoAlpha: 0, y: 0, scale: 1 }),
    });
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

  const dealTo = (count: number, animated: boolean) => {
    const want = Math.max(1, Math.min(count, cards.length));
    if (want === shown) return;

    if (want > shown) {
      /* Only the newest is dealt — anything a jump skipped is simply put down,
         which is what makes a restored scroll position land as a standing row
         rather than as three cards arriving on one frame. */
      for (let i = shown; i < want; i++) {
        deal(cards[i], animated && i === want - 1);
      }
    } else {
      for (let i = shown - 1; i >= want; i--) undeal(cards[i], animated);
    }

    shown = want;
    turn(want, animated);
  };

  /* THE NAME, on a timeline of its own: it is played by the pin's first beat and
     rewound if the reader leaves above the section, neither of which a tween
     queued inside a sequence can do. */
  const nameTl = chars.length ? gsap.timeline({ paused: true }) : null;
  if (nameTl) {
    nameTl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: SIBLINGS_REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      SIBLINGS_REVEAL.TITLE_GAP,
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

  /* CARD ONE, ON THE WAY IN — its own trigger and not the pin's first beat, for
     the reason ARRIVE_START gives. */
  const arriveSt = ScrollTrigger.create({
    trigger: stage ?? root,
    start: SIBLINGS_REVEAL.ARRIVE_START,
    once: true,
    onEnter: () => dealTo(1, true),
  });

  /* THE PIN, and the beats spent on it. */
  let step = -1;
  const pinSt = stage
    ? ScrollTrigger.create({
        trigger: stage,
        start: SIBLINGS_REVEAL.PIN_START,
        /* Measured off the window rather than typed as a length, so the section
           costs the same number of SCREENS whatever screen it is read on. */
        end: () =>
          "+=" +
          Math.round(screenH() * SIBLINGS_REVEAL.BEAT * steps),
        pin: stage,
        /* True pinning, not fake: the stage is the window's height in ordinary
           document flow, so it can be held with position: fixed and the rest of
           the page pushed down by a spacer. */
        pinSpacing: true,
        /* Re-reads `end` on every refresh, which includes every resize. Without
           it the pin keeps the length it was built with on the old window. */
        invalidateOnRefresh: true,
        /* The deal's geometry is layout, and layout is what a refresh means. Re-
           measured and re-applied on the spot: a refresh that leaves the row at
           an offset computed for the old window is a row standing off centre. */
        onRefresh: () => {
          stops = spots();
          wheel = pivot();
          if (fan) {
            gsap.set(fan, {
              transformOrigin: `50% ${Math.round(wheel.origin)}px`,
            });
          }
          if (shown) turn(shown, false);
        },
        onUpdate: (self) => {
          const next = Math.min(
            Math.floor(self.progress * steps),
            steps - 1,
          );
          if (next === step) return;
          step = next;

          /* One card per beat, so the count IS the step plus one — and beat 0
             asks for the card that is already down, which is what makes it the
             held moment described at STEPS. dealTo clamps at the row's length,
             which leaves the two beats after the last card free for the name and
             the hold. */
          dealTo(step + 1, shown > 0);

          /* And the name on the beat AFTER the last card, not on the same one:
             the row has to be finished for the gap to be there, and the two
             landing together would be the arrangement and its name arriving as
             one event rather than as cause and effect. Rewound if the reader
             goes back past that beat, so it is watched again on the way down. */
          /* AND REVERSED RATHER THAN SNAPPED BACK on the way up: the letters go
             back down under their masks in the order they came out of them,
             which is the same move read backwards. Jumping the timeline to zero
             is the name being deleted, and the reader who scrolled up by one
             beat did not ask for that — they asked to see the last thing
             again. */
          if (step >= cards.length) nameTl?.play();
          else nameTl?.reverse();
        },
        onLeaveBack: () => {
          /* Back above the section: the row goes back to the one card that
             arrived on the way in and the name back under its masks. Both are
             what the reader will watch arrive again on the way down. */
          step = -1;
          nameTl?.reverse();
          dealTo(1, true);
        },
      })
    : null;

  return () => {
    /* The pin first: killing it takes the spacer out of the document, and doing
       that after the transforms are cleared would leave one frame with the row
       home and the page three screens too tall. */
    pinSt?.kill();
    arriveSt.kill();
    nameTl?.kill();
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
