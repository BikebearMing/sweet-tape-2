/* Sweet Tape — the mark as a sticker.
 *
 * It springs up off the sheet, its shape flexes as it settles, a sheen pans
 * across it, and then it stays put until the cover lifts it away. This file
 * owns the SURFACE — how a flat SVG is made to bend and catch light — and owns
 * none of the timing; Preloader/reveal.ts writes the pose and this draws it.
 * Same division the hero and the menu make, and the same one components/Peel
 * makes with peel.ts.
 *
 * It replaces that peel, which replaced a gif. Prototyped at /lab/sticker-pop,
 * which is still the place to tune it: every number in STICKER below is a
 * slider there.
 *
 * NO WEBGL, DELIBERATELY, and this is the constraint the whole approach is cut
 * to. The cover is the first thing painted on a cold load and it runs against
 * hydration, against the hero's three and against the type — the mark's beat
 * sits at 1.0s for exactly that reason (see MARK.IN_AT's note in reveal.ts,
 * where the frame cadence is written down). A canvas booting a context,
 * compiling a shader and rasterising a texture is the one cost that moment
 * cannot carry. So the bend is CSS 3D and the artwork stays 5 kB of flat SVG:
 * nothing to decode, nothing to compile, crisp at any width.
 *
 * HOW THE BEND IS FAKED. There is no bend. There are N vertical columns of the
 * same image, each one a background sized to the WHOLE mark and slid left by
 * that column's own offset — so the ink runs continuously across the joins —
 * and each column is then placed on a curve in 3D and turned to face along it.
 * A chord approximation of a bending strip, and three things make it read as
 * material rather than as a flat thing in a funny outline:
 *
 *   ARC LENGTH IS CONSERVED. The curve is INTEGRATED, ds at a time, not
 *   interpolated between two poses. A bending sticker keeps its length and
 *   loses its width, and walking the tangent angle is what gets that for free —
 *   the mark narrows as it curls and comes back as it flattens. Interpolating
 *   the same shape would squash it, which reads as rubber, not paper.
 *
 *   EVERY COLUMN IS SHADED BY ITS OWN ANGLE. Columns turning away from the
 *   light go down. Without this the geometry is all still correct and the thing
 *   looks flat anyway, because a bend with no gradient across it is not one.
 *
 *   IT HAS A BACK, AND THE BACK IS BLANK. A flag shows the same picture
 *   whichever way it is turned; a sticker has one printed side and one that is
 *   not. Every column carries a third layer in the mark's own underside colour,
 *   and past a quarter turn that is what is drawn instead of the ink. Without
 *   it the whole gesture reads as cloth rippling — which is exactly what it did
 *   read as until this went in.
 *
 *   AND WHAT SHOWS THAT BACK IS A FOLD, NOT AN ARC. This is the part that is
 *   not obvious and cost a wrong version to find. An arc spreads its turn
 *   evenly along the mark, so to get ANY of it past a quarter turn the whole
 *   thing has to roll — and a roll hides its own back behind its own front:
 *   measured, a bend deep enough to pass 90deg showed the underside as a
 *   three-pixel sliver at the edge. A fold puts all the turn inside a narrow
 *   band of u (the crease) and leaves the flap beyond it flat at whatever angle
 *   that took it to. The flap's whole area is then underside, which at the
 *   values below is a quarter of the mark for the first third of the pop.
 *
 *   THE SHEEN IS ONE GRADIENT, NOT N. Each column carries the same white band,
 *   sized to the whole mark and offset by its own position, so what crosses the
 *   shape is a single continuous highlight rather than sixty-four lit
 *   rectangles. Masked by the artwork's own alpha, so it lights the mark and
 *   not the box around it — over the letters as well as the field.
 *
 * BUILT ON MOUNT, NOT SERVER-RENDERED, which is the one place this parts
 * company with the rest of the cover. Every other piece of the preloader is in
 * the first painted frame on purpose; this is sixty-four divs carrying about
 * twenty-five kilobytes of inline style between them, and it is `visibility:
 * hidden` until its beat a full second later. Shipping that in the document
 * would be paying the critical path for something nothing can see yet. The
 * wrapper IS server-rendered — it holds the layout box, and the SVG is
 * preloaded in the head — and this fills it.
 *
 * SIZED OFF THE ELEMENT, and the px numbers below are fractions because of it.
 * The mark is --pre-mark: 15vw on a desktop and 46vw on a phone, so a rise or a
 * drop written in px would be a different gesture on every screen. They are
 * multiples of the mark's own width instead, and the figures the lab showed are
 * kept beside them.
 */

/* What reveal.ts writes and this reads. One object, mutated in place — GSAP
   tweens the numbers on it and the ticker draws whatever they say. */
export type StickerPose = {
  /* the whole mark */
  scale: number;
  rotX: number;
  y: number;
  alpha: number;
  /* the surface */
  bend: number; // total arc across the mark, radians
  fold: number; // how far the flap beyond the crease is turned back, radians
  wave: number; // travelling flex on top of that arc, radians
  phase: number; // where along the mark the wave has got to
  /* the light */
  sheen: number; // 0 = a full width off the left, 1 = off the right
};

/* The artwork's own aspect. The stylesheet holds the same ratio (see
   .preloader-mark) and this is what the columns are cut against. */
const ART_W = 191;
const ART_H = 118;

export const STICKER = {
  /* THE BUILD.
   *
   * Sixty-four columns is what the lab settled on and it is more than the
   * geometry needs — the curve is smooth by about twenty. What it buys is the
   * SHADING, which is per column and therefore stepped: at 24 the gradient
   * across a hard bend bands visibly, and at 64 it does not. The cost is 128
   * elements written per frame for the length of the cover, which is the one
   * figure here worth re-measuring if the cover's cadence ever regresses. */
  COLUMNS: 64,

  /* Bleed per column, in px. Adjacent columns sitting at an angle to each
     other leave a hairline of the sheet showing between them — at 0 the mark
     is visibly combed with lime. This closes it. The cost is that each column
     draws about a pixel of its neighbour's ink at a slightly wrong brightness,
     which at this width is invisible and at 0 the gaps are not. */
  BLEED: 1.3,

  /* Both as multiples of the mark's own width, so the gesture is the same on a
     phone as on a desktop. The lab's figures, at its 250px mark, in brackets. */
  DEPTH: 6.6, // perspective (1650px)
  /* Where it hinges. Near the top rather than at the middle, which is what
     makes it read as a sticker still stuck down along its top edge and peeling
     up off the sheet, rather than as a card being lifted by the middle. */
  HINGE: 25, // %

  /* THE POP. */
  POP: {
    DURATION: 0.92,
    SCALE: 0.62, // where it starts
    TILT: -78, // rotX it starts at — lying away, near edge-on
    RISE: 0.064, // px it travels up as it stands, x width (16px)

    /* back.out, and high. At 2.8 the mark passes its own size and comes back,
       which is most of what separates a thing that SPRINGS from a thing that
       is faded in. The tilt gets a gentler one — the same overshoot on the
       rotation reads as a wobble on top of the flex that is already running. */
    BACK: 2.8,
    BACK_TILT: 0.8, // x BACK
    FADE: 0.28, // x DURATION — over long before the shape has landed
  },

  /* THE FLEX. The mark arrives with a corner still turned back, that corner
     lays down, and the shape goes on moving for a moment after it has. */
  FLEX: {
    /* THE FOLD — the corner, and the only part of this that shows an
       underside. See the note at the top for why an arc cannot.

       THE CREASE AND THE ARC SHARE THE WORK HERE, which is worth reading off
       the numbers rather than guessing at. The fold alone is 1.0 rad — about
       57deg, well short of facing away — and sits near the FRONT of the mark at
       0.31. What carries the far side past a quarter turn is BEND on top of it:
       1.85 rad of arc puts u = 1 at about 110deg while the crease keeps the
       near side from simply rolling with it. So the underside shows along the
       trailing edge rather than as a folded-over corner, and the crease reads
       as the line it turns about.

       An earlier set did the opposite — 2.6 rad of fold at 0.72 with almost no
       arc — and gave a hard flap over the end of TAPE. Both show a back; they
       are different gestures, and this is the one that was chosen. */
    FOLD: 1.0,
    FOLD_AT: 0.31,
    CREASE: 0.09,

    /* And a gentle arc under all of it, so the mark is not dead flat behind
       the fold. Well down from the 1.55 this carried when the arc was doing
       all the work — the fold is the shape now, and an arc that deep on top of
       it is the flag coming back. */
    BEND: 1.85,

    /* The wobble after it lands. Also well down, and its frequency with it: a
       travelling wave at better than one cycle across the mark IS a flag,
       whatever else is done to it. Under one cycle it reads as the sheet
       flexing rather than as cloth. */
    WAVE: 0.35,
    FREQ: 1.95,
    SPIN: 0.3, // how fast the wave travels, turns per second

    /* WHERE THE UNROLL STARTS, x POP.DURATION. Not at 0: the mark would lay
       itself flat while still at 62% and tipped 78deg away, so the one moment
       the underside exists would be the one moment nothing can be seen of it.
       This overlaps the back half of the pop instead — the mark is most of the
       way up and still bent, and it finishes arriving and finishes flattening
       within a couple of frames of each other. */
    START: 0.26,

    /* HOW LONG THE CORNER TAKES TO LAY DOWN, and it has its own ease for a
       reason worth writing down: this used to be one elastic tween and the
       elastic was wrong. elastic.out is AT its target inside the first tenth of
       its duration and spends the rest oscillating around it, so however deep
       the starting fold was set, it was gone in about a hundred milliseconds.
       sine.inOut instead — out of rest and back into it, which is the ease the
       peel this replaced used on exactly this move, and for the same words: a
       sticker let go rather than one yanked flat. */
    UNROLL: 0.74,

    /* The wobble's own clock, which is where the elastic belongs — it is the
       residual flex in a thing that has landed, not the landing. */
    SETTLE: 1.35,
    RUBBER: 0.36,
  },

  /* THE LIGHT ON THE SURFACE. Per column, off its own angle. */
  SHADE: 0.6,

  /* THE UNDERSIDE. Not a new colour: components/Peel's BACKS already carries
     one for this exact artwork, "peel-back-mark", and this is it. Measured off
     the gif the whole thing descends from — through its unfold the folded-over
     part is dominantly this green — and NOT the lime the mark's own outline is
     drawn in, which is what it looks like it ought to be. Peel's note says why:
     the sheet behind it is the hero's lime, and a back flooded with lime is
     invisible for the whole of the move.

     If the artwork is ever replaced, re-sample it there and copy it here. */
  BACK: "#60a000",
  BACK_SHADE: 1,

  /* THE SHEEN, which runs the whole arrival: it starts with the pop and takes
     longer than the pop does, so the light is still crossing while the shape is
     still moving. That is the constraint worth keeping — a highlight is only
     worth having on a surface that is not flat, and DURATION is what holds it
     over one. Shortening it much below the unroll spends the second half of the
     sweep on a flat board.

     Wide and weak. A narrow strong band is a glass rod sliding over the logo;
     at 30% of the mark and 0.16 alpha it is a sheet of light passing over it,
     which is the thing the reference does. */
  SHEEN: {
    AT: 0, // seconds after the pop starts
    DURATION: 1.06,
    BAND: 30, // half-width, % of the mark
    POWER: 0.16,
    LEAN: 118, // deg
  },

  /* THERE IS NO FALL. There was one here — a set that tilted the mark to 84deg,
     dropped it a width, reversed BEND hard to -2.9 and opened FOLD to 1.65 so
     it curled back on itself on the way out, and faded it late. The cover does
     not use it: the mark arrives, flexes flat, and stays there until the sheet
     it is printed on sweeps it away. The lab (/lab/sticker-pop) still has the
     gesture on its own sliders if it is ever wanted back. */
};

export type Sticker = {
  /* The numbers reveal.ts tweens. */
  pose: StickerPose;
  /* One frame. Hand it to gsap.ticker. */
  draw: () => void;
  destroy: () => void;
};

/* Build the columns into `host` — the server-rendered .preloader-mark, which
   holds the layout box and nothing else — and return the pose to drive them
   with.
 *
 * `src` is the artwork, passed in rather than imported so index.tsx stays the
 * one place the file is named. */
export function buildSticker(host: HTMLElement, src: string): Sticker {
  const N = STICKER.COLUMNS;

  const pose: StickerPose = {
    scale: STICKER.POP.SCALE,
    rotX: STICKER.POP.TILT,
    y: 0,
    alpha: 0,
    bend: STICKER.FLEX.BEND,
    fold: STICKER.FLEX.FOLD,
    wave: STICKER.FLEX.WAVE,
    phase: 0,
    sheen: 0,
  };

  /* The 3D frame. The perspective is on the host and the pose is on this, so
     the columns inside are children of a preserve-3d element that is itself
     being turned — which is what puts them in one shared space rather than
     each in a flat one of its own. */
  const body = document.createElement("div");
  body.className = "preloader-sticker";
  body.style.opacity = "0";

  const columns: HTMLElement[] = [];
  const inks: HTMLElement[] = [];
  const sheens: HTMLElement[] = [];
  const backs: HTMLElement[] = [];
  /* Which way each column was facing last time it was looked at. The flip is
     three writes and most columns do not flip on most frames, so it is worth
     one boolean each to skip them. */
  const facing: boolean[] = [];

  for (let i = 0; i < N; i++) {
    const col = document.createElement("div");
    col.className = "preloader-col";

    const ink = document.createElement("div");
    ink.className = "preloader-ink";
    ink.style.backgroundImage = `url(${src})`;

    const sheen = document.createElement("div");
    sheen.className = "preloader-sheen";
    sheen.style.backgroundImage =
      `linear-gradient(${STICKER.SHEEN.LEAN}deg,` +
      ` rgba(255,255,255,0) ${50 - STICKER.SHEEN.BAND}%,` +
      ` rgba(255,255,255,${STICKER.SHEEN.POWER}) 50%,` +
      ` rgba(255,255,255,0) ${50 + STICKER.SHEEN.BAND}%)`;
    sheen.style.webkitMaskImage = `url(${src})`;
    sheen.style.maskImage = `url(${src})`;

    /* The blank side. Flat colour cut to the artwork's own silhouette, so what
       shows past a quarter turn is the MARK's shape in unprinted green and not
       a rectangle. Hidden until a column turns away. */
    const back = document.createElement("div");
    back.className = "preloader-back";
    back.style.background = STICKER.BACK;
    back.style.webkitMaskImage = `url(${src})`;
    back.style.maskImage = `url(${src})`;

    col.append(ink, sheen, back);
    body.append(col);
    columns.push(col);
    inks.push(ink);
    sheens.push(sheen);
    backs.push(back);
    facing.push(true);
  }

  host.append(body);

  /* THE LAYOUT, which is everything that depends on the mark's width and
     nothing that depends on the pose. Re-run on resize and never per frame: it
     is the only part of this that reads layout back out of the DOM, and doing
     that inside the ticker would be a forced reflow on each of the cover's
     frames. */
  let W = 0;
  let H = 0;
  let ds = 0;

  const layout = () => {
    W = host.clientWidth;
    if (!W) return;
    H = (W * ART_H) / ART_W;
    ds = W / N;

    host.style.perspective = `${W * STICKER.DEPTH}px`;
    body.style.transformOrigin = `50% ${STICKER.HINGE}%`;

    const size = `${W}px ${H}px`;
    for (let i = 0; i < N; i++) {
      const at = `${-(i * ds)}px 0`;
      const col = columns[i];
      col.style.left = `${i * ds}px`;
      /* The bleed goes on the width only — the left edge stays true, so the
         column still shows its own slice of the artwork and simply runs a
         little past its right-hand neighbour's start. */
      col.style.width = `${ds + STICKER.BLEED}px`;
      col.style.height = `${H}px`;

      inks[i].style.backgroundSize = size;
      inks[i].style.backgroundPosition = at;

      sheens[i].style.backgroundSize = size;
      sheens[i].style.webkitMaskSize = size;
      sheens[i].style.maskSize = size;
      sheens[i].style.webkitMaskPosition = at;
      sheens[i].style.maskPosition = at;

      backs[i].style.webkitMaskSize = size;
      backs[i].style.maskSize = size;
      backs[i].style.webkitMaskPosition = at;
      backs[i].style.maskPosition = at;
    }
  };

  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(host);

  /* Scratch, allocated once. The ticker runs through the busiest frames of the
     page's life and has no business making garbage on any of them. */
  const ang = new Float64Array(N);
  const cx = new Float64Array(N);
  const cz = new Float64Array(N);

  const draw = () => {
    if (!W) return;

    body.style.opacity = String(pose.alpha);
    body.style.transform =
      `translate3d(0, ${pose.y.toFixed(2)}px, 0) ` +
      `rotateX(${pose.rotX.toFixed(2)}deg) ` +
      `scale(${pose.scale.toFixed(4)})`;

    /* Walk the strip. theta is the surface's tangent angle at u, the fraction
       along the mark; x and z are where the strip has got to after ds of it.
       Because the step is always ds, the mark's LENGTH is fixed and its width
       on screen falls out of the curve — which is the whole trick. */
    let x = 0;
    let z = 0;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;

      /* THE CREASE. A smoothstep and not a step: a hard one would put the
         whole turn between two adjacent columns, which is a corner in a sheet
         of glass rather than a fold in something with a thickness. CREASE is
         how much of the mark the turn is spread over, either side of FOLD_AT. */
      let k = (u - (STICKER.FLEX.FOLD_AT - STICKER.FLEX.CREASE)) /
        (2 * STICKER.FLEX.CREASE);
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      k = k * k * (3 - 2 * k);

      const a =
        pose.bend * (u - 0.5) +
        pose.fold * k +
        pose.wave *
          Math.sin(2 * Math.PI * (STICKER.FLEX.FREQ * u - pose.phase));
      const c = Math.cos(a);
      const s = Math.sin(a);
      ang[i] = a;
      cx[i] = x + (c * ds) / 2;
      cz[i] = z + (s * ds) / 2;
      x += c * ds;
      z += s * ds;
    }

    /* Recentred, and it has to be: the chord shortens as the bend deepens, so
       without this the mark would crawl left across the sheet every time it
       flexed. The middle column is what stays put in depth. */
    const offX = (W - x) / 2;
    const z0 = cz[N >> 1];

    for (let i = 0; i < N; i++) {
      const dx = cx[i] + offX - (i * ds + ds / 2);
      /* rotateY(+a) turns +x AWAY from the viewer and the walk above has +z
         coming TOWARDS it, which is where the sign comes from. */
      columns[i].style.transform =
        `translate3d(${dx.toFixed(2)}px, 0, ${(cz[i] - z0).toFixed(2)}px) ` +
        `rotateY(${((-ang[i] * 180) / Math.PI).toFixed(2)}deg)`;

      const cos = Math.cos(ang[i]);
      const b = 1 - STICKER.SHADE * (1 - cos);
      inks[i].style.filter = `brightness(${(b < 0.2 ? 0.2 : b).toFixed(3)})`;

      /* WHICH SIDE IS FACING. Past a quarter turn this column is looking away
         and what belongs there is the blank underside, not the ink and not a
         highlight on it — a printed back is a flag.

         Written only on the frames a column actually flips, which for most
         columns is twice in the whole cover. backface-visibility would do the
         same in the compositor and was the first attempt; it needs the back
         rotated 180deg to be hidden by it, and a rotated element carries its
         MASK round with it, so every column's silhouette came out mirrored
         within its own slice. This is exact and costs three writes on a flip. */
      const front = cos >= 0;
      if (facing[i] !== front) {
        facing[i] = front;
        inks[i].style.opacity = front ? "1" : "0";
        sheens[i].style.opacity = front ? "1" : "0";
        backs[i].style.opacity = front ? "0" : "1";
      }
      if (!front) {
        /* The same ramp as the ink's, the other way up: flat-on to the light
           at half a turn, and down towards the crease where it is edge-on. */
        const bb = 1 - STICKER.BACK_SHADE * (1 + cos);
        backs[i].style.filter = `brightness(${(bb < 0.2 ? 0.2 : bb).toFixed(3)})`;
      }

      /* One band, sized to the whole mark and walked from a full width off the
         left to a full width off the right. Each column reads its own slice of
         it, so the highlight is continuous across the shape. */
      sheens[i].style.backgroundPosition =
        `${(-(i * ds) + (pose.sheen * 2 - 1) * W).toFixed(2)}px 0`;
    }
  };

  return {
    pose,
    draw,
    destroy: () => {
      ro.disconnect();
      body.remove();
      host.style.removeProperty("perspective");
    },
  };
}
