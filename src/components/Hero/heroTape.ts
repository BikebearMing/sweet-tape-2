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
  /* Base roughness, which the roughness streaks multiply — so it sits higher
     than a flat value would, and the effective gloss ranges about 0.14-0.29.
     Lower is a tighter, brighter, sharper highlight. */
  GLOSS: 0.3,
  /* A dielectric reflects about 4% head-on, which under a bright ambient is too
     little to see — the surface has a highlight in the maths and none on
     screen. Metalness raises that reflectance and tints it with the surface's
     own colour, which is what makes the sheen read as coated film rather than
     as a grey smear. Kept low: past ~0.35 the artwork starts going dark and
     metallic, because metalness also takes light away from the diffuse. */
  METAL: 0.25,
  /** Saturation, applied to the artwork after its texture is sampled. */
  SAT: 0.79,
  /** Contrast about mid grey. Small numbers go a long way; 1.25 is a lot. */
  PUNCH: 1.4,
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
     white — which costs the saturation SAT is there to add. */
  FACE: 0.6,
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

/* Subtle streak maps — the anti-flat trick. A colour map alone still shades
   evenly under a directional light; it is the roughnessMap that varies the
   gloss across the surface, so the key light lands as streaks of sheen instead
   of one even wash. The same streaks go on the wound side and the strip, run in
   each surface's tape-length direction, so they read as one continuous film.

   `broken` is the difference between the two surfaces. Streaks that span the
   map edge to edge vary across the width and not at all along it — which is
   what the wound side wants, since its length is a circumference and a mark
   that stopped would be a mark that came round again. On the dispensed strip
   the same map is the whole "extruded" problem: constant along the length means
   every inch of tape is the same inch, so paying more out only stretches the
   silhouette. Broken, most of the streaks become runs of their own length with
   faded ends, and the tape has events along it — a glint that starts and stops
   — for the growth to carry past the roll. */
function streakTex(
  base: number,
  amp: number,
  horizontal: boolean,
  srgb: boolean,
  aniso: number,
  broken = false
) {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const shade = (v: number, a = 1) => {
    const n = Math.max(0, Math.min(255, Math.round(v * 255)));
    return `rgba(${n},${n},${n},${a})`;
  };
  g.fillStyle = shade(base);
  g.fillRect(0, 0, S, S);

  /* One streak. `across` is where it sits on the width axis, `from` where it
     starts on the length axis and `len` how far it runs — S for the full span.
     Two things keep it honest:

     The ends fade rather than stop, over 40px or 40% of the run, whichever is
     shorter. A hard end is a printed dash; a faded one is the light letting go
     of the film.

     Drawn twice, S apart, so a run overhanging the end comes back in at the
     start and the map still tiles seamlessly along the tape — which it has to,
     because GRAIN tiles it several times over a full length. The second pass is
     clipped away when the run does not overhang, which costs nothing. */
  const streak = (v: number, across: number, w: number, from: number, len: number) => {
    const solid = shade(v);
    const clear = shade(v, 0);
    const fade = len < S ? Math.min(0.4, 40 / len) : 0;

    for (const off of [0, -S]) {
      const a = from + off;
      const grad = horizontal
        ? g.createLinearGradient(a, 0, a + len, 0)
        : g.createLinearGradient(0, a, 0, a + len);
      grad.addColorStop(0, fade ? clear : solid);
      if (fade) {
        grad.addColorStop(fade, solid);
        grad.addColorStop(1 - fade, solid);
      }
      grad.addColorStop(1, fade ? clear : solid);

      g.fillStyle = grad;
      if (horizontal) g.fillRect(a, across, len, w);
      else g.fillRect(across, a, w, len);

      if (!fade) break; // a full-span run has nothing to wrap
    }
  };

  // More of them when they are broken, because each now covers a fraction of
  // the length it used to.
  const count = broken ? 380 : 240;
  for (let i = 0; i < count; i++) {
    const v = base + (Math.random() - 0.5) * amp;
    const across = Math.random() * S;
    const w = 2 + Math.random() * 12;
    /* A quarter stay continuous even on the strip. Film really does carry
       extrusion lines that run its whole length, and losing them entirely
       trades one wrong read for another — tape for weathered paper. */
    if (!broken || Math.random() < 0.25) streak(v, across, w, 0, S);
    else streak(v, across, w, Math.random() * S, S * (0.06 + Math.random() * 0.34));
  }

  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  if (srgb) tex.colorSpace = SRGBColorSpace; // colour maps only
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
 * Bands of noise summed at falling amplitude — the same trick as the streak
 * maps, in one dimension. This is the part a regular serration cannot fake: a
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
       carried on down: the lengthwise streaks run through the tear instead of
       stopping at it, and they do so at any length.

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
 * effect on the next frame instead of forcing a shader recompile. */
const filmLook = {
  uSat: { value: FILM.SAT },
  uPunch: { value: FILM.PUNCH },
};

function applyFilmLook(mat: MeshStandardMaterial) {
  mat.roughness = FILM.GLOSS;
  mat.metalness = FILM.METAL;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSat = filmLook.uSat;
    shader.uniforms.uPunch = filmLook.uPunch;
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

  /* Every surface that is meant to read as the same film. Held so a live tweak
     can re-apply the finish to all of them at once — the roll's wound side
     joins the list when the model lands. The FACE is deliberately NOT in here:
     its finish is its own (applyFaceLook), and this list would overwrite it. */
  const filmMats: MeshStandardMaterial[] = [];

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
     authority — it only adds the faint streaks. */
  const stripGeo = new PlaneGeometry(1, 1);
  stripGeo.translate(0, -0.5, 0);
  const stripMat = new MeshStandardMaterial({
    color: STRIP.COLOR,
    map: streakTex(1, 0.07, false, true, aniso, true),
    roughnessMap: streakTex(0.72, 0.5, false, false, aniso, true),
    side: DoubleSide,
  });
  applyFilmLook(stripMat);
  filmMats.push(stripMat);
  const stripMap = stripMat.map as Texture;
  const stripRough = stripMat.roughnessMap as Texture;
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

  function tune() {
    dir.position.set(LIGHT.X, LIGHT.Y, LIGHT.Z);
    dir.intensity = LIGHT.POWER;
    amb.intensity = Math.PI * LIGHT.AMBIENT;
    kick.position.set(FACE_LIGHT.X, FACE_LIGHT.Y, FACE_LIGHT.Z);
    kick.intensity = FACE_LIGHT.POWER;
    camera.position.z = CONFIG.camZ;

    // Uniforms, so these two land on the next frame with no recompile.
    filmLook.uSat.value = FILM.SAT;
    filmLook.uPunch.value = FILM.PUNCH;
    filmMats.forEach((m) => {
      m.roughness = FILM.GLOSS;
      m.metalness = FILM.METAL;
    });
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
    stripMap.repeat.set(1, rep);
    stripRough.repeat.set(1, rep);
    const anchor = -Math.max(body * STRIP.GRAIN, 0.001);
    stripMap.offset.y = anchor;
    stripRough.offset.y = anchor;
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
             — under the same key light the two render identically. Blender's
             cylinder unwrap runs U around the circumference, so the side's
             streaks are drawn horizontal in UV space to land along the winding
             direction on screen. */
          if (mat.name === "Material") {
            applyFilmLook(mat);
            filmMats.push(mat);
            mat.map = streakTex(1, 0.07, true, true, aniso);
            mat.roughnessMap = streakTex(0.72, 0.5, true, false, aniso);
            mat.needsUpdate = true; // new maps => shader recompile
            stripMat.color.copy(mat.color);
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
            applyFilmLook(phys); // the artwork is what SAT and PUNCH are for
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
