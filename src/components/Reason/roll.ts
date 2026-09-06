/* THE ROLL IN THE ANSWER — the object the whole page has been arguing about,
 * standing in front of its own name.
 *
 * ONE VIEWER, ONE MODEL, NO JOURNEY. This is the simplest 3D on the site and
 * deliberately so: the product page's roll rolls down the page and turns
 * (ProductIntro/roll.ts), the slider's flips between six (TapeSlider/engine.ts),
 * and this one is set down in a pose and left there. What moves is the BOX it is
 * drawn into — the entrance in ./arrive.ts drives the element's translate and
 * scale, not the camera — which is why nothing in here is animated and why this
 * file is forty lines instead of four hundred.
 *
 * THE LIGHTING IS THE PRODUCT PAGE'S, VERBATIM, and that is not laziness. The
 * OPP roll's label disc carries metalness, and metal has no diffuse term: on a
 * stage of bare lights, with nothing to reflect, that share of the surface
 * renders BLACK and the lime label leaves the renderer at about half the colour
 * the artwork was drawn in. ROOM is the input it has no value without, and 0.25
 * is where ProductIntro measured the label back to the artwork's own lime — see
 * the note at ROOM there, which is where that number was found. Copying the
 * figure rather than re-deriving it is the point: this is the same object, and
 * two pages showing one roll at two brightnesses is worse than either.
 *
 * DYNAMIC IMPORT, so three.js and the GLTF loader ship as their own chunk
 * fetched after the section is interactive — the arrangement the slider and the
 * product page both make, and the reason there is a flat <img> in the markup at
 * all. Until the chunk and the model land, the photograph is the roll; if either
 * fails, the photograph stays and the section is exactly what it would have been
 * without any of this.
 */
import type { TapeViewer } from "@/components/TapeSlider/tape3d";

/* THE BROWN PACKING ROLL, and the INNER export rather than the home page's.
   src/data/tapes.ts splits this one tape in two — Header-Brown-Inner.glb is the
   copy the close-up pages are free to re-export without the orbit of six
   changing by a pixel — and this section is a close-up. */
const MODEL = "/assets/tapes/Header-Brown-Inner.glb";

/* The room, the finish AND THE FILM, all straight off ProductIntro/roll.ts. See
   the note at the top: these are corrections the metal label needs, not a second
   opinion about how the object should look.

   THE FILM IS WHAT WAS MISSING FOR A ROUND. Without it the viewer stages the
   roll on the slider's deliberately flat orbit light (key 0.7 under a pi x 0.82
   ambient), which is right for six thumbnails and wrong for a close-up — the
   roll rendered plain: no relief, no coat, no moving highlight. Passing a film
   switches the viewer onto FILM_LIGHT plus the face's own kick light and gives
   the surface the product page's procedural roughness, relief and clear coat
   (see ViewerFilm in tape3d.ts and TapeSlider/film.ts). The clarity is the OPP
   tape's own 0.09, from CLARITY in ProductIntro/rolls.ts — the same object at
   the same see-through, on the page that argues for it. */
const ROOM = 0.25;
const FINISH = {
  "Face Brown": { metalness: 0.05, roughness: 2 },
  Tape: { roughness: 0.4 },
};
const FILM = { clarity: 0.09 };

/* THE LAMP — what puts the shadow on the right of the face, the way the hero's
   own stage models its roll. A directional cannot do it: the label is a flat
   disc with one normal, so directional light shades all of it identically and
   the face reads as a wash. This is a close point light on the reader's LEFT
   whose inverse-square falloff is the gradient — lit at the label's left edge,
   falling into shade across it. See `lamp` in TapeSlider/tape3d.ts.

   AND THE AMBIENT COMES DOWN TO PAY FOR IT. The film stage's base (0.6) holds
   the face at nearly the artwork's own brightness, which leaves a lamp nowhere
   to add but past clipping; a step down makes the shade a real darkening and
   the lamp brings the lit side back to the artwork rather than over it. */
/* Both scaled by 0.87 from 0.38 / 2.6 — the site-wide 13% step down that
   FILM_LIGHT took, applied to this section's own overrides too. */
const AMBIENT = 0.33;
const LAMP = { x: -1.6, y: 0.9, z: 1.3, power: 2.26 };

/* THE POSE, AND IT IS THE ONE KNOB IN THIS FILE.
 *
 * TURN is degrees about the flip axis — the roll turned off square so the wound
 * brown side shows beside the label instead of the label alone. POSITIVE swings
 * the label to the right and leaves the brown flank on the LEFT, which is the
 * way the design has it; the sign was the other way round first and put the
 * brown on the wrong side of the roll. It is not a number to push: past about 78
 * the single-walled export starts showing the inside of a shell that has none,
 * which is why the slider swaps models at exactly 90.
 *
 * LEAN is the home page's own dial, where 0 is dead square and ±1 is as far as
 * that stage ever leans for anybody — a camera that has stepped aside rather
 * than an object that has been twisted, so it composes with the turn instead of
 * fighting it. Slightly down on the roll, which is the ordinary product-shot
 * angle: an object on a surface in front of you. */
const TURN = 25;
const LEAN = { x: -0.25, y: -0.3 };

/* AND THE POSE FOLLOWS THE POINTER, which is the half of the home page this
   section did not mimic and the half that carries the depth. A lit face is
   still a still photograph; what the hero's roll has is PERSPECTIVE THAT
   ANSWERS THE READER — the pointer moves, the roll leans a few degrees, and
   the lamp's gradient and the kick's highlight slide across the label as it
   does. The lean is the slider's own mechanism (point() in tape3d, eased
   internally on a group above the flip); all this owns is where the pointer is
   relative to the roll and how far out counts as full deflection.

   TILT_REACH is the slider's figure. The base LEAN above stays the pose the
   section is composed around: the pointer's offset is ADDED to it, so the roll
   at rest — and under reduced motion, where none of this is wired — is exactly
   the roll it was. */
const TILT_REACH = 0.42;

/** Mounts the roll into `box` and returns the teardown. Safe to call when three
    is unavailable: the promise is caught and the flat photograph simply stays. */
export function mountRoll(box: HTMLElement, card: HTMLElement | null): () => void {
  let viewer: TapeViewer | null = null;
  let gone = false;
  const ac = new AbortController();

  /* Hidden from MOUNT, not from viewer-ready — the slider's call, for its
     reason: once scripts are running the roll is coming, and letting the flat
     card paint first only flashes artwork the roll is about to replace. The cost
     is an empty slot while the chunk and the model load, and this section spends
     that slot behind a curtain that has not come down yet. */
  if (card) card.style.visibility = "hidden";

  import("@/components/TapeSlider/tape3d")
    .then(({ createTapeViewer }) =>
      createTapeViewer(
        box,
        [MODEL],
        { env: ROOM, ambient: AMBIENT, lamp: LAMP },
        FINISH,
        FILM,
      ),
    )
    .then((v) => {
      if (gone) return v.dispose();
      viewer = v;
      v.show(MODEL);
      v.spin(TURN);
      /* The rest pose — where the ease settles whenever the pointer is gone,
         and the whole of the pose for a reader who has asked for less
         motion. */
      v.point(LEAN.x, LEAN.y);

      /* A roll swinging after the cursor is exactly what the setting asks
         about; posed and lit, without the chase, is the reduced version. */
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      /* The roll's centre, cached — the slider reads it on scroll rather than
         per pointermove for the reason its engine gives: a rect per mouse
         event is a forced layout per mouse event. Scroll and resize are when
         it actually changes. */
      let cx = 0;
      let cy = 0;
      const measure = () => {
        const b = box.getBoundingClientRect();
        cx = b.left + b.width / 2;
        cy = b.top + b.height / 2;
      };
      measure();
      window.addEventListener("scroll", measure, { signal: ac.signal, passive: true });
      window.addEventListener("resize", measure, { signal: ac.signal });

      window.addEventListener(
        "pointermove",
        (e) => {
          const reach =
            Math.min(window.innerWidth, window.innerHeight) * 0.5 * TILT_REACH;
          viewer?.point(
            LEAN.x + (e.clientX - cx) / reach,
            LEAN.y + (e.clientY - cy) / reach,
          );
        },
        { signal: ac.signal, passive: true },
      );
      // Pointer off the window or the tab blurred mid-lean: back to the pose.
      window.addEventListener(
        "blur",
        () => viewer?.point(LEAN.x, LEAN.y),
        { signal: ac.signal },
      );
      document.documentElement.addEventListener(
        "pointerleave",
        () => viewer?.point(LEAN.x, LEAN.y),
        { signal: ac.signal },
      );
    })
    .catch(() => {
      /* No three after all — put the photograph back and the section is the one
         it would have been without any of this. An explicit `visible`, not "":
         the line above set it inline, and only an inline value out-specifies an
         inline value. */
      if (card) card.style.visibility = "visible";
    });

  return () => {
    gone = true;
    ac.abort();
    viewer?.dispose();
    viewer = null;
    if (card) card.style.visibility = "visible";
  };
}
