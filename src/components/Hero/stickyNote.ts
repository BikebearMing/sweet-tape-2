/* The sticky note — the first prop of the hero's bottom part.
 *
 * Same arrangement as the roll (heroTape.ts): everything three-specific lives
 * here, Hero/note.ts owns the clock and the observers and imports this
 * dynamically, so it rides the same three chunk the roll already pays for.
 *
 * The note is built, not loaded. Geometrically a sticky note is a subdivided
 * plane and nothing more — a downloaded model would bring a silhouette we would
 * immediately re-deform and a texture we would immediately replace with the
 * design's own artwork. So the sheet is a PlaneGeometry and the artwork is a
 * texture, and the whole asset question reduces to one PNG.
 *
 * The wind is vertex animation on the CPU. ~2k vertices moved and re-normalled
 * per frame is nothing, and it keeps the deformation in plain maths that can be
 * tuned from the console rather than inside a shader string. The sheet hangs
 * from the strip of masking tape across its top — that region is pinned dead
 * still, so a DOM tape graphic laid over the canvas will always register.
 */
import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  TextureLoader,
  VSMShadowMap,
  WebGLRenderer,
} from "three";

/* The face seam, in its own file so that a page supplying one never has to
   static-import THIS file and drag three into its bundle — see noteFace.ts,
   which argues it. Re-exported here so the module's surface is unchanged for
   anything that already reads it off the note. */
import { SHEET, noteCanvas, type NoteFace } from "./noteFace";

export { noteCanvas };
export type { NoteFace };

const FOV = 35;
const DPR_CAP = 2;

/** Served straight from /public. Drop the Figma export of the note's face here
    and it replaces the placeholder on the next load; until the file exists the
    canvas-drawn stand-in below is the face. */
export const NOTE_URL = "/assets/sticky-note.png";

export const NOTE = {
  /* The sheet, in world units — read off noteFace.ts rather than typed here,
     because a face's canvas has to be cut to the same proportion and one of the
     two would otherwise go stale. Mirrored by the slot's aspect-ratio in
     global.css wherever a note is placed; change those with it. */
  W: SHEET.W,
  H: SHEET.H,
  /* Subdivisions per side. The wind can only bend where there are vertices;
     at 44 a segment is ~7px at the design size, under what a curl shows. */
  SEGS: 44,
  /* How much of the canvas the resting sheet spans. Held well under 1 because
     the canvas IS the bleed: a gust swings the free corners outside the
     sheet's resting box, and this is the room they land in. The visible note
     is therefore SPAN of the .sticky-note slot — size the slot accordingly. */
  SPAN: 0.62,
};

/* The weather. Live-tweak in dev: note.WIND.GUST = 0.6 — the clock reads these
   every frame, nothing needs re-calling. */
export const WIND = {
  SPEED: 1, // one global clock multiplier
  /* The resting bow, radians-ish of outward peel. This is what "3D" reads as
     when the air is still — a note pressed dead flat is indistinguishable from
     the 2D image it replaced. */
  CURL: 0.14,
  /* The slow sway riding on everything. Deliberately at ONE low spatial
     frequency: what makes fabric read as fabric is several waves travelling
     through the sheet at once, so paper gets a single bow that leans. */
  FLUTTER: 0.035,
  /* The fast shiver of stiff stock. High temporal frequency, tiny amplitude —
     the exact opposite corner of the space from a curtain's slow deep waves.
     Stiffness IS this ratio: raise TREMBLE's speed or cut FLUTTER's depth and
     the same sheet reads as heavier paper. Mostly excited by the gusts. */
  TREMBLE: 0.016,
  /* The gusts: how hard the occasional surge lifts the sheet outward. The
     envelope is a product of two slow incommensurate sines clipped at zero, so
     the surges arrive irregularly and the air is calm between them. */
  GUST: 0.3,
  /* How much wind SCROLLING itself makes, on top of the ambient gusts — at
     full scroll speed it adds this many GUSTs' worth of blow. The page moving
     past the board is the draught: the note always answers a fast scroll,
     rather than hoping an ambient gust happens to coincide with the reader
     arriving. Fed in by note.ts, which owns the scroll. */
  SCROLL: 1.1,
  /* The cursor's stir. A hand moving near a pinned-up note pushes a little
     air, and this is that: the side of the sheet nearest the pointer lifts,
     by at most this much. Deliberately a fraction of a gust — presence, not a
     toy. note.ts owns the pointer and hands the direction in smoothed. */
  POKE: 0.6,
  /* Half-width of the taped run across the top, as a fraction of the sheet's
     width from centre. Inside it the sheet cannot move at all — that stillness
     is what lets a DOM tape graphic sit over the canvas and stay registered. */
  PIN_HALF: 0.3,
};

/* Same flat-art recipe as the roll, dimmer key: paper is matte, and the note
   is a supporting prop — it should move, not glow. Shading is the curl's whole
   read though, so the key still carries real weight. */
export const LIGHT = { X: -2, Y: 2.5, Z: 3, POWER: 1.1, AMBIENT: 0.72 };

/* The drop shadow — the depth cue. Cast by the key light onto an invisible
   catcher plane just behind the sheet, so it composites straight onto the DOM
   wall behind the canvas. Because it is a real shadow, its throw follows the
   curl: the taped run hugs its shadow, a gusting corner slings its own
   down-right — which is what actually says "off the wall", not the darkness
   itself.

   Soft and light on purpose: the shadow is a hint of depth, not a rendering
   flex — too dark or too crisp and it reads as a literal second object. SOFT
   is the blur radius in shadow-map texels; both are read every frame, so
   note.SHADOW.OPACITY = 0.3 / note.SHADOW.SOFT = 4 are live. */
export const SHADOW = { OPACITY: 0.2, SOFT: 9 };

export type StickyNote = {
  /** Advance the wind to time t (seconds) and flag a render. `blow` is extra
      wind on top of the ambient gusts, 0..~1 — the scroll's draught. The poke
      is the cursor's stir: a direction from the note's centre toward the
      pointer (each -1..1) and a strength 0..1, all pre-smoothed by note.ts. */
  frame(
    t: number,
    blow?: number,
    pokeX?: number,
    pokeY?: number,
    pokeS?: number
  ): void;
  resize(): void;
  /** Renders if anything moved since the last draw. */
  draw(): void;
  dispose(): void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/* The stand-in face, drawn rather than shipped: yellow stock, the heading, the
   ruled dotted lines. Close enough to the mock to design the motion against;
   the real artwork replaces it wholesale via NOTE_URL. */
function placeholderFace(): HTMLCanvasElement {
  const c = noteCanvas();
  const W = c.width;
  const H = c.height;
  const g = c.getContext("2d")!;

  const paper = g.createLinearGradient(0, 0, 0, H);
  paper.addColorStop(0, "#f9dd55");
  paper.addColorStop(1, "#f2cf3e");
  g.fillStyle = paper;
  g.fillRect(0, 0, W, H);

  g.fillStyle = "#7c4a12";
  g.font = `800 ${W * 0.16}px futura-pt-condensed, "Arial Narrow", sans-serif`;
  g.fillText("TO-DO LIST", W * 0.09, H * 0.24);

  const items = ["clean up plates", "daily yoga 30 minutes", "meal prep"];
  g.font = `italic ${W * 0.055}px "Bradley Hand", "Comic Sans MS", cursive`;
  items.forEach((item, i) => {
    const y = H * (0.36 + i * 0.115);
    g.beginPath();
    g.arc(W * 0.12, y - W * 0.02, W * 0.02, 0, Math.PI * 2);
    g.lineWidth = 2;
    g.strokeStyle = "#7c4a12";
    g.stroke();
    g.fillText(item, W * 0.17, y);
    g.setLineDash([3, 5]);
    g.beginPath();
    g.moveTo(W * 0.09, y + W * 0.025);
    g.lineTo(W * 0.91, y + W * 0.025);
    g.stroke();
    g.setLineDash([]);
  });

  return c;
}

/** The hero's own face — the default, so nothing that already calls this
    function has to say anything about faces. */
const PINBOARD_FACE: NoteFace = { draw: placeholderFace, url: NOTE_URL };

export function createStickyNote(
  mount: HTMLElement,
  face: NoteFace = PINBOARD_FACE,
): StickyNote {
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
  /* Distance from span: the sheet's height fills SPAN of the canvas height.
     The slot is near-square so height is the tighter framing axis. */
  camera.position.z =
    NOTE.H / NOTE.SPAN / (2 * Math.tan((FOV / 2) * (Math.PI / 180)));

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  /* VSM rather than the PCF types because it is the one that can BLUR: PCF's
     softness tops out at a thin feather, and a sticky note's real shadow on a
     wall is a diffuse bloom. With one caster and one catcher, VSM's classic
     light-bleed artefacts have nowhere to happen. */
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  const canvas = renderer.domElement;
  mount.appendChild(canvas);

  const dir = new DirectionalLight(0xffffff, LIGHT.POWER);
  dir.position.set(LIGHT.X, LIGHT.Y, LIGHT.Z);
  dir.castShadow = true;
  /* A small map on a tight orthographic box: the scene is one sheet, so the
     shadow camera only needs to see just past its swing. The penumbra comes
     from SHADOW.SOFT (VSM's blur radius), applied per frame below. */
  dir.shadow.mapSize.set(512, 512);
  dir.shadow.blurSamples = 20;
  dir.shadow.camera.left = -1.2;
  dir.shadow.camera.right = 1.2;
  dir.shadow.camera.top = 1.2;
  dir.shadow.camera.bottom = -1.2;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 10;
  scene.add(dir, new AmbientLight(0xffffff, Math.PI * LIGHT.AMBIENT));

  const drawn = new CanvasTexture(face.draw());
  drawn.colorSpace = SRGBColorSpace;
  drawn.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // The Adobe kit may land after the face is first drawn; one redraw picks the
  // real heading font up. Irrelevant once artwork replaces the canvas.
  document.fonts?.ready.then(() => {
    if (mat.map === drawn) {
      drawn.image = face.draw();
      drawn.needsUpdate = true;
      dirty = true;
    }
  });

  const mat = new MeshStandardMaterial({
    map: drawn,
    /* Paper: matte, and both-sided because a gust shows the sheet's underside
       at the curl. The artwork mirrored on the back is what real thin stock
       does with strong artwork anyway (and it is on screen for frames). */
    roughness: 0.92,
    side: DoubleSide,
  });

  if (face.url) {
    new TextureLoader().load(face.url, (tex) => {
      if (disposed) return tex.dispose();
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mat.map = tex;
      mat.needsUpdate = true;
      drawn.dispose();
      dirty = true;
    });
  }
  // No error handler: an absent PNG means the drawing stays, which is the
  // designed fallback rather than a failure. A face with no url never asks.

  const geo = new PlaneGeometry(NOTE.W, NOTE.H, NOTE.SEGS, NOTE.SEGS);
  const base = (geo.attributes.position.array as Float32Array).slice();
  const sheet = new Mesh(geo, mat);
  sheet.castShadow = true;
  scene.add(sheet);

  /* The wall, for shadow purposes only. ShadowMaterial draws nothing but the
     shadow itself — everywhere else the plane is fully transparent, so the DOM
     background stays the visible wall and the shadow lands "on" it. Just
     behind the sheet's resting plane, which is why the taped run's shadow
     barely peeks out while a lifted corner's swings wide. */
  const shadowMat = new ShadowMaterial({ opacity: SHADOW.OPACITY });
  const catcher = new Mesh(new PlaneGeometry(4, 4), shadowMat);
  catcher.position.z = -0.02;
  catcher.receiveShadow = true;
  scene.add(catcher);

  let dirty = true;
  let disposed = false;

  /* How free each vertex is to move, 0 (under the tape) to 1 (bottom corners).
     Freedom grows with distance below the top edge, plus an extra term that
     frees the top corners OUTSIDE the taped run — so they lift a little while
     the tape's own span holds dead still. Raised to a power for stiffness:
     paper bends progressively, not linearly, from a clamp. */
  function freedom(x: number, y: number) {
    const down = (NOTE.H / 2 - y) / NOTE.H; // 0 at the top edge, 1 at the bottom
    const out = Math.abs(x) / NOTE.W; // 0 at centre, 0.5 at the side edges
    const fallAway = smooth(down / 0.85);
    /* Gated to zero AT the top edge (the smooth(down/0.12) ramp): the corners
       peel from just below it, so the edge itself stays a straight line
       however hard they curl. Without the gate the outermost row of vertices
       moves too and the top edge wanders. */
    const cornerLift =
      smooth((out - WIND.PIN_HALF) / (0.5 - WIND.PIN_HALF)) *
      (1 - smooth(down / 0.35)) *
      smooth(down / 0.12) *
      0.55;
    return Math.pow(clamp01(fallAway + cornerLift), 2.1);
  }

  function frame(t: number, blow = 0, pokeX = 0, pokeY = 0, pokeS = 0) {
    const T = t * WIND.SPEED;
    // Live-tweakable, see SHADOW.
    shadowMat.opacity = SHADOW.OPACITY;
    dir.shadow.radius = SHADOW.SOFT;

    /* The gusts' envelope: two slow, incommensurate sines multiplied, clipped
       at zero. The product spends most of its time low and surges when the
       two peaks coincide — irregular arrivals from pure deterministic maths,
       nothing to seed or store. */
    /* Raised to a power so the peaks sharpen: a gust on stiff paper is a
       flick, not a swell — quick in, quick out, calm restored between. The
       scroll's draught (`blow`, from note.ts) rides on top of the ambient
       envelope, so it excites everything a natural gust excites — the throw
       and the tremble both. */
    const surge =
      Math.pow(
        Math.max(0, Math.sin(0.31 * T) * Math.sin(0.117 * T + 2.0) - 0.25) /
          0.75,
        1.6
      ) +
      blow * WIND.SCROLL;
    const gust = WIND.GUST * surge;

    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const f = freedom(x, y);
      const down = (NOTE.H / 2 - y) / NOTE.H;

      /* Outward = +z (toward the camera). Three motions, and their frequency
         split is what says paper rather than cloth:

         - flutter: ONE slow bow leaning about the sheet, spatial frequencies
           near 1 — the sheet moves as a piece, it does not undulate. Several
           waves in the sheet at once (the old 5.3/4.7 here) is precisely the
           curtain read.
         - tremble: fast and tiny, the shiver of stock stiff enough to ring.
           Wind-excited: mostly still in calm air, buzzing through a gust.
         - gust roll: the flick leads with the BOTTOM-LEFT corner — the wind
           arrives from below-left, behind the sheet — and falls away toward
           the top-right, so a gust peels the near corner first rather than
           inflating the sheet evenly like a sail. The flutter's phases run
           the same way: the bow travels up and across from that corner. */
      const lead = down * (0.5 - x / NOTE.W); // 1 at bottom-left, 0 by top-right
      const flutter =
        WIND.FLUTTER *
        (Math.sin(1.1 * T + 1.4 * down - 0.8 * x) +
          0.5 * Math.sin(1.9 * T - 0.9 * down - 1.2 * x + 1.3));
      const tremble =
        WIND.TREMBLE *
        (0.35 + 1.8 * surge) *
        (Math.sin(8.7 * T + 1.9 * x + 1.1 * down) +
          0.6 * Math.sin(13.3 * T + 3.1 * x));
      const roll = 0.55 + 0.45 * Math.sin(1.3 * T + 1.6 * x) + 0.9 * lead;
      /* The cursor's stir: a gentle lift biased toward the pointer's side of
         the sheet. Half of it is even pressure, half is the lean — the note
         breathes toward a nearby hand without ever pivoting hard. */
      const poke =
        WIND.POKE * pokeS * (0.5 + 0.9 * (x * pokeX + (down - 0.5) * pokeY));
      const z = f * (WIND.CURL + flutter + tremble + gust * roll + poke);

      pos[i + 2] = z;
      /* Arc length, cheaply: a sheet that bows out must give that length up
         from its height or it reads as rubber. The pull is toward the pinned
         top, strongest where the curl is — and faded out entirely AT the top
         edge, where it has nothing to be pulled toward: lifting the free top
         corners above the taped middle is what made the edge look like it
         sagged in the centre. */
      pos[i + 1] = y + z * z * 0.4 * smooth(down / 0.3);
    }
    geo.attributes.position.needsUpdate = true;
    // The lighting is the curl's whole read, and the curl just moved.
    geo.computeVertexNormals();
    dirty = true;
  }

  function resize() {
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    renderer.setSize(w, h, false); // the stylesheet owns the canvas box
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  resize();

  function draw() {
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera);
  }

  function dispose() {
    disposed = true;
    geo.dispose();
    mat.map?.dispose();
    mat.dispose();
    catcher.geometry.dispose();
    shadowMat.dispose();
    renderer.dispose();
    canvas.remove();
  }

  return { frame, resize, draw, dispose };
}
