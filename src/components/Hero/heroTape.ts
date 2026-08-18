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
  COLOR: 0xe7e7e7, // pre-load fallback only — the roll's own wound-side
  // colour is copied over it once the model arrives. Near-white now rather
  // than the brown it was: the low-noise roll's film is clear, and the export
  // states it as a flat 0.8 linear grey, which is this in sRGB.
  //
  // Reached only while FILM.CAST_STRIP is null. With a colour authored there
  // the strip has no need of the roll's, so tune() takes it before the load as
  // well as after and this value is never on screen. It stays because null is
  // a supported setting and something has to hold the first frames.
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
   * DOWN FROM 0.5, WHICH READ AS CRINKLED. At that spread the roughness map ran
   * 0.47-0.97 — the effective roughness wandering between about 0.21 and 0.44,
   * which is a factor of two across a few centimetres of tape. A gloss that
   * varies that much over that short a distance is not read as an uneven
   * surface; it is read as a CREASED one, because creasing is the only everyday
   * thing that makes a highlight break up on that scale. The tape looked like it
   * had been screwed up and smoothed out again.
   *
   * At 0.18 the map runs 0.63-0.81 and the effective roughness 0.28-0.36 — still
   * plainly not a uniform surface, still enough for the key to travel unevenly
   * along the strip, but a wander rather than a wrinkle. TOOTH came down with it
   * and the reason is in its own note: the two are the same complaint measured
   * two ways, and dropping only one leaves the relief drawing the creases the
   * roughness stopped drawing.
   *
   * Live-tweak in dev: hero.FILM.MOTTLE = 0.2; hero.tune() — tune() rebuilds
   * both maps, unlike the streak maps this replaced, which needed a reload. */
  MOTTLE: 0.18,
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
   * DOWN FROM 0.15 WITH MOTTLE, and the pair moved together on purpose. Relief
   * and gloss-wander are two ways of drawing the same thing — a surface that is
   * not flat — so smoothing the roughness map on its own just hands the job to
   * the normals: the highlight stops breaking up and the geometry starts to,
   * and the tape still reads creased. Halving this takes the slope out with it.
   *
   * 0.08 is the floor worth having rather than a step on the way to 0. At 0 the
   * strip is a mathematically flat plane and the key lies on it as one unbroken
   * band, which is the giveaway that reads as cellophane wrapper rather than
   * tape. This is enough to keep the band from being perfectly clean and not
   * enough to see as texture at hero size.
   *
   * Live-tweak in dev: hero.FILM.TOOTH = 1.4; hero.tune() */
  TOOTH: 0.08,
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
     Down from 0.82 with the low-noise roll, and the number moved because what
     it is a fraction OF moved. The brown export's wound side was 0.54 linear at
     its brightest channel; this one is a flat 0.8 grey, so the same exposure
     lands half a stop higher and lands it on a NEUTRAL, where there is no
     saturation to carry the difference — the film went from a colour with a
     sheen to a bright surface with a sheen washed out on top of it. This puts
     the albedo back near where the brown sat (~0.58 linear after the mottle and
     PUNCH), which is the level GLAZE's white coat was tuned to read against.

     Live-tweak in dev: hero.FILM.TONE = 0.7; hero.tune() */
  TONE: 0.72,

  /* THE FILM'S OWN COLOUR — the roll's wound side and the dispensed strip, which
   * are one surface and take one value.
   *
   * WHY IT IS HERE AT ALL. This colour used to come out of the GLB and nowhere
   * else: whatever the export stated for the wound side was taken as the film's
   * albedo and copied onto the strip, and STRIP.COLOR was only ever a stand-in
   * for the seconds before the model landed. That is the right default and it
   * is still the default — set this to null and the export is back in charge.
   *
   * What it could not do is be ART DIRECTED. The low-noise export states its
   * film as a flat 0.8 linear grey, which is a NEUTRAL — and a neutral film on a
   * page of saturated lime and brown reads as grey plastic rather than as the
   * slightly warm, slightly cloudy stuff cellophane tape actually is. There is
   * no knob on a neutral that fixes that: TONE moves it up and down and leaves
   * it just as grey, and SAT has nothing to pull away from luminance.
   *
   * IT USED TO BE 0xe7e3d4 — the export's own lightness, a few points warm of
   * neutral, and a deliberately small move on the grounds that a large bright
   * flat area with real chroma in it stops reading as clear tape and starts
   * reading as tinted plastic. That was true while the side was OPAQUE, which is
   * what it no longer is. At GLASS.WOUND the wall's own colour is about three
   * quarters of the pixel rather than all of it, and the rest is the core and the
   * page seen through the film — so this can carry the amber that says cellophane
   * and land it as a tint rather than as paint.
   *
   * AND IT HAD TO COME DOWN, which matters more than the hue. At the old value
   * the roll's lit half was CLIPPING: albedo 0.8 linear, TONE 0.72, then an
   * ambient of 0.66 and a key of 3.5 on top of that puts the top of the barrel
   * past display white with the mottle squashed flat against the ceiling. A
   * clipped surface has no highlight, because there is nothing left to be
   * brighter than it — and a bright even white cylinder is exactly the read the
   * whole exercise was trying to get away from. Roughly two thirds of the old
   * lightness keeps the mottle and GLAZE's coat in range, and the tape now reads
   * glossy where it used to read merely pale.
   *
   * SO IT WANTS CHECKING AGAINST THE LABEL, which is a printed gold. Warm the
   * side too far and the two stop being two materials.
   *
   * IT IS THE ALBEDO, NOT THE PIXEL. TONE is applied on top of this exactly as
   * it was applied on top of the export's value — this sits where that sat, so
   * every relationship above and below it is unchanged — and then the key light
   * and GLAZE's coat are on top of that again. So the colour on screen is not
   * this hex and is not meant to be; this is what the surface IS, and the
   * render is what it looks like under this section's light. Sampling the
   * screenshot and correcting the number back toward the swatch would be
   * undoing the exposure the whole material is graded around.
   *
   * IT IS THE WOUND SIDE'S ALONE NOW. It used to be both surfaces', on the
   * reasoning that the strip is the same tape as the roll it comes off and two
   * colours would be two materials — and that note said where to split when the
   * case arrived. It has: see FILM.CAST_STRIP, and the reason there. This value
   * is the roll's side and nothing else, unless CAST_STRIP is null, in which case
   * the strip follows it exactly as it always did.
   *
   * null restores the export's own colour completely — the rollback is the same
   * code path as the effect, and it is honoured by tune() as well as at load.
   *
   * Live-tweak in dev: hero.FILM.CAST = 0xd8d2be; hero.tune()
   *                    hero.FILM.CAST = null;     hero.tune()   (back to the GLB) */
  CAST: 0xd8c07f as number | null,
  /* THE DISPENSED STRIP'S OWN COLOUR — the split the note above said to make
   * when it came, and null means "the same tape as the roll", exactly as before.
   *
   * WHY IT CAME. A wound roll is a hundred turns of film stacked edge-on, so
   * whatever tint one layer has is compounded a hundred times over and the side
   * reads as a solid, nearly opaque colour. A SINGLE layer of that same film,
   * held over a page, is very nearly clear, and the only colour left in it is
   * the faint amber cellophane carries. Those are two different numbers about
   * one material, not two materials — and one hex cannot be both: give the pair
   * a single value and either the strip is as heavy as the roll's side or the
   * side is as pale as one layer.
   *
   * IT IS THE STRIP'S ALBEDO, NOT WHAT SHOWS. GLASS below decides how much of
   * this ever reaches the frame — at CLARITY 0.75 a quarter of the pixel is the
   * film and three quarters is the page behind it, so the tint on screen is a
   * quarter of this hex over whatever is back there. The two are read together:
   * raising clarity fades this, and the correction belongs here rather than at
   * CLARITY, which is about how see-through the tape is and not about what
   * colour it is when it gets there.
   *
   * SO IT IS ALLOWED REAL CHROMA, where CAST above is not. That note warns that
   * anything much off neutral stops reading as clear tape and starts reading as
   * tinted plastic, and it is right about the WOUND SIDE, which is opaque and
   * large. Quartered over the page's own colour a saturated hex lands as a wash.
   *
   * AND IT IS DARK, which is the part that surprises. The instinct on clear tape
   * is to reach for a pale, near-white amber, and every pale value tried here
   * read as MILK: a lit surface's diffuse is roughly its albedo times the light
   * on it, LIGHT.AMBIENT alone is 0.66 of that, and a quarter of a near-white
   * albedo is still around 90/255 of veil laid over the page — enough to lift
   * dark green most of the way to sage. Real film scatters almost nothing; what
   * makes it visible is the highlight, which GLASS.SHEEN now carries separately.
   * So the diffuse's whole job here is a faint warm cast, and about a third of
   * the brightness the wound side wants is what that takes. Pale it toward
   * 0xe8c877 and the tape fogs; darken it past about 0x8a6524 and it stops
   * tinting and starts to soot.
   *
   * null hands the strip straight back to the wound side, which is the rollback
   * and is the same code path as the effect (stripCastOf).
   *
   * Live-tweak in dev: hero.FILM.CAST_STRIP = 0xc99a3a; hero.tune()
   *                    hero.FILM.CAST_STRIP = null;     hero.tune()  (one film) */
  CAST_STRIP: 0xb2842e as number | null,
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
   * lot.
   *
   * BOTH ARE NEAR THEIR NO-OPS NOW, which is the low-noise roll's film rather
   * than a retreat. SAT is at 1 because it has nothing to act on: this wound
   * side is a flat grey and the tint map over it is neutral, so the sampled
   * colour equals its own luma and mix(luma, rgb, uSat) returns the same value
   * for any uSat whatsoever. Holding it at the brown's 0.57 would not desaturate
   * anything; it would only claim to.
   *
   * PUNCH came down from 1.6 for the reason FILM.FACE gives about clipping,
   * arriving a surface early. Contrast about a 0.21 pivot DEEPENED the brown —
   * it was a saturated colour well clear of white, so pushing it away from mid
   * grey had somewhere to go. A near-white film has no such room: at 1.6 the
   * albedo lands past 0.9 linear, the mottle's variation is squashed flat
   * against the ceiling with it, and the clear coat's highlight then has nothing
   * left to be brighter than. Just over 1 keeps the unevenness legible without
   * spending the headroom the sheen needs. */
  SAT: 1,
  PUNCH: 1.05,
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
  /* Exposure on the roll's INSIDE — the bore's wall and the disc behind it (see
   * INNER), which are the same printed artwork as the label and want nothing
   * like the same treatment.
   *
   * IT EXISTS BECAUSE THE WOUND SIDE WENT SEE-THROUGH. Until GLASS.WOUND these
   * two surfaces were all but invisible: the bore is a deep, small hole and the
   * wall in front of it was solid. Now the roll's whole barrel is a window onto
   * them, and what came through was the export's texture at the label's own
   * exposure — the SWEET TAPE mark, full strength, MIRRORED, because the far
   * side of a bore faces away. Legible reversed branding across the hero's key
   * object reads as a rendering fault, not as depth.
   *
   * DOWN RATHER THAN OFF, and the difference is the point. Hiding the interior
   * would leave the wall a translucent nothing, and a window onto nothing is
   * just a paler wall — the reason to see through it at all is that there is
   * something behind. What is wanted is what you actually get looking into a
   * roll: a dark, warm, structured interior where the eye reads DEPTH and never
   * quite resolves a shape. About a fifth of the label's exposure is where the
   * mark stops being readable and starts being shading.
   *
   * It is the same operation as FACE, against each material's own exported
   * colour, so it can be moved either way without compounding. Raise it toward
   * FACE and the branding comes back; take it to 0 and the roll is a hollow.
   *
   * Live-tweak in dev: hero.FILM.INNER = 0.3; hero.tune() */
  INNER: 0.12,
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

/* THE FILM'S TRANSLUCENCY — the dispensed strip only, and the page behind it is
 * the real page.
 *
 * WHAT THIS IS NOT: three's `transmission`. That is the obvious tool and it is
 * the wrong one here, for a reason that is about this canvas rather than about
 * the material. Transmission is not a backdrop filter — it renders the SCENE's
 * opaque objects into a second target and refracts that. This scene is a roll on
 * nothing: the clear colour is transparent black, so a transmissive strip would
 * sample emptiness and go dark and hollow. Everything the tape appears to lie
 * over — the lime field, the dark green under it, the cardboard, the gift, the
 * taped-down painting, the headline — is DOM behind the canvas, and WebGL cannot
 * see a pixel of it. Feeding it a painted backdrop mesh would work over the flat
 * lime and lie about everything below it, which is most of the strip's run.
 *
 * WHAT IT IS: alpha. The canvas is already a transparent overlay (`alpha: true`,
 * clear alpha 0), so a fragment that leaves here at less than full alpha is
 * composited by the BROWSER against whatever is actually behind it — the right
 * props, at the right scroll position, with the right parallax, for nothing. It
 * is the one version of this that cannot be wrong about what is back there,
 * because it does not have an opinion about what is back there.
 *
 * WHAT IT COSTS: no second render pass, no backdrop to author and keep in step,
 * and — the part that matters most for this file — no disturbance to the grade.
 * At transmission ~1 the diffuse term goes to nothing, which is where FILM.TONE,
 * the `base` colour registries, SAT and PUNCH all quietly stop doing anything
 * and the tint has to move to attenuationColor. On alpha the diffuse is
 * untouched and every knob above still means exactly what it says.
 *
 * WHAT IT CANNOT DO is BEND. Refraction has to sample the backdrop at an offset
 * and there is no backdrop to sample. What stands in for it is the Fresnel below,
 * which is not a substitute so much as the other half of the same physics: a
 * film's transmission FALLS toward grazing angles, so the edges close up and
 * catch light while the middle stays open. That is what an edge of real tape
 * does, and it reads as one.
 *
 * NOT THE PRINTED LABEL, EVER — see the note where filmGlass is passed, and the
 * two independent reasons there that it cannot happen by accident.
 *
 * THE WOUND SIDE, THOUGH, YES — and the note that used to sit here said it could
 * not, on the grounds that the roll was a single shell and a see-through side
 * would be a see-through hollow. THAT WAS WRONG ABOUT THE EXPORT. Low-Noise-Tape
 * carries six prims, and one of them (`Core`) is a second cylinder wall at r 0.399
 * inside the wound side's 0.499, with the two end discs closing the gap between
 * them. It is a proper annulus. So there is something BEHIND the wound side to see
 * through it to, which is what makes WOUND below possible at all — and if a future
 * export ever does arrive as a bare shell, that is the setting to take back to 0.
 *
 * Live-tweak in dev: hero.GLASS.CLARITY = 0.5; hero.tune() */
export const GLASS = {
  /* The master, and the rollback. At 0 the strip's alpha is 1 everywhere, the
     material goes back to opaque, and the frame is today's frame — not nearly
     it, exactly it: three defines OPAQUE on a material that is not transparent
     and forces diffuseColor.a to 1 itself, so the block below cannot contribute
     even a rounding error. Everything else here is scaled by it. */
  AMOUNT: 1,
  /* How much of the page shows through where the film faces the camera squarely,
     0..1 — so the alpha there is 1 minus this.
   *
   * It is the whole look, and both ends of it are failures. Under about 0.15 the
   * tape reads as slightly dirty rather than as see-through. The other end used
   * to be near 0.45, where the note here warned that the board behind started to
   * win and the strip stopped being a thing lying ON the page and became a tint
   * over it. What is wanted either way is the read you get holding real tape
   * against print: you can tell what is under it, and you can tell there is tape.
   *
   * THAT CEILING MOVED, and the two changes that moved it are the ones to undo
   * before lowering this again. It was not the transparency that made 0.45 the
   * limit; it was what the remaining opacity was made of. The film's albedo came
   * from the roll's near-white wound side, so the half that was not the page was
   * a bright neutral veil — a whiter tape, not a clearer one, and the eye reads
   * a white veil as fog long before it reads it as glass. And every knob that
   * said "tape" — the coat, the grain, the tooth — was scaled by the same alpha
   * as that veil, so pushing the page through meant giving up the highlight in
   * exact step. FILM.CAST_STRIP fixed the first (a dark warm albedo tints instead
   * of fogging) and SHEEN below fixed the second (the highlight is exempt), and
   * with both in place three quarters of the page comes through and the strip
   * still reads as a thing in front of it. Drop either and this wants to come
   * back down.
   *
   * Face-on is the WORST case, deliberately. This is the maximum clarity the
   * strip ever reaches; the Fresnel below only ever closes it up from here. */
  CLARITY: 0.75,
  /* THE SHEEN'S EXEMPTION — how much of the strip's REFLECTED light is held out
   * of the fade, 0..1. It is what makes a genuinely clear tape possible at all,
   * and without it CLARITY has a ceiling well below the one above.
   *
   * Alpha does not distinguish between the two things leaving a surface. The
   * light that came back OFF the film — its specular, and GLAZE's clear coat
   * over the top of it — and the light the film is itself putting into the room,
   * its diffuse, are summed into one colour long before the blend gets to them.
   * So `a` scales both, and a strip at alpha 0.38 keeps 38% of its highlight.
   * That is why raising CLARITY on its own does not make the tape clearer so
   * much as make it DISAPPEAR: the sheen is the only evidence a transparent
   * object is in front of the page, and it fades in exact step with the body it
   * is supposed to be sitting on.
   *
   * Real film does not spend one budget on both. A sheet of cellophane passes
   * almost everything behind it AND throws a full-strength highlight, and it is
   * that combination — not the transparency — that the eye reads as glass. So
   * the reflected part is added back at full weight in proportion to what the
   * fade took out of it: 1 restores all of it, 0 is the old behaviour to the
   * pixel, and it goes back on the frame AFTER the encode so the addition
   * happens in the space the compositor works in.
   *
   * WHAT IT COSTS is one flag, and the flag is on everything. Adding light on
   * top of a faded surface only composes correctly against a PREMULTIPLIED
   * blend, so every material in here now carries premultipliedAlpha — see
   * applyFilmLook for why all of them rather than only the see-through one.
   *
   * Live-tweak in dev: hero.GLASS.SHEEN = 0.4; hero.tune() */
  SHEEN: 0.15,
  /* THE WOUND SIDE'S OWN CLARITY — the roll, not the tape coming off it, and 0
   * puts the roll back exactly as it was.
   *
   * WHY IT IS A SEPARATE NUMBER AND A SMALL ONE. CLARITY above is one layer of
   * film. This is the cut edge of a few hundred of them wound tight, and what
   * that stack does to light is not "the same material, thicker" — every layer
   * boundary is another place to scatter, so a clear roll's side is CLOUDY in a
   * way its own tape is not. Set this to CLARITY and the roll reads as a glass
   * bangle; a quarter of it is the read that says wound film.
   *
   * IT IS SPENT TWICE, WHICH DOES MOST OF THE WORK. The wound side is one
   * double-sided cylinder wall, so all but the silhouette has both a near face
   * and a far one between the camera and whatever is behind — 0.28 through each
   * is under a tenth of the way through both. What that gives for free is the
   * gradient a roll actually has: the CORE shows through at nearly a third
   * (there is only the near wall over it), while past the core's edge the page
   * behind has to cross two walls and the rim stays all but solid. Turn it up
   * expecting the page and you will get the core instead.
   *
   * AND IT COSTS THE DEPTH BUFFER. A translucent wall cannot write depth — the
   * near and far faces arrive in one draw in buffer order, so with depthWrite on
   * whichever lands first z-rejects the other and the wall renders in patches.
   * Off, both blend, which is also the physically right answer for a shell.
   * The consequence to know about is that the wound side then stops occluding
   * the DISPENSED STRIP, and the strip pays out from the roll's BACK tangent —
   * so the tape behind the roll now shows faintly through it. That is either the
   * best detail in the shot or a band across the roll, depending on this number.
   * The interior (Core, the end discs, the label) is opaque and drawn in the
   * opaque pass, so none of it is affected.
   *
   * Live-tweak in dev: hero.GLASS.WOUND = 0.4; hero.tune()
   *                    hero.GLASS.WOUND = 0;   hero.tune()   (solid roll) */
  WOUND: 0.13,
  /* How fast it closes toward grazing — the exponent on the Fresnel term.
   *
   * 1 is a linear ramp, which puts haze halfway up a surface that is barely
   * turned and reads as fog rather than as an edge. The real curve is far
   * sharper than that: Schlick's is a fifth power, and anything from about 3 up
   * keeps the effect in the last few degrees where the eye reads it as the edge
   * of a material. Below 2 the strip's own cross-curl (FILM.CURL) starts to show
   * as a band of opacity down the tape rather than as a highlight.
   *
   * The strip is nearly square to the camera for most of its run, so this
   * mostly draws the two long slit edges and the tear — which is exactly where
   * the thickness of real tape is visible. */
  EDGE: 3.2,
};

export type HeroTape = {
  /** Yaw in degrees; tape paid out, in document px. */
  /** cutPx severs the strip that far below the roll's centre: everything above
      the cut is gone (the tail, rewinding home), everything below stays put.
      settle 0..1 is the roll's wind-down — it eases the spin to the nearest
      whole turn so the label lands upright, exactly as it started. */
  pose(yawDeg: number, lenPx: number, cutPx?: number, settle?: number): void;
  /** The roll's idle offsets, in degrees, laid OVER whatever pose() last set:
      tilt about x, yaw, tilt about z, and extra spin about the axle. Nothing
      here touches the dispensed strip — see `lean` below for why that matters. */
  drift(tiltX: number, yaw: number, tiltZ: number, spin: number): void;
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
  const tan: number[] = [];
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
    /* AND THE TANGENT, STATED RATHER THAN DERIVED — which the line above is
     * exactly why, and without it the tear renders as a band of BLOWN WHITE.
     *
     * A material with a normal map or anisotropy needs a tangent frame, and if
     * the geometry does not carry one three reconstructs it from the screen-space
     * derivatives of the UVs (getTangentFrame): the bitangent comes out as
     * `q1perp * st0.y + q0perp * st1.y`. Both of those terms are the derivative
     * of V — and V is a CONSTANT here, so both are zero and the bitangent is the
     * ZERO VECTOR. Nothing downstream checks for that. The anisotropic GGX lobe
     * is built from T and B, and with B gone it collapses from an ellipse to a
     * line: the denominator loses the term that was damping it and the specular
     * goes to several times display white, which clips, which is the white band.
     *
     * Note what that means for the OTHER knobs. It is not a grade problem and no
     * amount of tuning the film's colour, exposure or clarity would have touched
     * it — the cap and the strip share one material and every uniform on it. The
     * only two settings that hid it were FILM.STRETCH at 0 (no anisotropy, no
     * lobe to collapse) and FILM.TOOTH at 0 with it, which is how it survived.
     *
     * The frame is not ambiguous, though — only underivable. u runs along the
     * cap's +x, so the tangent is +x rotated into the curled normal's plane, and
     * three takes the bitangent from cross( normal, tangent ) itself: that comes
     * out (0, 1, 0), up the tape, which is the strip's own frame. Handedness is
     * left at +1 for both caps. The cut's cap is mirrored by a negative scale.y
     * at pose time, so strictly its bitangent wants flipping with it — but V does
     * not vary on either cap, so the only thing riding on that is which way the
     * tooth's relief leans across a 16px serration.
     *
     * `vertexTangents` is decided per GEOMETRY rather than per material, so this
     * buys the caps their own program and leaves the strip on the derived frame,
     * where its UVs are well conditioned and the derivation is correct. */
    tan.push(Math.cos(a), 0, -Math.sin(a), 1);
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
  geo.setAttribute("tangent", new Float32BufferAttribute(tan, 4));
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

/* WHICH EXPORTED MATERIAL IS THE WOUND SIDE — the one surface in the model this
 * file has to be able to name, because it is the only one that is not artwork.
 * Everything else the traverse meets is a printed surface and takes the face's
 * grade; this one takes the film's, and the dispensed strip copies its colour.
 *
 * A LIST rather than a single name, and Blender is why. These rolls are one rig
 * re-dressed per product, so the wound side is "Material" on the brown export
 * and "Material.003" on the low-noise one — the suffix is nothing but the order
 * the slots happened to be created in, and it does not survive a re-export.
 *
 * Matching the "Material" PREFIX instead would be the obvious shortcut and is a
 * trap: the low-noise export calls its printed FACE "Material.004". A prefix
 * test would hand the label the film's grade, the film's translucency and none
 * of its dome — the artwork would go see-through and flat. Whole names only.
 *
 * A roll whose wound side is not in here still loads: it is read as artwork, so
 * the roll goes matte and the dispensed tape keeps STRIP.COLOR instead of the
 * roll's own — which is what a mismatched name looks like on screen. */
const WOUND = new Set(["Material", "Material.003"]);

/* AND WHICH ONES ARE THE ROLL'S INSIDE — the second name test, added when the
 * wound side became a window onto what it had been hiding. See FILM.INNER.
 *
 * These are artwork like every other surface that is not the film, and they take
 * the face's grade and the face's dome; the only thing that differs is the
 * exposure, so a name that is not in here costs nothing but brightness. That is
 * deliberate — the register is a way to say "this is behind something", not a
 * third material family.
 *
 * `Core` is the bore's wall, at r 0.399 against the wound side's 0.499, and it is
 * what fills the barrel when the roll turns side-on. `white` is the disc closing
 * the bore behind the label. Whole names, for the reason WOUND gives above, and
 * these two are descriptive rather than serial — so unlike Material.003 they have
 * a fair chance of surviving a re-export. */
const INNER = new Set(["Core", "white"]);

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

/* The translucency's uniforms — see GLASS.
 *
 * A THIRD SET AND NOT TWO MORE FIELDS ON Look, because the split is a different
 * one. Look divides the FILM from the FACE — a grade, and the wound side and the
 * strip share it. This divides the STRIP from everything else: those two are one
 * grade and emphatically not one translucency, since the roll is a solid object
 * and the tape coming off it is a film. Folding these into Look would make the
 * wound side see-through the moment the strip was, which is error 11 waiting to
 * happen (this export is a single shell with no inner wall).
 *
 * The patched SOURCE stays identical for every material either way, which is
 * the same point the two Look objects make: three keys its program cache on the
 * shader text, so all three families compile once between them and share the
 * result, while the uniforms are bound per material and stay independent. A
 * third grade still costs no third program. */
type Glass = {
  uClarity: { value: number };
  uEdge: { value: number };
  uSheen: { value: number };
};

/* The default, and it is the safe one: clarity 0 is alpha 1 is today's look.
 * Shared by every material that is not the dispensed strip — the wound side and
 * the printed label — so both of them carry the block and neither can be moved
 * by it. uSheen is belt and braces: at clarity 0 the exemption is multiplied by
 * 1 - alpha and so is zero whatever this says. Never written to. */
const noGlass: Glass = {
  uClarity: { value: 0 },
  uEdge: { value: 1 },
  uSheen: { value: 0 },
};

/* And the strip's own, which tune() drives off GLASS. */
const filmGlass: Glass = {
  uClarity: { value: GLASS.CLARITY * GLASS.AMOUNT },
  uEdge: { value: GLASS.EDGE },
  uSheen: { value: GLASS.SHEEN },
};

/* And the ROLL's, which is a third set for the same reason there was a second —
   see GLASS.WOUND. The wound side is far cloudier than one layer of its own tape,
   so it cannot share filmGlass's clarity; it shares the shape of the falloff and
   the sheen's exemption, which are about how film behaves rather than about how
   much of this film there is. Still no fourth program: the source is identical. */
const woundGlass: Glass = {
  uClarity: { value: GLASS.WOUND * GLASS.AMOUNT },
  uEdge: { value: GLASS.EDGE },
  uSheen: { value: GLASS.SHEEN },
};

function applyFilmLook(
  mat: MeshStandardMaterial,
  look: Look = filmLook,
  glass: Glass = noGlass
) {
  mat.roughness = FILM.GLOSS;
  mat.metalness = FILM.METAL;
  /* PREMULTIPLIED, and on all three families rather than on the see-through one
   * — see GLASS.SHEEN for what needs it.
   *
   * The strip's sheen is added to the frame after its body has been faded, and
   * an addition only survives a blend that does not scale the source: three sets
   * (SRC_ALPHA, 1 - SRC_ALPHA) for a plain transparent material, which would
   * multiply the highlight straight back down by the alpha it was exempted
   * from. With this it sets (ONE, 1 - SRC_ALPHA) instead and the shader hands
   * over colour that has already been scaled, so the exemption can simply not be
   * scaled.
   *
   * The other two are opaque and need none of it. They carry it because it
   * decides a #define, and a define only one material had would split the
   * program these three deliberately share (see the Look and Glass notes). On a
   * surface whose alpha is 1 the whole thing is a multiply by one. */
  mat.premultipliedAlpha = true;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSat = look.uSat;
    shader.uniforms.uPunch = look.uPunch;
    shader.uniforms.uClarity = glass.uClarity;
    shader.uniforms.uEdge = glass.uEdge;
    shader.uniforms.uSheen = glass.uSheen;
    shader.fragmentShader =
      /* gReflect is a global rather than a local because the two halves of the
         exemption cannot be neighbours: it is WORKED OUT where the lighting
         still exists as separate terms, and SPENT at the very end of the
         fragment, after the encode. Nothing between the two can be moved. */
      "uniform float uSat;\nuniform float uPunch;\nuniform float uClarity;\nuniform float uEdge;\nuniform float uSheen;\nvec3 gReflect;\n" +
      shader.fragmentShader
        .replace(
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
        )
        /* THE SECOND PATCH, and it is composed into this same callback rather
           than being a second onBeforeCompile — assigning that property again
           would silently drop the grade above, which is the one edit this
           material must never lose.
       *
       * AT opaque_fragment, and that site is chosen rather than convenient. It
       * is the last thing the fragment stage does, `gl_FragColor = vec4(
       * outgoingLight, diffuseColor.a )`, so writing the alpha immediately
       * before it is writing the alpha that leaves. It is also AFTER
       * normal_fragment_maps, which is what makes the Fresnel worth having:
       * `normal` at this point is the normal-mapped one, so the film's own tooth
       * — and, at step 4, its bubbles and scratches — modulate how see-through
       * the tape is, rather than the transparency being a flat sheet laid over a
       * textured surface.
       *
       * AND THE CHUNK ITSELF IS THE SAFETY. opaque_fragment opens with
       * `#ifdef OPAQUE diffuseColor.a = 1.0;`, and three defines OPAQUE on any
       * material that is not `transparent`. So the wound side and the printed
       * label have their alpha forced back to 1 by three's own code a line
       * after this block runs, whatever the uniforms say. Two independent
       * reasons the label cannot go glassy, which is the acceptance criterion
       * least worth being clever about. */
        .replace(
          "#include <opaque_fragment>",
          `{
          /* Schlick's shape, with the exponent as a knob — see GLASS.EDGE. The
             view direction is the one three uses itself: vViewPosition runs from
             the fragment to the camera, which is the eye vector in view space.

             abs() on the dot, for the strip's DoubleSide. three already flips
             the normal by faceDirection on a double-sided material, so this is
             belt and braces rather than the fix — but it costs one instruction
             and a back face reading as inside-out would be a black edge down the
             tape at exactly the angle the effect is for. */
          float ndv = abs( dot( normal, normalize( vViewPosition ) ) );
          /* Face-on the film is at its clearest and the page shows through;
             toward grazing it closes to solid. Never past 1 and never under
             1 - uClarity, so the knob is the full range of the effect and there
             is nothing to clamp. */
          diffuseColor.a = mix( 1.0 - uClarity, 1.0, pow( 1.0 - ndv, uEdge ) );
          /* The sheen's exemption — see GLASS.SHEEN. What the fade is about to
             take out of the REFLECTED light only, banked to be put back at the
             foot of the shader.

             outgoingLight minus totalDiffuse is that reflection: the specular,
             the emissive (nothing, here) and GLAZE's clear coat, which three has
             already folded in a few lines above this. Stated as the remainder
             rather than summed from its parts on purpose — the coat's terms sit
             inside an ifdef on USE_CLEARCOAT, and naming them here would fail to
             compile the moment GLAZE went to zero, which is exactly the rollback
             that has to keep working. Clamped because that same fold scales the
             diffuse by ( 1 - clearcoat * F ), so the subtraction can undershoot
             by a hair at grazing angles. */
          gReflect = max( outgoingLight - totalDiffuse, vec3( 0.0 ) )
            * ( 1.0 - diffuseColor.a ) * uSheen;
        }
        #include <opaque_fragment>`
        )
        /* AND SPENT HERE, which is the last line of the fragment stage.
         *
         * After premultiplied_alpha_fragment rather than before it, because that
         * chunk is the multiply this term is being exempted FROM: everything
         * ahead of it is scaled by alpha and this must not be.
         *
         * And through linearToOutputTexel — the same encode colorspace_fragment
         * put the rest of the frame through two lines earlier, injected into
         * every fragment shader by three's program builder. Adding linear light
         * to an already-encoded pixel would land the highlight far brighter than
         * asked for, and brighter the darker the surface under it. */
        .replace(
          "#include <premultiplied_alpha_fragment>",
          `#include <premultiplied_alpha_fragment>
        gl_FragColor.rgb += linearToOutputTexel( vec4( gReflect, 1.0 ) ).rgb;`
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
  /* `exported` is the colour the GLB stated, kept beside the one in use so
     FILM.CAST can be taken back OFF again — an override that destroys what it
     overrides is a one-way door, and setting CAST to null would otherwise leave
     the film on the last hex it was given. Only the wound side carries one; the
     strip has no export of its own and follows it (see castOf). */
  const filmMats: {
    mat: MeshPhysicalMaterial;
    turn: number;
    base: Color;
    exported?: Color;
  }[] = [];

  /* The film's albedo: the authored colour if there is one, the export's own if
     there is not. One function, called at load and again by every tune(), so
     the two paths cannot disagree about which colour is in force. */
  const castOf = (exported: Color) =>
    FILM.CAST === null ? exported.clone() : new Color(FILM.CAST);

  /* And the STRIP's, which is whatever the wound side resolved to unless it has
     been given a colour of its own — see FILM.CAST_STRIP. Takes the side's
     resolved base rather than the export's, so a null here still follows CAST:
     "the same tape as the roll" has to mean the roll as it is now, not as it
     shipped. Same shape as castOf, and called from the same two places, so the
     load and the tweak cannot disagree about which colour is in force. */
  const stripCastOf = (wound: Color) =>
    FILM.CAST_STRIP === null ? wound.clone() : new Color(FILM.CAST_STRIP);

  /* The roll's wound side, once the model has landed — held on its own because
     it is the one surface tune() has to reach for by identity rather than by
     grade. Everything else it does to the film it does to the whole of filmMats;
     the transparency is per-surface (GLASS.CLARITY against GLASS.WOUND) and there
     is no way to tell which entry is which from the grade alone. */
  let woundMat: MeshPhysicalMaterial | null = null;

  /* Turn a film surface see-through, or solid again.
   *
   * Both flags together and in one place, because they are one decision: three
   * decides the OPAQUE define off `transparent` (which is what lets the shader's
   * alpha out at all) and the blend and depth state off both, and a surface that
   * had one without the other would either ignore the alpha it computes or eat
   * its own far side. See GLASS.WOUND on why depth has to go.
   *
   * `transparent` is a plain field with no setter — three never sees it change —
   * so the recompile is ours to ask for, and only when it actually crosses: at
   * load this runs once with the flag already right, and a needsUpdate on every
   * tune() would be a recompile for a knob that did not move. depthWrite has no
   * define behind it and needs no such care. */
  function setGlassy(mat: MeshPhysicalMaterial, glassy: boolean) {
    mat.depthWrite = !glassy;
    if (mat.transparent === glassy) return;
    mat.transparent = glassy;
    mat.needsUpdate = true;
  }

  /* The roll's face materials, each with the colour it arrived from the export
     with. FILM.FACE is applied against that original rather than against the
     current value, so tuning it repeatedly sets the exposure instead of
     compounding it. */
  const faces: {
    mat: MeshPhysicalMaterial;
    base: Color;
    /** Behind the wound side rather than on the outside of it — see FILM.INNER.
        A flag rather than the exposure itself, so tune() re-reads the knob and a
        live tweak takes on the next frame. */
    inner: boolean;
  }[] = [];

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

     COLOR is only the pre-load fallback, and only while FILM.CAST_STRIP is null:
     with a colour authored there tune() takes it immediately, and without one
     the roll's own side colour replaces it the moment the model arrives. The
     near-white tint map keeps whichever it is in authority — it only adds the
     faint unevenness.

     It arrives with no maps at all: remap() below is what gives it them, and
     tune() runs before the first frame. One code path for building them, and
     it is the same one a live tweak takes. */
  const stripGeo = new PlaneGeometry(1, 1);
  stripGeo.translate(0, -0.5, 0);
  const stripMat = new MeshPhysicalMaterial({
    color: STRIP.COLOR,
    side: DoubleSide,
  });
  /* THE ONE TRANSLUCENT SURFACE IN THE SCENE — filmGlass rather than the default
     noGlass, and this argument is the entire scope of the effect. The wound side
     a few hundred lines down takes the default and stays solid; so does the
     label. See GLASS for why it is the strip and only the strip.

     `transparent` itself is set in tune(), which runs before the first frame and
     is what a live tweak goes through — so the flag and the uniform can only
     ever be turned on together. */
  applyFilmLook(stripMat, filmLook, filmGlass);
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

  /* The idle pose, in degrees — the roll's float, its lean toward the pointer
   * and whatever spin a drag has put on it (Hero/idle.ts). Kept as an OFFSET on
   * top of the pose rather than folded into pose()'s own arguments, for two
   * reasons.
   *
   * The owners differ. pose() is the story — scroll, then the finale's tween —
   * and it is ratcheted and measured in document px; this is what happens once
   * that story is over, on its own clock and in its own units. Passing it
   * through pose would mean the idle had to restate the whole final pose every
   * frame just to nudge the roll two degrees, and pose's early-out compares its
   * arguments, so a tilt that did not change one of them would never be applied.
   *
   * And it lands on the GROUP, which is the roll alone: the dispensed strip, its
   * two torn ends and everything the finale stuck to the cardboard live in the
   * scene, not in the group (see the strip's construction above). So the roll
   * can drift, lean and be spun without the tape it left behind moving a pixel —
   * which it must not, because it has been stuck down. */
  const lean = { tiltX: 0, yaw: 0, tiltZ: 0, spin: 0 };
  /* The spin pose() worked out from the paid-out length, in radians, held so
     the drift has something to be an offset FROM. */
  let poseSpin = 0;

  /* Write the rotations — the pose and the idle offset over it, in one place so
     neither can be applied without the other. Silent until something has been
     posed: before the first pose there is no yaw to offset. */
  function place() {
    if (Number.isNaN(lastYaw)) return;
    group.rotation.set(
      (CONFIG.rotX + lean.tiltX) * DEG,
      (lastYaw + lean.yaw) * DEG,
      (CONFIG.rotZ + lean.tiltZ) * DEG
    );
    spinner.rotation.y = poseSpin + lean.spin * DEG;
  }

  function drift(tiltX: number, yaw: number, tiltZ: number, spin: number) {
    if (
      tiltX === lean.tiltX &&
      yaw === lean.yaw &&
      tiltZ === lean.tiltZ &&
      spin === lean.spin
    )
      return;
    lean.tiltX = tiltX;
    lean.yaw = yaw;
    lean.tiltZ = tiltZ;
    lean.spin = spin;
    place();
    dirty = true;
  }

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

    /* The strip's translucency — see GLASS. Two uniforms and one flag, and the
     * flag is the only thing here that is not free.
     *
     * `transparent` DOES need a recompile when it crosses, unlike the four
     * above and unlike GLAZE or STRETCH crossing zero. Those are three's own
     * setters, which bump the material's version themselves; `transparent` is a
     * plain field with no setter, and it decides the OPAQUE define — so a
     * material switched from solid to see-through without this would go on
     * running the program that forces its alpha back to 1, and the tweak would
     * silently do nothing. Only when it actually changes: at load this runs
     * once with the flag already right, and needsUpdate on every tune() would
     * be a recompile for a knob that did not move.
     *
     * Clarity carries the master rather than being multiplied at the shader,
     * so AMOUNT is one number in one place and the rollback is literally the
     * same code path as the effect. */
    const clarity = GLASS.CLARITY * GLASS.AMOUNT;
    filmGlass.uClarity.value = clarity;
    filmGlass.uEdge.value = GLASS.EDGE;
    filmGlass.uSheen.value = GLASS.SHEEN;
    setGlassy(stripMat, clarity > 0);
    /* And the roll's side, on its own clarity and through the same helper — see
       GLASS.WOUND. Before the model lands there is nothing here to flip, and
       tune() runs again for every tweak afterwards, so the roll picks the setting
       up the moment it exists. */
    const woundClarity = GLASS.WOUND * GLASS.AMOUNT;
    woundGlass.uClarity.value = woundClarity;
    woundGlass.uEdge.value = GLASS.EDGE;
    woundGlass.uSheen.value = GLASS.SHEEN;
    if (woundMat) setGlassy(woundMat, woundClarity > 0);
    /* No needsUpdate here, unlike the faces below: GLAZE and STRETCH crossing
       zero adds or drops USE_CLEARCOAT / USE_ANISOTROPY, and three's own
       setters bump the material's version when they do. Tweaking either
       within its range is a uniform and lands on the next frame. */
    /* FILM.CAST, re-resolved before the exposure is re-applied — so a tweak in
       the console lands on this frame and so does taking it off again.

       The wound side is the only entry with an export behind it, and the strip
       follows whatever that resolves to: the two are one material and there is
       one place that decides its colour. Before the model lands there is no
       such entry, and the strip is left on STRIP.COLOR — which is exactly the
       fallback's job. */
    const wound = filmMats.find((f) => f.exported);
    if (wound) {
      wound.base.copy(castOf(wound.exported!));
      stripFilm.base.copy(stripCastOf(wound.base));
    } else if (FILM.CAST_STRIP !== null) {
      /* No model yet, so there is no wound side to follow — but an authored
         strip colour does not need one, and taking it now means the fallback
         the first frames draw is the tape's colour rather than STRIP.COLOR. */
      stripFilm.base.set(FILM.CAST_STRIP);
    }

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
      f.mat.color.copy(f.base).multiplyScalar(f.inner ? FILM.INNER : FILM.FACE);
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
    // CONFIG's two tilts are read by place(), and pose() early-outs on
    // unchanged arguments — without this a rotX tweak would sit unapplied until
    // something else happened to move the roll.
    place();
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
    poseSpin = spin;
    place(); // the idle offset rides on top of this — see `lean` above

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

          /* The wound side — see WOUND for how it is told from the artwork. The
             dispensed strip IS this tape, so it takes the side's exact colour
             and the shared gloss — under the same key light the two render
             identically, and they now take the same maps too: the mottle has no
             direction, so there is nothing to say about which way this surface
             is unwrapped. Only the grain's axis still cares, and that is
             TURN_WOUND. */
          if (WOUND.has(mat.name)) {
            /* Onto a physical material, exactly as the face is and for the same
               reason — a clear coat is the only honest way to put a white
               highlight on a dielectric. Cached in `swapped` alongside the
               faces so a material shared by several meshes stays one material
               after the swap. */
            let film = swapped.get(mat);
            if (!film) {
              film = toPhysical(mat);
              swapped.set(mat, film);
              /* On woundGlass, not the default noGlass and not the strip's —
                 the roll's side is see-through on a clarity of its own, because
                 a wound stack scatters far more than the single layer coming off
                 it. See GLASS.WOUND. */
              applyFilmLook(film, filmLook, woundGlass);
              applyFilmFinish(film, TURN_WOUND);
              woundMat = film;
              /* And the flags to match, off the UNIFORM rather than off GLASS —
                 tune() has already run once by here and is what set it, so
                 reading it back is how the load and the tweak are guaranteed to
                 agree about whether this surface is see-through. The strip needs
                 no equivalent: it exists before tune() does. */
              setGlassy(film, woundGlass.uClarity.value > 0);
              remap(film); // the export's own maps are replaced, never disposed
              /* The export's colour, before FILM.TONE has touched it. Taken
                 now, because the next lines apply the exposure and there is no
                 way back to it afterwards — and kept, so FILM.CAST can be set
                 back to null and hand the export its surface back.

                 What TONE is a fraction of is `base`, which is the export's
                 colour or the authored one standing in its place. Same
                 arrangement either way, on this surface and on the strip
                 alike. */
              const exported = film.color.clone();
              const base = castOf(exported);
              filmMats.push({ mat: film, turn: TURN_WOUND, base, exported });
              film.color.copy(base).multiplyScalar(FILM.TONE);
              /* The strip is this tape one layer thick, so it takes the roll's
                 colour unless FILM.CAST_STRIP has given it one of its own — and
                 its stored base moves with it either way, or TONE would go on
                 being applied against the pre-load fallback for the rest of the
                 session. */
              const stripBase = stripCastOf(base);
              stripFilm.base.copy(stripBase);
              stripMat.color.copy(stripBase).multiplyScalar(FILM.TONE);
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
            const inner = INNER.has(mat.name);
            faces.push({ mat: phys, base: phys.color.clone(), inner });
            phys.color.multiplyScalar(inner ? FILM.INNER : FILM.FACE);
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
        resolve({ pose, drift, resize, draw, tune, dispose: teardown });
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
