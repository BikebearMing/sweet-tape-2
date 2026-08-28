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
