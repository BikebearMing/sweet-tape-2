/* Sweet Tape — the product page's roll, and the journey it makes down the page.
 *
 * ONE ROLL ON THE WHOLE PAGE, seen twice. It stands in its own name at the top,
 * exactly as the home page's key visual stands in the slider's, and when the
 * page is scrolled it rolls down out of the lime sheet and comes to rest in the
 * origin section's left column — the slot the flat card used to hold. It is not
 * two rolls handed off between two sections and it is not a copy: it is the same
 * WebGL context, the same model and the same lighting, moved.
 *
 * WHY THAT AND NOT A SECOND VIEWER. The origin section used to build its own —
 * its own canvas, its own GLB fetch, its own context, at its own angle — so the
 * page paid for the model twice and the reader was shown the same object twice
 * with no relationship drawn between the two. Moving the one we already have
 * costs nothing, says the thing the design is actually saying, and halves the
 * page's 3D budget.
 *
 * THE ANGLE AND THE LIGHTING ARE THE HOME PAGE'S, and deliberately not this
 * page's own. createTapeViewer's key and ambient are left at the slider's
 * defaults — the one thing added is a room for the label's metal to reflect,
 * which is a missing input rather than a second opinion about the lighting; see
 * ROOM below — and the roll sits at the slider's own pose: face-on,
 * spin(0), which is where the key visual stands and where it returns to. A
 * visitor arriving here has just been shown this exact object and should meet
 * the same one, lit and posed the same way. The old origin-section rig — key up,
 * ambient down, a fill from behind, the roll turned thirty degrees — was built
 * for a stage this page no longer has.
 *
 * IT LEANS, BUT NOT AT THE CURSOR. The home page's roll is almost never square
 * on screen — it is leaning toward wherever the pointer happens to be, and that
 * tilt is most of what its key visual LOOKS like. This page takes the tilt and
 * throws away the chase: the same lean, at a fixed setting, held. See LEAN
 * below, which is the one number to change if the angle is wrong.
 *
 * WHY NOT THE CHASE TOO. On the slider the lean is a depth cue on an object you
 * are NOT being invited to touch — what you click is the orbit of six rolls
 * beside it. Here the roll is the only thing on the screen, and an angle that
 * drifts with the pointer is an angle nobody chose: it reads as reacting to you
 * without ever being under your control, and it means the pose the journey lands
 * on is only the composed one when the cursor happens to be somewhere
 * particular. It also costs a pointermove listener and a per-frame re-measure of
 * a box the scroll is already moving.
 *
 * THE TURN IS THE SLIDER'S FLIP, HANDOFF AND ALL — see addCard in
 * TapeSlider/engine.ts, which this is the scroll-driven version of. Same axis,
 * same direction throughout, same two eases, and the same swap at edge-on. The
 * only difference is what is on the far side of the handoff: the slider trades
 * one model for the next there, and this page has only one, so it hands the roll
 * back to itself.
 *
 * AND THAT HANDOFF IS NOT A FLOURISH, IT IS THE WHOLE THING THAT MAKES THIS
 * WORK. The exports are single-walled — turned past edge-on you are looking
 * through the back of a shell that has no inside, and what is actually on screen
 * is a flat grey disc where the roll should be. It is why the slider swaps at
 * exactly 90deg and why the origin section's old drag was clamped at 78. So the
 * roll cannot simply be turned through 360: it goes out to edge-on, is picked up
 * again at edge-on from the OTHER side, and comes home. A reader sees a full
 * turn; the renderer never draws a frame past the rim. See TURN below.
 *
 * DYNAMIC IMPORT, so three.js and the loaders ship as their own chunk fetched
 * after the section is interactive — the same arrangement the slider makes, and
 * the reason the flat <img> exists in the markup at all. Until the chunk and the
 * GLB land, the img is the roll; if either fails, the img stays, the second
 * section's own card stays, and the page is exactly what it would have been
 * without any of this.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { TapeViewer } from "@/components/TapeSlider/tape3d";

/* ===========================================================================
   THE RESTING LEAN — how square the roll sits, and THE ONE KNOB TO TURN if it
   should sit at a different angle. Everything else in this file is the journey.
   ===========================================================================
 *
 * Two numbers, and they are in the SLIDER'S OWN UNITS rather than degrees: they
 * are exactly what the home page hands viewer.point(), where 0 is dead square
 * and ±1 is as far as that stage ever leans for anybody. So this is not an angle
 * invented for this page — it is a position on the home page's own dial, held
 * still instead of chasing a cursor.
 *
 * WHICH IS THE WHOLE REASON IT IS point() AND NOT A SPIN. The lean is a yaw, a
 * pitch AND a small counter-shift of the roll in frame, applied to the stage
 * group ABOVE the flip (see MAX_YAW in tape3d.ts) — a camera that has stepped
 * aside, not an object that has been twisted. Faking it with spin() would get
 * the turn and lose the tip and the shift, and it would fight the journey, which
 * owns spin() outright.
 *
 * WHAT THE TWO DO, and both are worth knowing before touching them:
 *
 *   x  turns the roll about the upright. NEGATIVE shows its LEFT flank, which is
 *      the side that should be showing: the roll ends its journey at the left of
 *      the origin column with the story to its right, so the wound side belongs
 *      on the outside edge rather than crowding the type. Positive swings the
 *      brown into the gutter.
 *
 *   y  tips it. NEGATIVE looks slightly DOWN on the roll, which is the ordinary
 *      product-shot angle — an object on a surface in front of you. Positive
 *      looks up at it from below, which reads as a monument.
 *
 * WHAT THEY COME OUT AS is MAX_YAW and MAX_PITCH in tape3d.ts — 17.2deg and
 * 11.5deg at full deflection. At -0.4 / -0.35 that is about 7deg of turn and 4
 * of tip: enough that the rim reads as round and the label as a face rather than
 * a sticker, and not so much that the artwork starts to distort.
 *
 * Turn it up towards ±1 for a more three-quarter roll; set both to 0 for the
 * square-on pose. The angle holds through the whole journey and is what the roll
 * lands in, because the lean composes with the flip rather than competing with
 * it. */
const LEAN = { x: 100, y: 0 };

/* THE ROOM — the one thing this page asks the viewer for that the slider does
   not, and it is a correction rather than a look.
 *
 * THE OPP ROLL'S LABEL IS HALF METAL. Its export, header-brown.glb, is the only
 * one in /assets/tapes with metalness on any material: "Face Brown", the disc
 * the artwork is printed on, at 0.55. Metal has no diffuse term — its colour is
 * what it reflects — so in a scene of bare lights, with nothing to reflect, that
 * half of the surface renders BLACK and the label leaves the renderer at about
 * half the brightness of the artwork. Which is exactly what the page was
 * showing: an olive-brown disc where the packaging is lime.
 *
 * IT IS NOT SOMETHING THE LIGHTS CAN FIX. key and ambient feed the diffuse term
 * the metal has already given up; turning them up brightens the rim, the core
 * and the wound side — the parts that were right — and leaves the face where it
 * was. What the face needs is a surrounding, and that is what this is: three's
 * own RoomEnvironment, the addon studio box, pre-filtered to a small cube map.
 * See `env` in TapeSlider/tape3d.ts, which is where it is built.
 *
 * THE NUMBER IS SET WHERE THE ARTWORK IS THE REFERENCE, AND IT IS SMALL. It is
 * scene.environmentIntensity, and it is turned up only as far as it takes to
 * bring the label back to the lime of /assets/opp-tape-inner-product.webp — the
 * flat hero this section's slot was designed around and the thing the roll
 * stands in for. Measured off a clean patch of the label field, that hero is
 * #b3d600; unlit the face rendered #8fb804, and at this setting it renders
 * #a7dd0b. Which is the whole distance to travel, and it is why 1 is nowhere
 * near the right answer: at 1 the same patch comes out past #e0ff20, a yellow
 * the packaging does not contain.
 *
 * THE SECOND REASON NOT TO GO HIGHER, and it is the one that decides it: the
 * sheet behind the roll on this page IS lime, #b6fe00. Push the label past the
 * artwork and it converges on the background it is standing against — the roll
 * stops being an object on a colour and becomes a hole in it. There is roughly
 * one setting where the face is bright enough to be the artwork and still dark
 * enough to be a thing.
 *
 * THE OTHER FIVE TAPES DO NOT NEED IT AND ARE NOT HARMED BY IT. Every other
 * export is fully dielectric, so they render identically with this on or off —
 * which is why it is passed here, per page, rather than turned on in the viewer
 * for everything including the home page's orbit of six. */
const ROOM = 0.25;

/* ===========================================================================
   THE FINISH — WHAT THE ROLL IS MADE OF ON THIS PAGE, and the dial to turn for
   metalness and gloss without opening Blender.
   ===========================================================================
 *
 * Keyed by the export's own material names — "Tape" is the wound side, "Core"
 * the cardboard, "Face Brown" the printed label disc, and `*` is all of them at
 * once. See MaterialFinish in TapeSlider/tape3d.ts for the full list and what
 * each property does.
 *
 * EMPTY, AND DELIBERATELY SO. What ships is whatever Header-Brown-Inner.glb was
 * exported with, which is the one true answer — this is the override, not the
 * setting. Uncomment a line to try a value in the browser in a second rather
 * than in a re-export in ten minutes, and once a number is right, put it in the
 * file and empty this again. Left populated it silently outranks the export, so
 * a re-export that changes gloss would appear to have done nothing.
 *
 * THE MOST LIKELY TWO, and they are the reason this page has its own export at
 * all (see `modelInner` in src/data/tapes.ts):
 *
 *   metalness  0.55 on the label today. It is what made the face render dark,
 *              and ROOM above is what pays for it. Take it to 0 and the room
 *              stops mattering; leave it up and the label keeps a sheen that
 *              reads as printed film rather than paper.
 *   roughness  0.91 on the label today — nearly matte. DOWN is glossier. This
 *              is the "gloss" dial, and it only does anything visible while
 *              there is a room for the surface to reflect.
 *
 * NOTHING HERE REACHES THE HOME PAGE. It is an argument to this page's viewer,
 * and this page's viewer now loads this page's own file. */
const FINISH = {
  "Face Brown": { metalness: 0.35, roughness: 2 },
  "Tape": { roughness: 0.4 },
};

/* THE TURN, and it is the slider's FLIP_SWEEP: how far the roll goes before
   there is nothing left of it to see. 90 is edge-on, exactly, and it is not a
   number to round up — see the note at the top on what is behind the rim. */
const SWEEP = 90;

/* The two halves of it, and they are TapeSlider/engine.ts's eases verbatim.
 *
 * power2.in out and power2.out back is what puts the fastest motion of the whole
 * move at the moment the roll is thinnest — which is the frame the handoff
 * happens on, so the swap is hidden inside the part of the turn the eye can
 * least follow. Levelled to linear the roll dawdles through edge-on, and the
 * flip stops reading as one continuous turn and starts reading as two.
 *
 * Parsed once, at module scope: place() runs on every scroll frame and
 * gsap.parseEase does a string lookup. */
const OUT = gsap.parseEase("power2.in");
const BACK = gsap.parseEase("power2.out");

/* WHERE THE HANDOFF FALLS, as a fraction of the journey. Half way, so the roll
   is edge-on at the midpoint of its travel — the two halves of the turn take the
   same amount of scroll, which is what the slider's own symmetrical halves do.
   The measured landing is what makes the arrival read: at the end of the second
   half the roll is back at 0, the angle it left the top of the page at and the
   angle the home page's key visual sits at. */
const HANDOFF = 0.5;

export function initProductRoll(root: HTMLElement): () => void {
  /* THE BOX THAT TRAVELS AND THE BOX THAT HOLDS THE CANVAS ARE NOT THE SAME ONE.
     `.pi-roll` is what the journey moves and `.pi-roll-in` is what the entrance
     bounces and what three draws into. Both moves are a transform, both are live
     at once on a visitor who scrolls while the page is still arriving, and a
     transform is one property. See the note in the markup. */
  const box = root.querySelector<HTMLElement>(".pi-roll");
  const mount = box?.querySelector<HTMLElement>(".pi-roll-in");
  const card = mount?.querySelector<HTMLImageElement>("img") ?? null;
  const model = root.dataset.model;
  if (!box || !mount || !model) return () => {};

  /* WHERE IT IS GOING, AND IT IS IN THE NEXT SECTION. Reached by a document
     query rather than handed in, which is the one place this module looks
     outside its own root and is worth being explicit about: the journey is a
     relationship between two sections and only the page has both. The slot is
     the origin section's own `.threed-tape` — the box the design already
     reserves for the roll, at the design's own offsets — so this file holds no
     destination geometry of its own and never has to be edited when that column
     is redrawn.

     If it is not there — a product page that one day carries only the opening
     section — everything below still runs and the roll simply stays where it
     is. */
  const info = document.querySelector<HTMLElement>(".product-inner-info");
  const slot = info?.querySelector<HTMLElement>(".threed-tape") ?? null;
  const slotCard = slot?.querySelector<HTMLImageElement>("img") ?? null;

  /* A roll that travels down the page and turns over as you scroll is exactly
     what the setting is asking about. Under reduced motion the page keeps BOTH
     stations as still pictures: the 3D roll is still mounted and still face-on
     at the top, and the origin section keeps the flat card it was served with.
     Nothing moves, and nothing is missing. */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let viewer: TapeViewer | null = null;
  let gone = false;

  /* ------------------------------------------------------------------- flight */

  /* How far the slot is from the roll's resting place, in px, measured rather
     than declared. The two boxes are the same size to the thousandth of a vw —
     see the note over .product-inner-info in global.css — so the journey is a
     translation and nothing else: no scale, and no second set of numbers here
     that a redesign could leave behind. */
  let dx = 0;
  let dy = 0;

  /* Measured with the journey's own transform taken off and put back, so the
     answer does not depend on where the reader happens to be on the page when
     ScrollTrigger asks. The destination is absolutely positioned and out of
     flow, so it cannot be disturbed by this. */
  function measure() {
    if (!slot) return;
    const x = gsap.getProperty(box!, "x") as number;
    const y = gsap.getProperty(box!, "y") as number;
    gsap.set(box, { x: 0, y: 0 });
    const from = box!.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    /* Both read in the same frame, so the scroll offset they share cancels and
       what is left is the page-space distance between the two slots. */
    dx = to.left - from.left;
    dy = to.top - from.top;
    gsap.set(box, { x, y });
  }

  /* The journey at a fraction of itself, and it is the only thing that ever
     moves the roll: position and turn are both written from the one number, so
     they cannot drift apart and there is no state to keep in step.
     Which is also what makes the flip safe to scrub. It is a FUNCTION of the
     scroll rather than a sequence played through it — there is no "have we
     handed over yet" to get wrong — so a reader who scrolls back up runs it
     backwards, one who throws the wheel and lands past the middle gets the far
     half and nothing else, and either way the angle is whatever the scroll
     position says it is. */
  function place(p: number) {
    gsap.set(box, { x: dx * p, y: dy * p });
    if (!viewer) return;
    /* Out to edge-on, then back from the other edge — the same direction of
       travel throughout, which is what makes the two halves one turn. Both are
       eased across their own half, so the joint at HANDOFF is the fastest point
       of each and the roll is at its thinnest for the fewest possible frames. */
    viewer.spin(
      p < HANDOFF
        ? SWEEP * OUT(p / HANDOFF)
        : -SWEEP + SWEEP * BACK((p - HANDOFF) / (1 - HANDOFF))
    );
  }

  let trigger: ScrollTrigger | null = null;

  if (slot && !reduced) {
    gsap.registerPlugin(ScrollTrigger);

    /* WHERE THE JOURNEY BEGINS AND ENDS, expressed as the two sections rather
       than as a distance.
       Start: the top of the page — the opening section is shorter than most
       windows, so the origin section is already partly in view at rest and the
       first notch of the wheel IS the reader setting off for it.
       End: the origin section's top reaching the top of the window, by which
       point the roll is home and the column is composed around it.
       Written this way, a taller or shorter opening section re-times the whole
       move by itself. */
    trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      endTrigger: info!,
      end: "top top",
      /* No scrub, because there is no tween to scrub: the position is written
         straight from the progress. Lenis is already smoothing the scroll this
         reads, so the move arrives smoothed and lands exactly rather than
         easing towards a target it may never quite reach. */
      onUpdate: (self) => place(self.progress),
      /* onUpdate stops firing the moment the range is left, and a fast throw can
         leave it having last been called a few pixels short. The toggles fire on
         exactly those crossings, with the progress already clamped to 0 or 1. */
      onToggle: (self) => place(self.progress),
      /* The window has changed shape: both slots have moved, so the distance
         between them is stale. Re-measured, then re-applied at wherever the
         reader currently is. */
      onRefresh: (self) => {
        measure();
        place(self.progress);
      },
    });
  }

  /* --------------------------------------------------------------- the model */

  /* Hidden from mount, not from viewer-ready — the slider's call, for its
     reason: once scripts are running the roll is coming, and letting the flat
     card paint first only flashes artwork the roll is about to replace. The cost
     is an empty slot while the chunk and the model load.

     BOTH CARDS, because there is one roll for two slots. The origin section's
     own flat card is the thing the roll comes to rest ON TOP OF, and two of the
     same object at the same size in the same box is one of them showing through
     the other's antialiasing. It is hidden here rather than in that section
     because this is the file that knows whether a roll is coming at all. */
  if (card) card.style.visibility = "hidden";
  if (slotCard && slot && !reduced) slotCard.style.visibility = "hidden";

  import("@/components/TapeSlider/tape3d")
    .then(({ createTapeViewer }) =>
      /* THE SLIDER'S KEY AND AMBIENT, UNTOUCHED — the whole point of this page
         is the home page's roll, lit the home page's way. See the note at the
         top, and ViewerLight in tape3d.ts.
         The room is the one addition, and it is not a second opinion about the
         lighting: it is the input the metal label has no value without. See
         ROOM above.

         THE FOURTH ARGUMENT IS THE OBJECT RATHER THAN THE STAGE — metalness and
         gloss, overriding this page's own export where a number is being tried
         out. Empty by default; see FINISH. */
      createTapeViewer(mount, [model], { env: ROOM }, FINISH)
    )
    .then((v) => {
      if (gone) return v.dispose();
      viewer = v;
      v.show(model);
      /* Square on the flip axis, which is where the home page's key visual rests
         and what the journey turns the roll away from and back to. place()
         overwrites this whenever there is a journey; it is what the roll sits at
         when there is not. */
      v.spin(0);
      /* AND THEN LEANED, once and for good — see LEAN. Said once rather than
         held every frame because nothing here ever changes it: point() is a
         target the viewer eases toward, not a pose it has to be reminded of, so
         the roll settles into the angle over the same beat the entrance bounce
         is landing on and then simply stays there. */
      v.point(LEAN.x, LEAN.y);
      // Caught up to wherever the reader has already scrolled to — the chunk may
      // well land after a page has been read past.
      place(trigger ? trigger.progress : 0);
      /* The journey was measured against a layout that did not include a canvas.
         It does not change one — the canvas is absolutely positioned inside a
         box the stylesheet sizes — but the model landing is also the first
         moment the page is finished, and a refresh here is the cheapest possible
         insurance against having measured mid-load. */
      trigger?.refresh();
    })
    .catch(() => {
      /* No three after all — put the flat fallbacks back on stage, in BOTH
         sections, and the page is the one it would have been without any of
         this. An explicit `visible`, not "": the line above set it inline, and
         only an inline value out-specifies an inline value. */
      if (card) card.style.visibility = "visible";
      if (slotCard) slotCard.style.visibility = "visible";
    });

  /* Teardown. Everything with a lifetime longer than one frame is released here,
     and both slots are put back the way the server rendered them — a mount that
     replaces this one may never get a viewer at all, and it must not inherit two
     invisible cards and a roll parked half way down the page. */
  return () => {
    gone = true;
    trigger?.kill();
    trigger = null;
    /* The dispose runs here OR in the loader's then-branch, never both: `gone`
       tells a load that resolves after teardown to discard itself. */
    viewer?.dispose();
    viewer = null;
    gsap.set(box, { clearProps: "transform" });
    if (card) card.style.visibility = "";
    if (slotCard) slotCard.style.visibility = "";
  };
}
