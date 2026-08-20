/* Sweet Tape — the crumpled sheet opening, and the statement written on it.
 *
 * SIX PHOTOGRAPHS AND NOTHING ELSE. The paper is not a model, a mesh or a
 * morph: it is six stills of one sheet being opened, stacked on top of each
 * other, and the unfold is those six SHOWN IN ORDER. A flipbook, and it is the
 * whole mechanism.
 *
 * WHY IT IS NOT A CROSS-FADE. Two photographs of a crumpled sheet at half
 * opacity each are not a sheet halfway between them — they are a double
 * exposure, and every fold shows through the other frame's folds. Hard cuts are
 * what stop-motion has always used and they read as motion for the same reason
 * film does. Six frames is a small number for a fade and a perfectly ordinary
 * one for a cut.
 *
 * THE GROWTH IS IN THE FRAMES AND NOT IN A TWEEN. Frame 6 is a ball with a lot
 * of empty canvas around it and frame 1 is a sheet filling its own; drawn into
 * one box at one size, the paper opens outward on its own, at the rate the
 * photographer opened it. Nothing here scales anything.
 *
 * THEN THE STATEMENT, in the site's headline voice — every letter under its own
 * mask, sliding up in a shuffled order. The hero's constants, imported rather
 * than copied. It starts a beat before the last frame lands, so the words are
 * already coming up as the sheet finishes flattening rather than waiting for it
 * to finish and then starting: two moves that overlap read as one event, which
 * is what "the paper opens and there is writing on it" has to be.
 *
 * ONCE, AND FORWARD ONLY. A sheet that re-crumples when the reader scrolls back
 * up is a sheet that was never opened — and unlike the section above this one,
 * none of this is scrubbed: the reader's arrival is the cue and the animation
 * has its own clock from there. It is a thing that HAPPENS, not a thing the
 * wheel drags.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

export const REIMAGINE = {
  /* WHERE THE SECTION HAS TO BE FOR IT TO GO, and it is measured off the
   * section's CENTRE rather than its top edge — which is the whole of what this
   * constant had wrong at first.
   *
   * The ball sits in the middle of a section 1096 tall. Triggered on the
   * section's top edge coming 70% down the window, the section is 630px in and
   * the ball is at 1145 — a third of a screen BELOW the fold. The unfold played
   * perfectly, off screen, every time; what the reader met on the way down was
   * a sheet that had always been open.
   *
   * On the centre it says what it means: the ball is 70% of the way down the
   * window when the paper springs. It is on screen and has been for a moment
   * before it goes, which is the beat the section is built on — a screen with
   * nothing on it but a screwed-up piece of paper — and the sheet has most of
   * the window to open into.
   *
   * The section's centre and the ball's are 30px apart at the design size (the
   * sheet sits a hair above centre, see .reimagine-sheet), which is close
   * enough to call this the ball's own position. */
  START: "center 70%",

  /* HOW LONG THE WHOLE UNFOLD TAKES, IN SECONDS. THIS IS THE KNOB.
   *
   * Not seconds-per-frame, which is what it was: the sequence is however many
   * stills are in the markup, and what anybody watching it has an opinion about
   * is how long the paper takes to open. Add a frame tomorrow and the unfold
   * still lasts exactly this long, with the extra picture making it smoother
   * rather than longer.
   *
   * AND THERE IS A FLOOR UNDER HOW SLOW SIX PICTURES CAN GO. At 0.36s the
   * flipbook ran at 17 frames a second, which is film; at 2.5 it runs at 2.4,
   * which is a slideshow, and no amount of tuning hides a cut you have had a
   * third of a second to study. EASE below is what buys the difference back —
   * it spends the time where a hard cut is least visible — but the honest limit
   * is the frame count. Past about 2.5s the only real fix is more stills
   * between the ones there are.
   *
   * 2.0 is the settled figure, and it has been walked to from both ends: 0.36
   * was a snap, 1.6 still hurried. Unmistakably an unfurl, and still inside the
   * ceiling above.
   *
   * It does not trade against the writing any more. It did for one round — the
   * unfold was cut to 1.6 to pay for the writing being made to wait for the
   * flat sheet (see TEXT_AT) — and that is the wrong thing to spend: the paper
   * opening is what the reader is watching, and the section's total length is a
   * consequence rather than a target. */
  UNFOLD: 2,

  /* HOW THE UNFOLD'S TIME IS SHARED OUT BETWEEN THE FRAMES.
   *
   * EVEN. Every cut is the same distance from the last — five holds of 0.4s
   * against UNFOLD 2 — and it is the setting this arrived at after trying both
   * of the curved ones.
   *
   * THE TWO IT REPLACED, because the trail is the argument. power1.in was pure
   * deceleration (holds of 0.08, 0.24, 0.40, 0.56, 0.72), on the reasoning that
   * a ball let go springs open and then relaxes; it put the longest wait of the
   * sequence immediately before the final frame, and the sheet appeared to
   * stall three quarters open. power1.inOut fixed that end (0.16, 0.48, 0.72,
   * 0.48, 0.16) and broke the other one — the last two cuts went past in under
   * two thirds of a second between them, which is a settle so quick it reads as
   * the animation being cut off.
   *
   * The trouble with both is the same: SIX STILLS ARE NOT ENOUGH TO SHAPE. A
   * curve borrows time from one part of a sequence to spend on another, and
   * with only five gaps to work with, every borrow leaves somewhere visibly
   * short. Held evenly there is nowhere to be short — no gap is longer than any
   * other, so none of them reads as a stall or a snip.
   *
   * WHAT IT COSTS is that the unfold is now paced like stop-motion rather than
   * like paper: 2.5 frames a second, held steady. That is a look rather than a
   * fault, and at this frame count it is the honest one. The day the sequence
   * gains stills, a curve becomes worth having again — "power1.inOut" is the
   * one to come back to, and it is a one-word change here.
   *
   * Any GSAP ease name works; "none" is the even hold. */
  EASE: "none",

  /* HOW LONG THE OUTGOING FRAME IS HELD UNDER THE INCOMING ONE, in seconds, and
   * it is what stops the cuts flashing.
   *
   * THE BUG IT FIXES, because it is invisible in the code that caused it. Show
   * the next frame and hide the previous one at the same instant and the two
   * instructions do land in the same tick — but the frame coming up has never
   * been rastered (it has been sitting at opacity 0, and a compositor does not
   * raster what it is not drawing), so on the tick it is asked for there is a
   * layer that is not ready yet AND a layer that has just been taken away. What
   * paints is the lime underneath, for exactly one frame, and what you see is a
   * flash. Measured on a screencast of the live playback: coverage of the sheet
   * dropped to 0% on the frame of the cut and back to 100% on the next one.
   *
   * So the hide is moved LATE rather than the show moved early: the frame going
   * out stays where it is for another three frames' worth of time, and the one
   * coming in has that long to appear over the top of it. There is never a
   * moment with nothing on the screen, whatever the compositor is doing.
   *
   * The cost is that two photographs are both on screen for 50ms, and it is a
   * cost worth paying twice over: the paper opens OUTWARD, so the frame coming
   * in is the larger of the two and covers the one underneath almost entirely —
   * and both are opaque paper. A doubled edge for three frames is not something
   * the eye has time to find; a hole in the middle of the section is.
   *
   * It is not the whole fix on its own — see will-change on .reimagine-paper in
   * global.css, which is what gets the incoming layer rastered in the first
   * place. This is the belt to that pair of braces. */
  LAP: 0.05,

  /* WHERE THE WRITING STARTS, in seconds from the END of the unfold.
   *
   * ZERO — THE SHEET IS FLAT BEFORE A WORD IS WRITTEN, AND IT CANNOT BE
   * OTHERWISE. This was -0.5 for a while, on the reasoning that two moves
   * overlapping read as one event, and it produced a defect worth writing down:
   * the type is laid out against the FLAT sheet's box (see .reimagine-copy in
   * global.css), and every frame before the last one draws a smaller piece of
   * paper inside that box. So the letters came up against a sheet whose left
   * edge had not reached them yet — the first word of the first line hung off
   * the paper onto the lime, in mid air, until the last cut landed under it.
   *
   * The overlap was buying about half a second of section length. It was not
   * worth writing on the background for.
   *
   * If the two ever need to overlap again, the thing to change is not this: it
   * is the frames. A sequence exported so that every still fills the same box —
   * the paper opening within a constant crop rather than being trimmed to its
   * own content — would let the writing start whenever it liked. */
  TEXT_AT: 0.67,

  /* THE STRIP OF TAPE, which is the last thing to happen.
   *
   * It goes on the way tape goes on: rolled down from its left end. The site's
   * peel does the drawing (components/Peel, and the markup in ./index.tsx says
   * which end and how big); all this owns is when it starts, how long it takes
   * and what curve it lays down on.
   *
   * AFTER THE WRITING, AND JUST BEFORE THE WRITING HAS FINISHED. LAG is
   * measured from the moment the last letter lands, so a negative number
   * overlaps the tail of the reveal — the last few letters are still coming up
   * as the strip starts down. Two moves that overlap read as one section
   * finishing; one that waits for the other to end reads as a queue.
   *
   * THE CURVE IS THE PRELOADER'S MARK, and not by coincidence — it is the same
   * gesture, a stuck thing being smoothed down. sine.inOut eases out of rest
   * and back into it, which is a hand laying something flat rather than
   * something being yanked. A power ease starts at full speed from a dead stop
   * and reads as a snap at this length; "back" or an elastic would bounce, and
   * tape does not.
   *
   * FROM is where the fold sits when the beat starts, in the peel's own units:
   * 1 is rolled right up at the far end, which is a strip that is not on the
   * page yet. The preloader's mark starts at 0.4 instead, and its note explains
   * why at length — a badge unrolling from nothing reads as a strange fade,
   * because a sticker does not arrive that way. A strip of tape does: rolling
   * down from nothing is exactly how it goes on, which is why this one can
   * start where that one could not. */
  TAPE: {
    /* ZERO: the last letter lands and the strip starts down on the same frame.
       It overlapped by a quarter of a second for a while, on the general
       principle that two moves reading as one beat is better than a queue —
       but here the queue IS the point. The sentence is written and THEN it is
       taped, which is an order of events and not two things happening at
       once. */
    LAG: 0,
    DURATION: 0.55,
    EASE: "sine.inOut",
    FROM: 1,
  },

  /* Between letters, in shuffled order. Well under the hero's 0.025: there are
     ninety-odd characters here against a headline's twenty, and at the hero's
     pace the last of them would arrive two and a half seconds after the first.
     The pinning section's own heading makes the same adjustment for the same
     reason. */
  STAGGER: 0.011,
};

/* Fisher–Yates, the hero's and the footer's. The shuffle IS the effect: reveal
   the same letters left to right and it reads as a wipe, which is a different
   thing entirely. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initReimagine(root: HTMLElement): () => void {
  /* THE FRAMES IN THE ORDER THEY PLAY, which is the order they are written in —
     the markup lists them crumpled-first, so this is document order and not a
     sort. The last one is the flat sheet and the section rests on it. */
  const frames = Array.from(
    root.querySelectorAll<HTMLElement>(".reimagine-paper"),
  );
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));
  const tape = root.querySelector<HTMLElement>(".reimagine-tape");
  if (!frames.length) return () => {};

  const last = frames[frames.length - 1];

  /* Hand the letters over from the stylesheet — the site's usual hand-off, and
     the reason it has to happen before the tween is built: global.css parks
     them with a percentage translate, GSAP reads that as resolved px and would
     ADD its own yPercent to it, leaving every letter a full height low. With
     the attribute on, the computed transform is `none` and GSAP owns it. */
  root.dataset.reveal = "live";

  /* A sheet of paper springing open and ninety letters flying up out of it are
     exactly what this setting is asking about. What is left is the section as
     it ends up: the sheet flat, with the statement written on it. The letters
     are already home — the attribute did that — and the stylesheet's own media
     query shows the last frame, so there is nothing to do here but stay out of
     the way. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    /* The tape needs nothing either: --peel is never written, so it rests at 0,
       which is the strip lying flat — see from={0} in ./index.tsx. */
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  /* THE FLIPBOOK. One `set` per frame, at its own moment: the frame coming up
     is shown and the one before it is hidden in the same instruction, so there
     is never a moment with two sheets on screen or none. Frame 0 is already
     showing — the stylesheet rests on it — so the run starts at 1.

     WHERE EACH CUT FALLS is the ease read at that frame's place in the run,
     which is what makes the first cuts quick and the last ones slow — see
     REIMAGINE.EASE, which argues it. gsap.parseEase turns the name into the
     curve, so the constant stays a string anybody can swap.

     opacity and not display: an image with display: none is not decoded until
     it is shown, and a flipbook that decodes its next frame at the moment it
     needs it is a flipbook that stutters exactly once, the first time it is
     played, which is the only time anybody sees it. At opacity 0 every frame
     is painted, decoded and in the compositor before the run begins. */
  const curve = gsap.parseEase(REIMAGINE.EASE);
  const last_i = frames.length - 1;

  for (let i = 1; i < frames.length; i++) {
    const at = curve(i / last_i) * REIMAGINE.UNFOLD;
    tl.set(frames[i], { opacity: 1 }, at);
    /* LATE, and REIMAGINE.LAP is the whole argument for why. */
    tl.set(frames[i - 1], { opacity: 0 }, at + REIMAGINE.LAP);
  }

  const unfold = REIMAGINE.UNFOLD;

  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: REIMAGINE.STAGGER,
        ease: REVEAL.EASE,
      },
      unfold + REIMAGINE.TEXT_AT,
    );
  }

  /* AND THE TAPE, ROLLED DOWN OVER THE HOLE IN THE THIRD LINE.
   *
   * --peel is WRITTEN AS A BARE NUMBER off a plain object rather than tweened as
   * a property, because that is what it is: no unit for GSAP's CSSPlugin to
   * infer, and Peel/peel.ts writes it the same way. The preloader's mark is
   * driven from this exact pattern.
   *
   * The first write happens NOW, outside the timeline, and it is what takes the
   * strip off the page before its beat. The markup's rest pose is the tape lying
   * flat — it has to be, so that a page with no script on it has the tape stuck
   * down rather than missing — so something has to roll it back up again the
   * moment there IS a script. This is that.
   *
   * WHERE IT STARTS is the end of the WRITING plus LAG, and every part of that
   * is read off the other constants rather than typed. The writing begins at
   * unfold + TEXT_AT and runs for its own duration plus its stagger across
   * however many letters the statement turned out to have; the strip goes on
   * LAG after the last of them.
   *
   * IT LEFT TEXT_AT OUT OF THAT SUM AT FIRST and the bug is worth recording,
   * because it hid: at TEXT_AT 0 the writing starts exactly when the unfold
   * ends, so "end of the unfold plus the writing's length" and "end of the
   * writing" are the same instant and the tape landed correctly. Move the
   * writing later — TEXT_AT 0.67 — and the tape stayed where it was, which put
   * it halfway down the sentence while half the letters were still in the air.
   * A sum that is right only for one value of a constant it does not mention is
   * a sum waiting for that constant to be tuned. */
  if (tape) {
    const fold = { v: REIMAGINE.TAPE.FROM };
    const write = () => tape.style.setProperty("--peel", String(fold.v));
    write();

    /* AND OFF THE PAGE UNTIL ITS BEAT, which rolling it up does not achieve on
     * its own.
     *
     * A peel at --peel 1 is not a strip that has gone away — it is a strip
     * folded back on itself, and what is left standing at the fold is a stub of
     * tape a good fraction of the width of the whole thing. Sitting on a lime
     * field with the paper still crumpled in the middle of the screen, that
     * stub is a piece of tape stuck to nothing, half a minute before anything
     * else on the section has happened.
     *
     * So the roll is what it looks like once it is there, and this is what
     * decides WHETHER it is there. The two are separate questions and the
     * peel only answers the first. The preloader's mark is held off the same
     * way and for the same reason — see PRELOADER.MARK, where the gif's first
     * twelve blank frames are what this stands in for.
     *
     * autoAlpha rather than opacity: visibility goes with it, so the strip is
     * not merely invisible but out of the way entirely. */
    gsap.set(tape, { autoAlpha: 0 });

    const written =
      chars.length > 0
        ? REVEAL.DURATION + REIMAGINE.STAGGER * (chars.length - 1)
        : 0;

    const at = unfold + REIMAGINE.TEXT_AT + written + REIMAGINE.TAPE.LAG;

    /* Shown on the frame the roll starts and not before — a cut rather than a
       fade, because what appears is the stub at the fold and it is on its way
       out from under itself in the same instant. A fade would be a strip
       arriving twice. */
    tl.set(tape, { autoAlpha: 1 }, at);

    tl.to(
      fold,
      {
        v: 0,
        duration: REIMAGINE.TAPE.DURATION,
        ease: REIMAGINE.TAPE.EASE,
        onUpdate: write,
      },
      at,
    );
  }

  /* AND HAND THE LAYERS BACK once the sheet is open.
   *
   * global.css puts will-change: opacity on all six frames, which is what makes
   * the compositor keep each of them ready to draw — the reason a cut no longer
   * has a hole in it. It is also six full-size layers held on the GPU for a page
   * that has finished with five of them, and will-change is explicitly a hint to
   * be TAKEN OFF when the thing it was promising about has happened.
   *
   * onComplete rather than at the end of the unfold: the letters are still
   * arriving after the last cut, and there is nothing to be gained by doing
   * memory work in the middle of them. */
  tl.eventCallback("onComplete", () => {
    gsap.set(frames, { willChange: "auto" });
  });

  const st = ScrollTrigger.create({
    trigger: root,
    start: REIMAGINE.START,
    once: true,
    onEnter: () => tl.play(),
  });

  if (process.env.NODE_ENV !== "production") {
    /* Console handle for tuning, the same convention as window.hero,
       window.band and window.wanted. The timeline is the useful thing here
       rather than the knobs: the unfold is over in a third of a second, so the
       way to look at it is reimagine.tl.timeScale(0.1) before scrolling in, or
       reimagine.tl.progress(0.4) to hold it open halfway. */
    Object.assign(window, { reimagine: { REIMAGINE, tl, st } });
  }

  return () => {
    st.kill();
    tl.kill();
    /* A teardown mid-unfold must leave a section that reads: the sheet open and
       the words on it, not a ball of paper with half a sentence beside it.
       Back to the stylesheet for the letters (with the attribute still set,
       that is home) and forward to the last frame for the paper. */
    gsap.set(chars, { clearProps: "transform" });
    gsap.set(frames, { opacity: 0 });
    gsap.set(last, { opacity: 1 });
    /* And the strip stuck down and visible, which is the markup's own rest pose
       — a teardown mid-roll must not leave a piece of tape half on, or a
       section with a hole in its sentence where the tape never arrived. */
    if (tape) {
      tape.style.removeProperty("--peel");
      gsap.set(tape, { clearProps: "opacity,visibility" });
    }
  };
}
