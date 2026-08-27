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
 * AND IT LEANS AT THE CURSOR, exactly as the home page's key visual does — the
 * same dial, the same reach, the same ease. See THE CHASE below.
 *
 * IT DID NOT USED TO, and the argument against is worth keeping because it was
 * a real one: on the slider the lean is a depth cue on an object you are not
 * invited to touch, and here the roll is the only thing on the screen, so an
 * angle that drifts with the pointer is an angle nobody composed. What settles
 * it the other way is that a roll which does not move AT ALL until you scroll
 * reads as artwork rather than as an object — a photograph of the thing, on a
 * page whose whole point is that it is the thing. The lean is what a visitor
 * arriving from the home page has just had their hands on, and meeting the same
 * roll gone inert is the one way this page can feel like a step backwards.
 *
 * THE COMPOSED POSE IS NOT LOST, it is where the roll RESTS — see LEAN, which
 * stopped being a held angle and became a home to come back to. No pointer, no
 * hover, or reduced motion, and the page is the still one it was before.
 *
 * THE TURN IS A WHOLE REVOLUTION, AND THE ROLL IS SEEN FROM BEHIND IN THE
 * MIDDLE OF IT. Face on at the top of the page, edge-on a quarter of the way
 * down, its open core square to the reader at the half, edge-on again, and back
 * to its face as it lands. One rotation about one axis, scrubbed by the scroll.
 *
 * THE EXPOSED CORE IS THE POINT OF IT rather than something tolerated on the way
 * round. A roll of tape is a tube, and the half-second where you are looking
 * into it — the wound edge as a ring, the hollow in the middle — is the frame
 * that says so. A key visual that only ever presents its label is a photograph;
 * one that turns over is an object.
 *
 * IT USED TO BE A MIRROR, AND THAT IS WORTH KNOWING because the file read as if
 * it still were. The turn went out to edge-on and was picked up again at edge-on
 * from the OTHER side — the slider's model handoff (addCard in
 * TapeSlider/engine.ts), borrowed by a page with only one model to hand, so it
 * handed the roll back to itself. A reader saw a full turn and the renderer
 * never drew a frame past the rim.
 *
 * The reason given for it was that the exports are single-walled — that past
 * edge-on you are looking through a shell with no inside, and what lands on
 * screen is a flat grey disc. THAT IS NO LONGER TRUE OF THESE FILES. Every
 * material in them is double-sided and the core is modelled and textured; the
 * roll renders correctly at every angle, which is what made this change a
 * deletion rather than a re-export. If a future export goes back to a bare
 * shell, this is the note that says what broke and the mirror above is the
 * shape of the thing to bring back.
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
import { onViewportChange, screenH } from "@/components/viewport";

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
 * square-on pose. The angle composes with the turn rather than competing with
 * it, so it holds through the whole journey.
 *
 * IT IS THE REST POSE AND NO LONGER A HELD ONE. It is what the roll is served
 * at, what it eases back to when the pointer leaves the window or the section,
 * and the only angle a touch or reduced-motion visitor ever sees. With a cursor
 * on the page THE CHASE below is driving, and this is the pose it is driving
 * away from. */
const LEAN = { x: 1, y: 0 };

/* THE CHASE — how far the pointer has to be from the roll to lean it as far as
   it goes, as a share of the viewport's short side. The home page's own figure
   (TILT_REACH in TapeSlider/engine.ts), and it is the same number for the same
   reason: at 0.42 the roll is at full travel well before the cursor reaches a
   corner, so the lean is live across most of the screen rather than only at the
   extremes. The deflection it produces is MAX_YAW and MAX_PITCH in tape3d.ts,
   and the ease toward it is that file's too. */
const REACH = 0.42;

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
 *   metalness  0.55 as the file was exported, held down to 0.14 below. It is
 *              what made the face render dark, and ROOM above is what pays for
 *              it. Take it to 0 and the room stops mattering; leave it up and
 *              the label keeps a sheen that reads as printed film rather than
 *              paper.
 *              THIS IS THE METAL DIAL AND THERE IS ONLY THE ONE. Nothing else
 *              on the roll has any metalness at all — the flank, the core and
 *              the discs are fully dielectric — so a roll that reads as metal
 *              is this number and the film's coat, in that order. It came from
 *              the export's 0.55 by way of 0.35, and each step took the label
 *              closer to its own printed colour: metalness tints reflections
 *              with the albedo and takes the diffuse away, so on a disc whose
 *              whole job is to be the artwork, less of it is more of the
 *              artwork.
 *   roughness  0.91 on the label today — nearly matte. DOWN is glossier. This
 *              is the "gloss" dial, and it only does anything visible while
 *              there is a room for the surface to reflect.
 *
 * NOTHING HERE REACHES THE HOME PAGE. It is an argument to this page's viewer,
 * and this page's viewer now loads this page's own file. */
const FINISH = {
  "Face Brown": { metalness: 0.05, roughness: 2 },
  "Tape": { roughness: 0.4 },
};

/* THE TURN. One whole revolution across the journey, which is the only figure
   that both shows the reader the back of the roll AND lands it on its face: the
   slot at the foot of the move is the origin section's key visual and a roll
   resting there at any other angle is a roll caught mid-move.

   HALF OF IT IS THE PICTURE, and that is what the number is chosen for rather
   than for being round. At the midpoint the core is square to the reader; the
   two quarter points either side are edge-on, and the two of them are what give
   the turn its rhythm. Take it to 720 and the roll spins rather than turns. */
const TURN = 360;

/* AND IT TURNS AT THE RATE THE READER SCROLLS, which is to say it is not eased
 * at all — the one deliberate omission in this file.
 *
 * WHAT THE EASES WERE FOR IS GONE. There were two, power2.in out and power2.out
 * back, lifted from TapeSlider/engine.ts: their job was to put the fastest
 * motion of the whole move on the frame the roll was thinnest, so that the
 * model handoff hiding in there was over before the eye could follow it. There
 * is no handoff now, so all an ease could do is decide which parts of the
 * rotation the reader gets to see properly — and it would spend its speed in
 * exactly the middle, which is where the core is.
 *
 * LINEAR IS ALSO WHAT THE TRAVEL DOES. The roll's position down the page is
 * dx * p and dy * p, straight off the progress; a turn on a curve against a
 * slide on a line is two moves rather than one object moving. And a scrubbed
 * rotation that keeps pace with the wheel is the thing that makes the roll feel
 * turned BY the reader instead of played at them. */

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
  /* Absent means a solid roll, which is what Number(undefined) would NOT give:
     the attribute is left off entirely for a tape with no clarity (see Stage),
     so this reads as 0 rather than NaN. */
  const clarity = Number(root.dataset.clarity ?? 0) || 0;
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

  /* --------------------------------------------------------------------- lean */

  /* THE LEAN THAT FOLLOWS THE POINTER. All this side does is say where the
   * cursor is relative to the roll's own centre and how far out counts as
   * full; the tilt, its limits and the ease toward it are tape3d.ts's, on a
   * group ABOVE the turn — so this and the journey run at the same time
   * instead of overwriting one another. See THE CHASE above.
   *
   * SKIPPED ON A DEVICE WITH NO POINTER, where the handler could only ever fire
   * on a tap and would leave the roll leaning at whatever was last touched, and
   * under reduced motion, which a lean that chases a cursor is precisely a case
   * of. Both fall through to the served pose, which is LEAN. */
  const chase = !reduced && window.matchMedia("(hover: hover)").matches;
  const ac = new AbortController();
  const { signal } = ac;

  /* Where the roll is on screen, cached. Read from `box` rather than from the
     canvas: the stylesheet oversizes the canvas past the slot to give the turn
     room to swing in, so its centre is the slot's but its box is not, and the
     bounce lives on `.pi-roll-in` inside it. */
  let cx = 0;
  let cy = 0;
  /* Measured on the next move that needs it rather than the moment it changes.
     The two things that move the roll are the scroll — which is also the thing
     moving it down the page — and a viewport change, and both can fire many
     times between two pointer events. This way a still page costs one
     measurement and a scrolled one costs at most one per move. */
  let stale = true;
  let seen = true;

  function centre() {
    const b = box!.getBoundingClientRect();
    cx = b.left + b.width / 2;
    cy = b.top + b.height / 2;
    stale = false;
  }

  function aim(e: PointerEvent) {
    if (!viewer || !seen) return;
    if (stale) centre();
    const reach = Math.min(window.innerWidth, screenH()) * 0.5 * REACH;
    viewer.point((e.clientX - cx) / reach, (e.clientY - cy) / reach);
  }

  /* Home, and home is the composed pose rather than square-on — the difference
     from the home page's restRoll(), which has nothing to come back TO. */
  const rest = () => viewer?.point(LEAN.x, LEAN.y);

  let watching: IntersectionObserver | null = null;
  let unwatchViewport: (() => void) | null = null;

  if (chase) {
    window.addEventListener("pointermove", aim, { signal, passive: true });
    /* The pointer has left the window, or the tab lost it mid-lean. */
    document.addEventListener("pointerleave", rest, { signal });
    window.addEventListener("blur", rest, { signal });
    window.addEventListener("scroll", () => (stale = true), { signal, passive: true });
    unwatchViewport = onViewportChange(() => (stale = true));

    /* The roll is one slot on a page several screens long, and the pointer goes
       on moving after it has been scrolled past. Without this it would keep
       easing — and the renderer keep drawing frames for it — somewhere nobody is
       looking. Sent home on the way out, so scrolling back finds it composed
       rather than holding the last angle it was given. */
    watching = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      if (!seen) rest();
    });
    watching.observe(box);
  }

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
    /* The whole turn, straight off the progress. p is 0 at the top of the page
       and 1 when the roll is home, so this is 0deg to 360deg with the core
       facing the reader at the half — and, being a function of the scroll
       rather than a sequence played through it, it runs backwards for a reader
       going back up and lands exactly wherever a thrown wheel stops. */
    viewer.spin(TURN * p);
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
      /* AND THE FIFTH IS THE SURFACE — the procedural roughness, relief and
         clear coat, and this tape's own clarity for its wound side. See
         ViewerFilm in tape3d.ts and components/TapeSlider/film.ts.

         THE CLARITY COMES OFF THE TAPE, not out of this file: `clarity` is a
         field in src/data/tapes.ts because how see-through a tape is is a fact
         about the tape. Absent — masking, cloth — is a solid roll, which is
         both the right answer for crepe paper and the exact roll this page had
         before any of this. */
      createTapeViewer(mount, [model], { env: ROOM }, FINISH, { clarity })
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
      /* AND THEN LEANED INTO ITS REST POSE — see LEAN. point() is a target the
         viewer eases toward rather than a pose it has to be reminded of, so the
         roll settles into the angle over the same beat the entrance bounce is
         landing on, and stays there until a pointer moves. On a device with no
         cursor, or under reduced motion, nothing ever does: this is the only
         angle those visitors are shown, which is why it is set here and not
         left to the first move. */
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
    ac.abort();
    watching?.disconnect();
    watching = null;
    unwatchViewport?.();
    unwatchViewport = null;
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
