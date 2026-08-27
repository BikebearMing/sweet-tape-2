/* LAB — the peeling letter, in three.
 *
 * Same arrangement as the roll and the note: everything three-specific lives
 * here and the mount (index.tsx) owns the clock, the observers and the state
 * machine, so this file rides the three chunk the hero already pays for.
 *
 * THE CAMERA IS IN PIXELS. It is a perspective camera placed so that the plane
 * z = 0 measures exactly one world unit per CSS pixel of viewport — put a thing
 * at (x, H - y, 0) and it lands on the DOM's (x, y). That is what lets the
 * letter be nailed to a box the browser laid out, without a projection matrix
 * anywhere in the placement code. Perspective rather than orthographic because
 * the flap curls TOWARD THE VIEWER, and an ortho camera would draw that with no
 * foreshortening at all — the peel would read as a shape changing rather than
 * as a corner coming off the wall.
 *
 * THE DEFORMATION IS ONE NUMBER, 0..1, for the reason components/Peel/peel.ts
 * gives at length: the shape of the movement and the shape of the object are
 * different questions, and a peel that is a function of a single scalar can be
 * driven by anything — an idle, a scrub, or a piece of tape pulling it flat.
 * `peel` is that number here. Nothing else in this file changes the geometry.
 *
 * THE FOLD, in the letter's own frame (y up, origin at the box's centre):
 *
 *        stuck        s < f          flat on the wall, z = 0
 *      ---------  <-- f, the fold    advances up the letter as peel grows
 *        curl         s - f < r0     an arc of radius CURL: off the wall,
 *          \                         over, and back on itself
 *           `-.       the rest       a second, much larger arc — the flap is
 *              `                     near straight, and SAG bends its tip
 *
 * Two meshes share one BufferGeometry: the printed face (FrontSide) and the
 * adhesive back (BackSide). Deform once, draw twice — which is also the only
 * way to give the two sides different artwork without a custom shader.
 */
import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  ShaderMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

import { placementOf, rasterise, type LetterRaster } from "./glyph";

const FOV = 30;
const DPR_CAP = 2;

/** The headline's ink, and the underside of a sticker cut out of it. The face
    is #013900 because that is what .hero-section .h1 is set in; the back is the
    same green lifted and greyed — adhesive over a light liner, not paint. */
export const COLOUR = {
  FACE: "#013900",
  BACK: "#d6e2c6",
};

/* Live-tweakable in dev via `peelLab.TUNE` — the ticker re-reads them every
   frame, so a change lands on the next one rather than on reload. */
export const TUNE = {
  /** The peel's lean off straight-down, in degrees. Zero lifts the whole
      bottom edge at once, which reads as a hinge; a few degrees makes one
      corner lead and the rest follow, which reads as a hand. */
  PHI: -24,
  /** The curl's radius, as a fraction of the ink's height. This is the single
      biggest number in the look: small is a tight kink (thin film), large is a
      lazy roll (card). A vinyl letter is nearer the middle. */
  CURL: 0.13,
  /** How far round the curl has gone by the time the arc ends, in degrees.
      Past 90 the flap is folded back over itself and its BACK is what faces the
      viewer, which is the whole reason there is a back texture. */
  THETA: 158,
  /** How the flap continues past the curl, in radians per pixel. Negative
      unbends it — the tip falls away from the fold under its own weight. */
  SAG: -0.0032,
  /** How far up the ink the fold can travel, as a fraction of the ink's height,
      at peel = 1. Past ~0.8 there is not enough letter left stuck to the wall
      to read as attached. */
  TRAVEL: 0.52,
  /** Vertices per side. The curl is where this shows: too few and the fold is
      a visible crease of flat facets. */
  SEG: 60,
  /** The idle. The peel does not FINISH — it lifts to PEEL and then breathes,
      because a flap that has settled is a thing that has happened and a flap
      that is still moving is a thing asking to be dealt with. Two periods that
      do not divide into each other, so the loop never announces itself. */
  IDLE: { PEEL: 0.6, BREATHE: 0.05, THETA: 10, SPEED: 0.33 },
  /** The scar left on the wall — the letter's own silhouette, darkened. Fades
      in with the peel and back out when the tape pulls the letter down. */
  RESIDUE: 0.26,
  /** The strip, as a fraction of the ink's width, and how far it floats off
      the wall so it is never coplanar with the letter it is holding. */
  TAPE_W: 0.62,
  TAPE_Z: 3,
  /* THE FILM'S COLOUR, and it is the roll's own rather than a new one: 0xb79a64
     is FILM.CAST_STRIP in Hero/heroTape.ts — the tan the tape paying out of the
     roll a few hundred pixels below this is graded to. It was near-white, which
     on lime is invisible: clear film over a colour that bright gives back
     almost nothing to see. Real OPP tape is not clear, it is AMBER, and amber
     is the one thing on this section that reads as tape at a glance.

     Live: peelLab.TUNE.TAPE_TINT = 0xd8b45c */
  TAPE_TINT: 0xb79a64,
  /** Rejected — a strip that is not across the fold is holding nothing. */
  TAPE_BAD: 0xff9a7a,
  /** How much of the film comes through. Not 1: the whole signature of tape
      over ink is that you can still read the ink under it. */
  TAPE_ALPHA: 0.55,
  /** THE FILM'S SURFACE — what makes it a piece of tape rather than a tinted
      rectangle. See the shader in tapeMaterial().

      CROWN is how far the strip stands proud down its middle, in px: tape
      pressed down is pinched at its slit edges and domed between them, and that
      dome is a lens the length of the strip.
      RIPPLE and RIPPLE_LEN are the slack in it — the shallow waves that run
      along any strip nobody managed to lay perfectly flat.
      REFRACT is how far what is behind the film is displaced by it, in px, at
      the steepest part of the surface. DISPERSE splits that per channel, which
      is where the colour fringe on the letter's edge comes from.
      SPEC and SHINE are the light coming back OFF it rather than through. */
  FILM: {
    CROWN: 7,
    RIPPLE: 1.6,
    RIPPLE_LEN: 52,
    REFRACT: 13,
    DISPERSE: 0.13,
    SPEC: 0.55,
    SHINE: 26,
    /** The slit edge — the bright line down each long side. The single
        strongest tape signal there is, and the one thing a normal off a smooth
        crown cannot produce: a cut edge is a discontinuity, not a slope. */
    EDGE: 0.34,
  },
  /** How far the two targets stand OFF the letter, in fractions of the ink.
      On the glyph they were competing with it for the eye; a ring wants clear
      ground around it, and the U has plenty on both sides. */
  TIP_OUT: 0.3,
  WALL_OUT: 0.72,
  /** How far above the fold the wall anchor sits, as a fraction of the ink's
      height. Far enough that the two targets are not one target, and that the
      strip between them is a STRIP rather than a stamp. */
  ANCHOR: 0.66,
  /** THE LIGHT, and the whole trick is in Z.
   *
   * A letter lying flat on the wall has to leave the renderer at EXACTLY its
   * own colour — it is standing in a row with five DOM letters set in the same
   * ink, and a WebGL one a shade off is the only thing anybody would see. But a
   * lit surface never returns its albedo: MeshStandardMaterial's non-metal
   * specular is a white 4% on top of the diffuse, and against ink this dark
   * (#013900 is 4% linear) even that wash lifts the flat letter grey.
   *
   * So the key is thrown almost ALONG the wall — mostly across and up, barely
   * any Z. A surface facing the viewer catches almost none of it and comes out
   * at ambient alone, which is set to 1 (in units of pi) and is therefore the
   * texture's own colour. The moment the flap curls, its normals swing into the
   * light and it picks up the whole key, sheen and all.
   *
   * Which means the lighting is not a compromise between the two states. Flat
   * is print and curled is film, and one grazing light says both. */
  LIGHT: { X: -820, Y: 760, Z: 62, POWER: 2.6, AMBIENT: 0.95 },
  /** The contact shadow — how far the flap's silhouette is thrown across the
      wall per unit it stands off it, and how dark. Sheared rather than lit:
      see the note on `shadow` below. */
  SHADOW: { X: 0.55, Y: -0.55, ALPHA: 0.3 },
};

export type PeelScene = {
  /** Advance the idle and redraw. `peel` is the 0..1 the caller owns; `wobble`
      scales the idle's breathing (0 while the tape is pulling it flat). */
  frame(seconds: number, peel: number, wobble: number): void;
  /** Re-read the mount's box and the letter's placement. */
  resize(): void;
  /** The flap's free tip, in viewport px — where the first target ring goes. */
  flapTip(): { x: number; y: number };
  /** The fold, in viewport px: the line a strip has to cross to be holding
      anything. Both ends are ON THE WALL (z = 0), so this is a screen-space
      line and the crossing test is plain 2D. */
  foldLine(): { ax: number; ay: number; bx: number; by: number };
  /** A point well above the fold, on the wall — the second target ring. */
  wallAnchor(): { x: number; y: number };
  /** Show the strip between two viewport points. `press` 0..1 is the slap:
      0 is the rubber band being dragged, 1 is stuck down. null hides it. */
  setTape(
    a: { x: number; y: number } | null,
    b: { x: number; y: number } | null,
    press: number,
    valid: boolean,
  ): void;
  /** Face-only, no peel — the alignment check against the DOM letter. */
  setGhost(on: boolean): void;
  /** Viewport px → the letter's own plane, so a point picked with the mouse
      survives the page scrolling under it. */
  screenToLocal(x: number, y: number): { x: number; y: number };
  /** And back again. */
  localToScreen(x: number, y: number): { x: number; y: number };
  dispose(): void;
};

/** The arc chain: distance `a` past the fold, out to (along, up-off-the-wall).
    Continuous and tangent-continuous at the join by construction — see the
    derivative check in the comment on SAG. */
function curl(a: number, r: number, theta: number, k: number) {
  const arcEnd = r * theta;
  if (a <= arcEnd) {
    const th = a / r;
    return { along: r * Math.sin(th), out: r * (1 - Math.cos(th)) };
  }
  const a1 = r * Math.sin(theta);
  const z1 = r * (1 - Math.cos(theta));
  const s2 = a - arcEnd;
  if (Math.abs(k) < 1e-7) {
    return {
      along: a1 + s2 * Math.cos(theta),
      out: z1 + s2 * Math.sin(theta),
    };
  }
  const R = 1 / k;
  const th2 = theta + s2 * k;
  return {
    along: a1 + R * (Math.sin(th2) - Math.sin(theta)),
    out: z1 - R * (Math.cos(th2) - Math.cos(theta)),
  };
}

/** A strip of film, drawn rather than loaded. Translucent, a touch cooler at
    the edges than through the middle, with two soft sheens down its length and
    ragged ends — the same three signals heroTape.ts spends a thousand lines on,
    at the fidelity a flat quad can carry. */
function tapeTexture(): CanvasTexture {
  const W = 512;
  const H = 128;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  /* The long edges are CRISP and the short ones are torn, which is the whole
     difference between a piece of tape and a soft white lozenge. A strip is
     slit off a roll down its length and pulled off across it, so the two pairs
     of edges are made by two different actions and cannot look alike.

     The edge stop is a hair BRIGHTER than the middle rather than fading out:
     the cut edge of a film catches the light along its whole run, and it is
     that line, not the body, that tells you the strip has a thickness. */
  /* Structure only — how the alpha and the sheen sit across the strip. THE
     COLOUR IS NOT IN HERE: it is TUNE.TAPE_TINT on the material, so the film
     can be graded from the console without rebuilding a texture. */
  const body = ctx.createLinearGradient(0, 0, 0, H);
  body.addColorStop(0, "rgba(255,248,228,0.95)");
  body.addColorStop(0.05, "rgba(255,255,255,0.9)");
  body.addColorStop(0.5, "rgba(255,255,255,0.8)");
  body.addColorStop(0.95, "rgba(255,255,255,0.9)");
  body.addColorStop(1, "rgba(255,248,228,0.95)");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, W, H);

  /* Two sheens, off-centre and of different weights: one down the middle is a
     stripe, two at odd spacings is a surface catching the light. */
  for (const [y, h, alpha] of [
    [H * 0.3, H * 0.1, 0.36],
    [H * 0.66, H * 0.05, 0.22],
  ]) {
    const g = ctx.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - h, W, h * 2);
  }

  /* The ends. Torn, not cut — a flat edge is what makes a quad read as a quad.
     Punched out with destination-out so the tear is in the ALPHA, which is what
     the material is keyed on. */
  ctx.globalCompositeOperation = "destination-out";
  for (const at of [0, W]) {
    const dir = at === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(at, 0);
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      /* Deterministic wobble: two out-of-phase sines, so the two ends are not
         mirror images of each other and neither repeats down the width. */
      const bite = 17 + 11 * Math.sin(t * 9.1 + at) + 6 * Math.sin(t * 21.7);
      ctx.lineTo(at + dir * bite, t * H);
    }
    ctx.lineTo(at, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  /* NO COLOUR SPACE ON PURPOSE. This is sampled by a raw shader that composites
     in the output space directly (see tapeMaterial), so a texture three would
     linearise on the way in is a texture that comes back wrong. Only its alpha
     and one grey channel are read anyway. */
  return new CanvasTexture(c);
}

/** A colour as the framebuffer wants it: sRGB bytes, not linearised. The strip
    paints its own backdrop and has to match the lime the DOM is painting a few
    layers below it, so the one thing it must not do is round-trip through a
    working colour space. */
function srgb(hex: number): Vector3 {
  return new Vector3(
    ((hex >> 16) & 255) / 255,
    ((hex >> 8) & 255) / 255,
    (hex & 255) / 255,
  );
}

/* THE FILM — and why it is a shader rather than a transparent quad.
 *
 * A strip of tape is not a tinted rectangle. What tells you it is tape, before
 * the colour does, is that THE THING BEHIND IT MOVES: the letter's edge steps
 * sideways as it passes under the strip's slit edge, breaks into a colour
 * fringe, and steps back. That is a lens, and it needs a surface with a shape
 * and something behind it to bend.
 *
 * THE SURFACE is a crown across the width — tape presses flat at its slit edges
 * and domes between them, so the whole strip is a shallow cylindrical lens —
 * plus a slow ripple down its length, which is the slack nobody ever gets out
 * of a strip they laid by hand. Both are height fields, both are differentiated
 * in the shader rather than baked to a normal map, so both are live numbers.
 *
 * WHAT IS BEHIND IT is worked out rather than sampled, and that is the trick
 * that makes this cheap. Real transmission would need the backdrop in a render
 * target, and the backdrop here is not even in the scene: it is the DOM, under
 * a transparent canvas. But this wall only has two things on it — the lime, and
 * the letter — and BOTH ARE KNOWN. The lime is a constant, the letter is the
 * same glyph texture the mesh is drawn from, and mapping a world point onto it
 * is one rotation and a divide. So the strip samples its own backdrop
 * analytically, three times at three displacements for the dispersion, and
 * composites it itself.
 *
 * Which is why it writes opaque colour rather than blending: it IS the
 * backdrop, over the strip's own coverage. The paper grain under it is lost,
 * and that costs nothing — the grain is 20% of an overlay under 86% of a film,
 * which is under 3% of a pixel nobody was going to find. */
function tapeMaterial(strip: CanvasTexture, glyph: CanvasTexture) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uStrip: { value: strip },
      uGlyph: { value: glyph },
      uTint: { value: srgb(TUNE.TAPE_TINT) },
      uLime: { value: srgb(0xb6fe00) },
      uInk: { value: srgb(0x013900) },
      uFilm: { value: TUNE.TAPE_ALPHA },
      uLen: { value: 1 },
      uWid: { value: 1 },
      uCrown: { value: TUNE.FILM.CROWN },
      uRipple: { value: TUNE.FILM.RIPPLE },
      uRippleLen: { value: TUNE.FILM.RIPPLE_LEN },
      uRefract: { value: TUNE.FILM.REFRACT },
      uDisperse: { value: TUNE.FILM.DISPERSE },
      uSpec: { value: TUNE.FILM.SPEC },
      uShine: { value: TUNE.FILM.SHINE },
      uEdge: { value: TUNE.FILM.EDGE },
      uAxis: { value: new Vector2(1, 0) },
      uLetterC: { value: new Vector2() },
      uLetterR: { value: new Vector2(1, 0) },
      uLetterS: { value: new Vector2(1, 1) },
      uLight: { value: new Vector3(0, 0, 1) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec2 vWorld;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xy;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform sampler2D uStrip;
      uniform sampler2D uGlyph;
      uniform vec3 uTint, uLime, uInk, uLight;
      uniform float uFilm, uLen, uWid, uCrown, uRipple, uRippleLen;
      uniform float uRefract, uDisperse, uSpec, uShine, uEdge;
      uniform vec2 uAxis, uLetterC, uLetterR, uLetterS;

      varying vec2 vUv;
      varying vec2 vWorld;

      /* How much ink is at a world point — the letter's own texture, reached
         by undoing the letter's placement. Outside its box there is none. */
      float inkAt(vec2 p) {
        vec2 d = p - uLetterC;
        vec2 l = vec2( d.x * uLetterR.x + d.y * uLetterR.y,
                      -d.x * uLetterR.y + d.y * uLetterR.x );
        vec2 g = l / uLetterS + 0.5;
        if (g.x < 0.0 || g.x > 1.0 || g.y < 0.0 || g.y > 1.0) return 0.0;
        return texture2D(uGlyph, g).a;
      }

      void main() {
        vec4 strip = texture2D(uStrip, vUv);
        if (strip.a < 0.004) discard;

        /* The surface: crowned across, rippled along. Slopes in px per px. */
        float v = vUv.y * 2.0 - 1.0;
        float u = vUv.x * uLen;
        float k = 6.2831853 / max(uRippleLen, 1.0);
        float dhdv = -4.0 * uCrown * v / max(uWid, 1.0);
        float dhdu = uRipple * k * cos(u * k);

        vec3 n = normalize(vec3(-dhdu, -dhdv, 1.0));
        vec2 along = uAxis;
        vec2 across = vec2(-uAxis.y, uAxis.x);
        vec2 nxy = n.x * along + n.y * across;

        /* What is behind, bent by it — three times, spread a little, so the
           letter's edge comes through the slit edge with a colour on it. */
        vec2 bend = -nxy * uRefract;
        float r = inkAt(vWorld + bend * (1.0 - uDisperse));
        float g = inkAt(vWorld + bend);
        float b = inkAt(vWorld + bend * (1.0 + uDisperse));
        vec3 behind = vec3(
          mix(uLime.r, uInk.r, r),
          mix(uLime.g, uInk.g, g),
          mix(uLime.b, uInk.b, b)
        );

        vec3 col = mix(behind, uTint * strip.r, uFilm);

        /* And the light coming back off it. The view is near enough head-on
           that the half-vector is the light plus z. */
        vec3 h = normalize(uLight + vec3(0.0, 0.0, 1.0));
        col += pow(max(dot(vec3(nxy, n.z), h), 0.0), uShine) * uSpec;

        /* And the slit edges, which are a cut rather than a curve and so have
           to be drawn rather than shaded — see FILM.EDGE. */
        col += smoothstep(0.86, 1.0, abs(v)) * uEdge;

        gl_FragColor = vec4(col, strip.a);
      }
    `,
  });
}

export function createPeelScene(
  mount: HTMLElement,
  charEl: HTMLElement,
): PeelScene | null {
  const raster = rasterise(charEl, COLOUR.FACE, COLOUR.BACK);
  if (!raster) return null;

  let R: LetterRaster = raster;

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = NoToneMapping;
  renderer.setClearAlpha(0);
  mount.append(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 20000);

  /* Key from the upper left and slightly in front, matching the roll's — the
     two objects are a foot apart on the same wall and a light that disagreed
     would be the first thing anyone noticed. */
  const dir = new DirectionalLight(0xffffff, TUNE.LIGHT.POWER);
  const amb = new AmbientLight(0xffffff, Math.PI * TUNE.LIGHT.AMBIENT);
  scene.add(dir, amb);

  const faceTex = new CanvasTexture(R.face);
  faceTex.colorSpace = SRGBColorSpace;
  faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const backTex = new CanvasTexture(R.back);
  backTex.colorSpace = SRGBColorSpace;
  backTex.anisotropy = faceTex.anisotropy;

  const geo = new PlaneGeometry(R.box.w, R.box.h, TUNE.SEG, TUNE.SEG);
  const pos = geo.attributes.position;
  const base = Float32Array.from(pos.array as Float32Array);

  /* alphaTest rather than blending: the letter has to occlude itself where the
     flap folds back over the part still stuck down, and a blended surface with
     depthWrite off cannot. The cutout edge is one texel of a 1.6x raster, which
     at this size is under half a CSS pixel. */
  const faceMat = new MeshStandardMaterial({
    map: faceTex,
    transparent: true,
    alphaTest: 0.45,
    side: FrontSide,
    roughness: 0.84,
    metalness: 0,
  });
  const backMat = new MeshStandardMaterial({
    map: backTex,
    transparent: true,
    alphaTest: 0.45,
    side: BackSide,
    roughness: 0.88,
    metalness: 0,
  });

  const group = new Group();
  const face = new Mesh(geo, faceMat);
  const back = new Mesh(geo, backMat);
  group.add(face, back);

  /* The scar. The letter's own silhouette in the wall's shadow, a hair off the
     wall so it never z-fights it. Unlit — it is meant to read as a mark ON the
     lime, not as an object standing in front of it. */
  const residue = new Mesh(
    new PlaneGeometry(R.box.w, R.box.h),
    new MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: 0x6f8f16,
    }),
  );
  residue.position.z = -0.3;
  group.add(residue);

  /* THE CONTACT SHADOW, and it is a shear rather than a light.
   *
   * The key grazes the wall (LIGHT.Z is tiny, for the reason argued there), so
   * a shadow cast along it would be thrown ten letter-heights sideways — the
   * grade that makes the flat letter read as print makes real shadows useless.
   * So this is a third copy of the same geometry under its own matrix, which
   * flattens z away and slides x and y with it: every point of the flap lands
   * on the wall, displaced in proportion to how far off the wall it was. The
   * part still stuck down has z = 0 and lands exactly under itself, so only the
   * lifted part throws anything.
   *
   * Not quite zero on the z row — a singular matrix is a NaN waiting to happen
   * the first time anything asks this mesh for a normal.
   *
   * BEHIND the wall plane rather than in front of it, and the scar below is
   * there for the same reason: the part of the letter still stuck down is at
   * z = 0 and throws its shadow exactly onto itself, so a shadow drawn in FRONT
   * would darken the flat letter by its own alpha — and the flat letter has to
   * come out at exactly the ink the five DOM letters beside it are set in. */
  const shadow = new Mesh(
    geo,
    new MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      opacity: TUNE.SHADOW.ALPHA,
      depthWrite: false,
      color: 0x0d470c,
    }),
  );
  shadow.matrixAutoUpdate = false;
  group.add(shadow);

  function applyShadow() {
    (shadow.material as MeshBasicMaterial).opacity = TUNE.SHADOW.ALPHA;
    shadow.matrix.set(
      1, 0, TUNE.SHADOW.X, 0,
      0, 1, TUNE.SHADOW.Y, 0,
      0, 0, 1e-4, -0.6,
      0, 0, 0, 1,
    );
  }
  applyShadow();

  scene.add(group);

  const tapeTex = tapeTexture();
  const tape = new Mesh(new PlaneGeometry(1, 1), tapeMaterial(tapeTex, faceTex));
  tape.visible = false;
  scene.add(tape);

  /* EXPLICIT ORDER, because every one of these is in the transparent queue and
     the transparent queue is sorted by distance — which for four near-coplanar
     things a few px apart is a sort on noise. The stacking is a fact about the
     scene, not something to be rediscovered from z each frame:
     shadow and scar on the wall, letter on top of them, film on top of that. */
  shadow.renderOrder = 0;
  residue.renderOrder = 1;
  back.renderOrder = 2;
  face.renderOrder = 2;
  tape.renderOrder = 3;

  let W = 0;
  let H = 0;
  let ghost = false;

  /* The fold's live geometry, kept from the last deform so the hit-testing
     helpers below answer about the frame that is actually on screen. */
  let foldS = 0;
  let tipLocal = new Vector3();

  const dHat = { x: 0, y: 0 };
  const tHat = { x: 0, y: 0 };

  /* The ink, in the plane's own centred coordinates (y up). Everything the
     peel is measured against — the box has padding the glyph does not use. */
  let inkTop = 0;
  let inkBottom = 0;
  let inkW = 0;

  function readInk() {
    inkTop = R.box.h / 2 - R.ink.y;
    inkBottom = inkTop - R.ink.h;
    inkW = R.ink.w;
  }
  readInk();

  function resize() {
    W = Math.max(1, mount.clientWidth);
    H = Math.max(1, mount.clientHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    renderer.setSize(W, H, false);

    camera.aspect = W / H;
    /* One world unit per CSS px at z = 0 — see the note at the top. */
    const distance = H / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.position.set(W / 2, H / 2, distance);
    camera.lookAt(W / 2, H / 2, 0);
    camera.updateProjectionMatrix();

    applyLight();
  }

  /* Re-read every frame so the grade is tunable from the console alongside the
     geometry — three numbers that have to be balanced against each other are
     no use if two of them need a reload. */
  function applyLight() {
    dir.position.set(
      W / 2 + TUNE.LIGHT.X,
      H / 2 + TUNE.LIGHT.Y,
      TUNE.LIGHT.Z,
    );
    dir.intensity = TUNE.LIGHT.POWER;
    amb.intensity = Math.PI * TUNE.LIGHT.AMBIENT;
    dir.target.position.set(W / 2, H / 2, 0);
    dir.target.updateMatrixWorld();
  }

  /** Nail the group to wherever the DOM says the letter is, this frame. */
  function place() {
    const p = placementOf(charEl);
    group.position.set(p.centre.x, H - p.centre.y, 0);
    /* CSS rotation is clockwise-positive against a y-down axis; the world here
       is y-up, so the same turn is the negative angle. */
    group.rotation.z = -p.angle;
    group.updateMatrixWorld();
  }

  /** Local (plane space) → viewport px. */
  const scratch = new Vector3();
  function toScreen(x: number, y: number, z: number) {
    scratch.set(x, y, z);
    group.localToWorld(scratch);
    scratch.project(camera);
    return {
      x: (scratch.x * 0.5 + 0.5) * W,
      y: (1 - (scratch.y * 0.5 + 0.5)) * H,
    };
  }

  function deform(peel: number, thetaDeg: number) {
    const phi = (TUNE.PHI * Math.PI) / 180;
    dHat.x = Math.sin(phi);
    dHat.y = -Math.cos(phi);
    tHat.x = Math.cos(phi);
    tHat.y = Math.sin(phi);

    /* The fold runs from the ink's far corner along dHat and travels back up.
       Measured on the INK so TRAVEL means what it says however much padding
       the box happens to carry. */
    const sTop = inkTop * dHat.y;
    const sBottom = inkBottom * dHat.y;
    const span = sBottom - sTop; // dHat points down, so bottom is the larger s
    const f = sBottom - peel * TUNE.TRAVEL * span;
    foldS = f;

    const r = Math.max(2, TUNE.CURL * R.ink.h);
    const theta = (thetaDeg * Math.PI) / 180;

    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const s = x * dHat.x + y * dHat.y;

      if (s <= f) {
        arr[i] = x;
        arr[i + 1] = y;
        arr[i + 2] = 0;
        continue;
      }

      const t = x * tHat.x + y * tHat.y;
      const { along, out } = curl(s - f, r, theta, TUNE.SAG);
      const sNew = f + along;
      arr[i] = tHat.x * t + dHat.x * sNew;
      arr[i + 1] = tHat.y * t + dHat.y * sNew;
      arr[i + 2] = out;
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    /* The tip: the ink's far point, run through the same chain. Down the middle
       of the letter rather than at a corner — it is where a ring goes, and a
       ring on a corner of a curled flap reads as pointing at nothing. */
    const midT = (inkTop + inkBottom) / 2;
    const tipCentreT = (R.ink.x + R.ink.w / 2 - R.box.w / 2) * tHat.x + midT * tHat.y;
    const tip = curl(sBottom - f, r, theta, TUNE.SAG);
    const tipS = f + tip.along;
    tipLocal.set(
      tHat.x * tipCentreT + dHat.x * tipS,
      tHat.y * tipCentreT + dHat.y * tipS,
      tip.out,
    );
  }

  function frame(seconds: number, peel: number, wobble: number) {
    place();
    applyLight();
    applyShadow();

    const idle = TUNE.IDLE;
    const breathe = wobble * idle.BREATHE * Math.sin(seconds * idle.SPEED * 2 * Math.PI);
    /* A second period at an irrational-ish ratio to the first: the flap is
       never in the same pose twice inside anything a viewer would sit through. */
    const swing = wobble * idle.THETA * Math.sin(seconds * idle.SPEED * 1.37 * Math.PI);

    const p = ghost ? 0 : Math.max(0, Math.min(1, peel + breathe));
    deform(p, TUNE.THETA + swing);

    (residue.material as MeshBasicMaterial).opacity = ghost
      ? 0
      : TUNE.RESIDUE * Math.min(1, p * 1.6);

    renderer.render(scene, camera);
  }

  function foldLine() {
    /* Wider than the ink, and it has to be: both targets now stand off the
       letter, so the strip between them crosses the fold out in the lime where
       a segment stopping at the glyph's edge would have missed it. */
    const half = inkW * 1.9;
    const a = toScreen(tHat.x * -half + dHat.x * foldS, tHat.y * -half + dHat.y * foldS, 0);
    const b = toScreen(tHat.x * half + dHat.x * foldS, tHat.y * half + dHat.y * foldS, 0);
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
  }

  /* BOTH TARGETS STAND OFF THE LETTER, and the reason is that a ring drawn on
     a glyph this size is competing with it: dark ink under a dark ring, on the
     one part of the screen already carrying the most detail. Pushed into the
     lime on either side they have clear ground, and the strip drawn between
     them still crosses the fold — which is the only thing the pick is checking.

     Off the letter's OWN axes rather than off the screen, so they keep their
     relationship to the peel as it breathes rather than swimming about. */
  function flapTip() {
    const out = TUNE.TIP_OUT * R.ink.h;
    return toScreen(
      tipLocal.x + dHat.x * out,
      tipLocal.y + dHat.y * out,
      tipLocal.z,
    );
  }

  /** Up the letter from the fold and on the wall — far enough that a strip
      between the two anchors crosses the fold with room to spare. */
  function wallAnchor() {
    const s = foldS - R.ink.h * TUNE.ANCHOR;
    const t =
      (R.ink.x + R.ink.w / 2 - R.box.w / 2) * tHat.x +
      R.ink.w * TUNE.WALL_OUT;
    return toScreen(tHat.x * t + dHat.x * s, tHat.y * t + dHat.y * s, 0);
  }

  function setTape(
    a: { x: number; y: number } | null,
    b: { x: number; y: number } | null,
    press: number,
    valid: boolean,
  ) {
    if (!a || !b) {
      tape.visible = false;
      return;
    }
    tape.visible = true;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);

    tape.position.set((a.x + b.x) / 2, H - (a.y + b.y) / 2, TUNE.TAPE_Z);
    /* Screen y runs down and the world's runs up, hence the negated angle —
       the same sign correction the letter's own placement makes. */
    tape.rotation.z = -Math.atan2(dy, dx);

    const width = TUNE.TAPE_W * R.ink.w * (0.42 + 0.58 * press);
    /* The slap: the strip lands narrow and springs to width. Scaling the WIDTH
       rather than fading it in is what makes it read as pressed down — a strip
       that arrives at full size has been placed, not stuck. */
    tape.scale.set(len, width, 1);

    const u = (tape.material as ShaderMaterial).uniforms;
    u.uLen.value = len;
    u.uWid.value = width;
    /* The strip's own direction in world, which is what the crown and the
       ripple are measured across and along. */
    u.uAxis.value.set(Math.cos(tape.rotation.z), Math.sin(tape.rotation.z));

    /* And where the letter is standing this frame, so the film knows what it
       is bending. Read off the group rather than cached: the section scrolls. */
    u.uLetterC.value.set(group.position.x, group.position.y);
    u.uLetterR.value.set(
      Math.cos(group.rotation.z),
      Math.sin(group.rotation.z),
    );
    u.uLetterS.value.set(R.box.w, R.box.h);

    /* The key, in the strip's own terms — normalised, and the same one the
       letter is lit by, so the sheen on the film and the sheen on the curl
       agree about where the window is. */
    const L = TUNE.LIGHT;
    const len3 = Math.hypot(L.X, L.Y, L.Z) || 1;
    u.uLight.value.set(L.X / len3, L.Y / len3, L.Z / len3);

    u.uTint.value.copy(srgb(valid ? TUNE.TAPE_TINT : TUNE.TAPE_BAD));
    u.uFilm.value = TUNE.TAPE_ALPHA * (valid ? 0.72 + 0.28 * press : 0.62);
    u.uCrown.value = TUNE.FILM.CROWN;
    u.uRipple.value = TUNE.FILM.RIPPLE;
    u.uRippleLen.value = TUNE.FILM.RIPPLE_LEN;
    u.uRefract.value = TUNE.FILM.REFRACT;
    u.uDisperse.value = TUNE.FILM.DISPERSE;
    u.uSpec.value = TUNE.FILM.SPEC;
    u.uShine.value = TUNE.FILM.SHINE;
    u.uEdge.value = TUNE.FILM.EDGE;
  }

  function setGhost(on: boolean) {
    ghost = on;
  }

  /* The group carries a z rotation and a translation and nothing else, so its
     own z = 0 plane IS the world's — which turns the unproject into one ray/
     plane intersection with no matrix work. */
  function screenToLocal(sx: number, sy: number) {
    scratch.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5);
    scratch.unproject(camera);
    const o = camera.position;
    scratch.sub(o);
    const k = -o.z / scratch.z;
    scratch.multiplyScalar(k).add(o);
    group.worldToLocal(scratch);
    return { x: scratch.x, y: scratch.y };
  }

  function localToScreen(x: number, y: number) {
    return toScreen(x, y, 0);
  }

  function dispose() {
    renderer.dispose();
    geo.dispose();
    faceTex.dispose();
    backTex.dispose();
    tapeTex.dispose();
    faceMat.dispose();
    backMat.dispose();
    (shadow.material as MeshBasicMaterial).dispose();
    residue.geometry.dispose();
    (residue.material as MeshBasicMaterial).dispose();
    tape.geometry.dispose();
    (tape.material as ShaderMaterial).dispose();
    renderer.domElement.remove();
  }

  resize();

  /* Live tuning, the way the roll and the note do it. Dev nicety; nothing
     reads it back. */
  (window as unknown as { peelLab: unknown }).peelLab = { TUNE, COLOUR };

  return {
    frame,
    resize,
    flapTip,
    foldLine,
    wallAnchor,
    setTape,
    setGhost,
    screenToLocal,
    localToScreen,
    dispose,
  };
}
