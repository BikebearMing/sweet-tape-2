/* What is printed on the contact page's sticky note.
 *
 * The note itself is the hero's — same stock, same wind, same light, same
 * shadow, same resting curl (Hero/stickyNote.ts). The only thing this page
 * changes is what is written on the paper, which is exactly the seam NoteFace
 * exists for: `createStickyNote(mount, face)` takes a drawing and everything
 * else about being a sticky note is unchanged.
 *
 * DRAWN AND NOT SHIPPED, which is the whole reason the address is legible.
 * The alternative was a PNG exported from the design, and the details on this
 * note are the two things on the site most likely to change — a number in
 * artwork is a number that needs an export and a deploy to correct, and a
 * number in a canvas is a string in src/data/contact.ts. It also means the note
 * keeps its 3D flutter rather than becoming a flat image: there is no DOM text
 * that could sit over a sheet that bends.
 *
 * THE CANVAS IS THE TEXTURE, so everything here is in fractions of its width
 * and never in px. The sheet is mapped to NOTE.W x NOTE.H whatever resolution
 * the canvas is, so a figure in px would silently change size the day the
 * canvas did. noteCanvas() is what guarantees the aspect matches the sheet.
 *
 * CALLED MORE THAN ONCE. The Adobe kit routinely lands after the first drawing,
 * and stickyNote.ts redraws on document.fonts.ready — so this has to be a pure
 * function of the module's constants and nothing else. No caching, no state.
 *
 * THE WRITING ARRIVES AS AN ARGUMENT AND IS NOT IMPORTED, which is the one
 * thing that changed when the page moved into the CMS. This module is reached
 * from a client component, and the module that reads the CMS pulls the Postgres
 * adapter in with it — so the address cannot be fetched anywhere near here. It
 * is read on the server, handed to Stage as a prop, and arrives as a parameter.
 * That also keeps the purity this file needs (see above): the drawing is a
 * function of its argument, so a redraw on document.fonts.ready draws the same
 * face rather than whatever a module-level cache happens to hold.
 *
 * TWO STRINGS AND NOT THE WHOLE RECORD. What the page holds is a label and an
 * href for each of the two, and an href is not written on the paper — it is
 * what a browser dials. Taking only what is drawn is what lets the caller's
 * effect depend on exactly these two and rebuild the sheet when one of them
 * changes, rather than whenever the record it came in on was rebuilt.
 *
 * IT IMPORTS noteFace.ts AND NEVER stickyNote.ts, which matters more than it
 * looks: this file is reached by a static import from the page's client
 * component, so anything it pulls in lands in the main bundle. Reaching into
 * stickyNote.ts for noteCanvas would put three there and undo the whole point
 * of loading the engine dynamically.
 */
import { noteCanvas, type NoteFace } from "@/components/Hero/noteFace";

/* The note's own palette, and it is the note's OWN — the one place on the site
   that is not written in the page's ink.

   The stock is the hero's note exactly: one pad of paper, not two.

   THE INK IS A BROWN AND NOT THE PAGE'S DARK GREEN, which is the correction
   this file needed. Everything else on the contact page is #013900 on lime, and
   carrying that onto the note made it read as a piece of the page that had come
   loose rather than as something written and stuck on afterwards. A pen on
   yellow stock is its own object — the hero's own note is written in a brown of
   the same family (#7c4a12) for the same reason, and this is that decision kept
   rather than a second idea about it. */
const STOCK_TOP = "#f9dd55";
const STOCK_BOTTOM = "#f2cf3e";
const INK = "#7b5406";
/* What the chip's lettering and its perforation are punched out in — and it is
   the STOCK'S OWN yellow, near enough, rather than the site's lime.

   That is the point of it: the letters read as the paper showing through a
   pill of ink rather than as a second colour printed on top, so a chip on this
   note is one object made of the two things the note is already made of. The
   lime it was would have been a third colour, and the only lime on a sheet that
   has nothing else lime on it. The shape and the light-on-dark reading are what
   keep these the same object as the four chips in markup on the sheet beside
   them; the pairing does not have to be. */
const CHIP_INK = "#fedd49";

/* The type, as fractions of the canvas width. Condensed bold with the same
   fallback the placeholder face uses — "Arial Narrow" is the one narrow face
   that can be relied on, and a wide fallback would overrun the sheet rather
   than merely looking wrong. */
const FONT = 'futura-pt-condensed, "Arial Narrow", sans-serif';
const CHIP_SIZE = 0.036;
const VALUE_SIZE = 0.062;

/* WHERE THE TWO BLOCKS SIT, top down, as fractions of the canvas HEIGHT.
 *
 * The first block starts a quarter of the way down and not at the top, because
 * the top of this sheet is under a strip of tape — WIND.PIN_HALF holds that
 * band dead still so the DOM tape graphic stays registered with it, and writing
 * into it would be writing under the tape. */
const BLOCK_Y = [0.235, 0.545];
/* Within a block: the chip, then the value's baseline, then the rule under it.
   Offsets from the block's own top, in fractions of the canvas height. */
const CHIP_DY = 0;
const VALUE_DY = 0.145;
const RULE_DY = 0.192;

/* The margins. Generous, because a sticky note is not a form — the writing sits
   in the middle of the paper with air around it. */
const PAD_X = 0.085;

/* The ruled line under each block: a drawn perforation rather than a solid
   rule, which is the line this site draws everywhere else. Mark and gap as
   fractions of the width; equal, for the reason the menu's rules give — under
   about twice the mark a dashed line closes up into a bar. */
const RULE_MARK = 0.014;
const RULE_GAP = 0.014;
const RULE_H = 0.005;

/** A chip: the site's small stuck-on label, drawn rather than styled. Same
    shape as the CSS one — a rounded rectangle with three perforation dots down
    its left edge — because it is the same object, and the page it sits beside
    has four of them in markup. Returns nothing; it paints in place. */
function chip(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  W: number,
) {
  const size = W * CHIP_SIZE;
  g.font = `800 ${size}px ${FONT}`;
  g.textBaseline = "middle";

  const padY = size * 0.42;
  const padR = size * 0.6;
  /* The left padding carries the perforation, so it is measured from the dots
     and not chosen: the strip sits padL/2 in, and the text clears it. */
  const padL = size * 1.5;
  const h = size + padY * 2;
  const w = g.measureText(text).width + padL + padR;
  const r = size * 0.34;

  g.fillStyle = INK;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();

  /* Three dots down the left edge, evenly spaced over the chip's own height —
     the CSS chip sizes its strip the same way, off the type rather than off a
     figure, so the two stay the same object as the size changes. */
  const dotR = size * 0.09;
  const strip = h * 0.56;
  g.fillStyle = CHIP_INK;
  for (let i = 0; i < 3; i++) {
    const cy = y + (h - strip) / 2 + (strip / 3) * (i + 0.5);
    g.beginPath();
    g.arc(x + padL * 0.42, cy, dotR, 0, Math.PI * 2);
    g.fill();
  }

  g.fillText(text, x + padL, y + h / 2 + size * 0.06);
  return h;
}

/** One perforated rule across the writing area. */
function rule(g: CanvasRenderingContext2D, y: number, W: number) {
  const mark = W * RULE_MARK;
  const pitch = mark + W * RULE_GAP;
  const left = W * PAD_X;
  const right = W * (1 - PAD_X);

  g.fillStyle = INK;
  g.globalAlpha = 0.55;
  for (let x = left; x + mark <= right; x += pitch) {
    g.fillRect(x, y, mark, W * RULE_H);
  }
  g.globalAlpha = 1;
}

/** What is written on the note: the two values, as they are read. */
export type NoteWriting = { email: string; phone: string };

/** The face, drawn fresh. Pure — see the note at the top of the file. */
export function drawContactFace(writing: NoteWriting): HTMLCanvasElement {
  /* 1024 rather than the placeholder's 512: this face carries a twenty-
     character address at a tenth of the sheet's width, where the hero's carries
     three short phrases, and small type is the only thing on a texture that
     shows the difference. */
  const c = noteCanvas(1024);
  const W = c.width;
  const H = c.height;
  const g = c.getContext("2d")!;

  const paper = g.createLinearGradient(0, 0, 0, H);
  paper.addColorStop(0, STOCK_TOP);
  paper.addColorStop(1, STOCK_BOTTOM);
  g.fillStyle = paper;
  g.fillRect(0, 0, W, H);

  const blocks = [
    { tag: "EMAIL", value: writing.email },
    { tag: "PHONE", value: writing.phone },
  ];

  blocks.forEach(({ tag, value }, i) => {
    const top = H * BLOCK_Y[i];

    chip(g, tag, W * PAD_X, top + H * CHIP_DY, W);

    g.font = `800 ${W * VALUE_SIZE}px ${FONT}`;
    g.fillStyle = INK;
    g.textBaseline = "alphabetic";
    g.fillText(value, W * PAD_X, top + H * VALUE_DY);

    rule(g, top + H * RULE_DY, W);
  });

  return c;
}

/* The face as stickyNote.ts wants it. url: null and not omitted — omitting it
   would be indistinguishable from "I forgot", and what is meant here is that
   this note has NO artwork waiting to supersede the drawing and never will.

   A FUNCTION NOW RATHER THAN A CONSTANT, because the words on the paper are the
   CMS's and a constant would have had to be built before they arrived. Called
   once on mount with what the server read; the closure is what carries the
   details into the redraw, which is where a pure `draw()` needed them. */
export function contactFace(writing: NoteWriting): NoteFace {
  return { draw: () => drawContactFace(writing), url: null };
}
