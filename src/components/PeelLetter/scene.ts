/* The peeling letters, in three.
 *
 * Same arrangement as the roll and the note: everything three-specific lives
 * here and the mount (index.tsx) owns the clock, the observers and the game,
 * so this file rides the three chunk the hero already pays for.
 *
 * ONE STAGE, EVERY LETTER. The headline's letters are all rasterised into this
 * one scene up front and each is a group nailed to its own DOM box; the game
 * decides which of them is peeling. One renderer, one canvas — a canvas per
 * letter would be ten WebGL contexts over one headline.
 *
 * THE CANVAS IS IN THE SECTION, NOT FIXED. It is laid over the hero's lime
 * field and scrolls with it, so a letter's placement is read ONCE (and again
 * on a real resize) rather than per frame: the type does not move inside its
 * section. The camera is in canvas px — a perspective camera placed so that
 * the plane z = 0 measures exactly one world unit per CSS pixel of the mount;
 * put a thing at (x, H - y, 0) and it lands on the mount's (x, y). Perspective
 * rather than orthographic because the flap curls TOWARD the viewer, and an
 * ortho camera would draw that with no foreshortening at all.
 *
 * THE DEFORMATION IS ONE NUMBER, 0..1, for the reason components/Peel/peel.ts
 * gives at length: `p` on a Letter is that number, and nothing else in this
 * file changes the geometry. The game lifts it and the tap puts it back.
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
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

import { rasterise, type LetterRaster } from "./glyph";

const FOV = 30;
const DPR_CAP = 2;

/** The headline's ink, and the underside of a sticker cut out of it. The face
    is #013900 because that is what .hero-section .h1 is set in. BACK is only
    the fallback: each letter's back is one of the six tapes' colours, handed
    down from the CMS by index.tsx, so the row peels in the whole palette. */
export const COLOUR = {
  FACE: "#013900",
  BACK: "#d6e2c6",
};

/* Live-tweakable in dev via `peelLab.TUNE` — the ticker re-reads them every
   frame, so a change lands on the next one rather than on reload. */
export const TUNE = {
  /** The peel's lean off straight-down, in degrees. Zero lifts the whole
      bottom edge at once, which reads as a hinge; a few degrees makes one
      corner lead and the rest follow, which reads as a hand. The sign
      alternates letter by letter (see index.tsx) so the flaps do not all lean
      the same way. */
  PHI: 24,
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
      in with the peel and back out when the tap puts the letter down. */
  RESIDUE: 0.26,
  /** THE LIGHT, and the whole trick is in Z.
   *
   * A letter lying flat on the wall has to leave the renderer at EXACTLY its
   * own colour — it is standing in a row with DOM letters set in the same ink,
   * and a WebGL one a shade off is the only thing anybody would see. But a lit
   * surface never returns its albedo: MeshStandardMaterial's non-metal
   * specular is a white 4% on top of the diffuse, and against ink this dark
   * (#013900 is 4% linear) even that wash lifts the flat letter grey.
   *
   * So the key is thrown almost ALONG the wall — mostly across and up, barely
   * any Z. A surface facing the viewer catches almost none of it and comes out
   * at ambient alone, which is set to 1 (in units of pi) and is therefore the
   * texture's own colour. The moment the flap curls, its normals swing into the
   * light and it picks up the whole key, sheen and all. */
  LIGHT: { X: -820, Y: 760, Z: 62, POWER: 2.6, AMBIENT: 0.95 },
};

export type Letter = {
  /** The DOM letter this one stands in for. */
  el: HTMLElement;
  /** The one number. 0 is flat on the wall. */
  p: number;
  /** Scales the idle's breathing — 0 while the tap is putting it flat. */
  wobble: number;
  /** Is the geometry still moving? The stage deforms and draws only while
      something is. Set by the game when a letter lifts; cleared here once it
      is flat and still. */
  active: boolean;
  /** The letter's box in mount px, grown to take in the flap — where a tap
      counts. */
  hitRect(): { x: number; y: number; w: number; h: number };
  dispose(): void;
};

export type PeelStage = {
  /** Rasterise one .char and stand a plane in its place. Null if the glyph
      came out blank (a space, or a font that has not landed). */
  addLetter(charEl: HTMLElement, phi: number, back?: string): Letter | null;
  /** Advance the idle and redraw, if anything on the stage is moving. */
  frame(seconds: number): void;
  /** Draw once more whatever is moving — after a rebuild. */
  touch(): void;
  dispose(): void;
};

/** The arc chain: distance `a` past the fold, out to (along, up-off-the-wall).
    Continuous and tangent-continuous at the join by construction. */
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

export function createPeelStage(mount: HTMLElement): PeelStage {
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

  const letters: LetterImpl[] = [];
  let dirty = true;

  const W = Math.max(1, mount.clientWidth);
  const H = Math.max(1, mount.clientHeight);
  const mountRect = mount.getBoundingClientRect();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  /* One world unit per CSS px at z = 0 — see the note at the top. */
  const distance = H / 2 / Math.tan((FOV * Math.PI) / 360);
  camera.position.set(W / 2, H / 2, distance);
  camera.lookAt(W / 2, H / 2, 0);
  camera.updateProjectionMatrix();

  /* Re-read every frame so the grade is tunable from the console alongside the
     geometry — three numbers that have to be balanced against each other are
     no use if two of them need a reload. */
  function applyLight() {
    dir.position.set(W / 2 + TUNE.LIGHT.X, H / 2 + TUNE.LIGHT.Y, TUNE.LIGHT.Z);
    dir.intensity = TUNE.LIGHT.POWER;
    amb.intensity = Math.PI * TUNE.LIGHT.AMBIENT;
    dir.target.position.set(W / 2, H / 2, 0);
    dir.target.updateMatrixWorld();
  }
  applyLight();

  type LetterImpl = Letter & {
    frame(seconds: number): void;
  };

  function addLetter(charEl: HTMLElement, phi: number, backColour = COLOUR.BACK): Letter | null {
    const raster = rasterise(charEl, COLOUR.FACE, backColour);
    if (!raster) return null;
    const R: LetterRaster = raster;

    const faceTex = new CanvasTexture(R.face);
    faceTex.colorSpace = SRGBColorSpace;
    faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const backTex = new CanvasTexture(R.back);
    backTex.colorSpace = SRGBColorSpace;
    backTex.anisotropy = faceTex.anisotropy;

    const geo = new PlaneGeometry(R.box.w, R.box.h, TUNE.SEG, TUNE.SEG);
    const pos = geo.attributes.position;
    const base = Float32Array.from(pos.array as Float32Array);

    /* alphaTest rather than blending: the letter has to occlude itself where
       the flap folds back over the part still stuck down, and a blended
       surface with depthWrite off cannot. */
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

    /* The scar. The letter's own silhouette in the wall's shadow, a hair off
       the wall so it never z-fights it. Unlit — it is meant to read as a mark
       ON the lime, not as an object standing in front of it. */
    const residueMat = new MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: 0x6f8f16,
    });
    const residue = new Mesh(new PlaneGeometry(R.box.w, R.box.h), residueMat);
    residue.position.z = -0.3;
    group.add(residue);

    /* EXPLICIT ORDER, because every one of these is in the transparent queue
       and the transparent queue is sorted by distance — which for near-coplanar
       things a few px apart is a sort on noise. Letters draw in the order they
       were added and their layers in this order within each. */
    const layer = letters.length * 10;
    residue.renderOrder = layer + 1;
    back.renderOrder = layer + 2;
    face.renderOrder = layer + 2;

    scene.add(group);

    /* Nailed to where the DOM says the letter is, in MOUNT px. Once: the
       type does not move inside its section, and a real resize rebuilds the
       whole stage (see index.tsx). */
    group.position.set(
      R.centre.x - mountRect.left,
      H - (R.centre.y - mountRect.top),
      0,
    );
    /* CSS rotation is clockwise-positive against a y-down axis; the world here
       is y-up, so the same turn is the negative angle. */
    group.rotation.z = -R.angle;
    group.updateMatrixWorld();

    /* The peel's axes: dHat down the letter along the lean, tHat across it. */
    const phiRad = (phi * Math.PI) / 180;
    const dHat = { x: Math.sin(phiRad), y: -Math.cos(phiRad) };
    const tHat = { x: Math.cos(phiRad), y: Math.sin(phiRad) };

    /* The ink, in the plane's own centred coordinates (y up). Everything the
       peel is measured against — the box has padding the glyph does not use. */
    const inkTop = R.box.h / 2 - R.ink.y;
    const inkBottom = inkTop - R.ink.h;
    const inkMidT = (R.ink.x + R.ink.w / 2 - R.box.w / 2) * tHat.x + ((inkTop + inkBottom) / 2) * tHat.y;

    function deform(peel: number, thetaDeg: number) {
      const sTop = inkTop * dHat.y;
      const sBottom = inkBottom * dHat.y;
      const span = sBottom - sTop; // dHat points down, so bottom is the larger s
      const f = sBottom - peel * TUNE.TRAVEL * span;

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
    }

    const L: LetterImpl = {
      el: charEl,
      p: 0,
      wobble: 1,
      active: false,

      hitRect() {
        const clip = charEl.parentElement!;
        const r = clip.getBoundingClientRect();
        const m = mount.getBoundingClientRect();
        /* Grown by a share of the letter each way, and by most of a letter
           BELOW it, which is where the flap hangs. */
        return {
          x: r.left - m.left - r.width * 0.15,
          y: r.top - m.top - r.height * 0.1,
          w: r.width * 1.3,
          h: r.height * 1.6,
        };
      },

      frame(seconds: number) {
        const idle = TUNE.IDLE;
        const breathe = L.wobble * idle.BREATHE * Math.sin(seconds * idle.SPEED * 2 * Math.PI);
        /* A second period at an irrational-ish ratio to the first: the flap is
           never in the same pose twice inside anything a viewer would sit
           through. */
        const swing = L.wobble * idle.THETA * Math.sin(seconds * idle.SPEED * 1.37 * Math.PI);

        const p = Math.max(0, Math.min(1, L.p + breathe));
        deform(p, TUNE.THETA + swing);
        residueMat.opacity = TUNE.RESIDUE * Math.min(1, p * 1.6);

        /* Flat and still: this letter is done moving until the game lifts it
           again. The deform above was its last, at p = 0. */
        if (L.p === 0 && L.wobble === 0) L.active = false;
      },

      dispose() {
        scene.remove(group);
        geo.dispose();
        faceTex.dispose();
        backTex.dispose();
        faceMat.dispose();
        backMat.dispose();
        residue.geometry.dispose();
        residueMat.dispose();
      },
    };

    letters.push(L);
    dirty = true;
    return L;
  }

  function frame(seconds: number) {
    let moving = false;
    for (const L of letters) {
      if (!L.active) continue;
      moving = true;
      L.frame(seconds);
    }
    if (!moving && !dirty) return;
    dirty = false;
    applyLight();
    renderer.render(scene, camera);
  }

  function dispose() {
    for (const L of letters) L.dispose();
    letters.length = 0;
    renderer.dispose();
    renderer.domElement.remove();
  }

  /* Live tuning, the way the roll and the note do it. Dev nicety; nothing
     reads it back. */
  (window as unknown as { peelLab: unknown }).peelLab = { TUNE, COLOUR };

  return {
    addLetter,
    frame,
    touch: () => {
      dirty = true;
    },
    dispose,
  };
}
