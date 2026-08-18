/* What is printed on a sticky note — the seam, and nothing that draws it.
 *
 * THIS FILE EXISTS TO KEEP THREE OUT OF A PAGE'S BUNDLE, which is the only
 * reason it is not simply the top of stickyNote.ts.
 *
 * The note is loaded dynamically (Hero/note.ts) so the engine never reaches the
 * critical bundle. A page supplying its own face has to name the NoteFace type
 * and size a canvas to the sheet — and if it reached into stickyNote.ts for
 * either, that STATIC import would pull three into the page's main client chunk
 * and the dynamic import below it would be pointless. `import type` is erased
 * and would have been safe; `noteCanvas` is a real function and would not.
 *
 * So the two things a face needs live here, with no three import anywhere in
 * the file, and stickyNote.ts reads its sheet proportion back off this rather
 * than the other way round.
 */

/* THE SHEET, in world units — square-ish, a touch wide. The one number a face
   has to agree with, because the texture is mapped across exactly this box: a
   canvas of any other proportion is a face stretched onto the paper.

   Mirrored by the slot's aspect-ratio in global.css, in both places a note is
   placed (.hero-section .sticky-note and .contact-note .sticky-note) — change
   this and change those. */
export const SHEET = { W: 1, H: 0.94 };

/* WHAT IS PRINTED ON THE PAPER, and it is an argument rather than a fact.
 *
 * Two pages want a sticky note with different things written on it: the hero's
 * pinboard note and the contact page's, which carries the address and the
 * number. Everything else — the stock, the wind, the light, the shadow, the
 * curl — is the same object, so the FACE is the seam and nothing else is.
 *
 * `draw` rather than a canvas, because it is called more than once: the Adobe
 * kit can land after the first drawing and the heading has to be re-set in the
 * real font, so a face must be a pure function of its own constants and hold no
 * state. `url` is optional artwork that replaces the drawing wholesale once it
 * loads — pass null for a face that is only ever drawn.
 */
export type NoteFace = {
  /** Draws the sheet's face into a fresh canvas. May be called again. */
  draw(): HTMLCanvasElement;
  /** Artwork that supersedes the drawing when it arrives, or null for none. */
  url?: string | null;
};

/** A blank canvas at the sheet's own proportion — see SHEET. */
export function noteCanvas(width = 512): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = Math.round(width * (SHEET.H / SHEET.W));
  return c;
}
