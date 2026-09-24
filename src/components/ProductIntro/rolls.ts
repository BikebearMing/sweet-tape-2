/* HOW EACH ROLL IS RENDERED, and why none of it is in the CMS.
 *
 * Two facts about the 3D roll on a product page used to be fields on a tape: a
 * `clarity` between 0 and 1, and an optional second GLB for this stage. Both
 * were taken out deliberately, and the reason is worth writing down because the
 * fields were not broken — they worked, and one of them was in use.
 *
 * THEY ARE RENDERING SETTINGS DRESSED AS CONTENT. A number between 0 and 1
 * labelled "how see-through" is a slider, and a slider in a CMS is an invitation
 * to tune it — which means a conversation about the right value, on six
 * products, with a person who cannot see the mesh while they drag it. The right
 * value is a decision made once by whoever lit the scene, and it belongs beside
 * the code that lights it. The same call strips.ts makes about the tape films,
 * for the same reason: those figures are facts about a FILE, not about a
 * product.
 *
 * THE VALUES ARE THE ONES THAT WERE IN THE DATABASE. Nothing changed on screen
 * when they moved here — four tapes were carrying a clarity and one an inner
 * model, and all five are below. Dropping the fields without carrying the values
 * across would have quietly turned four see-through rolls solid.
 *
 * KEYED BY SLUG, which is the tape's stable id. A tape not listed gets the
 * default, which is what an unset field already meant: a solid roll, and the
 * same model the home page shows.
 */

/** How see-through the wound side of a roll is, 0 to 1. Absent means solid. */
const CLARITY: Record<string, number> = {
  double: 0.04,
  stationery: 0.11,
  opp: 0.09,
  "opp-quiet": 0.1,
};

/* A SECOND MESH FOR THE CLOSE-UP, where the one the home page's slider spins is
   not right for a roll seen this large. One tape has one; the rest show the same
   file on both pages, which is the honest default — the two pages show the same
   OBJECT and are only obliged to show a different FILE when somebody has
   actually made one. */
const INNER_MODEL: Record<string, string> = {
  opp: "/assets/tapes/Header-Brown-Inner.glb",
};

/** How clear this tape's roll is, or undefined for a solid one.
 *
 *  UNDEFINED AND NOT 0, which matters one level up: Stage omits `data-clarity`
 *  entirely rather than writing a zero, so the attribute's absence and a solid
 *  roll stay the same thing all the way down to roll.ts. Returning 0 here would
 *  put `data-clarity="0"` on four of the six and quietly break that. */
export function clarityOf(id: string): number | undefined {
  return CLARITY[id];
}

/** The mesh this page should load: the tape's own close-up where one exists,
 *  and the model it shares with the home page where it does not. */
export function modelOf(tape: { id: string; model: string }): string {
  return INNER_MODEL[tape.id] ?? tape.model;
}

/* THE HOME SLIDER'S FINISH — the OPP face's metal, taken out. The export's
   "Face Brown" carries metalness 0.55, and metal has no diffuse: on a stage
   with no environment the metallic share renders BLACK and the lime label
   leaves the renderer at about half the artwork's brightness. The product page
   pays for it with a room (ROOM in roll.ts); the orbit shows six rolls and
   wants no room, so the cheaper end of the same fix — a dielectric face — is
   the right one there. The other five faces carry no metalness. Here rather
   than in the engine so /lab/tape-3d mounts the orbit with the same object. */
export const HOME_FINISH = { "Face Brown": { metalness: 0.05 } };

/* THE HOME SLIDER'S LIGHT AND COAT. Tuned at /lab/tape-3d on the double tape,
   2026-09-11. Before this the orbit passed no light (FILM_LIGHT: key 0.74,
   ambient 0.68, no room) and wore film.ts as it stands. The room is on at
   0.14, which costs the orbit one RoomEnvironment import and one PMREM at
   mount — the thing tape3d's `env` note says the orbit never wanted; the lab
   said otherwise, so it has it. */
export const HOME_LIGHT = { key: 0, ambient: 0.97, fill: 0, env: 0.14 };
export const HOME_FILM = {
  knobs: {
    AMOUNT: 0.6,
    GLOSS: 0.42,
    MOTTLE: 0.22,
    SMUDGE: 1.2,
    TOOTH: 0.41,
    GLAZE: 0.18,
    GLAZE_ROUGH: 0.36,
    FACE_GLOSS: 0.41,
    GRAIN: 4,
    ANISO: 0.11,
  },
  glass: { AMOUNT: 0.41, EDGE: 3.8, SHEEN: 0.155 },
};
