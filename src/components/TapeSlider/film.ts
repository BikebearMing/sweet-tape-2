/* THE ROLL'S SURFACE — what the tape is MADE of, for the product pages' viewer.
 *
 * The exports arrive with one base-colour texture per material and nothing
 * else: roughness 0.5 flat, metalness 0, no normal map, no roughness map. Under
 * the slider's rig — one key at 0.7 against an ambient at pi * 0.82 — that is a
 * picture of the artwork with a faint gradient on it, which is exactly what the
 * roll looked like. Nothing about it is wrong; there is simply nothing in it for
 * light to catch.
 *
 * This is the missing half, and all of it is procedural. Three maps cut into
 * canvases at load — a broad tint mottle, a roughness mottle, a fine tooth
 * normal — plus a clear coat, plus the anisotropy that makes a highlight sit
 * ALONG the winding rather than as a round spot on a cylinder. No new files.
 *
 * IT IS A PORT, AND THE ORIGINAL IS Hero/heroTape.ts. That file is where this
 * was worked out — its FILM and GLASS blocks carry the full argument for every
 * shape and most of the numbers, at a length worth reading before changing any
 * of them. What is here is the same technique against a different subject: the
 * hero has a strip of tape paid out across a page and this has a roll standing
 * on a colour sheet, so the tooth is finer, the mottle broader, and there is no
 * strip to be the clear one. Where a comment here says "see heroTape", that is
 * not a shortcut — it is where the reasoning lives.
 *
 * IT IS OFF UNLESS ASKED FOR. createTapeViewer takes it as an option and the
 * home page's orbit does not pass it, so the six rolls on the slider render
 * exactly as they did. The product pages opt in. See `film` in tape3d.ts.
 *
 * EVERY KNOB GOES TO ZERO AND LANDS BACK ON TODAY'S ROLL. FILM.AMOUNT = 0 takes
 * the maps and the coat off, GLASS.AMOUNT = 0 puts the material back to opaque,
 * and the two are independent.
 */
import {
  CanvasTexture,
  Color,
  type IUniform,
  type MeshPhysicalMaterial,
  type MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  Vector2,
} from "three";

/* ==========================================================================
   THE KNOBS
   ========================================================================== */

/* THE FINISH. Live-tweak in dev with the viewer's tune() — see tape3d.ts. */
export const FILM = {
  /* The master. 0 is the export as delivered: no maps, no coat, no anisotropy,
     and the roll is the flat one this file exists to replace. Everything below
     is scaled by it, so this is the A/B and the rollback in one number. */
  AMOUNT: 1,

  /* BASE ROUGHNESS for the wound side — what the export left at 0.5 for every
     surface alike, which is the single biggest reason the roll reads as one
     material moulded in one piece.
   *
   * 0.34, and it has been up and back down again for a reason worth writing
   * out, because it is the whole difference between the two ways a surface can
   * be too bright.
   *
   * GLOSSY AND REFLECTIVE ARE NOT THE SAME COMPLAINT. Roughness does not change
   * how much light a surface returns — it changes how WIDELY it spreads it. Take
   * roughness up and the same energy is smeared over half the roll: a broad pale
   * wash, no shape to it, and the surface reads as chalk or as unfinished
   * plastic. That is what 0.52 did here. Take it down and the same energy
   * collects into a small hard spot with dark around it, which is what the eye
   * reads as a shine on moulded plastic.
   *
   * So a roll that is too bright is almost never fixed by roughness. It is
   * fixed by giving it LESS LIGHT — see FILM_LIGHT and KICK in tape3d.ts — and
   * by narrowing the coat, and then roughness is free to go back down and do
   * the one thing it is actually for, which is deciding whether the highlight
   * has an edge.
   *
   * Up toward 0.6 for paper-backed stock, down toward 0.2 and the cylinder turns
   * into chrome. The mottle below is a variation ABOUT this, so a base this low
   * needs a narrow spread or the unevenness reads as smears — which is why
   * MOTTLE came down with it. */
  GLOSS: 0.34,

  /* HOW FAR THE ROUGHNESS WANDERS about GLOSS, full spread. The coating is not
     even and this is what says so — the thing that stops one continuous
     highlight running the width of the roll like a strip light.
     TIED TO GLOSS, and it came down when GLOSS did. A spread is only unevenness
     while both ends of it are the same KIND of surface: about a base of 0.34
     this puts the range at 0.25 to 0.43, all of it plastic. The old 0.26 about
     the old 0.52 was fine too — but 0.26 about 0.34 would reach 0.21, which is
     nearly a mirror, and a mirror next to a matte patch is a smear rather than
     a coating. Past ~0.4 it stops being a coating and starts being weather. */
  MOTTLE: 0.18,

  /* And the same field on the COLOUR, far weaker. Its job is only to keep the
     roughness mottle from reading as a lighting artefact: an unevenness that
     changes the gloss and not the tint at all is a trick of the light, and one
     that moves both is a surface. Tiny on purpose — this multiplies the
     artwork, and the artwork is the product. */
  MOTTLE_TINT: 0.05,

  /* THE SHAPE OF THE UNEVENNESS, as an exponent on the field. 1 is symmetrical
     — as much glossier as duller, everywhere. Above 1 the field is pushed to
     its low end, so most of the roll is clean and the marks are occasional
     blooms out of it, which is the difference between a surface somebody has
     handled and a surface with a pattern on it. See FILM.SMUDGE in heroTape,
     which is the same exponent and carries the argument. */
  SMUDGE: 1.7,

  /* MICRO-RELIEF, as normalScale on the tooth map. This is the part roughness
     cannot do: roughness spreads a highlight, tooth makes the surface catch the
     key at different angles a pixel apart. It is what the eye reads as texture
     rather than as tint.
     Finer here than in the hero — a roll at this size is a smaller thing on
     screen than a strip paid out across the section, so its grain has to be
     smaller to stay grain. Past ~0.6 the wound side starts to sparkle. */
  TOOTH: 0.27,

  /* THE CLEAR COAT — clearcoat on the physical material, which is a second
     specular lobe over the diffuse. Tape is a film with a slick face, and a
     single-lobe surface at any roughness cannot be both matte in the body and
     sharp at the highlight. This is what buys that.
     THE COAT IS THE PLASTIC, and this is the number that says how much of it
     there is — how much of the surface's return comes from a slick layer on top
     rather than from the pigment underneath. GLAZE_ROUGH below says how WIDE
     that layer's highlight is, and the two are not interchangeable: a big soft
     coat is lacquer and a small tight one is moulded plastic. 0.20 over a body
     at 0.38, both wide, was the lacquer. This is the small tight one. */
  GLAZE: 0.12,
  /* And the coat's own roughness — the single most useful number in this file,
   * because it is the one that separates GLOSSY from BRIGHT.
   *
   * A coat's peak scales as roughly one over roughness to the fourth, and its
   * AREA scales the other way. So this trades size against intensity at nearly
   * constant total light: 0.46 was a soft wash across a third of the roll, and
   * 0.14 is a small hard glint with clean surface either side of it. Both return
   * about the same energy; only one of them looks like plastic.
   *
   * Clipping is fine here and that is not a slip. With no tone mapping anything
   * over 1 flattens to white — across a wash that is a blown-out patch with no
   * information in it, and across a glint a few pixels wide it is just what a
   * specular on plastic looks like. Small enough to clip is the point.
   *
   * Well under the body, because a coat is the smooth thing on top. Never 0,
   * which is a perfect mirror and there is nothing in this scene to mirror. */
  GLAZE_ROUGH: 0.14,

  /* THE LABEL'S OWN ROUGHNESS, and the only number the printed disc takes from
     this file besides the coat. Slicker than the flank — a printed film face is
     the smoothest thing on a roll of tape — but nowhere near a mirror, which
     would put a white blowout across the type at exactly the angle the roll
     rests at.
     SLICKER THAN THE FLANK AGAIN, and by a hair — 0.32 against the body's 0.34.
     A printed film face IS the smoothest thing on a roll of tape and should read
     that way. It went the other way for a while, up to the export's own 0.5, on
     a note that the label was too bright; what was actually too bright was the
     light on it, and that is now dealt with where it belongs (KICK in tape3d.ts)
     rather than by pretending the lamination is not there. */
  FACE_GLOSS: 0.32,

  /* THE CLEAR TAPE'S CAST — the one knob here that only exists for the clear
   * ones, and the fix for the specific way they fail.
   *
   * A CLEAR TAPE'S ALBEDO IS NEAR WHITE, which is the trap. Once the wound side
   * is passing light, the half of it that is NOT passing light is a bright
   * neutral veil — and the eye reads a white veil as FOG long before it reads it
   * as glass. Worse, with no tone mapping there is no headroom above 1: a pale
   * diffuse plus a coat's specular clips, and the roll comes back as a white
   * blowout with a tape-shaped silhouette. That is exactly what the cello roll
   * did at every clarity worth having.
   *
   * So the albedo is pulled toward a warm darker tone in proportion to how clear
   * the tape is — a tape that TINTS what is behind it rather than one that
   * whitens it, which is both what real cellophane does and what buys the
   * specular its room back. It multiplies the export's artwork, so the roll
   * keeps its own colour and simply stops being pale.
   *
   * SCALED BY CLARITY, so a solid tape never sees it: masking and cloth take
   * this at exactly 0 and are the rolls they were. See FILM.CAST_STRIP in
   * Hero/heroTape.ts, which is the same correction on the same failure.
   *
   * CAST_MIX is how much of it lands per unit of clarity. Above about 2 the
   * clear tapes go amber; at 0 the blowout comes back. */
  CAST: "#c6a66d",
  CAST_MIX: 1.7,

  /* THE INTERIOR'S SHARE of the tooth and the coat. The core and the back disc
     are the same material as the flank and want the same character, but they are
     seen through the roll's opening rather than across a lit curve, and at full
     depth they turn the inside of the tube into gravel. */
  INNER: 0.45,

  /* HOW MANY TIMES THE MAPS TILE around the roll. The maps are a square tile
     and the wound side is a cylinder the tape is wound ALONG, so this is set
     high enough that the tile does not announce itself and low enough that the
     tooth stays relief rather than noise at the size the roll is drawn. */
  GRAIN: 6,

  /* ANISOTROPY — how far the highlight is stretched, and the direction it is
     stretched IN.
   *
   * THE ONE THING HERE THAT IS ABOUT TAPE SPECIFICALLY. Tape is wound, and a
   * wound surface scatters along the winding: the highlight on a roll's flank
   * is a band that runs AROUND it, not a spot. An isotropic material cannot
   * make that shape at any roughness — it can only make the spot bigger.
   * ROTATION is in radians and 0 puts the stretch along the surface's own u,
   * which for these exports is around the circumference.
   * DOWN FROM 0.55, because a stretched highlight is also a BIGGER one, and
   * bigness is the thing being taken out of this surface everywhere else. It
   * also pulls against the coat: the point of a tight GLAZE_ROUGH is a highlight
   * with a shape, and anisotropy's job is to smear that shape sideways. What is
   * left at 0.18 is enough to say the flank is wound rather than moulded, and
   * little enough that the glint on top of it still has an edge. */
  ANISO: 0.18,
  ANISO_TURN: 0,
};

/* THE CLEAR ONES — how see-through a roll's wound side is.
 *
 * WHAT THIS IS NOT: three's `transmission`. That is the obvious tool and it is
 * the wrong one for this canvas, for exactly the reason heroTape.ts sets out at
 * length above its own GLASS block — transmission is not a backdrop filter. It
 * renders the SCENE's opaque objects into a second target and refracts THAT,
 * and this scene is a roll on nothing: the clear colour is transparent black,
 * so a transmissive roll samples emptiness and goes dark and hollow. Everything
 * the roll appears to stand on — the tape's own colour sheet, the wordmark
 * behind it, the origin section's dark green further down — is DOM behind the
 * canvas, and WebGL cannot see a pixel of it.
 *
 * WHAT IT IS: alpha. The canvas is already a transparent overlay (`alpha: true`,
 * clear alpha 0 — see createTapeViewer), so a fragment leaving at less than full
 * alpha is composited by the BROWSER against whatever is actually behind it: the
 * right sheet, at the right scroll position, mid-turn, for nothing. It cannot be
 * wrong about what is back there because it has no opinion about what is back
 * there.
 *
 * WHAT STANDS IN FOR REFRACTION is the Fresnel below. Not a substitute so much
 * as the other half of the same physics: a film's transmission falls toward
 * grazing angles, so the edges close up and catch light while the middle stays
 * open. That is what the edge of real tape does.
 *
 * IT IS SPENT TWICE. The wound side is one double-sided cylinder wall, so
 * everywhere but the silhouette has both a near face and a far one between the
 * camera and the page. A clarity of 0.3 through each is under a tenth of the way
 * through both — which is what gives the gradient a real roll has: the core
 * shows through where only the near wall covers it, and the rim stays all but
 * solid. Turn it up expecting the page and you will get the core.
 *
 * NEVER THE PRINTED LABEL, and there are two independent reasons it cannot
 * happen by accident. The label is classified by geometry rather than by name
 * (see classify below), and the shader patch sits at `opaque_fragment`, which
 * opens by forcing alpha back to 1 on any material three considers opaque — and
 * three considers any material opaque that is not flagged `transparent`, which
 * only the wound side is.
 */
export const GLASS = {
  /* The master, and the rollback. At 0 nothing is flagged transparent, three
     forces diffuseColor.a to 1 itself, and the patch below cannot contribute a
     rounding error. */
  AMOUNT: 1,

  /* How fast the film closes toward grazing — the exponent on the Fresnel. Low
     numbers close it early and the roll reads as a thick-walled tube; high
     numbers keep it open almost to the silhouette and it reads as a sheet.
     3 is the shape a wound film has. */
  EDGE: 3,

  /* THE HIGHLIGHT'S EXEMPTION, 0..1. Without it the specular fades in exact
     step with the body, so a clearer roll is also a duller one — and the eye
     reads a surface that passes light AND throws an undiminished highlight as
     glass, while one that fades both reads as fog. This is the share of the
     reflected term that is held out of the fade and added back after the encode.
     See GLASS.SHEEN in heroTape for the full argument and the trap.
     Small, and smaller since: this term is added AFTER the encode, so it is the
     one thing on the roll that can exceed the rest of the frame's range. On the
     clear tapes it was the last part still reading as glare. */
  SHEEN: 0.07,
};

/* ==========================================================================
   THE MAPS
   ========================================================================== */

/* One band of value noise on a grid n across, smoothstepped between and
   wrapping at the edges so a sum of bands tiles with no seam. */
function octave(n: number) {
  const v = Array.from({ length: n * n }, () => Math.random());
  const ease = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const gx = x * n;
    const gy = y * n;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const fx = ease(gx - ix);
    const fy = ease(gy - iy);
    const x0 = ix % n;
    const y0 = iy % n;
    const x1 = (x0 + 1) % n;
    const y1 = (y0 + 1) % n;
    const top = v[y0 * n + x0] + (v[y0 * n + x1] - v[y0 * n + x0]) * fx;
    const bot = v[y1 * n + x0] + (v[y1 * n + x1] - v[y1 * n + x0]) * fx;
    return top + (bot - top) * fy;
  };
}

/** Sum a set of octaves into a 0..1 field with a mean near 0.5. */
function fieldOf(bands: readonly (readonly [number, number])[]) {
  const waves = bands.map(([n, amp]) => ({ amp, at: octave(n) }));
  const total = waves.reduce((sum, w) => sum + w.amp, 0);
  return (x: number, y: number) =>
    waves.reduce((sum, w) => sum + w.amp * w.at(x, y), 0) / total;
}

/* Everything this module cuts, so teardown can release it. A CanvasTexture is a
   GPU upload and it does not go away with the material that referenced it. */
const cut: Texture[] = [];

/* THE COATING'S UNEVENNESS. `base` is the map's average, `amp` the full spread
 * about it, `srgb` for a colour map and not for a data one.
 *
 * Falling amplitude over rising frequency: the broad swell of the coating, then
 * the marks within it. The coarsest band is two cells across the whole tile —
 * one slow swell — which is what keeps a tile repeated four times around a roll
 * from reading as a repeat. The finest is 23, and a 256px map is eleven pixels
 * per cell at that: past this size the canvas is storing an interpolation it
 * could have computed. */
function mottleTex(base: number, amp: number, srgb: boolean, aniso: number) {
  const S = 256;
  const at = fieldOf([
    [2, 1],
    [5, 0.6],
    [11, 0.28],
    [23, 0.1],
  ]);

  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);

  /* Shaped by SMUDGE, then MEASURED. The raw field sits near 0.5 by
     construction; a shaped one does not, so subtracting a constant 0.5 would
     slide the whole map darker as SMUDGE rose and the character knob would
     quietly be a brightness knob too. One extra pass over 65k texels. */
  const f = new Float32Array(S * S);
  let sum = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const v = at(x / S, y / S) ** FILM.SMUDGE;
      f[y * S + x] = v;
      sum += v;
    }
  }
  const mean = sum / (S * S);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const v = base + (f[y * S + x] - mean) * amp;
      const n = Math.max(0, Math.min(255, Math.round(v * 255)));
      const i = (y * S + x) * 4;
      img.data[i] = n;
      img.data[i + 1] = n;
      img.data[i + 2] = n;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(FILM.GRAIN, FILM.GRAIN);
  if (srgb) tex.colorSpace = SRGBColorSpace; // colour maps only
  tex.anisotropy = aniso;
  cut.push(tex);
  return tex;
}

/* THE TOOTH — micro-relief as a tangent-space normal map, and the thing
 * roughness cannot do. Much finer than the mottle: that map is the coating's
 * slow unevenness and this starts where it stops.
 *
 * A HEIGHT FIELD DIFFERENCED rather than noise written into the channels. RGB
 * noise is not a normal map — its vectors point nowhere in particular and the
 * lighting comes out as coloured static. Central differences off a scalar height
 * give slopes consistent with their neighbours, which is what makes a lit bump
 * look like a bump.
 *
 * Amplitude is not baked in: the gain here is fixed and FILM.TOOTH rides on the
 * material's normalScale, so depth is a live uniform rather than a re-cut map. */
function toothTex(aniso: number) {
  const S = 256;
  const at = fieldOf([
    [23, 1],
    [53, 0.62],
    [113, 0.36],
    [211, 0.2],
  ]);

  // Sampled once and reused: the difference below reads each texel four times,
  // and recomputing four octaves per read is 16x the work for the same number.
  const h = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) h[y * S + x] = at(x / S, y / S);
  }

  /* What a unit of height means against a texel's width — the map's inherent
     steepness, with normalScale free to be the artistic dial on top. High
     enough that TOOTH lands near 1 for a plainly textured tape, so the knob
     reads as 0..1 rather than 0..0.05. */
  const GAIN = 26;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);

  // Wrapped, so the normals agree across the seam the heights already tile at.
  const at2 = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)];

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (at2(x + 1, y) - at2(x - 1, y)) * GAIN;
      const dy = (at2(x, y + 1) - at2(x, y - 1)) * GAIN;
      // Tangent space: +x right, +y up the texture, +z out. The slopes are
      // negated because a surface rising to the right tilts LEFT.
      const len = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      img.data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round((1 / len) * 0.5 * 255 + 127.5);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(FILM.GRAIN, FILM.GRAIN);
  // No colorSpace: a normal map is a vector, and decoding it as sRGB would bend
  // every one of those vectors toward the surface.
  tex.anisotropy = aniso;
  cut.push(tex);
  return tex;
}

/* Cut once per viewer rather than once per material — six models share one set,
   and six copies of the same 256px noise is six uploads of the same bytes. */
type Maps = { tint: Texture; rough: Texture; tooth: Texture };
export function cutMaps(aniso: number): Maps {
  return {
    tint: mottleTex(1, FILM.MOTTLE_TINT, true, aniso),
    rough: mottleTex(0.72, FILM.MOTTLE, false, aniso),
    tooth: toothTex(aniso),
  };
}

/** Release every map this module has cut. Called from the viewer's teardown. */
export function disposeMaps() {
  for (const t of cut) t.dispose();
  cut.length = 0;
}

/* ==========================================================================
   WHICH SURFACE IS WHICH
   ========================================================================== */

/** What a primitive of the roll turns out to be, once measured. */
export type Surface = "wound" | "label" | "core" | "end" | "other";

/* CLASSIFIED BY GEOMETRY, NOT BY NAME, and that is the whole reason this
 * function exists rather than a lookup table.
 *
 * The exports do not agree on names. The wound side is "Cello Side" on the
 * stationery roll, "Material" on the OPP one and "Material.003" on the
 * low-noise one; the printed label is "Face Brown", "Double Sided",
 * "Material.001", "Material.007". There is no key in those. A table would be
 * six rows to keep in step with six files by hand, and the failure mode is the
 * label going glassy — the one thing in here that must never happen.
 *
 * The SHAPES do agree, to the thousandth, across every export:
 *
 *   wound side   cylinder, r 0.5,  height 0.47
 *   core         cylinder, r 0.4,  height 0.47
 *   label        disc,     r 0.5,  at the front end
 *   end          disc,     r 0.5,  at the back end
 *   core disc    disc,     r 0.4
 *
 * So: thin in one axis is a DISC and the rest are WALLS, and the radius says
 * which of the two. A future export that changes those proportions will fall
 * through to "other" and be left alone, which is the safe direction to fail in.
 *
 * MEASURED IN THE MODEL'S OWN SPACE, before FACE_FORWARD turns it upright, so
 * the roll's axis is y here whatever the stage does with it afterwards. */
export function classify(size: { x: number; y: number; z: number }, midY: number): Surface {
  const r = Math.max(size.x, size.z) / 2;
  const outer = r > 0.45;
  // A disc is flat in the axis the roll is wound about. A tenth of its own
  // radius is far below the 0.47 of either wall and far above the 0.003 of the
  // hang tab, which is the only other thin thing in the file.
  const disc = size.y < r * 0.1;

  if (!disc) return outer ? "wound" : "core";
  if (!outer) return "core";
  /* Front or back, and the front is the printed one. The two discs sit at
     opposite ends of the wall's own span — the label at the low end of the
     axis, the back face at the high end — and the midpoint of the wall is what
     separates them. */
  return midY < 0 ? "label" : "end";
}

/* ==========================================================================
   APPLYING IT
   ========================================================================== */

type Glass = {
  uClarity: IUniform<number>;
  uEdge: IUniform<number>;
  uSheen: IUniform<number>;
};

/* The opaque surfaces share one of these, all zeros, so they compile the SAME
   program as the clear one rather than a second variant of it — a uniform
   branch is free and a shader permutation is not. uSheen is belt and braces:
   at clarity 0 the exemption is multiplied by (1 - alpha) = 0 anyway. */
const solid: Glass = {
  uClarity: { value: 0 },
  uEdge: { value: GLASS.EDGE },
  uSheen: { value: 0 },
};

/**
 * Give one material the film treatment.
 *
 * FOUR SURFACES, FOUR RECIPES, AND THE LABEL IS THE REASON THIS TAKES A KIND AT
 * ALL. The first version of this gave every primitive the same maps, and the
 * printed disc came out looking like stucco: the tooth is cut for a wound
 * plastic flank seen across a curve, and the label is a flat panel of type
 * filling half the screen, so the same relief that reads as tape at a grazing
 * angle reads as sandpaper head-on. The two are not the same material and
 * cannot take the same treatment — see applyFaceLook in Hero/heroTape.ts, which
 * is the same split for the same reason.
 *
 * - wound  the flank. Everything: mottle, tooth, coat, anisotropy, and the
 *          clarity if this tape has one.
 * - core   the tube inside, and the end disc. The same surface at a fraction of
 *   end    the depth — it is tape, but it is never the subject and it is mostly
 *          seen in shadow through the roll's opening.
 * - label  the printed disc. NO MAPS AT ALL. It gets a coat and a gloss, which
 *          is what says the artwork is printed on film rather than on paper,
 *          and nothing that could disturb the type.
 * - other  the hang tab. Left exactly as exported.
 *
 * `clarity` is how see-through this surface is, 0..1. Only ever non-zero for
 * the wound side — see the call site in tape3d.ts.
 */
export function applyFilm(
  mat: MeshStandardMaterial,
  maps: Maps,
  surface: Surface,
  clarity: number
) {
  if (FILM.AMOUNT <= 0 || surface === "other") return;

  const k = FILM.AMOUNT;
  const phys0 = mat as MeshPhysicalMaterial;

  /* THE LABEL, AND IT IS ALL IT GETS. The export's own roughness and a coat
     over it, so the key finds a highlight that travels across the disc as the
     roll turns. No roughnessMap and no normalMap:
     the artwork is the product, and the one thing this file must not do is put
     a texture through the type. It returns before the maps and before anything
     that could flag it transparent, which is the first of the two guards. */
  if (surface === "label") {
    mat.roughness = FILM.FACE_GLOSS;
    phys0.clearcoat = FILM.GLAZE * k;
    phys0.clearcoatRoughness = FILM.GLAZE_ROUGH;
    mat.needsUpdate = true;
    return;
  }

  /* The interior takes the same surface at a fraction of the depth — see the
     table above. */
  const deep = surface === "wound" ? 1 : FILM.INNER;

  /* The maps multiply the export's own artwork rather than replacing it —
     mat.map stays exactly what the GLB shipped, and these ride on top as the
     roughness, the relief and a whisper of tint. */
  mat.roughness = FILM.GLOSS;
  mat.roughnessMap = maps.rough;
  mat.normalMap = maps.tooth;
  mat.normalScale = new Vector2(FILM.TOOTH * k * deep, FILM.TOOTH * k * deep);

  /* Clearcoat and anisotropy are MeshPhysicalMaterial's, and the loader hands
     back MeshStandardMaterial. Rather than rebuild every material as physical —
     which would mean hand-copying fields and is where the hero's toPhysical()
     earns its keep — these are set through a cast: three's standard material
     ignores properties it has no uniform for, and the physical one picks them
     up when the export carries an extension that promotes it. Where it does
     not, GLAZE simply does not apply, which is a softer roll and not a broken
     one. See the note in tape3d.ts on why the promotion is done there. */
  const phys = mat as MeshPhysicalMaterial;
  phys.clearcoat = FILM.GLAZE * k * deep;
  phys.clearcoatRoughness = FILM.GLAZE_ROUGH;
  phys.anisotropy = FILM.ANISO * k;
  phys.anisotropyRotation = FILM.ANISO_TURN;

  /* And the cast, before the glass — see FILM.CAST. A tape with no clarity
     lerps by 0 and keeps the export's colour to the bit. */
  if (clarity > 0) {
    mat.color.lerp(new Color(FILM.CAST), Math.min(1, clarity * FILM.CAST_MIX));
  }

  const glass: Glass =
    clarity > 0
      ? {
          uClarity: { value: clarity * GLASS.AMOUNT },
          uEdge: { value: GLASS.EDGE },
          uSheen: { value: GLASS.SHEEN },
        }
      : solid;

  if (clarity > 0 && GLASS.AMOUNT > 0) {
    /* THE FLAG THAT MAKES IT SEE-THROUGH, and the one that makes the sheen
       compose. `transparent` is what stops three defining OPAQUE and forcing
       the alpha back to 1; `premultipliedAlpha` is what lets the highlight be
       exempt from the fade — the default blend would multiply it straight back
       down by the alpha it was just held out of.
       depthWrite off because a translucent wall cannot write depth: the near
       and far faces of the cylinder arrive in one draw, and with it on
       whichever lands first z-rejects the other and the wall renders in
       patches. */
    mat.transparent = true;
    mat.premultipliedAlpha = true;
    mat.depthWrite = false;
  }

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uClarity = glass.uClarity;
    shader.uniforms.uEdge = glass.uEdge;
    shader.uniforms.uSheen = glass.uSheen;
    shader.fragmentShader =
      /* gReflect is a global rather than a local because the two halves of the
         exemption cannot be neighbours: it is worked out where the lighting
         still exists as separate terms and spent at the very end of the
         fragment, after the encode. Nothing between the two can be moved. */
      "uniform float uClarity;\nuniform float uEdge;\nuniform float uSheen;\nvec3 gReflect;\n" +
      shader.fragmentShader
        /* AT opaque_fragment, and the site is chosen rather than convenient. It
         * is the last thing the fragment stage does — `gl_FragColor = vec4(
         * outgoingLight, diffuseColor.a )` — so writing the alpha immediately
         * before it is writing the alpha that leaves. It is also AFTER
         * normal_fragment_maps, which is what makes the Fresnel worth having:
         * `normal` here is the normal-MAPPED one, so the tooth cut above
         * modulates how see-through the roll is, rather than the transparency
         * being a flat sheet laid over a textured surface. */
        .replace(
          "#include <opaque_fragment>",
          `{
          /* Schlick's shape with the exponent as a knob — see GLASS.EDGE.
             vViewPosition runs from the fragment to the camera, which is the eye
             vector in view space; abs() covers the far wall of the cylinder,
             where a normal read inside-out would be a black band across the
             roll at exactly the angle the effect is for. */
          float ndv = abs( dot( normal, normalize( vViewPosition ) ) );
          /* Face-on the film is at its clearest; toward grazing it closes to
             solid. Never past 1 and never under 1 - uClarity, so the knob is
             the full range of the effect and there is nothing to clamp. */
          diffuseColor.a = mix( 1.0 - uClarity, 1.0, pow( 1.0 - ndv, uEdge ) );
          /* The sheen's exemption — what the fade is about to take out of the
             REFLECTED light only, banked to be put back at the foot of the
             shader. outgoingLight minus totalDiffuse IS that reflection: the
             specular and the clear coat, which three has already folded in.
             Stated as the remainder rather than summed from its parts because
             the coat's terms sit inside an ifdef on USE_CLEARCOAT, and naming
             them would fail to compile the moment GLAZE went to 0 — which is
             exactly the rollback that has to keep working. */
          gReflect = max( outgoingLight - totalDiffuse, vec3( 0.0 ) )
            * ( 1.0 - diffuseColor.a ) * uSheen;
        }
        #include <opaque_fragment>`
        )
        /* AND SPENT HERE, the last line of the fragment stage. After
         * premultiplied_alpha_fragment rather than before it, because that chunk
         * is the multiply this term is exempt FROM. And through
         * linearToOutputTexel — the same encode colorspace_fragment put the rest
         * of the frame through two lines earlier — because adding linear light
         * to an already-encoded pixel lands the highlight far brighter than
         * asked for, and brighter the darker the surface under it. */
        .replace(
          "#include <premultiplied_alpha_fragment>",
          `#include <premultiplied_alpha_fragment>
        gl_FragColor.rgb += linearToOutputTexel( vec4( gReflect, 1.0 ) ).rgb;`
        );
  };
  mat.needsUpdate = true; // patched source => recompile
}
