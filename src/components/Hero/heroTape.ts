/* The hero's dispensing roll.
 *
 * Same arrangement as the slider's key visual (tape3d.ts): everything
 * three-specific lives here, the engine imports it dynamically after mount so
 * three ships as its own chunk, and until that resolves — or if it never does —
 * the section is type and colour, which are already on screen.
 *
 * The split with engine.ts is scroll vs scene. The engine knows where the page
 * is and hands over two numbers: how far the roll has turned side-on, and how
 * much tape has been paid out in document px. Everything past that — the px to
 * world conversion, the spin the length implies, the material — is in here.
 *
 * Named imports rather than `import * as THREE`: the namespace object keeps the
 * whole library reachable, so the chunk carries every loader and helper whether
 * or not it is used.
 */
import {
  AmbientLight,
  Box3,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const FOV = 35;
const DEG = Math.PI / 180;
const DPR_CAP = 2;
/* The canvas runs the full section, which is far taller than it is wide. Cap
   the drawing buffer's height so a retina screen cannot push it past the
   texture limit real GPUs enforce. */
const MAX_BUFFER = 4096;

/* Resting pose and camera. rotY is not here: the yaw is the scroll's to drive,
   so its rest and end angles live with the choreography in engine.ts.
   Live-tweak in dev: hero.CONFIG.camZ = 2.2; hero.tune() */
export const CONFIG = { rotX: 0, rotZ: 0, camZ: 1.95 };

/* The dispensed strip. RADIUS matches the model (0.5 in its units) so paid-out
   length equals spin angle x radius — the two never slip. */
export const STRIP = {
  RADIUS: 0.5,
  ROLL_W: 0.472, // the model's axial length, from its bounds
  WIDTH: 0.838, // multiplier on the visually-matched width; 1 = flush,
  // held under it so the strip reads as tape, not as wider than its roll.
  // On-screen width is ROLL_W * WIDTH * mountW / (2 * (camZ - RADIUS) * tan(FOV/2)),
  // so at the 1440 design width one unit of WIDTH is ~253px: 0.004 ~= 1px.
  COLOR: 0xc08a49, // pre-load fallback only — the roll's own wound-side
  // colour is copied over it once the model arrives
  /* How many times the film's own pattern repeats per world unit of tape.
   *
   * This is what stops the strip reading as an extrusion. The maps are tiled
   * along the tape by this against the paid-out length rather than left at 1:
   * at 1 a single copy of the pattern is smeared over however much tape is out,
   * so the strip is the same cross-section stretched further and further and
   * the growth shows nothing new. Tiled, the pattern holds its real size and is
   * anchored at the free end, so tape gains new pattern AT THE ROLL — material
   * coming out, rather than a shape getting longer.
   *
   * Low on purpose. It sets the tile's length (1/GRAIN world units, ~700px at
   * the design width), and the tile is what eventually comes round again: at
   * 1.5 the same stretch of film repeats a dozen times over a full tape, which
   * the eye reads as wallpaper. At 0.45 it is about three, which reads as
   * material. Live-tweak in dev: hero.STRIP.GRAIN = 0.8; hero.tune() */
  GRAIN: 0.3,
};

/* The free end — a tear.
 *
 * A flat edge reads as a rectangle; a torn one reads as tape, and it is the
 * clearest such signal on the strip, because the roll turns side-on and the end
 * is seen square on.
 *
 * SEGMENTS is high on purpose. A tear is irregular at every scale at once, and
 * the giveaway that it is not one is being able to count the facets — at 180 a
 * segment is about a pixel wide at the design size, so the line reads as a
 * silhouette rather than as geometry.
 *
 * DEPTH is in world units and the profile never exceeds it, so the tape's
 * furthest point stays exactly where the engine asked for it: the tear eats
 * INTO the length rather than adding to it, and the chase line still lands on
 * END_GAP.
 *
 * Live-tweak in dev: hero.END.ROUGH = 0.8; hero.tune()  (tune re-tears it) */
export const END = {
  DEPTH: 0.09, // ~16px at the 1440 design width, against a ~213px width
  SEGMENTS: 180, // resolution across the width
  ROUGH: 0.82, // 0 is a soft wandering edge, 1 is a hard rip
};

/* Key light high and to the LEFT, slightly in front — the sheen.
 *
 * POWER and AMBIENT are two ends of one balance, and it is the balance rather
 * than either number that decides whether the tape looks lit or looks printed.
 * Ambient light arrives from every direction at once, so it carries no shading
 * and no highlight: it is flat by definition. Raise it and every surface trends
 * toward its own flat albedo — which is exactly the "flat and full" read. The
 * two are set here so the key carries about 40% of the light on a
 * camera-facing surface, against roughly 20% before.
 *
 * AMBIENT is in units of pi, where 1 means an unlit surface leaves the renderer
 * at its texture's own colour. Live-tweak in dev: hero.LIGHT.POWER = 3;
 * hero.tune() */
export const LIGHT = { X: -1.5, Y: 5, Z: 2.5, POWER: 3.5, AMBIENT: 0.66 };

/* The face's own key — the kicker.
 *
 * The roll's FACE cannot be lit by the light above, and no amount of GLOSS or
 * METAL can change that. The face is a flat disc whose normal runs from
 * (sin35, 0, cos35) at rest to (1, 0, 0) side-on, so it points into the RIGHT
 * half of the scene for the entire sequence, and the direction it mirrors
 * toward the camera is about (0.94, 0, 0.34) — right and level. The key sits
 * left and high, some 98 degrees away from that. The face's specular therefore
 * lands three orders of magnitude below the lobe's peak at GLOSS 0.42 and
 * nearly four at 0.3 — tightening the lobe only misses harder. Worse, by
 * the time the roll is side-on the key's N.L has gone NEGATIVE and the face is
 * lit by ambient alone — which carries no highlight by definition (see
 * AMBIENT above), and is why the artwork could only ever be tuned brighter,
 * duller or more saturated, never glossier.
 *
 * So this one is aimed at the face's mirror direction instead, lifted about 35
 * degrees above it. Two things follow from that placement:
 *
 * The highlight is a real arc rather than a wash, because it peaks where the
 * domed normals (FILM.DOME) tilt into the half-vector — a ring at roughly 3/4
 * of the disc's radius, up and to the right.
 *
 * And it SLIDES. The mirror direction sweeps away as the roll turns side-on,
 * so the sheen travels across the label and off it. A highlight that moves
 * when the surface turns is the whole read: a fixed one is printed on.
 *
 * Elevation is the other half of the placement, because three filters lights
 * by camera layers only — there is no per-object scoping, so this one falls on
 * the strip and the wound side too. Their normals lie in the xz plane, so
 * carrying the light's energy in Y keeps most of it off them while the face's
 * dome still catches it. What does reach the strip is a second, softer sheen
 * band on its right — the side the key leaves dark. Drop POWER to 0 to see
 * what it is contributing.
 *
 * POWER is set against FILM.COAT_GLOSS rather than on its own: the coat's peak
 * scales as 1/roughness^4, so the two have to come down together or the
 * highlight clips to white long before it looks bright. Live-tweak in dev:
 * hero.FACE_LIGHT.POWER = 2; hero.tune() */
export const FACE_LIGHT = { X: 2.7, Y: 2.0, Z: 1.0, POWER: 0.3 };

/* The film's finish — shared by the roll's face, its wound side and the
   dispensed strip, so the key light draws one continuous material across all
   three rather than three surfaces that happen to be adjacent.

   Live-tweak in dev: hero.FILM.SAT = 1.5; hero.tune() */
export const FILM = {
  /* Base roughness, which the mottle map multiplies — so it sits higher than a
     flat value would. Against MOTTLE at 0.5 the map runs 0.47-0.97, which puts
     the effective roughness at about 0.21-0.44. Lower is a tighter, brighter,
     sharper highlight; higher is broader, dimmer and more matte.

     Raised from 0.3, where the film was reading as slick — a GGX lobe's peak
     goes as 1/roughness^4, so the clear coat GLAZE added below was landing on
     an already tight base and the two compounded into plastic. The coat's own
     roughness went up with it, for the same reason and by the same feel: they
     are one surface and want to move together.

     Live-tweak in dev: hero.FILM.GLOSS = 0.6; hero.tune() */
  GLOSS: 0.44,
  /* How uneven the film is, and it is the one knob to reach for if the surface
     is reading as PATTERNED rather than as material.
   *
   * MOTTLE is the full spread of the roughness map about its own middle, so it
   * is what decides whether the gloss wanders visibly across the tape or
   * barely at all. MOTTLE_TINT is the same thing on the colour map and is tiny
   * by comparison — the map is near white so the roll's own colour keeps
   * authority; it only stops the albedo being mathematically uniform.
   *
   * Both go to ZERO cleanly. At 0 the maps are flat and the film is a single
   * even surface again, lit only by the lights and the curl — which is worth
   * looking at before deciding what the mottle should be doing.
   *
   * Live-tweak in dev: hero.FILM.MOTTLE = 0.2; hero.tune() — tune() rebuilds
   * both maps, unlike the streak maps this replaced, which needed a reload. */
  MOTTLE: 0.5,
  MOTTLE_TINT: 0.07,
  /* The film's TOOTH — how deep its micro-relief reads. See toothTex.
   *
   * The knob to reach for when the surface wants to be ROUGHER rather than
   * duller, and the two are not the same request. GLOSS spreads the highlight,
   * which takes gloss away and adds nothing; this puts real slope on the
   * surface, so the key breaks up across it and the tape reads as a material
   * with a weave instead of a tint with a sheen.
   *
   * It rides on the material's normalScale rather than being baked into the
   * map, so it is a uniform: this one lands on the next frame with no texture
   * to re-cut and no recompile. 0 is dead flat.
   *
   * It also buys SHINE, which is the trap and is why it came down from 0.85.
   * Relief does not only break the key up, it turns one broad highlight into a
   * field of small bright ones — every bump has a facet pointing at the light —
   * and past about half of this the tape stops reading as textured and starts
   * reading as glittery. GLAZE came down with it for the same reason: a coat is
   * a second specular over the top of all those facets.
   *
   * Live-tweak in dev: hero.FILM.TOOTH = 1.4; hero.tune() */
  TOOTH: 0.15,
  /* Exposure on the FILM — the wound side and the strip, never the label. The
     exact counterpart of FACE below, and it exists for the same reason that
     one does: the two surfaces are lit by one set of lights, so without a knob
     apiece the only way to darken either is to darken both.
   *
     Under 1 because dropping METAL to near nothing handed the diffuse back all
     the light metalness had been taking out of it — which is the correction it
     was there to make, but it landed as a brighter roll rather than a fuller
     one. This takes that back without touching the sheen sitting on top of it:
     GLAZE's coat reflects the same white whatever the albedo underneath does,
     so albedo down is highlight contrast UP.
   *
     Applied against each material's ORIGINAL colour rather than its current
     one, so tuning it repeatedly sets the exposure instead of compounding it —
     the same arrangement FACE has.
   *
     Live-tweak in dev: hero.FILM.TONE = 0.7; hero.tune() */
  TONE: 0.82,
  /* Near zero, and it used to be 0.25 — the same correction the face made, a
     surface late.
   *
   * A dielectric reflects about 4% head-on, which under a bright ambient is too
     little to see, and metalness is the obvious way to buy more of it. It is
     also the wrong way, for the two reasons FACE_METAL sets out below: it TINTS
     the reflection with the surface's own colour, so brown tape gets a brown
     sheen rather than a white one, and it takes the same light back out of the
     diffuse, so the colour darkens by exactly as much as the highlight
     brightens. The wound side has been paying that on 0.25 while the face
     stopped paying it at 0.1.
   *
     GLAZE below is what replaces it. Raise this again only to make the film
     look like foil. */
  METAL: 0.03,
  /* The film's clear coat — the same second lobe the face wears (COAT), on the
     wound side and the strip.
   *
   * This is what tape actually is: a coloured backing under a smooth
   * transparent skin. A clearcoat is a white specular layer over the diffuse,
   * unaffected by the albedo, by SAT and by PUNCH — so it brightens the sheen
   * without touching the colour, which is precisely what METAL could not do.
   *
   * GLAZE_GLOSS is its roughness, and the warning on COAT_GLOSS applies here
   * word for word: a GGX lobe's peak goes as 1/roughness^4, so tightening this
   * is not a linear brightening and anything much under 0.15 will clip to a
   * white blob. That fourth power is also why it moves WITH GLOSS rather than
   * being set once: a sharp coat over a matte base is not a rougher surface,
   * it is a wet one. It sits looser than the face's coat on purpose — the
   * label is pressed flat and the film is not.
   *
   * If raising both leaves the film too dull rather than too rough, GLAZE is
   * the compensation — more coat at the same roughness, rather than a tighter
   * coat, which is the change that would take the roughness back out.
   *
   * Live-tweak in dev: hero.FILM.GLAZE = 0.7; hero.tune() */
  GLAZE: 0.18,
  GLAZE_GLOSS: 0.18,
  /* The extrusion grain, 0..1 — the film's specular stretched along one axis.
   *
   * Tape is extruded, and an extruded surface is not equally rough in every
   * direction: its microscopic grooves run the way the film was drawn, so the
   * slope varies ACROSS the grooves and barely at all along them. The specular
   * lobe spreads in the direction the slope varies, which is why a brushed or
   * drawn surface throws a highlight running square across its own grain
   * rather than a round one — the same reason a record's highlight is a radial
   * streak across its circular grooves.
   *
   * Which is the one thing a roughnessMap cannot fake. The mottle map varies
   * HOW GLOSSY the surface is from place to place; this varies what SHAPE the
   * gloss is, and it keeps that shape correct as the roll turns side-on, which
   * a map baked at one angle cannot. It is also not a line: it broadens the
   * highlight across the tape rather than drawing anything on it.
   *
   * The direction is not a taste knob and is not here: it follows from each
   * surface's own unwrap, and is worked out at TURN_STRIP / TURN_WOUND below.
   *
   * At 0 the whole feature is compiled out. Live-tweak in dev:
   * hero.FILM.STRETCH = 0.8; hero.tune() */
  STRETCH: 0.55,
  /* Saturation and contrast, applied to a map the moment it is sampled.
   *
   * These two are the FILM — the wound side and the dispensed strip, which are
   * one continuous surface and have to be graded as one. The roll's face has
   * its own pair (FACE_SAT / FACE_PUNCH below) because it is a printed label
   * rather than tape, and the two want different things: the film is a colour
   * carrying a sheen, the artwork is ink.
   *
   * Contrast is about mid grey, and small numbers go a long way; 1.25 is a
   * lot. */
  SAT: 0.57,
  PUNCH: 1.6,
  /* Exposure on the roll's FACE alone — the artwork, not the wound side or the
     strip. It scales the texture on its way in, so nothing else in the scene
     moves, and the face's own shading is untouched.

     It sits well under 1 now, and that is deliberate rather than a darkening.
     A dielectric's specular does not scale with albedo — the clear coat below
     reflects the same white whatever the artwork underneath is doing — so
     albedo down plus light up RAISES the highlight's contrast against the
     surface it sits on, which is the difference between a glossy label and a
     bright one. The two move together: drop this and raise FACE_LIGHT.POWER
     for more sheen, do the reverse for a flatter, fuller face. Above roughly
     1.15 the artwork's brightest parts clip, and clipped channels drift toward
     white — which costs the saturation FACE_SAT is there to add. */
  FACE: 0.6,
  /* The face's own saturation and contrast — the same two operations as SAT
     and PUNCH above, on uniforms of their own, so the printed label can be
     graded without dragging the wound side and the strip along with it.
   *
   * They start at the film's values, which is not laziness: it is what makes
   * the split cost nothing to have. Leave them alone and the face is graded
   * exactly as it was when there was one pair for everything; the moment the
   * artwork wants to be richer or flatter than the tape it is wound on, this
   * is where that is said.
   *
   * FACE_PUNCH is the one to be careful with, for the reason FILM.FACE gives:
   * contrast pushes the brightest ink toward clipping, and a clipped channel
   * drifts white — which takes the saturation straight back out. Raising this
   * usually wants FACE pulled down a little to make room.
   *
   * Live-tweak in dev: hero.FILM.FACE_SAT = 1.1; hero.tune() */
  FACE_SAT: 0.79,
  FACE_PUNCH: 1.4,
  /* The face's own finish. The artwork is under a coat of clear film, and none
     of these four touch the wound side or the strip.

     FACE_METAL is near zero on purpose — it replaces METAL's job here. Raising
     metalness is the wrong way to buy reflectance on a dielectric: it TINTS
     the highlight with the artwork's own colour and takes the same light away
     from the diffuse, so the face goes grey and dark exactly as it gets shiny.
     That is the trade this scene kept running into.

     COAT is the right tool instead — a second specular lobe layered over the
     diffuse, white and unaffected by SAT, PUNCH or the albedo, which is
     literally what a coat of clear plastic over a printed label is. COAT_GLOSS
     is its roughness, and it wants to be a little tighter than the base
     FACE_GLOSS so the two read as a reflection sitting on a broader sheen
     rather than as one smear.

     But only a little, and this is the knob to be careful with, because a GGX
     lobe's peak goes as 1/roughness^4: at 0.28 the density peaks near 52, at
     0.1 near 3200. The second one is not a harder glint, it is a blown one —
     roughly 60x display white, which clips to a flat white blob and takes the
     artwork under it with it. Anything under about 0.2 here needs FACE_LIGHT's
     POWER pulled down to match, and past that the highlight stops being a
     sheen and starts being a hole.

     Live-tweak in dev: hero.FILM.COAT_GLOSS = 0.22; hero.tune() */
  FACE_GLOSS: 0.14,
  FACE_METAL: 0.1,
  COAT: 0.3,
  COAT_GLOSS: 0.18,
  /* The face's fake dome, in radians at the rim — the flat-disc problem, and
     the exact counterpart of CURL below.
   *
   * Getting a light onto the face is only half of it. A flat disc has ONE
   * normal over its whole area, so every term of the shading is constant
   * across it and the specular resolves to a single value — a uniform wash the
   * eye reads as exposure, not as gloss. Sheen is a GRADIENT: a bright region
   * with a falloff. Without one, a correctly lit flat face still just looks
   * brighter, which is the second half of why the knobs never worked.
   *
   * So the face's normals are fanned radially outward, as if the label were
   * very slightly domed — which a wound roll's face genuinely is. The normal
   * then sweeps through the half-vector on a ring, and that ring is the
   * highlight arc. Normals only: not one vertex moves, so the roll's
   * silhouette and the artwork's registration are exactly as exported.
   *
   * DOME_BIAS shapes where the ring sits. At 1 the tilt grows linearly with
   * radius; above it the middle of the disc stays flatter and the curve piles
   * up near the rim, which pushes the arc outward and tightens it. */
  DOME: 1.3,
  DOME_BIAS: 0.5,
  /* How far the strip's normals fan across its width, in radians.
   *
   * The strip is a flat plane facing the camera, and a flat plane under a
   * directional light shades to ONE value over its whole area — the normal
   * never changes, so nor does the shading, however long the tape gets. That is
   * why the dispensed length has no sheen of its own to speak of.
   *
   * Fanning the normals across the width says the tape has a slight cross-curl,
   * which real tape always does. The normal then sweeps through the light's
   * half-vector exactly once across the width, and where it does there is a
   * highlight — running the entire length, and growing with it, for no extra
   * light and no extra geometry. The silhouette is untouched: the normals move,
   * the vertices do not, so the carefully matched width still holds.
   *
   * The mesh's own scale.x (~0.67) amplifies the tilt by about 1.5x on its way
   * through the normal matrix; the number below is the pre-amplification one. */
  CURL: 0.6,
};

export type HeroTape = {
  /** Yaw in degrees; tape paid out, in document px. */
  /** cutPx severs the strip that far below the roll's centre: everything above
      the cut is gone (the tail, rewinding home), everything below stays put.
      settle 0..1 is the roll's wind-down — it eases the spin to the nearest
      whole turn so the label lands upright, exactly as it started. */
  pose(yawDeg: number, lenPx: number, cutPx?: number, settle?: number): void;
  /** Re-read the mount's box and reframe. */
  resize(): void;
  /** Render, but only if pose() or resize() changed something. */
  draw(): void;
  /** Re-apply CONFIG and LIGHT and recut the end after a live tweak. Dev only. */
  tune(): void;
  dispose(): void;
};

/* The film's unevenness — the anti-flat trick, and NO LINES ANYWHERE.
 *
 * A colour map alone still shades evenly under a directional light; it is the
 * roughnessMap that varies the gloss across the surface, so the key lands as
 * patches of sheen rather than one even wash. The same map goes on the wound
 * side and the strip, so the two read as one continuous film.
 *
 * This used to draw hundreds of soft-ended RUNS, which is what a drawn film
 * really carries and which read on screen as ruled lines — the map's marks
 * were legible AS MARKS, and doubly so once the film gained a clear coat, since
 * a glossier surface reads its own roughness variation harder. Summed value
 * noise instead: the same job with nothing in it that has a direction.
 *
 * ISOTROPIC ON PURPOSE, and it is what lets both surfaces share one call. The
 * old map had to know which way it was being applied — the wound side's length
 * is a circumference, so a mark that stopped was a mark that came round again,
 * while the strip needs events ALONG its length or paying more out is just the
 * same inch stretched further. Noise varies in both axes by construction, so
 * neither surface has a direction to be told about and the strip gains new
 * pattern at the roll for free.
 *
 * Four octaves, each a grid that WRAPS, so the sum tiles seamlessly — which it
 * has to, because STRIP.GRAIN lays several copies down a full tape. */
/* One octave: an n x n grid of random values, smoothstepped between and indexed
   modulo n so the far edge samples the near one. The two-dimensional version of
   band() below, and wrapping for the same reason — a sum of these has no seam,
   which is what lets STRIP.GRAIN lay several copies down a full tape. */
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

/* Sum a set of octaves into a 0..1 field with a mean near 0.5. */
function fieldOf(bands: readonly (readonly [number, number])[]) {
  const waves = bands.map(([n, amp]) => ({ amp, at: octave(n) }));
  const total = waves.reduce((sum, w) => sum + w.amp, 0);
  return (x: number, y: number) =>
    waves.reduce((sum, w) => sum + w.amp * w.at(x, y), 0) / total;
}

function mottleTex(base: number, amp: number, srgb: boolean, aniso: number) {
  /* Small, unlike the 1024 the runs needed. The finest octave here has a
     41-cell grid, so a 256px map is already six pixels per cell — past that
     the canvas is storing an interpolation it could have computed. */
  const S = 256;

  /* Falling amplitude over rising frequency — the broad unevenness of the
     coating, then the grain within it. The coarsest is deliberately very
     coarse: three cells across the map is one slow swell over the whole tile,
     which is what keeps the tile from announcing itself. */
  const at = fieldOf([
    [3, 1],
    [7, 0.5],
    [17, 0.26],
    [41, 0.13],
  ]);

  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // The field has a mean near 0.5, so `amp` is the full spread about `base`.
      const v = base + (at(x / S, y / S) - 0.5) * amp;
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
  if (srgb) tex.colorSpace = SRGBColorSpace; // colour maps only
  tex.anisotropy = aniso;
  return tex;
}

/* The film's TOOTH — micro-relief, as a tangent-space normal map.
 *
 * This is the part roughness cannot do. Roughness says how WIDE the highlight
 * is, so pushing it up makes a surface duller and never grainier — the light
 * still arrives evenly, it just spreads. Tooth is the other thing: real relief,
 * so the surface catches the key at slightly different angles a pixel apart and
 * the eye reads texture instead of a tint. It is what separates crepe-backed
 * tape, which has a weave you can see, from cling film.
 *
 * Much finer than the mottle. That map is the coating's slow unevenness, tens
 * of cells across a tile; this starts where that one stops and runs down to a
 * grid finer than the map is wide, so it survives being tiled several times
 * over a full tape and still reads as a surface rather than as lumps.
 *
 * A HEIGHT FIELD DIFFERENCED, rather than noise written into the channels
 * directly. RGB noise is not a normal map — its vectors point nowhere in
 * particular and the lighting comes out as coloured static. Central differences
 * off a scalar height give slopes that are consistent with their neighbours,
 * which is what makes a lit bump look like a bump.
 *
 * Amplitude is NOT baked in: the slope gain here is fixed and FILM.TOOTH rides
 * on the material's normalScale, so the depth is a live uniform rather than a
 * texture to re-cut. */
function toothTex(aniso: number) {
  const S = 256;
  const at = fieldOf([
    [23, 1],
    [53, 0.62],
    [113, 0.36],
    [211, 0.2],
  ]);

  // The height field, sampled once and reused — the difference below reads each
  // texel four times, and recomputing four octaves for each of those is 16x the
  // work for the same number.
  const h = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) h[y * S + x] = at(x / S, y / S);
  }

  /* Slope per texel, then a fixed gain. GAIN sets what a unit of height means
     against a texel's width — the map's inherent steepness, with normalScale
     free to be the artistic dial on top. High enough that TOOTH lands near 1
     for a plainly textured tape, so the knob reads as 0..1 rather than 0..0.05. */
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
      // Tangent space: +x right, +y up the texture, +z out of the surface. The
      // slopes are negated because a surface rising to the right tilts LEFT.
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
  // No colorSpace: a normal map is a vector, and decoding it as sRGB would bend
  // every one of those vectors toward the surface.
  tex.anisotropy = aniso;
  return tex;
}

/* One band of value noise: n random values around the width, smoothstepped
   between, wrapping at the ends so a sum of bands has no seam. */
function band(n: number) {
  const v = Array.from({ length: n }, () => Math.random());
  return (t: number) => {
    const x = t * n;
    const i = Math.floor(x) % n;
    const f = x - Math.floor(x);
    const a = v[i];
    const b = v[(i + 1) % n];
    return a + (b - a) * f * f * (3 - 2 * f);
  };
}

/* The tear line, as a 0..1 depth for any point across the width.
 *
 * Bands of noise summed at falling amplitude — the same trick as mottleTex, in
 * one dimension. This is the part a regular serration cannot fake: a
 * real tear wanders across the whole width, breaks into bites within that, and
 * frays within those, and it is having all three at once that makes it read as
 * torn rather than as a pattern. */
function tearProfile() {
  const bands = [
    [2, 1], // which side of the tape the tear runs deep
    [5, 0.62], // the long swings
    [13, 0.34], // bites
    [31, 0.19], // nicks
    [73, 0.1], // fray
  ] as const;
  const waves = bands.map(([n, amp]) => ({ amp, at: band(n) }));
  const total = waves.reduce((sum, w) => sum + w.amp, 0);

  return (t: number) => {
    const f = waves.reduce((sum, w) => sum + w.amp * w.at(t), 0) / total;
    /* Folding the wave at its midline turns every crossing into a crease. That
       is the difference between a line that rolls and a line that was ripped:
       smooth noise alone gives soft scallops, however much of it you stack. */
    const ridged = Math.abs(f * 2 - 1);
    const mixed = Math.min(1, Math.max(0, f + (ridged - f) * END.ROUGH));
    // Biased shallow, so the deep bites are occasional rather than the average.
    return mixed ** (1 + END.ROUGH * 0.8);
  };
}

/* The tear, as a strip of quads.
 *
 * Geometry rather than an alpha map: the silhouette is the whole point, and a
 * cutout would have to be alpha-tested — which stair-steps on a diagonal, and
 * every edge of a tear is a diagonal. Real edges get the renderer's MSAA free.
 *
 * Spans x -0.5..0.5 and y -DEPTH..0, so it takes the strip's own scale.x and
 * hangs off the bottom edge unstretched.
 *
 * vRow is which row of the strip's texture the cap carries — 0 for the free
 * end's cap (the body's last row carried on down), 1 for the cut's cap at the
 * top, which must continue the strip's FIRST row upward instead. */
function tearGeometry(vRow = 0) {
  const n = Math.max(8, Math.round(END.SEGMENTS));
  const depthAt = tearProfile();

  const cut: number[] = [];
  for (let i = 0; i <= n; i++) cut.push(-END.DEPTH * depthAt(i / n));

  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  const vert = (x: number, y: number) => {
    pos.push(x, y, 0);
    // The same cross-curl as the strip it ends, so the lengthwise sheen runs
    // through the tear rather than stopping dead at the join.
    const a = FILM.CURL * x * 2;
    nor.push(Math.sin(a), 0, Math.cos(a));
    /* u across the width, v pinned to 0 — the strip's own coordinate at the
       join, since the body is anchored there. So the cap is the body's last row
       carried on down: whatever the mottle is doing at the join carries into
       the tear instead of stopping at it, and it does so at any length.

       Not v up the tear, which is what this was. The cap shares the strip's
       textures, and those are now tiled along the tape — a v spanning 0..1
       would pull the whole tile into the tear's 16px and pack tighter the
       longer the tape got, which is the one place on the strip that must not
       look like it is being squeezed. */
    uvs.push(x + 0.5, vRow);
  };

  for (let i = 0; i < n; i++) {
    const x0 = -0.5 + i / n;
    const x1 = -0.5 + (i + 1) / n;
    // Wound counter-clockwise seen from +z, matching the normals above.
    vert(x0, 0);
    vert(x0, cut[i]);
    vert(x1, cut[i + 1]);
    vert(x0, 0);
    vert(x1, cut[i + 1]);
    vert(x1, 0);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  return geo;
}

/* Fan a flat sheet's normals across its width — see FILM.CURL. Only the normals
   change, so the mesh keeps its exact silhouette; the two columns of a
   single-segment plane are enough, because the fragment stage interpolates
   between them and renormalises, which is the sweep we are after. */
function curlNormals(geo: BufferGeometry) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const a = FILM.CURL * pos.getX(i) * 2; // x spans -0.5..0.5
    nor.setXYZ(i, Math.sin(a), 0, Math.cos(a));
  }
  nor.needsUpdate = true;
}

/* The face's dome, held with the normals it arrived from the export with — see
   FILM.DOME. The curve is re-applied against those rather than against the
   current values, so tuning it sets the dome instead of compounding it (the
   same reasoning as FILM.FACE). */
type Dome = { geo: BufferGeometry; flat: Float32Array };

/* Fan a disc's normals radially outward from its own centre.
 *
 * The axis is taken from each vertex's OWN exported normal rather than from one
 * averaged over the mesh, which costs nothing and means the export can put the
 * artwork on whichever axis it likes — and that a mesh carrying both the front
 * and the back disc gets each one domed outward from its own face instead of
 * the two cancelling. The radial direction is then the vertex's offset from the
 * centre with its axial part removed, so it lies in the disc's own plane
 * whatever that plane is. */
function applyDome({ geo, flat }: Dome) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  geo.computeBoundingSphere();
  const c = geo.boundingSphere!.center;

  const p = new Vector3();
  const n = new Vector3();
  const r = new Vector3();
  const radial = (i: number) => {
    p.fromBufferAttribute(pos, i).sub(c);
    n.set(flat[i * 3], flat[i * 3 + 1], flat[i * 3 + 2]);
    return r.copy(p).addScaledVector(n, -p.dot(n)); // p flattened into the face
  };

  // The rim, so the tilt can be expressed as a fraction of the disc's radius
  // and DOME means the same thing whatever units the export is in.
  let rim = 0;
  for (let i = 0; i < pos.count; i++) rim = Math.max(rim, radial(i).length());
  if (rim < 1e-6) return; // not a disc — nothing to dome

  for (let i = 0; i < pos.count; i++) {
    const rad = radial(i).length();
    if (rad > 1e-6) {
      const a = FILM.DOME * (rad / rim) ** FILM.DOME_BIAS;
      r.divideScalar(rad); // unit, and in the disc's plane
      n.multiplyScalar(Math.cos(a)).addScaledVector(r, Math.sin(a)).normalize();
    }
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  nor.needsUpdate = true;
}

/* The artwork, moved onto a material that can carry a clear coat — see
   FILM.COAT. three's GLTF loader builds MeshStandardMaterial, and copy() does
   not run safely in this direction (physical reads fields standard has none of
   and would take undefined for), so the export's maps and colour are carried
   across by hand. Only what this export actually uses. */
function toPhysical(src: MeshStandardMaterial) {
  const mat = new MeshPhysicalMaterial({
    name: src.name,
    color: src.color.clone(),
    map: src.map,
    normalMap: src.normalMap,
    aoMap: src.aoMap,
    roughnessMap: src.roughnessMap,
    metalnessMap: src.metalnessMap,
    emissive: src.emissive.clone(),
    emissiveMap: src.emissiveMap,
    side: src.side,
    transparent: src.transparent,
    opacity: src.opacity,
    alphaTest: src.alphaTest,
    /* Not carried over, and it must not be: flat shading discards the vertex
       normals in favour of the triangle's own, which would throw the dome away
       — the whole trick is that the normals disagree with the geometry. */
    flatShading: false,
  });
  mat.normalScale.copy(src.normalScale);
  return mat;
}

/* Which way the film's grain runs on each surface, as a rotation off that
 * surface's own U axis — see FILM.STRETCH. three takes the anisotropy
 * direction as the ROUGH axis, and the rough axis of a drawn film is ACROSS
 * the direction it was drawn in. So both of these are "a quarter turn off the
 * length", and they differ only because the two unwraps disagree about which
 * way the length runs.
 *
 * The strip is a PlaneGeometry: u across the width, v down the length. The
 * length is v, so the rough axis is u — the tangent itself, no turn.
 *
 * The wound side comes off Blender's cylinder unwrap, whose U runs around the
 * circumference. On a roll the circumference IS the tape's length, so there
 * the rough axis is v: a quarter turn.
 *
 * Neither surface carries a tangent attribute, so three derives the frame from
 * the UV derivatives (getTangentFrame). That is why these are stated against
 * the unwrap rather than against the world. */
const TURN_STRIP = 0;
const TURN_WOUND = Math.PI / 2;

/* The film's finish — the part of it that needs a physical material. Kept
   apart from applyFilmLook for the same reason applyFaceLook is: that one is
   the GRADE, which every surface shares, and this is the SURFACE, which the
   face and the film disagree about. Runs after it, since that one sets
   roughness and metalness from the shared knobs. */
function applyFilmFinish(mat: MeshPhysicalMaterial, turn: number) {
  mat.clearcoat = FILM.GLAZE;
  mat.clearcoatRoughness = FILM.GLAZE_GLOSS;
  mat.anisotropy = FILM.STRETCH;
  mat.anisotropyRotation = turn;
  /* The tooth's depth. A uniform, not part of the map — which is why this can
     sit here with the rest of the finish rather than forcing a re-cut. */
  mat.normalScale.set(FILM.TOOTH, FILM.TOOTH);
}

/* The face's finish, kept apart from applyFilmLook's so the artwork can be
   glossier and far less metallic than the wound side and the strip. Runs after
   it, since that one sets roughness and metalness from the shared knobs. */
function applyFaceLook(mat: MeshPhysicalMaterial) {
  mat.roughness = FILM.FACE_GLOSS;
  mat.metalness = FILM.FACE_METAL;
  mat.clearcoat = FILM.COAT;
  mat.clearcoatRoughness = FILM.COAT_GLOSS;
}

/* Saturation and contrast, as a patch on the standard shader.
 *
 * The artwork's colour lives in the model's texture, and a material's `color`
 * can only scale it — scaling white light makes a texture brighter, never more
 * saturated. Pulling the sampled colour away from its own luminance is the
 * operation that actually saturates, and it has to happen where the texture is
 * read, which means in the shader.
 *
 * Fed from uniforms rather than baked into the source so a dev tweak takes
 * effect on the next frame instead of forcing a shader recompile.
 *
 * TWO SETS OF THEM, one per surface family — see FILM.FACE_SAT. The patched
 * SOURCE is identical either way, which is the point: three keys its program
 * cache on the shader text, so both families compile once between them and
 * share the result, while the uniforms are bound per material and so stay
 * independent. A second grade costs no second program. */
type Look = { uSat: { value: number }; uPunch: { value: number } };

const filmLook: Look = {
  uSat: { value: FILM.SAT },
  uPunch: { value: FILM.PUNCH },
};

/* The roll's face. Its own object, so writing to one never moves the other. */
const faceLook: Look = {
  uSat: { value: FILM.FACE_SAT },
  uPunch: { value: FILM.FACE_PUNCH },
};

function applyFilmLook(mat: MeshStandardMaterial, look: Look = filmLook) {
  mat.roughness = FILM.GLOSS;
  mat.metalness = FILM.METAL;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSat = look.uSat;
    shader.uniforms.uPunch = look.uPunch;
    shader.fragmentShader =
      "uniform float uSat;\nuniform float uPunch;\n" +
      shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          // Rec. 709 luma, and a pivot of 0.21 — mid grey, in the linear space
          // the map has already been decoded into. Before any lighting, so the
          // highlight is drawn against the punchier colour rather than over it.
          float l = dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
          diffuseColor.rgb = mix( vec3( l ), diffuseColor.rgb, uSat );
          diffuseColor.rgb = clamp( mix( vec3( 0.21 ), diffuseColor.rgb, uPunch ), 0.0, 1.0 );
        }`
      );
  };
  mat.needsUpdate = true; // patched source => recompile
}

export function createHeroTape(
  mount: HTMLElement,
  url: string
): Promise<HeroTape> {
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);

  /* Same flat-art pipeline as the slider: no tone mapping and no environment
     map, both of which exist to make photoreal scenes filmic and both of which
     drag saturated flat artwork toward pastel. What shapes the surface instead
     is the balance across LIGHT and FACE_LIGHT and the finish in FILM.

     No env map is also why light placement has to be exact here: with nothing
     to reflect, a surface's only specular is what a light happens to put on it,
     and a surface no light is aimed at has none at all. */
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  mount.appendChild(canvas);

  const aniso = renderer.capabilities.getMaxAnisotropy();

  const dir = new DirectionalLight(0xffffff, LIGHT.POWER);
  const amb = new AmbientLight(0xffffff, Math.PI * LIGHT.AMBIENT);
  // The face's own key — the one the artwork can actually see. See FACE_LIGHT.
  const kick = new DirectionalLight(0xffffff, FACE_LIGHT.POWER);
  scene.add(dir, amb, kick);

  /* Every surface that is meant to read as the same film: the way its own grain
     runs (see TURN_STRIP) and the colour it started life with, which FILM.TONE
     is applied against rather than against the current value. Held so a live
     tweak can re-apply the finish to all of them at once; the roll's wound side
     joins the list when the model lands. The FACE is deliberately NOT in here:
     its finish is its own (applyFaceLook), and this list would overwrite it. */
  const filmMats: { mat: MeshPhysicalMaterial; turn: number; base: Color }[] =
    [];

  /* The roll's face materials, each with the colour it arrived from the export
     with. FILM.FACE is applied against that original rather than against the
     current value, so tuning it repeatedly sets the exposure instead of
     compounding it. */
  const faces: { mat: MeshPhysicalMaterial; base: Color }[] = [];

  /* And their geometry, with the normals it arrived with — same reasoning, for
     the dome. Keyed by geometry rather than by mesh: one geometry is domed
     once, however many meshes happen to share it. */
  const domes: Dome[] = [];

  const group = new Group();

  /* The axle, as its own group.
   *
   * The model exports face-up, so the -90 on X turns the artwork toward the
   * camera and leaves the axle along this group's LOCAL y — which makes a y
   * rotation here a spin about the axle at any yaw whatsoever.
   *
   * That is the point of it. Spinning the outer group about world x, as this
   * used to, is only a spin about the axle once the roll has finished turning
   * side-on; at any angle short of that it tumbles the roll instead. Which
   * meant the tape could not start feeding until the turn was completely over,
   * and the two moves could only ever be played end to end. */
  const spinner = new Group();
  spinner.rotation.x = -Math.PI / 2;
  group.add(spinner);
  scene.add(group);

  /* The strip hangs from the roll's BACK tangent (z = -RADIUS) and pays out
     downward as the roll spins, so the roll occludes their overlap and the tape
     reads as coming from behind it. Top-anchored via the geometry translate so
     scale.y is the paid-out length; it lives in the scene, not the spinning
     group, because dispensed tape does not rotate.

     COLOR is only the pre-load fallback; the roll's own side colour replaces it
     the moment the model arrives. The near-white tint map keeps that colour
     authority — it only adds the faint unevenness.

     It arrives with no maps at all: remap() below is what gives it them, and
     tune() runs before the first frame. One code path for building them, and
     it is the same one a live tweak takes. */
  const stripGeo = new PlaneGeometry(1, 1);
  stripGeo.translate(0, -0.5, 0);
  const stripMat = new MeshPhysicalMaterial({
    color: STRIP.COLOR,
    side: DoubleSide,
  });
  applyFilmLook(stripMat);
  applyFilmFinish(stripMat, TURN_STRIP);
  /* Held rather than pushed anonymously: when the model lands the roll's own
     colour replaces STRIP.COLOR, and this entry's `base` has to move with it or
     FILM.TONE would go on being applied against the fallback. */
  const stripFilm = {
    mat: stripMat,
    turn: TURN_STRIP,
    base: new Color(STRIP.COLOR),
  };
  filmMats.push(stripFilm);
  /* Reassigned every time the maps are rebuilt — pose() writes the tiling onto
     whichever textures are current, and all three have to move together or the
     relief would slide against the colour it belongs to. */
  let stripMap!: Texture;
  let stripRough!: Texture;
  let stripTooth!: Texture;
  const strip = new Mesh(stripGeo, stripMat);
  strip.position.z = -STRIP.RADIUS;
  strip.visible = false;
  scene.add(strip);

  /* The cut end, sharing the strip's material so the two are one piece of tape
     under the key light — there is no second surface to keep in step. Its
     geometry is cut by tune(), which runs before the first frame. */
  const endCap = new Mesh(new BufferGeometry(), stripMat);
  endCap.position.z = -STRIP.RADIUS;
  endCap.visible = false;
  scene.add(endCap);

  /* The CUT's edge — same tear, teeth up (the negative y scale in pose does
     the mirroring; the cross-curl normals all have y = 0, so the flip leaves
     them alone). Its own geometry rather than the endCap's, so the two edges
     tear differently — one blade, two rips. Hidden until there is a cut. */
  const topCap = new Mesh(new BufferGeometry(), stripMat);
  topCap.position.z = -STRIP.RADIUS;
  topCap.visible = false;
  scene.add(topCap);

  /* Render only when something changed. The scene is static between scroll
     positions, and the page already runs Lenis and GSAP tickers — a fixed 60fps
     render of a still frame would be pure heat. */
  let dirty = true;
  let pxPerWorld = 1;
  let lastYaw = NaN;
  let lastLen = NaN;
  let lastCut = NaN;
  let lastSettle = NaN;

  function resize() {
    const w = mount.clientWidth || 1; // the roll's square framing box
    const h = mount.clientHeight || 1; // square + strip room to the section end
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP, MAX_BUFFER / h));
    // updateStyle false: the stylesheet owns the canvas box; three only sizes
    // the drawing buffer.
    renderer.setSize(w, h, false);
    /* Frame the roll exactly as a square canvas would, then extend the view
       downward for the strip — same projection, more paper. */
    camera.aspect = 1;
    camera.setViewOffset(w, w, 0, 0, w, h);
    camera.updateProjectionMatrix();

    // px per world unit at the STRIP's depth — it sits RADIUS beyond the roll's
    // centre, so it projects slightly smaller than the roll does.
    pxPerWorld = w / (2 * (CONFIG.camZ + STRIP.RADIUS) * Math.tan((FOV / 2) * DEG));

    /* Flush with the roll's on-screen silhouette, whose width is set by its
       NEAR rim (camZ - R) while the strip hangs at the far side (camZ + R);
       WIDTH is a multiplier on that match. Depends only on the camera, so it is
       set here rather than per frame. */
    strip.scale.x =
      STRIP.ROLL_W *
      ((CONFIG.camZ + STRIP.RADIUS) / (CONFIG.camZ - STRIP.RADIUS)) *
      STRIP.WIDTH;
    endCap.scale.x = strip.scale.x; // the tears are as wide as what they end
    topCap.scale.x = strip.scale.x;

    lastLen = NaN; // px -> world moved; the next pose must recompute
    dirty = true;
  }

  /* Cut a fresh pair of maps for one film surface.
   *
   * Every map on the film goes through here, at build and at every tweak, so
   * MOTTLE is a console knob rather than a reload. New noise each time, which
   * is deliberate: the marks are not a design, and a rebuilt surface that
   * happened to be identical would hide a tweak that had not taken.
   *
   * `ours` is the safety on the dispose. The wound side arrives from the export
   * carrying its own textures, and those may be shared with the face's material
   * — three's loader hands the same Texture to every material that references
   * one image. Disposing something we did not create would take the artwork's
   * map with it, so only maps cut here are ever released. */
  const ours = new Set<Texture>();

  function remap(mat: MeshStandardMaterial) {
    for (const old of [mat.map, mat.roughnessMap, mat.normalMap]) {
      if (old && ours.delete(old)) old.dispose();
    }
    mat.map = mottleTex(1, FILM.MOTTLE_TINT, true, aniso);
    mat.roughnessMap = mottleTex(0.72, FILM.MOTTLE, false, aniso);
    mat.normalMap = toothTex(aniso);
    ours.add(mat.map).add(mat.roughnessMap).add(mat.normalMap);
    mat.needsUpdate = true; // a map appearing or changing => recompile
  }

  function tune() {
    dir.position.set(LIGHT.X, LIGHT.Y, LIGHT.Z);
    dir.intensity = LIGHT.POWER;
    amb.intensity = Math.PI * LIGHT.AMBIENT;
    kick.position.set(FACE_LIGHT.X, FACE_LIGHT.Y, FACE_LIGHT.Z);
    kick.intensity = FACE_LIGHT.POWER;
    camera.position.z = CONFIG.camZ;

    // Uniforms, so these four land on the next frame with no recompile.
    filmLook.uSat.value = FILM.SAT;
    filmLook.uPunch.value = FILM.PUNCH;
    faceLook.uSat.value = FILM.FACE_SAT;
    faceLook.uPunch.value = FILM.FACE_PUNCH;
    /* No needsUpdate here, unlike the faces below: GLAZE and STRETCH crossing
       zero adds or drops USE_CLEARCOAT / USE_ANISOTROPY, and three's own
       setters bump the material's version when they do. Tweaking either
       within its range is a uniform and lands on the next frame. */
    filmMats.forEach(({ mat, turn, base }) => {
      mat.roughness = FILM.GLOSS;
      mat.metalness = FILM.METAL;
      mat.color.copy(base).multiplyScalar(FILM.TONE);
      applyFilmFinish(mat, turn);
      remap(mat);
    });
    /* The strip's are what pose() tiles, so the references have to follow the
       rebuild. resize() at the foot of this function clears lastLen, so the
       next pose writes the tiling onto the new set before anything draws. */
    stripMap = stripMat.map as Texture;
    stripRough = stripMat.roughnessMap as Texture;
    stripTooth = stripMat.normalMap as Texture;
    faces.forEach((f) => {
      f.mat.color.copy(f.base).multiplyScalar(FILM.FACE);
      applyFaceLook(f.mat);
      /* Unlike the film knobs above, COAT crossing zero adds or drops
         USE_CLEARCOAT and so needs new source. One recompile per tweak, and
         tune() is a dev-console call — at load `faces` is still empty. */
      f.mat.needsUpdate = true;
    });

    // Baked into vertices rather than uniforms, so these are rebuilt: the tear
    // profile, the cross-curl the strip's sheen rides on, and the dome the
    // face's does.
    curlNormals(stripGeo);
    domes.forEach(applyDome);
    endCap.geometry.dispose();
    endCap.geometry = tearGeometry();
    topCap.geometry.dispose();
    topCap.geometry = tearGeometry(1); // v = 1: continues the strip's top row
    resize(); // pxPerWorld and the strip's width both follow camZ
  }

  function pose(yawDeg: number, lenPx: number, cutPx = 0, settle = 0) {
    if (
      yawDeg === lastYaw &&
      lenPx === lastLen &&
      cutPx === lastCut &&
      settle === lastSettle
    )
      return;
    lastYaw = yawDeg;
    lastLen = lenPx;
    lastCut = cutPx;
    lastSettle = settle;

    const len = lenPx / pxPerWorld;
    // Spin follows the paid-out length exactly (angle = length / radius), so
    // the roll can never turn without dispensing or vice versa. Once the cut
    // has been made that pact is over: `settle` carries the spin to the
    // NEAREST whole turn — rounded, not ceiled, so it may rewind a shade,
    // which is what a cut tail springing back onto the roll would do — and
    // the label lands exactly the way up it started.
    const spinBase = len / STRIP.RADIUS;
    const TURN = Math.PI * 2;
    const spin =
      spinBase + (Math.round(spinBase / TURN) * TURN - spinBase) * settle;

    // The turn and the unspooling are now independent: the group only ever
    // yaws, the spinner only ever spins about the axle. Positive spin sends the
    // BACK surface downward — the tangent the strip pays out from.
    group.rotation.set(CONFIG.rotX * DEG, yawDeg * DEG, CONFIG.rotZ * DEG);
    spinner.rotation.y = spin;

    /* The cut occupies the last DEPTH of the tape, so the body stops short by
       that much and the two together measure exactly len. Below DEPTH the cut
       scales down instead of being clipped, so the very first tape out of the
       roll grows a tooth edge rather than popping one on at 13px. */
    const capT = Math.min(len / END.DEPTH, 1);
    const body = Math.max(len - END.DEPTH * capT, 0);
    /* The severed tail. The mesh is top-anchored at the roll's centre, so the
       cut slides the top edge down (position) while the bottom edge stays
       where the length put it (scale picks up the difference). The tear cap
       hangs off the ABSOLUTE end, which the cut never moves.

       The cut line wears its own serration: topCap's teeth point UP (the
       negative scale mirrors it) with their tips exactly on the cut line, so
       the serration eats into the piece and the piece's topmost point stays
       precisely where the cut was asked for. It ramps in over the first DEPTH
       of cut — all of which happens hidden behind the roll. */
    const cut = Math.min(cutPx / pxPerWorld, body);
    const topDepth = Math.max(Math.min(cut, END.DEPTH, body - cut), 0);
    const vis = Math.max(body - cut - topDepth, 0);

    endCap.visible = len > 0.001;
    endCap.scale.y = Math.max(capT, 0.0001);
    endCap.position.y = -body;

    topCap.visible = topDepth > 0.0005;
    topCap.scale.y = -Math.max(topDepth / END.DEPTH, 0.0001);
    topCap.position.y = -(cut + topDepth);

    strip.visible = vis > 0.001;
    strip.scale.y = Math.max(vis, 0.0001);
    strip.position.y = -(cut + topDepth);

    /* The film's pattern, held at its real size however long the tape gets —
       see STRIP.GRAIN. The repeat covers the VISIBLE run (the mesh's uv 0..1
       spans exactly `vis` world units), while the offset stays pinned against
       the full paid-out body — which keeps the pattern fixed to the WALL, both
       while the tape pays out (the torn end sweeps through fresh pattern — the
       evidence of new material, where the eye is looking) and while the cut
       trims the top (the remaining piece must not slide: it has been stuck
       down this whole time). The tear cap's UVs sit on the strip's bottom row,
       so it follows automatically. */
    const rep = Math.max(vis * STRIP.GRAIN, 0.001);
    const anchor = -Math.max(body * STRIP.GRAIN, 0.001);
    /* All three together. The tooth is relief on the same piece of film the
       other two colour, so a repeat it did not share would slide the surface
       against its own shading — which is more obviously wrong than either map
       being off on its own. */
    for (const tex of [stripMap, stripRough, stripTooth]) {
      tex.repeat.set(1, rep);
      tex.offset.y = anchor;
    }
    dirty = true;
  }

  function draw() {
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera);
  }

  function teardown() {
    // The strip and its cut end share one material; without this its textures
    // would be disposed twice.
    const done = new Set<MeshStandardMaterial>();
    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m: MeshStandardMaterial) => {
        if (done.has(m)) return;
        done.add(m);
        m.map?.dispose();
        m.roughnessMap?.dispose();
        m.normalMap?.dispose();
        m.dispose();
      });
    });
    renderer.dispose();
    canvas.remove();
  }

  tune();

  return new Promise<HeroTape>((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => {
        const model = gltf.scene;
        /* Full anisotropy on every map. Without it the wound side's weave
           collapses to its flat grey mip average wherever the surface grazes
           the view — a grey sheet creeping along the roll's rim on real GPUs
           (software renderers mip less aggressively, which is why headless
           checks do not show it). */
        // One physical material per exported face material, so a material
        // shared by several meshes stays one material after the swap.
        const swapped = new Map<MeshStandardMaterial, MeshPhysicalMaterial>();

        model.traverse((o) => {
          const mesh = o as Mesh;
          if (!mesh.isMesh) return;
          const mat = mesh.material as MeshStandardMaterial;
          if (mat.map) {
            mat.map.anisotropy = aniso;
            mat.map.needsUpdate = true;
          }

          /* "Material" is the wound side in this export. The dispensed strip IS
             this tape, so it takes the side's exact colour and the shared gloss
             — under the same key light the two render identically, and they
             now take the same maps too: the mottle has no direction, so there
             is nothing to say about which way this surface is unwrapped. Only
             the grain's axis still cares, and that is TURN_WOUND. */
          if (mat.name === "Material") {
            /* Onto a physical material, exactly as the face is and for the same
               reason — a clear coat is the only honest way to put a white
               highlight on a dielectric. Cached in `swapped` alongside the
               faces so a material shared by several meshes stays one material
               after the swap. */
            let film = swapped.get(mat);
            if (!film) {
              film = toPhysical(mat);
              swapped.set(mat, film);
              applyFilmLook(film);
              applyFilmFinish(film, TURN_WOUND);
              remap(film); // the export's own maps are replaced, never disposed
              /* The export's colour, before FILM.TONE has touched it — that is
                 what TONE is a fraction OF, on this surface and on the strip
                 alike. Taken now, because the next line applies the exposure
                 and there is no way back to it afterwards. */
              const base = film.color.clone();
              filmMats.push({ mat: film, turn: TURN_WOUND, base });
              film.color.multiplyScalar(FILM.TONE);
              /* The strip IS this tape, so it takes the roll's colour — and its
                 stored base with it, or TONE would go on being applied against
                 the pre-load fallback for the rest of the session. */
              stripFilm.base.copy(base);
              stripMat.color.copy(base).multiplyScalar(FILM.TONE);
            }
            mesh.material = film;
            return;
          }

          /* Anything that is not the wound side is artwork: the face — the
             surface the whole section is about, and the one that arrives from
             the export flat and matte. It leaves here on a physical material
             wearing a clear coat, over normals domed into a highlight, lit by
             a key of its own. See FACE_LIGHT for why all three are needed. */
          let phys = swapped.get(mat);
          if (!phys) {
            phys = toPhysical(mat);
            swapped.set(mat, phys);
            /* On the FACE's own grade, not the film's — the label is print and
               the tape it is wound on is not. See FILM.FACE_SAT. */
            applyFilmLook(phys, faceLook);
            applyFaceLook(phys); // after it: this overrides the shared finish
            faces.push({ mat: phys, base: phys.color.clone() });
            phys.color.multiplyScalar(FILM.FACE);
          }
          mesh.material = phys;

          if (!domes.some((d) => d.geo === mesh.geometry)) {
            const nor = mesh.geometry.attributes.normal;
            if (nor) {
              const dome = {
                geo: mesh.geometry,
                flat: (nor.array as Float32Array).slice(),
              };
              domes.push(dome);
              applyDome(dome);
            }
          }
        });

        // Centre on the geometry, not the export's origin — the roll has to
        // spin about the middle of itself.
        const centre = new Box3().setFromObject(model).getCenter(new Vector3());
        model.position.sub(centre);

        spinner.add(model); // the -90 that faces the artwork at us is already on it

        dirty = true;
        resolve({ pose, resize, draw, tune, dispose: teardown });
      },
      undefined,
      (e) => {
        // A failed load must not leak the context it was going to draw into.
        teardown();
        reject(e);
      }
    );
  });
}
