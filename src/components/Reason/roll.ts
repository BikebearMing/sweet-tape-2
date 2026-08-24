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

/* The room, and the finish, both straight off ProductIntro/roll.ts. See the note
   at the top: these are corrections the metal label needs, not a second opinion
   about how the object should look. */
const ROOM = 0.25;
const FINISH = {
  "Face Brown": { metalness: 0.35, roughness: 2 },
  Tape: { roughness: 0.4 },
};

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

/** Mounts the roll into `box` and returns the teardown. Safe to call when three
    is unavailable: the promise is caught and the flat photograph simply stays. */
export function mountRoll(box: HTMLElement, card: HTMLElement | null): () => void {
  let viewer: TapeViewer | null = null;
  let gone = false;

  /* Hidden from MOUNT, not from viewer-ready — the slider's call, for its
     reason: once scripts are running the roll is coming, and letting the flat
     card paint first only flashes artwork the roll is about to replace. The cost
     is an empty slot while the chunk and the model load, and this section spends
     that slot behind a curtain that has not come down yet. */
  if (card) card.style.visibility = "hidden";

  import("@/components/TapeSlider/tape3d")
    .then(({ createTapeViewer }) =>
      createTapeViewer(box, [MODEL], { env: ROOM }, FINISH),
    )
    .then((v) => {
      if (gone) return v.dispose();
      viewer = v;
      v.show(MODEL);
      v.spin(TURN);
      /* Said once rather than held every frame: point() is a target the viewer
         eases toward, not a pose it has to be reminded of, so the roll settles
         into the angle over the same beat the entrance bounce is landing on and
         then simply stays there. */
      v.point(LEAN.x, LEAN.y);
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
    viewer?.dispose();
    viewer = null;
    if (card) card.style.visibility = "visible";
  };
}
