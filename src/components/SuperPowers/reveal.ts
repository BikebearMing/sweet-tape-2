/* Sweet Tape — SUPER POWERS: a stack taller than its window, scrolled a card at
 * a time.
 *
 * THE SECTION HOLDS STILL WHILE THE PAGE SCROLLS PAST IT and the stack is run
 * through it. It is the arrangement THE SIBLINGS above it already uses and the
 * one the home page's pinning section uses — a box the height of the window,
 * held with position: fixed while a length of scroll is spent on it.
 *
 * THREE SLOTS ARE VISIBLE AND THE REST ARE SHUT TO NOTHING. That is the whole
 * mechanic, and it is the reference effect's: a card that has had its turn is
 * collapsed to no height at all and the ones below climb into the room it
 * leaves. What the reader sees is a window with a card either side of the one
 * being read; what is actually there is the whole run, stacked, with everything
 * outside those three slots at zero. The three do not fit the screen and are not
 * meant to — the run is cut by the top and bottom edges, so it reads as passing
 * through the section rather than as being arranged in it. See .powers-stack.
 *
 * ONLY THE CARD IN THE MIDDLE HAS ANYTHING ON IT. Every other card in the run is
 * a blank green shape; the claim, the mark and the sentence all arrive when a
 * card reaches the middle and all go back out when it leaves. That is what makes
 * the middle of the window the one place anything can be read, which is what a
 * run scrolled through a card at a time is for — see openTo, which records the
 * arrangement this replaced and why it was worse.
 *
 * A PAD AT EACH END, and it is what makes a run of three work in a window of
 * three. The first card has nothing above it and the last has nothing below, so
 * each end gets an empty slot that takes up a card's worth of room and draws
 * nothing — the reference effect pads both ends of its run for exactly this
 * reason. What the reader sees at the start of the run is the first card with
 * space above it, which is what the start of a run looks like.
 *
 * THE ORDER, WHICH IS THE WHOLE EFFECT:
 *
 *   1. The section comes up the screen ALREADY IN SHAPE — the run standing, the
 *      middle card open, every card still blank. That is not an entrance and is
 *      not treated as one: it is put in place before any of it can be seen,
 *      because a stack this size is never usefully half visible and shaping it
 *      on the way in meant scrolling into a bare lime band. See SHAPE_START.
 *   2. SUPER and POWERS write themselves as they clear the fold. See NAME_START.
 *   3. The pin engages, the stack comes to rest dead centre, and the open card
 *      writes itself — claim, mark, sentence. Then a beat with nothing moving,
 *      the only chance the reader gets to look at the first card while nothing
 *      else on the screen is. See the step count.
 *   4. A beat each for every card after it: the card being read settles back and
 *      empties itself, the one above it shuts to nothing, the one below opens
 *      and writes itself, and the run climbs by a slot.
 *   5. A beat with the last card standing, and the pin lets go into THE RUN.
 *
 * WHAT IS SCRUBBED AND WHAT IS NOT. Scroll position picks WHICH CARD is open;
 * everything else then plays at its own pace. That is the one thing that cannot
 * be done the other way round, and THE SIBLINGS' note gives the long version of
 * why: a letter reveal scrubbed off a scrollbar is not a reveal, it is a row of
 * boxes being dragged, and it stops dead the moment the wheel does. The mark's
 * bounce settles the argument on its own — it is a CSS animation with sixty-odd
 * baked keyframes and a squash in the middle of it, and there is no sense in
 * which a reader's wheel is its clock.
 *
 * IT RUNS BACKWARDS, AND IT UNDOES THE WRITING TOO. Scroll back up through the
 * pin and the run climbs back down, each card emptying as it leaves the middle
 * and writing itself again as it returns to it. That follows from the cards
 * being blank at all: a card is written exactly while it is the one being read,
 * and which card that is depends only on where the reader is — not on where they
 * have been. Leave the section above its top and everything resets, so a second
 * pass down the page plays in full.
 *
 * THE TRIGGERS ARE BUILT ON MOUNT AND NOT BEHIND THE COVER, and that is not a
 * detail — it was a bug. A pinned ScrollTrigger adds a SPACER to the document
 * the length of its pin, and every trigger created before that spacer exists has
 * measured a page that is now several screens shorter than it thought. This
 * section's triggers were once built inside whenRevealed, which is to say after
 * the preloader lifts and therefore AFTER THE RUN below had already created and
 * measured its own pin — so the reel, NEXT UP and the footer were all keyed to
 * positions four screens off, and both pins on the page fought over the same
 * stretch of scroll. THE SIBLINGS and THE RUN both build at mount; so does this,
 * and the three then create in document order, which is the one thing
 * ScrollTrigger asks of a page with more than one pin on it.
 *
 * NOTHING IS MEASURED IN THIS FILE, and a slot's whole state is two custom
 * properties. --pow-shown says whether it is in the window at all and --pow-open
 * says whether it is the one being read; global.css derives the slot's height,
 * the size of everything printed on it and the weight of its shadow from those
 * two numbers, and all this file does is tween them. Re-proportion the stack in
 * the stylesheet and the moves follow with nothing here to keep in step — the
 * same bargain Siblings/reveal.ts strikes with its wheel and GiantPinning/pin.ts
 * with its camera.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { BODY_REVEAL, bodyLines } from "@/components/bodyReveal";
import { REVEAL } from "../Hero/reveal";

export const POWERS_REVEAL = {
  /* HOW MANY SLOTS ARE OPEN AT ONCE — the card being read and one either side.
   *
   * THE STYLESHEET HAS TO AGREE. --pow-stack-h is the height of exactly this
   * many slots and their margins, and the stack is clipped to it; show four here
   * and the fourth is cut in half by a window that was built for three. It is
   * the one number in this file that is also a number in that one.
   *
   * Three and not the reference effect's five, for the reason the section's
   * arrangement gives: at five, the two outermost are slivers, and a stack whose
   * outer cards are edges is a stack of three pretending to be five. */
  VISIBLE: 3,

  /* WHERE THE STACK TAKES ITS SHAPE, and it is as early as a start can sensibly
   * be written — the stage's top edge level with the very bottom of the window,
   * which is the frame before any of it could be seen.
   *
   * THIS WAS "top 25%" AND IT WAS WRONG, in a way only scrolling into the
   * section shows. The stack is three slots tall against a stage the height of
   * the window — near enough the whole screen — so unlike a row of cards it is
   * never usefully HALF visible: by the time the stage's top is a quarter of the
   * way down the window, the section has already been on screen for two thirds
   * of a screenful. Shaping it then meant scrolling into a bare lime band and
   * watching a stack appear in the middle of it.
   *
   * So the arrangement is not an entrance at all. It is LAYOUT, and it is put in
   * place before the section is visible and WITHOUT ANIMATION — the reader meets
   * a stack that is already a stack, exactly as the mock draws it. What is left
   * to be an entrance is the thing that actually is one: the run climbing, which
   * is what the pin is for. */
  SHAPE_START: "top 99%",

  /* THE NAME, which is a different question and gets its own answer. It sits at
     the vertical middle of the stage, so it is behind the fold until the section
     is half way up the screen — written at SHAPE_START it would be spent below
     the window every time. Half way is where it can first be read, and that is
     where it writes itself. */
  NAME_START: "top 50%",

  /* And where the section takes the screen. Full bleed, so its top at the top —
     the honest start for a box that is exactly the window's height. */
  PIN_START: "top top",

  /* HOW LONG A BEAT IS, in windows of scrolling — the one number that decides
   * how long the section is, since the pin's whole length is this times the
   * number of beats, and the number of beats is one per card plus one to stand
   * and look before it lets go.
   *
   * THE SIBLINGS' OWN FIGURE, NEARLY, AND FOR ITS REASON. That section deals
   * three cards across five beats at 0.7; this one opens three across four at
   * 0.8, which comes to about three and a quarter screens against its three and
   * a half. Two pinned sections back to back that hold for wildly different
   * lengths read as one of them being broken.
   *
   * It was 0.55 while the run was the claims repeated and there were seven beats
   * to get through. With the repeats gone there are four, and at the old figure
   * the whole section went by in a bit over two screens — a card would open
   * before the one before it had finished writing itself. Longer than this and
   * there is dead scrolling between two cards with nothing happening in it. */
  BEAT: 0.8,

  /* THE MOVE ITSELF: the card taking its turn opening, the one above it shutting
   * to nothing, and the run climbing a slot. One duration and one ease for all
   * of it, because they are one move — the stack is sharing out a fixed window
   * and any daylight between the parts is the arrangement visibly not adding up.
   *
   * inOut rather than the site's usual out. An `out` ease starts at full tilt,
   * which is right for something ARRIVING — a letter coming up from under a mask
   * has no earlier state to be continuous with. This is a rearrangement of things
   * already on screen and already still, so it has to leave from rest as well as
   * come to it. */
  OPEN_DURATION: 0.8,
  OPEN_EASE: "power3.inOut",

  /* THE NAME, either side of the stack. Written once as the section arrives and
   * never again — it is the section's title, not a card's.
   *
   * Its own stagger, tighter than the hero's 0.025 because SUPER POWERS is
   * eleven letters set enormous and split across two boxes with a whole stack
   * between them: at the hero's pace the two halves visibly finish at different
   * times, which reads as two things rather than one name. The rise itself —
   * duration, ease, hidden figure — is the hero's exactly. */
  NAME_STAGGER: 0.018,

  /* And a card's claim, which is the other way: five or six letters at a time,
     so the same pace that makes a long line read as one gesture makes a short
     one look like it barely happened. Loose enough that six letters take about
     as long as the name's eleven. */
  TITLE_STAGGER: 0.055,

  /* HOW LONG AFTER A CARD TAKES ITS TURN THE MARK IS DROPPED. Not zero: the card
   * is growing into the middle of the window over OPEN_DURATION, and a box that
   * falls onto it while it is still on its way is a box falling onto a moving
   * target — it lands, and then the thing it landed on carries on getting
   * bigger. A fifth of the move is enough that the card reads as having arrived
   * and little enough that the two are plainly one event.
   *
   * It is also LATER THAN IT LOOKS. The mark's own animation opens with an
   * eighth of a second of falling before anything touches down, so what this
   * number places is the moment it leaves the ceiling and not the moment it
   * lands. */
  MARK_AT: 0.22,

  /* And the sentence, from the moment the card's claim starts writing itself.
     After the claim has started and well before it has finished — the two
     overlap, because a card that writes its title, stops, then writes its
     sentence is two events with a silence between them. */
  COPY_AT: 0.62,
};

/* Fisher–Yates, the hero's. The shuffle IS the effect for type: reveal the same
   letters left to right and it reads as a wipe, which is a different thing
   entirely. Used on the name and on every card's claim, and on nothing else —
   the sentence under the mark arrives a line at a time in the order it is read
   in, which is the argument bodyReveal.ts makes at length. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initSuperPowersReveal(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>(".powers-stage");
  const nameChars = Array.from(
    root.querySelectorAll<HTMLElement>(".powers-name .char"),
  );

  /* EVERY SLOT, PADS INCLUDED, in document order — this is the run, and its
   * indices are what every position in this file is expressed in.
   *
   * A pad is a slot with no card on it. It takes part in the arrangement exactly
   * like any other, which is the point of it: it is what gives the first and the
   * last card something to sit against, and treating it as a special case here
   * would mean an `if` in the middle of every loop below to say so. */
  const slots = Array.from(root.querySelectorAll<HTMLElement>(".powers-slot"));
  if (slots.length < 3) return () => {};

  /* WHICH SLOTS CAN BE OPENED — the first and the last cannot, because a card in
   * either would have the window's edge on one side of it instead of a
   * neighbour. With one pad at each end that is exactly the set of real cards,
   * and it is derived rather than assumed so a second pad, or none, still works.
   *
   * These are the beats: one per openable slot, plus one at the end to stand and
   * look at the last card before the pin lets go.
   *
   * THAT LAST BEAT HAS NOTHING IN IT, and that is the point of it — the same
   * call THE SIBLINGS makes about its first. Without it the pin releases on the
   * frame the final card finishes arriving, and the card the section has been
   * climbing towards is never once still. */
  const first = 1;
  const last = slots.length - 2;
  const steps = last - first + 1 + 1;

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* Hand the type over from the stylesheet, exactly as every other reveal on
   * this site does.
   *
   * global.css holds the letters under their masks and the words of every
   * sentence under theirs until these attributes land, and setting them FIRST is
   * what makes the tweens' numbers mean what they say: GSAP reads the computed
   * transform as its starting point, and a percentage translate coming from CSS
   * is reported as resolved px — which GSAP would then ADD to the yPercent set
   * below, leaving every letter and every line a full height low.
   *
   * The sentences carry their own attribute on their own block rather than
   * inheriting the section's, because that is the contract .body-copy already
   * has with the stylesheet and this section is not the only thing that honours
   * it. Nothing paints in between: both attributes and the parks after them
   * happen in the same task. */
  root.dataset.reveal = "live";
  const blocks = Array.from(root.querySelectorAll<HTMLElement>(".body-copy"));
  for (const block of blocks) block.dataset.reveal = "live";

  /* Per SLOT and not per card, so an index is an index everywhere in this file.
     A pad's entries are empty arrays and every loop below simply does nothing
     with them. */
  const titleChars = slots.map((slot) =>
    Array.from(slot.querySelectorAll<HTMLElement>(".powers-card-title .char")),
  );
  const rises = slots.map((slot) =>
    Array.from(slot.querySelectorAll<HTMLElement>(".body-rise")),
  );
  const allChars = [...nameChars, ...titleChars.flat()];
  const allRises = rises.flat();

  /* Eleven letters flying in from nowhere, a box falling out of the ceiling and
   * a stack climbing through a window are exactly what this setting is asking
   * about.
   *
   * The two attributes above have already put the type where it belongs, and the
   * arrangement is the one thing left — so the window is opened outright on the
   * first three slots, with no tween and no trigger, and the section is a
   * finished drawing from its first frame. What a reader who has asked for no
   * motion gets is the stack's opening position and no way to run it, which is
   * the honest answer: the rest of the run is a motion, and they have asked for
   * none. The mark's bounce is called off in the stylesheet rather than here,
   * because it is a CSS animation and there is nothing in this file holding it.
   */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const block of blocks) block.dataset.arrived = "";
    slots.forEach((slot, j) => {
      gsap.set(slot, {
        "--pow-shown": Math.abs(j - first) <= 1 ? 1 : 0,
        "--pow-open": j === first ? 1 : 0,
      });
    });
    return () => {};
  }

  const tweens: gsap.core.Tween[] = [];
  const timelines: gsap.core.Timeline[] = [];
  const triggers: ScrollTrigger[] = [];

  /* Parked here as well as in the stylesheet, because the attributes above have
     just released the CSS park and something has to hold the type down in the
     frame between that and its own tween. */
  if (allChars.length) gsap.set(allChars, { yPercent: REVEAL.HIDDEN });
  if (allRises.length) gsap.set(allRises, { yPercent: BODY_REVEAL.HIDDEN });

  /* ---------------------------------------------------------------------- */
  /* THE MARK                                                                */
  /* ---------------------------------------------------------------------- */

  /* Drop the mark on one card, from the top, however many times it is asked for.
   *
   * THE ATTRIBUTE IS THE SWITCH AND THE REFLOW IS THE RESTART. global.css
   * declares the bounce only under [data-mark="go"], so setting the attribute
   * starts the animation at its first keyframe and taking it off removes the
   * declaration altogether and returns the mark to where it waits. Toggling
   * animation-play-state instead would not do this: a paused animation resumes
   * from wherever it was stopped, so a mark that had already landed would be
   * asked to play the frames after the last one, which is no frames at all.
   *
   * The read between the two writes is not superstition and not a debugging
   * leftover. Style changes inside one task are coalesced — the browser would
   * see the attribute go and come back as no change at all and let the animation
   * run on undisturbed — and asking for a geometric property is what forces the
   * removal to be resolved before the addition is queued. Nothing paints in
   * between, so there is no frame in which the mark is not declared.
   *
   * getBoundingClientRect and not offsetWidth: this is an element in an SVG, and
   * SVG elements are not HTMLElements — they have no offsetWidth to read, so the
   * usual spelling of this trick is a silent undefined and no reflow at all.
   *
   * The delete also covers a slot caught mid-EXIT at data-mark="out" — a reader
   * who scrolls off a card and straight back onto it. Clearing the attribute
   * takes the leave animation off before the drop is declared, so the mark
   * restarts from the ceiling rather than fighting a fade on its way down. */
  const dropMark = (slot: HTMLElement) => {
    const jump = slot.querySelector<SVGGElement>(".powers-mark-jump");
    if (!jump) return;
    delete slot.dataset.mark;
    jump.getBoundingClientRect();
    slot.dataset.mark = "go";
  };

  /* And take it off again, which is what makes a card blank the moment it stops
   * being the one being read.
   *
   * "out" AND NOT NO ATTRIBUTE AT ALL, and the difference is the whole of a bug
   * that made every change of card look like the drawing had been switched off.
   * Undeclaring the drop outright returns the mark to the base rule's opacity 0
   * on a single frame — the transition that used to be on .powers-mark-jump to
   * catch that fall could never fire, because a transition compares styles with
   * animation-derived values excluded and both sides of that comparison were
   * the base rule's 0. So the mark simply vanished mid-card, while the card it
   * was on was still shrinking. See the [data-mark="out"] rule in global.css,
   * which now carries the exit as an animation of its own.
   *
   * ONLY FROM "go". A slot whose mark never fell has nothing to take off, and
   * putting it into the exit would run a fade from opacity 1 on a mark that was
   * never shown — a box flashing onto a card on its way past. */
  const liftMark = (slot: HTMLElement) => {
    if (slot.dataset.mark === "go") slot.dataset.mark = "out";
  };

  /* The hard version, for the teardown: no exit, no animation left running, the
     attribute simply gone. A React remount is not a moment to be caught fading
     something out of an element that is about to be handed back to the
     stylesheet. */
  const clearMark = (slot: HTMLElement) => {
    delete slot.dataset.mark;
  };

  /* ---------------------------------------------------------------------- */
  /* WHAT ARRIVES ON A CARD                                                  */
  /* ---------------------------------------------------------------------- */

  /* One card's contents, on a timeline of its own: the claim, the mark and the
   * sentence, in that order and overlapping.
   *
   * BUILT ON DEMAND AND NOT AT MOUNT, and the sentence is the reason. Which
   * words share a line is decided by the font, the measure and the window, and
   * bodyLines is emphatic that it must be asked at the moment of use rather than
   * cached — a window resized since mount, a font that swapped in late, and the
   * grouping is already wrong. So a card's timeline is made the first time the
   * card is asked to play and thrown away on every refresh, which is what a
   * resize is. See the pin's onRefresh.
   *
   * PLAYED FORWARD AND NEVER REVERSED. It is kept only so the teardown can kill
   * it and so a rebuild can seek a card that has already been read to its end.
   */
  /* TWO TIMELINES PER CARD AND NOT ONE, which is what "their own respective
   * timelines" asks for and is the better shape anyway. The claim and the
   * sentence are set in different voices at different sizes and want different
   * pacing, and folding them into one timeline means retiming either of them is
   * an edit to a position inside a sequence the other one is also in. Apart,
   * each is a thing that plays and reverses on its own, and COPY_AT is the only
   * number left saying anything about how the two sit together.
   *
   * The mark is a third and is not a timeline at all — it is a CSS animation
   * gated on an attribute. See dropMark. */
  type Contents = { title: gsap.core.Timeline; copy: gsap.core.Timeline };
  const built = new Map<HTMLElement, Contents>();

  const contentsOf = (j: number): Contents => {
    const slot = slots[j];
    const existing = built.get(slot);
    if (existing) return existing;

    const title = gsap.timeline({ paused: true });
    const copy = gsap.timeline({ paused: true });

    if (titleChars[j].length) {
      title.to(shuffle(titleChars[j]), {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: POWERS_REVEAL.TITLE_STAGGER,
        ease: REVEAL.EASE,
      });
    }

    /* THE SENTENCE, grouped into the lines it actually landed on, right now. */
    if (rises[j].length) {
      const lines = bodyLines(rises[j]);
      lines.forEach((line, n) => {
        /* One tween for the whole line and no stagger inside it. A stagger here
           would be a wipe left to right across the line, which is a different
           effect and a worse one — the eye follows the moving edge instead of
           reading the words. bodyReveal.ts says the same thing at its own
           length; this is the same entrance, played off a beat instead of off a
           scroll position. */
        copy.to(
          line,
          {
            yPercent: 0,
            duration: BODY_REVEAL.DURATION,
            ease: BODY_REVEAL.EASE,
            /* The hand-off, on the last line only — the block is arrived when
               its bottom line has landed. Nothing on this page reads it and the
               stylesheet never has; it is set because every other block of body
               copy on the site sets it, and the day something does look for it,
               a sentence on this card should not be the one paragraph that never
               says it got there. */
            onComplete:
              n === lines.length - 1
                ? () => {
                    const block = line[0]?.closest<HTMLElement>(".body-copy");
                    if (block) block.dataset.arrived = "";
                  }
                : undefined,
          },
          /* Held off the start of its OWN timeline rather than given a delay, so
             that reversing it runs the whole block back out in the order it came
             in — a delay would sit outside the reverse and leave the last line
             hanging. */
          POWERS_REVEAL.COPY_AT + n * BODY_REVEAL.STAGGER,
        );
      });
    }

    const contents = { title, copy };
    built.set(slot, contents);
    timelines.push(title, copy);
    return contents;
  };

  /* ---------------------------------------------------------------------- */
  /* THE ARRANGEMENT                                                         */
  /* ---------------------------------------------------------------------- */

  /* HOW FAR EITHER SIDE OF THE OPEN CARD THE WINDOW REACHES. Three slots showing
     means one above and one below, and it is derived rather than typed so
     VISIBLE stays the only place the number is stated. */
  const reach = Math.floor((POWERS_REVEAL.VISIBLE - 1) / 2);

  /* The pending mark drop, so a new turn can cancel one the reader has scrolled
     past before it fired. */
  let markCall: gsap.core.Tween | null = null;

  /* Which slot is open, and -1 for none of them — the state before the section
     has been reached and the state it is put back into when the reader leaves
     above it. */
  let open = -1;

  /* WHETHER THE OPEN CARD HAS WRITTEN ITSELF, and it is a separate fact from
   * which card is open because a card can be opened without being written: the
   * shape trigger opens the first one below the fold, and its claim, mark and
   * sentence are deliberately held back until the pin gives them a screen to
   * arrive on.
   *
   * IT IS ALSO THE FIX FOR A CARD ARRIVING TWICE. The pin plays the open card on
   * the frame it takes the screen, both ways round — and coming back UP from the
   * section below, the card it takes the screen on is the LAST one, which the
   * reader has already watched write itself and which is still fully written.
   * Without this the whole of it — letters back under their masks, the mark back
   * to the ceiling and dropped again — replayed under a reader who had done
   * nothing but scroll up. Asked only when there is something to ask for, the
   * section is simply still where they left it.
   *
   * Reset wherever the card changes or the run is shut, which is everywhere the
   * writing is actually thrown away. */
  let written = false;

  /* Open one slot, shut its two neighbours and collapse everything else, on one
   * tween each so the window always adds up.
   *
   * EVERY SLOT IS WRITTEN ON EVERY MOVE, not just the three that changed. It is
   * the same cost — a tween to a value a slot already holds resolves on the
   * first frame — and it is what makes a jump of any size land correctly: a
   * restored scroll position can move the run four slots at once, and a loop that
   * only touched the neighbourhood would leave the slots it skipped standing
   * open behind it.
   *
   * `animated` is false for exactly those jumps: landing mid-section should look
   * like a stack that was always this way rather than like one rearranging
   * itself the moment it is looked at. */
  const openTo = (want: number, animated: boolean) => {
    if (want === open) return;
    const leaving = open;
    open = want;
    /* A different card is open, so nothing on it is written yet — whatever the
       card before it had on it is being reversed off a few lines down. The
       `animated` branch at the foot of this function puts it back to true if it
       plays; the un-animated branch deliberately leaves it false, which is what
       the pin's onEnter is waiting for. */
    written = false;

    slots.forEach((slot, j) => {
      const shown = want >= 0 && Math.abs(j - want) <= reach ? 1 : 0;
      tweens.push(
        gsap.to(slot, {
          "--pow-shown": shown,
          "--pow-open": j === want ? 1 : 0,
          duration: animated ? POWERS_REVEAL.OPEN_DURATION : 0,
          ease: POWERS_REVEAL.OPEN_EASE,
          overwrite: "auto",
        }),
      );
    });

    /* EVERYTHING PRINTED ON A CARD BELONGS TO THE MIDDLE OF THE WINDOW.
     *
     * A card that is not the one being read is BLANK — no claim, no mark, no
     * sentence, just the printed green shape holding its place in the run. All
     * three arrive when the card reaches the middle and all three go back out
     * when it leaves: separate timelines, played together.
     *
     * IT WAS BUILT THE OTHER WAY FIRST, and the other way is worth recording
     * because it reads perfectly well written down: tie the writing to the
     * WINDOW rather than to the turn, so a card is already written by the time
     * it takes its place and every card on screen has words on it. What that
     * costs is the point of the section. A card complete before it arrives makes
     * the turn nothing but a change of size — the reader has already read it,
     * and the mark dropping is the only thing left that the scrolling bought.
     * Blank cards make the middle of the window the one place anything can be
     * read, which is what a run scrolled through a card at a time is FOR.
     *
     * The card leaving is REVERSED rather than reset. It is on screen and
     * shrinking, and type that vanishes on a frame reads as a glitch where type
     * that sinks back under its own masks reads as the card closing. */
    if (leaving >= 0 && leaving !== want) {
      const gone = built.get(slots[leaving]);
      gone?.title.reverse();
      gone?.copy.reverse();
      liftMark(slots[leaving]);
    }

    if (want < 0) return;

    /* AND THE CARD ARRIVING — but not while the run is being SHAPED. That
       happens below the fold, before any of it can be seen, and an entrance
       spent there is an entrance nobody gets. The pin plays the first card on
       the frame it takes the screen; see its onEnter. */
    if (animated) play(want);
  };

  /* One card developing: the claim, the mark and the sentence, together.
   *
   * THE MARK IS HELD BACK BY MARK_AT AND THE OTHER TWO ARE NOT, because it is
   * the only one of the three that lands ON the card rather than being part of
   * it — the card is still growing into the middle of the window, and a box
   * dropped on the first frame lands on a target that then carries on getting
   * bigger underneath it.
   *
   * THE PENDING DROP IS CANCELLED FIRST. A reader throwing the wheel can move
   * the run several slots inside MARK_AT, and without this every card passed
   * through would drop its mark a fifth of a second later — onto cards that are
   * by then somewhere else in the window, or out of it. Only the card the reader
   * actually stopped on should bounce. */
  const play = (j: number) => {
    /* Recorded here rather than at each of the three call sites, so the flag
       cannot drift from the thing it describes: whatever asks for a card to
       write itself has, by definition, written it. */
    written = true;

    const contents = contentsOf(j);
    contents.title.play(0);
    contents.copy.play(0);

    markCall?.kill();
    markCall = gsap.delayedCall(POWERS_REVEAL.MARK_AT, () => dropMark(slots[j]));
    tweens.push(markCall);
  };

  /* ---------------------------------------------------------------------- */
  /* THE SCROLL                                                              */
  /* ---------------------------------------------------------------------- */

  /* THE NAME, on a timeline of its own for the reason THE SIBLINGS' is: it is
     played as the section arrives and rewound if the reader leaves above it,
     neither of which a tween queued inside a sequence can do. */
  const nameTl = nameChars.length ? gsap.timeline({ paused: true }) : null;
  if (nameTl) {
    nameTl.to(shuffle(nameChars), {
      yPercent: 0,
      duration: REVEAL.DURATION,
      stagger: POWERS_REVEAL.NAME_STAGGER,
      ease: REVEAL.EASE,
    });
    timelines.push(nameTl);
  }

  /* THE NAME, played when it can first be read and rewound if the reader leaves
     above the section. Its own trigger, because it is the one thing here whose
     right moment is neither the section's shape nor the pin's — see NAME_START.
     Not `once`: a second pass down the page writes it again. */
  triggers.push(
    ScrollTrigger.create({
      trigger: stage ?? root,
      start: POWERS_REVEAL.NAME_START,
      onEnter: () => nameTl?.play(),
      onEnterBack: () => nameTl?.play(),
      onLeaveBack: () => nameTl?.reverse(),
    }),
  );

  /* THE STACK TAKING ITS SHAPE, before any of it can be seen — and the reset on
     the way back out. Not `once`: leaving above the section shuts the whole run,
     puts every claim back under its masks and lifts every mark to the ceiling,
     so a second pass down the page plays the whole thing again. */
  triggers.push(
    ScrollTrigger.create({
      trigger: stage ?? root,
      start: POWERS_REVEAL.SHAPE_START,
      /* NOT ANIMATED, EITHER WAY. Coming down, the section is not visible yet and
         an entrance spent here is an entrance nobody sees; coming back up, the
         reader is arriving at a section rather than watching one rearrange. The
         arrangement is layout, and layout does not have an entrance. */
      onEnter: () => openTo(first, false),
      onEnterBack: () => {
        if (open < 0) openTo(first, false);
      },
      onLeaveBack: () => {
        openTo(-1, false);
        for (const slot of slots) liftMark(slot);
        /* Every card back to blank, and every timeline back to its own start so
           the next pass down the page plays them rather than finding them spent.
           clearProps is not the tool here — the parks below are exactly where the
           stylesheet would put them anyway, and setting them outright avoids a
           frame of unmasked type between the two. */
        for (const c of built.values()) {
          c.title.pause(0);
          c.copy.pause(0);
        }
        /* THE CLAIMS ONLY, AND POINTEDLY NOT THE NAME. Every letter in the
           section is in `allChars`, the name's included — and the name is put
           back by REVERSING its own timeline, on its own trigger above. Setting
           it here as well would be two things writing the same property on the
           same elements in the same frame: the set would win, the tween would
           carry on running against it, and the name would be parked and then
           dragged back out from under its masks. */
        const claimChars = titleChars.flat();
        if (claimChars.length) gsap.set(claimChars, { yPercent: REVEAL.HIDDEN });
        if (allRises.length)
          gsap.set(allRises, { yPercent: BODY_REVEAL.HIDDEN });
        for (const block of blocks) delete block.dataset.arrived;
      },
    }),
  );

  /* THE PIN, and the beats spent on it. */
  let step = -1;
  if (stage) {
    triggers.push(
      ScrollTrigger.create({
        trigger: stage,
        start: POWERS_REVEAL.PIN_START,
        /* Measured off the window rather than typed as a length, so the section
           costs the same number of SCREENS whatever screen it is read on. THE
           SIBLINGS' pin is written the same way. */
        end: () =>
          "+=" + Math.round(window.innerHeight * POWERS_REVEAL.BEAT * steps),
        pin: stage,
        /* True pinning, not fake: the stage is the window's height in ordinary
           document flow, so it can be held with position: fixed and the rest of
           the page pushed down by a spacer. */
        pinSpacing: true,
        /* Re-reads `end` on every refresh, which includes every resize. Without
           it the pin keeps the length it was built with on the old window. */
        invalidateOnRefresh: true,
        /* THE FIRST CARD DEVELOPING, ON THE FRAME THE SECTION TAKES THE SCREEN.
         * Every other card writes itself as it takes its turn, but the first
         * card's turn began before the section was visible — its slot was opened
         * by the shape trigger, off the bottom of the window, where the claim,
         * the box and the sentence would all have been spent on nobody.
         *
         * So the whole of it waits for this. The pin engaging is the moment the
         * stack is centred and still, which is the best frame on the section to
         * put a card down on. Both ways round, because a reader coming back up
         * into the section is arriving at it just as much as one coming down.
         *
         * AND ONLY IF THERE IS SOMETHING TO PLAY, which is what `written`
         * carries and is the difference between the two directions. Coming down,
         * the open card is the first and it is blank — the shape trigger opened
         * it below the fold without an entrance, exactly so this frame could
         * spend one. Coming back up from the section below, the open card is the
         * LAST one and it is finished: the reader watched it write itself on the
         * way down and nothing since has taken it off. Playing it again put every
         * letter back under its mask and dropped the mark a second time, which
         * from the reader's side was a section they had already read replaying
         * itself because they scrolled up. */
        onEnter: () => {
          if (open >= 0 && !written) play(open);
        },
        onEnterBack: () => {
          if (open >= 0 && !written) play(open);
        },
        /* A REFRESH IS A RESIZE, AND A RESIZE RE-BREAKS EVERY SENTENCE.
         *
         * The card timelines were built against a measurement of which words
         * shared a line, and after a resize that measurement describes a layout
         * that no longer exists — so they are thrown away and made again on
         * demand, which is the whole reason contentsOf is lazy.
         *
         * THE OPEN CARD IS PUT STRAIGHT TO ITS END rather than replayed: its
         * words are on the page and the reader is in the middle of the section,
         * so re-running the entrance under them would be the section reacting to
         * a window being dragged. Every other card is blank and has nothing to
         * restore. The mark is left exactly as it is — it is a CSS animation,
         * nothing here is holding it, and a resize is not a reason to drop a box
         * on somebody. */
        onRefresh: () => {
          for (const [slot, c] of built) {
            for (const tl of [c.title, c.copy]) {
              tl.kill();
              const at = timelines.indexOf(tl);
              if (at >= 0) timelines.splice(at, 1);
            }
            built.delete(slot);
          }
          /* `written` and not just `open`, for the case the sentence above
             glosses over: the open card is only on the page if it has actually
             played. Between the shape trigger opening the first card and the pin
             giving it a screen, the open card is deliberately blank — and a
             resize landing in that window would have written it out below the
             fold, spending the section's opening entrance on nobody and leaving
             the pin nothing to arrive with. Rebuilt and left at zero, it is
             still waiting. */
          if (
            written &&
            open >= 0 &&
            slots[open]?.classList.contains("powers-card")
          ) {
            const c = contentsOf(open);
            c.title.progress(1, true);
            c.copy.progress(1, true);
          }
        },
        onUpdate: (self) => {
          const next = Math.min(
            Math.floor(self.progress * steps),
            steps - 1,
          );
          if (next === step) return;
          step = next;

          /* One card per beat, so the beat IS the slot less the pad in front of
             it — and beat 0 asks for the card that is already open, which is what
             makes it the held moment described at the step count. The last beat
             asks for the last card again, which is the run standing still while
             the pin runs out. */
          openTo(Math.min(first + next, last), true);
        },
      }),
    );
  }

  return () => {
    triggers.forEach((t) => t.kill());
    timelines.forEach((t) => t.kill());
    tweens.forEach((t) => t.kill());

    /* READABLE, AND THE WINDOW OPEN ON ITS FIRST CARD. A teardown mid-section —
       a StrictMode remount, a route change — must never leave a card's claim
       hidden under its own mask with nothing left running to lift it, and must
       never leave a run of slots holding numbers nothing is tweening any more.
       clearProps hands the type back to the stylesheet, which is where it
       belongs now that data-reveal is set and staying set; the arrangement is
       then written outright to the position the section rests in.

       The marks are left where they are on purpose: they are CSS, they have
       either landed or not, and neither is a broken state to be found in. */
    if (allChars.length) gsap.set(allChars, { clearProps: "transform" });
    if (allRises.length) gsap.set(allRises, { clearProps: "transform" });
    for (const block of blocks) block.dataset.arrived = "";
    for (const slot of slots) clearMark(slot);
    gsap.set(slots, { clearProps: "--pow-shown,--pow-open" });
    slots.forEach((slot, j) => {
      gsap.set(slot, {
        "--pow-shown": Math.abs(j - first) <= reach ? 1 : 0,
        "--pow-open": j === first ? 1 : 0,
      });
    });
  };
}
